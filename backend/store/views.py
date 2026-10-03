from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Sum, Count
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from .models import Category, Product, Order, Review, LoyaltyAccount, LoyaltyTransaction, SupportTicket, SupportMessage
from accounts.models import User
from .serializers import (
    CategorySerializer, ProductSerializer,
    OrderCreateSerializer, OrderSerializer,
    ReviewSerializer, LoyaltyAccountSerializer,
    SupportTicketSerializer, SupportMessageSerializer,
)
from .broadcast import broadcast


# ── Public ────────────────────────────────────────────────────────

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cats = Category.objects.all()
        return Response(CategorySerializer(cats, many=True).data)


class AdminCategoryDetailView(APIView):
    """Create, rename, or delete a category (admin only)."""

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Name is required."}, status=400)
        if Category.objects.filter(name__iexact=name).exists():
            return Response({"error": "Category already exists."}, status=400)
        cat = Category.objects.create(name=name)
        return Response(CategorySerializer(cat).data, status=201)

    def put(self, request, pk):
        try:
            cat = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Name is required."}, status=400)
        cat.name = name
        cat.save()
        return Response(CategorySerializer(cat).data)

    def delete(self, request, pk):
        try:
            cat = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        cat.delete()
        return Response(status=204)


class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.filter(is_active=True).select_related("category")
        category = request.query_params.get("category")
        search   = request.query_params.get("search")
        if category:
            qs = qs.filter(category__name__icontains=category)
        if search:
            qs = qs.filter(name__icontains=search)
        return Response(ProductSerializer(qs, many=True, context={"request": request}).data)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=404)
        return Response(ProductSerializer(product, context={"request": request}).data)


class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        import json
        data = request.data.copy()
        items_data = data.get("items")
        if isinstance(items_data, str):
            try:
                data["items"] = json.loads(items_data)
            except Exception:
                pass
        data["customer_email"] = request.user.email
        data["customer_name"] = data.get("customer_name") or getattr(request.user, "name", "") or request.user.email
        s = OrderCreateSerializer(data=data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        try:
            order = s.save()
        except Product.DoesNotExist:
            return Response({"error": "One or more products not found."}, status=400)

        # Earn loyalty points (1 point per ₹10 spent)
        points_earned = int(float(order.total_amount) // 10)
        if points_earned > 0:
            acct, _ = LoyaltyAccount.objects.get_or_create(user=request.user)
            acct.points += points_earned
            acct.save()
            LoyaltyTransaction.objects.create(
                account=acct, type="earn", points=points_earned,
                note=f"Order {order.order_id}"
            )

        order_data = OrderSerializer(order, context={"request": request}).data
        broadcast("order:created", order_data)

        # Broadcast updated product stock data for any item affected by this order
        for item in order.items.select_related("product").all():
            if item.product is None:
                continue
            broadcast("product:updated", ProductSerializer(item.product, context={"request": request}).data)

        _send_order_email(request.user.email, order, "placed")
        return Response(order_data, status=201)


class OrderDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=404)
        return Response(OrderSerializer(order).data)


# ── Admin ─────────────────────────────────────────────────────────

class AdminProductListView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        products = Product.objects.all().select_related("category")
        return Response(ProductSerializer(products, many=True, context={"request": request}).data)

    def post(self, request):
        s = ProductSerializer(data=request.data, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        s.save()
        broadcast("product:created", s.data)
        return Response(s.data, status=201)


class AdminProductDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def put(self, request, pk):
        try:
            with transaction.atomic():
                product = Product.objects.select_for_update().get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        s = ProductSerializer(product, data=request.data, partial=True, context={"request": request})
        if not s.is_valid():
            return Response(s.errors, status=400)
        s.save()
        broadcast("product:updated", s.data)
        return Response(s.data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        product.delete()
        broadcast("product:deleted", {"id": pk})
        return Response(status=204)


class CustomerOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(
            customer_email=request.user.email
        ).prefetch_related("items").order_by("-created_at")
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderListView(APIView):
    def get(self, request):
        orders = Order.objects.prefetch_related("items").order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            orders = orders.filter(status=status_filter)
        return Response(OrderSerializer(orders, many=True).data)


class AdminOrderUpdateView(APIView):
    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        old_status = order.status
        new_status = request.data.get("status", order.status)
        if new_status not in dict(Order.STATUS):
            return Response({"error": "Invalid status."}, status=400)

        order.status = new_status
        order.save()
        order_data = OrderSerializer(order).data
        broadcast("order:updated", order_data)
        broadcast("order:status_changed", {
            "id": order.pk,
            "order_id": order.order_id,
            "status": order.status,
        })
        if order.status != old_status and order.customer_email:
            _send_order_email(order.customer_email, order, "updated")
        return Response(order_data)


class AdminStatsView(APIView):
    def get(self, request):
        total_orders  = Order.objects.count()
        total_revenue = Order.objects.aggregate(r=Sum("total_amount"))["r"] or 0
        pending       = Order.objects.filter(status="pending").count()
        delivered     = Order.objects.filter(status="delivered").count()
        total_products = Product.objects.filter(is_active=True).count()
        return Response({
            "total_orders":   total_orders,
            "total_revenue":  float(total_revenue),
            "pending_orders": pending,
            "delivered":      delivered,
            "total_products": total_products,
        })


# ── Reviews ───────────────────────────────────────────────────────

class ProductReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        reviews = Review.objects.filter(product_id=pk).select_related("user")
        return Response(ReviewSerializer(reviews, many=True).data)


class SubmitReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not Product.objects.filter(pk=pk, is_active=True).exists():
            return Response({"error": "Product not found."}, status=404)
        # Allow update if already reviewed
        review, _ = Review.objects.update_or_create(
            product_id=pk, user=request.user,
            defaults={
                "rating":  request.data.get("rating"),
                "comment": request.data.get("comment", ""),
            }
        )
        return Response(ReviewSerializer(review).data, status=201)


def get_tokens(user):
    """Return JWT access + refresh tokens, user role, and name."""
    refresh = RefreshToken.for_user(user)
    return {
        "access":  str(refresh.access_token),
        "refresh": str(refresh),
        "role":    getattr(user, "role", ""),
        "name":    getattr(user, "name", ""),
    }


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'error': 'id_token is required.'}, status=400)
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        except Exception as e:
            return Response({'error': f'Invalid Google token: {str(e)}'}, status=400)
        email = idinfo.get('email')
        if not email:
            return Response({'error': 'Email not provided by Google.'}, status=400)
        user, created = User.objects.get_or_create(email=email, defaults={'role': 'customer'})
        # Optionally update name
        name = idinfo.get('name')
        if name and not user.name:
            user.name = name
            user.save()
        return Response(get_tokens(user))



# ── Loyalty ───────────────────────────────────────────────────────

class LoyaltyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        acct, _ = LoyaltyAccount.objects.get_or_create(user=request.user)
        return Response(LoyaltyAccountSerializer(acct).data)


# ── Support ───────────────────────────────────────────────────────

class SupportTicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user).prefetch_related("messages").order_by("-created_at")
        return Response(SupportTicketSerializer(tickets, many=True).data)

    def post(self, request):
        subject = request.data.get("subject", "").strip()
        message = request.data.get("message", "").strip()
        if not subject or not message:
            return Response({"error": "Subject and message are required."}, status=400)
        ticket = SupportTicket.objects.create(user=request.user, subject=subject)
        SupportMessage.objects.create(ticket=ticket, sender="user", text=message)
        return Response(SupportTicketSerializer(ticket).data, status=201)


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_ticket(self, pk, user):
        try:
            return SupportTicket.objects.prefetch_related("messages").get(pk=pk, user=user)
        except SupportTicket.DoesNotExist:
            return None

    def get(self, request, pk):
        ticket = self.get_ticket(pk, request.user)
        if not ticket:
            return Response({"error": "Not found."}, status=404)
        return Response(SupportTicketSerializer(ticket).data)

    def post(self, request, pk):
        ticket = self.get_ticket(pk, request.user)
        if not ticket:
            return Response({"error": "Not found."}, status=404)
        if ticket.status == "closed":
            return Response({"error": "Ticket is closed."}, status=400)
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Message text required."}, status=400)
        msg = SupportMessage.objects.create(ticket=ticket, sender="user", text=text)
        return Response(SupportMessageSerializer(msg).data, status=201)


class AdminSupportListView(APIView):
    def get(self, request):
        tickets = SupportTicket.objects.prefetch_related("messages").order_by("-created_at")
        return Response(SupportTicketSerializer(tickets, many=True).data)


class AdminSupportReplyView(APIView):
    def post(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        text   = request.data.get("text", "").strip()
        action = request.data.get("action")  # "close"
        if text:
            SupportMessage.objects.create(ticket=ticket, sender="admin", text=text)
        if action == "close":
            ticket.status = "closed"
            ticket.save()
        return Response(SupportTicketSerializer(ticket).data)


# ── Email helper ──────────────────────────────────────────────────

def _send_order_email(email, order, event):
    if not email or not getattr(settings, "EMAIL_HOST_USER", ""):
        return
    if event == "placed":
        subject = f"Order Confirmed – {order.order_id} | Aasai Foods"
        body    = (
            f"Hi {order.customer_name},\n\n"
            f"Your order {order.order_id} has been placed successfully!\n"
            f"Total: ₹{order.total_amount}\n\n"
            f"We'll notify you when it ships.\n\nThank you for shopping with Aasai Foods!"
        )
    else:
        subject = f"Order Update – {order.order_id} | Aasai Foods"
        body    = (
            f"Hi {order.customer_name},\n\n"
            f"Your order {order.order_id} status has been updated to: {order.status.upper()}\n\n"
            f"Thank you for shopping with Aasai Foods!"
        )
    try:
        send_mail(subject, body, settings.EMAIL_HOST_USER, [email], fail_silently=True)
    except Exception:
        pass

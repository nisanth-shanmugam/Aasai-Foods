from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .models import Category, Product, Order, OrderItem, Review, LoyaltyAccount, LoyaltyTransaction, SupportTicket, SupportMessage
import uuid


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url     = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ["id", "name", "description", "price", "stock", "image", "image_url", "category", "category_name", "is_active"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name  = serializers.CharField(max_length=100)
    customer_email = serializers.EmailField(required=False, default="")
    phone          = serializers.CharField(max_length=15)
    address        = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=["upi", "cod"], default="upi")
    items          = OrderItemSerializer(many=True)

    def validate_items(self, items):
        if len(items) == 0:
            raise ValidationError("At least one item is required.")

        item_map = {}
        for item in items:
            product_id = item["product_id"]
            quantity = item["quantity"]
            if quantity <= 0:
                raise ValidationError("Quantity must be greater than zero.")
            if product_id in item_map:
                item_map[product_id] += quantity
            else:
                item_map[product_id] = quantity

        products = Product.objects.filter(id__in=item_map.keys(), is_active=True)
        if products.count() != len(item_map):
            raise ValidationError("One or more selected products are unavailable.")

        for product in products:
            if item_map[product.id] > product.stock:
                raise ValidationError({
                    "items": [
                        {
                            "product_id": product.id,
                            "quantity": f"Only {product.stock} unit(s) available for {product.name}."
                        }
                    ]
                })

        return items

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        total = 0
        order_items = []

        with transaction.atomic():
            for item in items_data:
                product = Product.objects.select_for_update().get(id=item["product_id"], is_active=True)
                if item["quantity"] > product.stock:
                    raise ValidationError({
                        "items": [
                            {
                                "product_id": product.id,
                                "quantity": f"Only {product.stock} unit(s) available for {product.name}."
                            }
                        ]
                    })
                subtotal = product.price * item["quantity"]
                total += subtotal
                order_items.append((product, item["quantity"]))

            order = Order.objects.create(
                order_id=f"AF{uuid.uuid4().hex[:6].upper()}",
                total_amount=total,
                status="payment_pending" if validated_data.get("payment_method") == "upi" else "pending",
                **validated_data,
            )

            for product, qty in order_items:
                OrderItem.objects.create(
                    order=order, product=product,
                    name=product.name, price=product.price, quantity=qty,
                )
                product.stock = product.stock - qty
                product.save()

        return order


class OrderItemDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ["id", "name", "price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    payment_screenshot_url = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "id", "order_id", "customer_name", "customer_email", "phone",
            "address", "total_amount", "status", "payment_method",
            "payment_status", "payment_screenshot_url", "created_at", "items",
        ]

    def get_payment_screenshot_url(self, obj):
        request = self.context.get("request")
        if obj.payment_screenshot and request:
            return request.build_absolute_uri(obj.payment_screenshot.url)
        if obj.payment_screenshot:
            return obj.payment_screenshot.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model  = Review
        fields = ["id", "product", "rating", "comment", "user_name", "created_at"]
        read_only_fields = ["user_name", "created_at"]


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LoyaltyTransaction
        fields = ["id", "type", "points", "note", "created_at"]


class LoyaltyAccountSerializer(serializers.ModelSerializer):
    transactions = LoyaltyTransactionSerializer(many=True, read_only=True)

    class Meta:
        model  = LoyaltyAccount
        fields = ["points", "transactions"]


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SupportMessage
        fields = ["id", "sender", "text", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = SupportTicket
        fields = ["id", "subject", "status", "created_at", "messages"]

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
import random
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, UpdateProfileSerializer
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        data["role"] = "customer"  # registration is customers only
        s = RegisterSerializer(data=data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        user = s.save()
        return Response({**get_tokens(user), "message": "Account created successfully."}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        user = authenticate(request, email=s.validated_data["email"], password=s.validated_data["password"])

        if not user:
            return Response({"error": "Invalid email or password."}, status=401)

        if not user.is_active:
            return Response({"error": "Your account has been disabled."}, status=403)

        return Response(get_tokens(user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data["refresh"]).blacklist()
        except Exception:
            pass
        return Response({"message": "Logged out successfully."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        s = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if not s.is_valid():
            return Response(s.errors, status=400)
        s.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current  = request.data.get("current_password", "")
        new_pass = request.data.get("new_password", "")
        if not request.user.check_password(current):
            return Response({"error": "Current password is incorrect."}, status=400)
        if len(new_pass) < 8:
            return Response({"error": "New password must be at least 8 characters."}, status=400)
        request.user.set_password(new_pass)
        request.user.save()
        return Response({"message": "Password changed successfully."})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        # generate 6-digit OTP
        otp = f"{random.randint(100000, 999999)}"
        # store in cache for 5 minutes
        cache.set(f"pwd_reset_otp_{email}", otp, timeout=300)
        # In a real app, send OTP via email/SMS. Here we just return it for demo.
        return Response({"message": "OTP sent to email.", "otp": otp})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")
        if not all([email, code, new_password]):
            return Response({"error": "Email, code and new password are required."}, status=400)
        cached_otp = cache.get(f"pwd_reset_otp_{email}")
        if cached_otp is None:
            return Response({"error": "OTP expired or not requested."}, status=400)
        if code != cached_otp:
            return Response({"error": "Invalid OTP code."}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        if len(new_password) < 8:
            return Response({"error": "New password must be at least 8 characters."}, status=400)
        user.set_password(new_password)
        user.save()
        cache.delete(f"pwd_reset_otp_{email}")
        return Response({"message": "Password reset successful."})

class GoogleOAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'error': 'id_token is required.'}, status=400)
        try:
            idinfo = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                "918591275952-hlt9av64p8cqg97j28agsf0aeol64k4v.apps.googleusercontent.com"
            )
        except Exception as e:
            return Response({'error': f'Invalid Google token: {str(e)}'}, status=400)
        email = idinfo.get('email')
        if not email:
            return Response({'error': 'Email not provided by Google.'}, status=400)
        user, created = User.objects.get_or_create(email=email, defaults={'role': 'customer'})
        name = idinfo.get('name')
        if name and not user.name:
            user.name = name
            user.save()
        tokens = get_tokens(user)
        return Response({**tokens, "name": user.name or "", "role": user.role})

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().order_by("date_joined")
        data = [
            {
                "id": u.id,
                "name": u.name or u.email,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "date_joined": u.date_joined.strftime("%d %b %Y"),
            }
            for u in users
        ]
        return Response(data)


class AdminUserToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        if user == request.user:
            return Response({"error": "Cannot block yourself."}, status=400)
        user.is_active = not user.is_active
        user.save()
        return Response({"id": user.id, "is_active": user.is_active})



from rest_framework.decorators import api_view, permission_classes

@api_view(["GET"])
@permission_classes([AllowAny])
def seed_demo_users_view(request):
    admin_email = "admin@aasai.com"
    admin_pass = "admin123"
    admin_user, created_admin = User.objects.get_or_create(
        email=admin_email,
        defaults={
            "name": "Aasai Admin",
            "role": "admin",
            "is_staff": True,
            "is_superuser": True
        }
    )
    if created_admin or not admin_user.check_password(admin_pass):
        admin_user.set_password(admin_pass)
        admin_user.save()
        admin_status = "created/updated"
    else:
        admin_status = "already exists"

    customer_email = "priya@gmail.com"
    customer_pass = "customer123"
    customer_user, created_customer = User.objects.get_or_create(
        email=customer_email,
        defaults={
            "name": "Priya",
            "role": "customer",
            "is_staff": False,
            "is_superuser": False
        }
    )
    if created_customer or not customer_user.check_password(customer_pass):
        customer_user.set_password(customer_pass)
        customer_user.save()
        customer_status = "created/updated"
    else:
        customer_status = "already exists"

    return Response({
        "status": "success",
        "admin": admin_status,
        "customer": customer_status
    })



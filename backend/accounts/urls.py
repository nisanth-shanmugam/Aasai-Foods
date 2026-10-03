from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("register/",        views.RegisterView.as_view()),
    path("login/",           views.LoginView.as_view(), name="login"),
    path("token/refresh/",   TokenRefreshView.as_view()),
    path("logout/",          views.LogoutView.as_view()),
    path("me/",              views.MeView.as_view()),
    path("me/password/",     views.ChangePasswordView.as_view()),
    path("forgot-password/", views.ForgotPasswordView.as_view()),
    path("reset-password/",  views.ResetPasswordView.as_view()),
    path("google/", views.GoogleOAuthView.as_view(), name="google_oauth"),
    path("seed-demo-users/", views.seed_demo_users_view),
    path("send-otp/",        views.SendPhoneOTPView.as_view()),
    path("verify-otp/",      views.VerifyPhoneOTPView.as_view()),
    path("admin/users/",          views.AdminUserListView.as_view()),
    path("admin/users/<int:pk>/",  views.AdminUserToggleView.as_view()),
]

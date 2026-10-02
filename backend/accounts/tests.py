from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import User


class LoginAuthenticationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("login")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="TestPass123!",
            name="Test User",
        )

    def test_login_success(self):
        res = self.client.post(self.url, {"email": "test@example.com", "password": "TestPass123!"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_login_wrong_password(self):
        res = self.client.post(self.url, {"email": "test@example.com", "password": "WrongPass!"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("error", res.data)

    def test_login_inactive_account(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post(self.url, {"email": "test@example.com", "password": "TestPass123!"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("error", res.data)

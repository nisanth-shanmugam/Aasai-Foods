from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name            = models.CharField(max_length=200)
    description     = models.TextField(blank=True)
    weight          = models.CharField(max_length=20, blank=True)
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price           = models.DecimalField(max_digits=10, decimal_places=2)  # MRP
    stock           = models.IntegerField(default=0)
    image           = models.ImageField(upload_to="products/", blank=True, null=True)
    category        = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS = [
        ("pending",          "Pending"),
        ("payment_pending",  "Payment Pending"),
        ("paid",             "Paid"),
        ("shipped",          "Shipped"),
        ("delivered",        "Delivered"),
        ("cancelled",        "Cancelled"),
    ]
    PAYMENT_METHOD = [
        ("upi",  "UPI"),
        ("cod",  "Cash on Delivery"),
    ]
    PAYMENT_STATUS = [
        ("pending",  "Pending"),
        ("uploaded", "Screenshot Uploaded"),
        ("paid",     "Paid"),
        ("failed",   "Failed"),
    ]

    order_id           = models.CharField(max_length=20, unique=True)
    customer_name      = models.CharField(max_length=100)
    customer_email     = models.EmailField(blank=True, default="")
    phone              = models.CharField(max_length=15)
    address            = models.TextField()
    total_amount       = models.DecimalField(max_digits=10, decimal_places=2)
    status             = models.CharField(max_length=20, choices=STATUS, default="pending")
    payment_method     = models.CharField(max_length=10, choices=PAYMENT_METHOD, default="upi")
    payment_status     = models.CharField(max_length=10, choices=PAYMENT_STATUS, default="pending")
    payment_screenshot = models.ImageField(upload_to="payment_screenshots/", blank=True, null=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product  = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    name     = models.CharField(max_length=200)
    price    = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.name} x{self.quantity}"


class Review(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField()  # 1-5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "user")

    def __str__(self):
        return f"{self.user} → {self.product} ({self.rating}★)"


class LoyaltyAccount(models.Model):
    user   = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loyalty")
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} – {self.points}pts"


class LoyaltyTransaction(models.Model):
    TYPES = [("earn", "Earn"), ("redeem", "Redeem")]
    account    = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name="transactions")
    type       = models.CharField(max_length=10, choices=TYPES)
    points     = models.IntegerField()
    note       = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class SupportTicket(models.Model):
    STATUS = [("open", "Open"), ("closed", "Closed")]
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets")
    subject    = models.CharField(max_length=200)
    status     = models.CharField(max_length=10, choices=STATUS, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"#{self.pk} – {self.subject}"


class SupportMessage(models.Model):
    ticket     = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender     = models.CharField(max_length=10, choices=[("user", "User"), ("admin", "Admin")])
    text       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

from django.urls import path
from . import views

urlpatterns = [
    # Public
    path("categories/",            views.CategoryListView.as_view()),
    path("products/",              views.ProductListView.as_view()),
    path("products/<int:pk>/",     views.ProductDetailView.as_view()),
    path("orders/",                views.PlaceOrderView.as_view()),
    path("orders/<str:order_id>/", views.OrderDetailView.as_view()),
    path("my-orders/",             views.CustomerOrderListView.as_view()),

    # Reviews
    path("products/<int:pk>/reviews/", views.ProductReviewsView.as_view()),
    path("products/<int:pk>/review/",  views.SubmitReviewView.as_view()),

    # Loyalty
    path("loyalty/",               views.LoyaltyView.as_view()),

    # Support
    path("support/",               views.SupportTicketListView.as_view()),
    path("support/<int:pk>/",      views.SupportTicketDetailView.as_view()),

    # Admin
    path("admin/products/",           views.AdminProductListView.as_view()),
    path("admin/products/<int:pk>/",  views.AdminProductDetailView.as_view()),
    path("admin/orders/",             views.AdminOrderListView.as_view()),
    path("admin/orders/<int:pk>/",    views.AdminOrderUpdateView.as_view()),
    path("admin/stats/",              views.AdminStatsView.as_view()),
    path("admin/support/",            views.AdminSupportListView.as_view()),
    path("admin/support/<int:pk>/",   views.AdminSupportReplyView.as_view()),
    path("admin/categories/",         views.AdminCategoryDetailView.as_view()),
    path("admin/categories/<int:pk>/",views.AdminCategoryDetailView.as_view()),
]

from django.contrib import admin
from .models import Category, Product, Order, OrderItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'weight', 'wholesale_price', 'price', 'stock', 'is_active')
    list_filter   = ('category', 'is_active')
    search_fields = ('name',)
    ordering      = ('category__name', 'name')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)


admin.site.register(Order)
admin.site.register(OrderItem)

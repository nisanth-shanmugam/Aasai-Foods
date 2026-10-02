from django.core.management.base import BaseCommand
from store.models import Category, Product


class Command(BaseCommand):
    help = 'Seed database with Aasai Foods products'

    def handle(self, *args, **kwargs):
        cats = {}
        for name in [
            'Health Mix & Millet Products',
            'Masala Products',
            'Soup Varieties',
            'Traditional Rice Products',
            'Pickles',
        ]:
            c, _ = Category.objects.get_or_create(name=name)
            cats[name] = c

        # (name, category, weight, wholesale_price, mrp)
        products = [
            # Health Mix & Millet Products
            ('Aasai Ruchi Health Mix',            'Health Mix & Millet Products', '250g', 100, 125),
            ('Millet Adai Mix',                   'Health Mix & Millet Products', '250g',  70,  90),
            ('Kambu Dosa Mix',                    'Health Mix & Millet Products', '500g',  70,  80),
            ('Millet Ladu',                       'Health Mix & Millet Products', '250g', 100, 125),
            ('Millet Dosa Mix',                   'Health Mix & Millet Products', '500g',  90, 120),
            ('Millet Cookies',                    'Health Mix & Millet Products', '250g', 100, 125),
            # Masala Products
            ('Herbal Idly Podi',                  'Masala Products', '250g',  90, 120),
            ('Mutton Masala',                     'Masala Products', '100g',  60,  80),
            ('Briyani Masala',                    'Masala Products',  '50g',  40,  60),
            ('Sambar Podi',                       'Masala Products', '250g', 125, 150),
            ('Fish Kulambu Masala',               'Masala Products', '100g',  55,  70),
            ('Garam Masala',                      'Masala Products', '100g',  70,  99),
            ('Puliyodharai Podi',                 'Masala Products', '100g',  50,  70),
            ('Lemon Rice Mix',                    'Masala Products', '100g',  50,  70),
            ('Murungai Rice Podi',                'Masala Products', '100g',  55,  75),
            ('Pirandai Rice Podi',                'Masala Products', '100g',  55,  75),
            ('Curry Leaf Rice Podi',              'Masala Products', '100g',  55,  75),
            # Soup Varieties
            ('Mudavattukal Soup Mix',             'Soup Varieties', '100g', 150, 199),
            ('Murungai Soup Mix',                 'Soup Varieties', '100g',  60,  90),
            ('Banana Stem Soup Mix',              'Soup Varieties', '100g',  60,  90),
            ('Pirandai Soup Mix',                 'Soup Varieties', '100g',  60,  90),
            ('Mudakathan Soup Mix',               'Soup Varieties', '100g',  60,  90),
            ('Manathakali Soup Mix',              'Soup Varieties', '100g',  70,  99),
            ('Thuthuvalai Soup Mix',              'Soup Varieties', '100g',  80,  99),
            ('Herbal Tea',                        'Soup Varieties', '100g',  70,  99),
            # Traditional Rice Products
            ('Karupukavuni Kanji Mix',            'Traditional Rice Products', '250g',  50,  75),
            ('Puttu Mix',                         'Traditional Rice Products', '250g',  50,  75),
            ('Black Ulundu Kanji Mix',            'Traditional Rice Products', '250g',  50,  75),
            ('Bajji Mix / Bonda Mix',             'Traditional Rice Products', '500g',  60,  75),
            ('Murukku Mavu Mix',                  'Traditional Rice Products',  '1kg', 200, 225),
            # Pickles
            ('Mango / Narthangai / Lemon Pickle', 'Pickles',                   '200g',  75,  90),
        ]

        for name, cat, weight, wholesale, mrp in products:
            p, created = Product.objects.update_or_create(
                name=name,
                defaults={
                    'category':        cats[cat],
                    'weight':          weight,
                    'wholesale_price': wholesale,
                    'price':           mrp,
                    'stock':           100,
                    'is_active':       True,
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {name}'))

        self.stdout.write(self.style.SUCCESS(f'\nTotal: {Product.objects.count()} products'))

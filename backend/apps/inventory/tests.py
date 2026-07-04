from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.tenants.models import Company, Branch, Tenant
from apps.catalog.models import Product, ProductUnit
from .models import Warehouse, StockLocation, StockLevel, StockMovement

User = get_user_model()
TENANT_ID = '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5c'


def _setup_base():
    tenant = Tenant.objects.create(name='Inv Tenant', subdomain='inv', tenant_id=TENANT_ID)
    company = Company.objects.create(name='Inv Co', tenant_id=TENANT_ID)
    branch = Branch.objects.create(name='Main Branch', company=company, tenant_id=TENANT_ID, address='HQ')
    unit = ProductUnit.objects.create(name='Piece', abbreviation='PCS', company=company, tenant_id=TENANT_ID)
    warehouse = Warehouse.objects.create(
        name='Main Warehouse', code='WH-MAIN',
        company=company, branch=branch, tenant_id=TENANT_ID,
    )
    location_in = StockLocation.objects.create(
        name='Receiving', code='RCV',
        warehouse=warehouse, location_type='RECEIVING', tenant_id=TENANT_ID,
    )
    location_shelf = StockLocation.objects.create(
        name='Shelf A1', code='SHELF-A1',
        warehouse=warehouse, location_type='INTERNAL', tenant_id=TENANT_ID,
    )
    product = Product.objects.create(
        name='Test Coffee', internal_ref='TCF-001',
        company=company, unit=unit, tenant_id=TENANT_ID,
        sell_price='5.00', cost_price='1.50', product_type='STORABLE',
    )
    return company, branch, warehouse, location_in, location_shelf, product


class StockMovementTests(TestCase):

    def setUp(self):
        self.company, self.branch, self.warehouse, self.loc_in, self.loc_shelf, self.product = _setup_base()

    def test_receipt_creates_stock_level(self):
        StockMovement.objects.create(
            product=self.product,
            to_location=self.loc_in,
            quantity=Decimal('100'),
            movement_type='RECEIPT',
            reference='PO-001',
            tenant_id=TENANT_ID,
        )
        level = StockLevel.objects.get(product=self.product, location=self.loc_in)
        self.assertEqual(level.quantity, Decimal('100'))

    def test_transfer_debits_source_credits_destination(self):
        # Receive 50 units first
        StockMovement.objects.create(
            product=self.product, to_location=self.loc_in,
            quantity=Decimal('50'), movement_type='RECEIPT', tenant_id=TENANT_ID,
        )
        # Transfer 20 from receiving to shelf
        StockMovement.objects.create(
            product=self.product,
            from_location=self.loc_in,
            to_location=self.loc_shelf,
            quantity=Decimal('20'),
            movement_type='TRANSFER',
            tenant_id=TENANT_ID,
        )
        level_in = StockLevel.objects.get(product=self.product, location=self.loc_in)
        level_shelf = StockLevel.objects.get(product=self.product, location=self.loc_shelf)
        self.assertEqual(level_in.quantity, Decimal('30'))
        self.assertEqual(level_shelf.quantity, Decimal('20'))

    def test_issue_reduces_stock(self):
        StockMovement.objects.create(
            product=self.product, to_location=self.loc_shelf,
            quantity=Decimal('10'), movement_type='RECEIPT', tenant_id=TENANT_ID,
        )
        StockMovement.objects.create(
            product=self.product, from_location=self.loc_shelf,
            quantity=Decimal('3'), movement_type='ISSUE', tenant_id=TENANT_ID,
        )
        level = StockLevel.objects.get(product=self.product, location=self.loc_shelf)
        self.assertEqual(level.quantity, Decimal('7'))

    def test_movement_requires_at_least_one_location(self):
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            StockMovement.objects.create(
                product=self.product,
                quantity=Decimal('5'),
                movement_type='ADJUSTMENT',
                tenant_id=TENANT_ID,
            )

    def test_movement_quantity_must_be_positive(self):
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            StockMovement.objects.create(
                product=self.product,
                to_location=self.loc_shelf,
                quantity=Decimal('-1'),
                movement_type='RECEIPT',
                tenant_id=TENANT_ID,
            )

    def test_movement_is_immutable_via_api(self):
        user = User.objects.create_user(username='invuser', password='x', tenant_id=TENANT_ID)
        import jwt, datetime
        from django.conf import settings
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'tenant_id': TENANT_ID,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}', HTTP_X_TENANT_ID=TENANT_ID)
        mv = StockMovement.objects.create(
            product=self.product, to_location=self.loc_shelf,
            quantity=Decimal('5'), movement_type='RECEIPT', tenant_id=TENANT_ID,
        )
        res = client.patch(f'/api/v1/inventory/movements/{mv.id}/', {'quantity': '99'}, format='json')
        self.assertEqual(res.status_code, 405)

    def test_stock_level_summary_endpoint(self):
        user = User.objects.create_user(username='sumuser', password='x', tenant_id=TENANT_ID)
        import jwt, datetime
        from django.conf import settings
        payload = {
            'user_id': str(user.id), 'username': user.username,
            'tenant_id': TENANT_ID,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}', HTTP_X_TENANT_ID=TENANT_ID)
        StockMovement.objects.create(
            product=self.product, to_location=self.loc_shelf,
            quantity=Decimal('15'), movement_type='RECEIPT', tenant_id=TENANT_ID,
        )
        res = client.get('/api/v1/inventory/levels/summary/')
        self.assertEqual(res.status_code, 200)
        totals = {item['product__name']: item['total_qty'] for item in res.json()}
        self.assertIn('Test Coffee', totals)

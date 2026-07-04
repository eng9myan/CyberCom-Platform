from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import PosSession, PosOrder, PosOrderLine, PosPayment, PosReceipt
from .serializers import (
    PosSessionSerializer, PosOrderSerializer, PosOrderListSerializer,
    PosOrderLineSerializer, PosPaymentSerializer, PosReceiptSerializer,
)


class PosSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PosSessionSerializer

    def get_queryset(self):
        qs = PosSession.objects.filter(
            tenant_id=self.request.tenant_id, is_deleted=False
        ).select_related('company', 'branch', 'cashier')
        if v := self.request.query_params.get('company'):
            qs = qs.filter(company_id=v)
        if v := self.request.query_params.get('status'):
            qs = qs.filter(status=v)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            cashier=self.request.user,
            tenant_id=self.request.tenant_id,
        )

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        session = self.get_object()
        if session.status == 'CLOSED':
            return Response({'detail': 'Session already closed.'}, status=status.HTTP_400_BAD_REQUEST)
        session.closing_float = request.data.get('closing_float', '0')
        session.status = 'CLOSED'
        session.closing_at = timezone.now()
        session.save()
        return Response(self.get_serializer(session).data)


class PosOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return PosOrderListSerializer
        return PosOrderSerializer

    def get_queryset(self):
        qs = PosOrder.objects.filter(
            tenant_id=self.request.tenant_id, is_deleted=False
        ).select_related('cashier', 'session').prefetch_related('lines', 'payments')
        p = self.request.query_params
        if v := p.get('status'):
            qs = qs.filter(status=v)
        if v := p.get('session'):
            qs = qs.filter(session_id=v)
        if v := p.get('company'):
            qs = qs.filter(company_id=v)
        if v := p.get('source'):
            qs = qs.filter(source=v)
        if v := p.get('date_from'):
            qs = qs.filter(created_at__date__gte=v)
        if v := p.get('date_to'):
            qs = qs.filter(created_at__date__lte=v)
        return qs

    def perform_create(self, serializer):
        serializer.save(cashier=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'DRAFT':
            return Response({'detail': 'Only DRAFT orders can be confirmed.'}, status=status.HTTP_400_BAD_REQUEST)
        if not order.lines.filter(is_deleted=False).exists():
            return Response({'detail': 'Order has no lines.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'CONFIRMED'
        order.save()
        return Response(PosOrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def add_line(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('DRAFT', 'CONFIRMED'):
            return Response(
                {'detail': 'Cannot modify order in current status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PosOrderLineSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        line = serializer.save(order=order, tenant_id=request.tenant_id)
        order.recalculate()
        return Response(
            PosOrderLineSerializer(line, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path=r'lines/(?P<line_pk>[^/.]+)')
    def remove_line(self, request, pk=None, line_pk=None):
        order = self.get_object()
        if order.status not in ('DRAFT', 'CONFIRMED'):
            return Response(
                {'detail': 'Cannot modify order in current status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            line = order.lines.get(pk=line_pk, is_deleted=False)
        except PosOrderLine.DoesNotExist:
            return Response({'detail': 'Line not found.'}, status=status.HTTP_404_NOT_FOUND)
        line.is_deleted = True
        line.save()
        order.recalculate()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('DRAFT', 'CONFIRMED'):
            return Response(
                {'detail': 'Order cannot accept payment in current status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not order.lines.filter(is_deleted=False).exists():
            return Response({'detail': 'Order has no lines.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PosPaymentSerializer(
            data={**request.data, 'order': str(order.id)},
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            serializer.save(order=order, tenant_id=request.tenant_id)
            total_paid = sum(
                p.amount for p in order.payments.filter(is_deleted=False)
            )
            if total_paid >= order.total:
                order.status = 'PAID'
                order.paid_at = timezone.now()
                order.save()
                receipt_num = f"REC-{timezone.now().strftime('%Y%m%d')}-{str(order.id)[:8].upper()}"
                PosReceipt.objects.get_or_create(
                    order=order,
                    defaults={'tenant_id': request.tenant_id, 'receipt_number': receipt_num},
                )

        order.refresh_from_db()
        return Response(PosOrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == 'PAID':
            return Response(
                {'detail': 'Paid orders cannot be cancelled; process a refund instead.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = 'CANCELLED'
        order.save()
        return Response(PosOrderSerializer(order, context={'request': request}).data)


class PosPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PosPaymentSerializer

    def get_queryset(self):
        qs = PosPayment.objects.filter(
            tenant_id=self.request.tenant_id, is_deleted=False
        )
        if v := self.request.query_params.get('order'):
            qs = qs.filter(order_id=v)
        return qs


class PosReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PosReceiptSerializer

    def get_queryset(self):
        return PosReceipt.objects.filter(
            tenant_id=self.request.tenant_id, is_deleted=False
        ).select_related('order')

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import LaundryBatch, LinenCart
from .serializers import LaundryBatchSerializer, LinenCartSerializer


class LinenCartViewSet(HospitalModelViewSet):
    queryset = LinenCart.objects.all()
    serializer_class = LinenCartSerializer

    @action(detail=False, methods=["get"], url_path="needs-attention")
    def needs_attention(self, request):
        tenant_id = getattr(request, "tenant_id", None)
        carts = [c for c in LinenCart.objects.filter(tenant_id=tenant_id) if c.needs_attention]
        return Response(LinenCartSerializer(carts, many=True).data)


class LaundryBatchViewSet(HospitalModelViewSet):
    queryset = LaundryBatch.objects.all()
    serializer_class = LaundryBatchSerializer

    @action(detail=True, methods=["post"])
    def send_to_laundry(self, request, pk=None):
        batch = self.get_object()
        if batch.status != "collected":
            return Response({"detail": f"Cannot send a batch in status '{batch.status}' to laundry."}, status=status.HTTP_400_BAD_REQUEST)
        batch.sent_to_laundry_at = timezone.now()
        batch.status = "at_laundry"
        batch.save(update_fields=["sent_to_laundry_at", "status", "updated_at"])
        return Response(LaundryBatchSerializer(batch).data)

    @action(detail=True, methods=["post"])
    def receive_return(self, request, pk=None):
        batch = self.get_object()
        item_count_returned = request.data.get("item_count_returned")
        if item_count_returned is None:
            return Response({"detail": "item_count_returned is required."}, status=status.HTTP_400_BAD_REQUEST)
        batch.mark_returned(item_count_returned=int(item_count_returned))
        return Response(LaundryBatchSerializer(batch).data)

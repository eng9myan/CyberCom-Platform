from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from products.cymed.hospital.views import HospitalModelViewSet

from .models import CleaningTask, HygieneAudit
from .serializers import CleaningTaskSerializer, HygieneAuditSerializer


class CleaningTaskViewSet(HospitalModelViewSet):
    queryset = CleaningTask.objects.all()
    serializer_class = CleaningTaskSerializer

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.status not in ("pending", "in_progress"):
            return Response({"detail": f"Cannot complete a task in status '{task.status}'."}, status=status.HTTP_400_BAD_REQUEST)
        task.status = "completed"
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at"])
        return Response(CleaningTaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        task = self.get_object()
        if task.status != "completed":
            return Response({"detail": "Only a completed task can be verified."}, status=status.HTTP_400_BAD_REQUEST)
        task.status = "verified"
        task.verified_by = request.data.get("verified_by")
        task.verified_at = timezone.now()
        task.save(update_fields=["status", "verified_by", "verified_at"])
        return Response(CleaningTaskSerializer(task).data)


class HygieneAuditViewSet(HospitalModelViewSet):
    queryset = HygieneAudit.objects.all()
    serializer_class = HygieneAuditSerializer

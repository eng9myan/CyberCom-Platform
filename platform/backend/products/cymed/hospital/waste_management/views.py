from products.cymed.hospital.views import HospitalModelViewSet

from .models import HaulerManifest, WasteCollectionLog
from .serializers import HaulerManifestSerializer, WasteCollectionLogSerializer


class WasteCollectionLogViewSet(HospitalModelViewSet):
    queryset = WasteCollectionLog.objects.all()
    serializer_class = WasteCollectionLogSerializer


class HaulerManifestViewSet(HospitalModelViewSet):
    queryset = HaulerManifest.objects.all()
    serializer_class = HaulerManifestSerializer

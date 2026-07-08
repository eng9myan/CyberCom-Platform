from products.cymed.hospital.views import HospitalModelViewSet

from .models import MortuaryCase, ReleaseRecord
from .serializers import MortuaryCaseSerializer, ReleaseRecordSerializer


class MortuaryCaseViewSet(HospitalModelViewSet):
    queryset = MortuaryCase.objects.all()
    serializer_class = MortuaryCaseSerializer


class ReleaseRecordViewSet(HospitalModelViewSet):
    queryset = ReleaseRecord.objects.all()
    serializer_class = ReleaseRecordSerializer

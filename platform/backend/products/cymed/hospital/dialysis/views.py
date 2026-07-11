from products.cymed.hospital.views import HospitalModelViewSet

from .models import (
    DialysisCarePlan,
    DialysisComplication,
    DialysisMachine,
    DialysisOrder,
    DialysisSession,
    VascularAccess,
)
from .serializers import (
    DialysisCarePlanSerializer,
    DialysisComplicationSerializer,
    DialysisMachineSerializer,
    DialysisOrderSerializer,
    DialysisSessionSerializer,
    VascularAccessSerializer,
)

DIALYSIS_STAFF_ROLES = {"physician", "nurse", "dialysis_technician"}


class VascularAccessViewSet(HospitalModelViewSet):
    queryset = VascularAccess.objects.all()
    serializer_class = VascularAccessSerializer
    action_required_roles = {"create": {"physician"}, "update": {"physician"}, "partial_update": {"physician"}}


class DialysisMachineViewSet(HospitalModelViewSet):
    queryset = DialysisMachine.objects.all()
    serializer_class = DialysisMachineSerializer
    action_required_roles = {"create": DIALYSIS_STAFF_ROLES, "update": DIALYSIS_STAFF_ROLES}


class DialysisOrderViewSet(HospitalModelViewSet):
    queryset = DialysisOrder.objects.all()
    serializer_class = DialysisOrderSerializer
    action_required_roles = {"create": {"physician"}, "update": {"physician"}, "partial_update": {"physician"}}


class DialysisCarePlanViewSet(HospitalModelViewSet):
    queryset = DialysisCarePlan.objects.all()
    serializer_class = DialysisCarePlanSerializer
    action_required_roles = {"create": {"physician"}, "update": {"physician"}, "partial_update": {"physician"}}


class DialysisSessionViewSet(HospitalModelViewSet):
    queryset = DialysisSession.objects.all()
    serializer_class = DialysisSessionSerializer
    action_required_roles = {
        "create": DIALYSIS_STAFF_ROLES,
        "update": DIALYSIS_STAFF_ROLES,
        "partial_update": DIALYSIS_STAFF_ROLES,
    }


class DialysisComplicationViewSet(HospitalModelViewSet):
    queryset = DialysisComplication.objects.all()
    serializer_class = DialysisComplicationSerializer
    action_required_roles = {
        "create": DIALYSIS_STAFF_ROLES,
        "update": DIALYSIS_STAFF_ROLES,
        "partial_update": DIALYSIS_STAFF_ROLES,
    }

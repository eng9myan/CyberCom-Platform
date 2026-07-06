from django.urls import re_path

from products.cymed.hospital.clinical_command_center.consumers import HospitalKpiConsumer

websocket_urlpatterns = [
    re_path(r"^ws/hospital/command-center/$", HospitalKpiConsumer.as_asgi()),
]

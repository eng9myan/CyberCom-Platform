from django.urls import path

from .gateway import ExternalInvoiceGatewayView

urlpatterns = [
    path("external-invoice/", ExternalInvoiceGatewayView.as_view(), name="external-invoice-gateway"),
]

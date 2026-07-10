import random

from rest_framework import serializers

from platform.cyintegrationhub.models import IntegrationPartner
from platform.cyintegrationhub.services import ConnectorFramework
from products.cymed.clinic.insurance_bridge.models import (
    AuthorizationRequest,
    AuthorizationResponse,
    EligibilityCheck,
    InsurancePlan,
    Payer,
)


class PayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payer
        fields = "__all__"


class InsurancePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePlan
        fields = "__all__"


class EligibilityCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = EligibilityCheck
        fields = ["id", "patient", "plan", "checked_at", "is_eligible", "response_details"]
        read_only_fields = ["checked_at", "is_eligible", "response_details"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", "00000000-0000-0000-0000-000000000000")
        validated_data["tenant_id"] = tenant_id

        # Fetch or create partner for external routing
        partner, _ = IntegrationPartner.objects.get_or_create(
            name="Availity Clearinghouse",
            defaults={
                "slug": "availity",
                "protocol": "fhir",
                "direction": "bidirectional",
                "metadata": {"endpoint": "https://api.availity.com/v1"},
            },
        )

        # Route through CyIntegrationHub Connector -- the FHIR connector requires a
        # built resource dict (with resourceType), not a raw payload.
        connector_res = ConnectorFramework.execute_connector(
            tenant_id=tenant_id,
            partner=partner,
            connector_type="fhir",
            action="send",
            payload={
                "resourceType": "CoverageEligibilityRequest",
                "status": "active",
                "purpose": ["validation"],
                "patient": {"reference": f"Patient/{validated_data['patient'].id}"},
                "insurer": {"identifier": {"value": validated_data["plan"].payer.payer_code}},
                "insurance": [
                    {"coverage": {"identifier": {"value": validated_data["plan"].plan_code}}}
                ],
            },
        )

        # "sent" is the only success status _send_fhir_resource ever returns (see its
        # docstring: it never fabricates a status for a call that never happened) --
        # "synced" was never a real value here.
        is_eligible = connector_res.get("fhir_status") == "sent"
        response_details = {
            "card_status": "active" if is_eligible else "inactive",
            "coverage_valid": is_eligible,
            "copay_percent": float(validated_data["plan"].copay_percentage),
            "connector_raw": connector_res,
        }

        return EligibilityCheck.objects.create(
            is_eligible=is_eligible, response_details=response_details, **validated_data
        )


class AuthorizationResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorizationResponse
        fields = "__all__"


class AuthorizationRequestSerializer(serializers.ModelSerializer):
    response = AuthorizationResponseSerializer(read_only=True)

    class Meta:
        model = AuthorizationRequest
        fields = [
            "id",
            "patient",
            "plan",
            "requested_service",
            "clinical_justification",
            "status",
            "response",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", "00000000-0000-0000-0000-000000000000")
        validated_data["tenant_id"] = tenant_id

        # Fetch or create partner for external routing
        partner, _ = IntegrationPartner.objects.get_or_create(
            name="Availity Clearinghouse",
            defaults={
                "slug": "availity",
                "protocol": "fhir",
                "direction": "bidirectional",
                "metadata": {"endpoint": "https://api.availity.com/v1"},
            },
        )

        # Route soap transaction through CyIntegrationHub Connector
        connector_res = ConnectorFramework.execute_connector(
            tenant_id=tenant_id,
            partner=partner,
            connector_type="soap",
            action="send",
            payload=f"<PriorAuthRequest><Patient>{validated_data['patient'].id}</Patient><Service>{validated_data['requested_service']}</Service></PriorAuthRequest>",
        )

        # Prior Authorization logic using SOAP response
        status_val = (
            "approved" if connector_res.get("soap_status") == "response_received" else "pending"
        )
        auth_req = AuthorizationRequest.objects.create(status=status_val, **validated_data)

        # Generate auth response immediately
        rand_num = random.randint(10000, 99999)
        AuthorizationResponse.objects.create(
            tenant_id=tenant_id, request=auth_req, authorization_number=f"AUTH-{rand_num}"
        )

        return auth_req

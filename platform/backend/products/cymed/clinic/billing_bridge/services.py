"""FHIR R4 mapping for clinic billing entities. Mirrors FHIRLabService/FHIRImagingService."""
from typing import Any


class FHIRBillingService:
    @staticmethod
    def to_fhir_claim(charge_item, amount) -> dict[str, Any]:
        encounter = charge_item.encounter
        service = charge_item.service
        return {
            "resourceType": "Claim",
            "id": str(charge_item.id),
            "status": "active",
            "type": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                        "code": "institutional",
                    }
                ]
            },
            "use": "claim",
            "patient": {"reference": f"Patient/{encounter.patient_id}"},
            "created": charge_item.created_at.isoformat(),
            "provider": {"reference": f"Organization/{encounter.organization_id}"},
            "priority": {"coding": [{"code": "normal"}]},
            "item": [
                {
                    "sequence": 1,
                    "productOrService": {
                        "coding": [
                            {
                                "system": "urn:cybercom:clinic:charge-code",
                                "code": service.charge_code.code,
                                "display": service.charge_code.display,
                            }
                        ]
                    },
                    "quantity": {"value": charge_item.quantity},
                    "unitPrice": {"value": float(service.price), "currency": service.price_list.currency},
                    "net": {"value": float(amount), "currency": service.price_list.currency},
                }
            ],
        }

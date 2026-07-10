from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from products.cycom.finance.gl.models import Account, JournalEntry, JournalLine
from products.cymed.clinic.billing_bridge.models import (
    ChargeCode,
    ChargeItem,
    ClinicService,
    PriceList,
)
from products.cymed.clinic.billing_bridge.services import FHIRBillingService

AR_ACCOUNT_CODE = "1200"
CLINICAL_REVENUE_ACCOUNT_CODE = "4000"


class ChargeCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeCode
        fields = "__all__"


class PriceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceList
        fields = "__all__"


class ClinicServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicService
        fields = "__all__"


class ChargeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeItem
        fields = ["id", "encounter", "service", "quantity", "posted_to_erp", "erp_transaction_id"]
        read_only_fields = ["posted_to_erp", "erp_transaction_id"]

    def create(self, validated_data):
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", "00000000-0000-0000-0000-000000000000")
        validated_data["tenant_id"] = tenant_id

        with transaction.atomic():
            charge_item = ChargeItem.objects.create(**validated_data)
            journal_entry = self._post_to_gl(tenant_id, charge_item)
            charge_item.posted_to_erp = True
            charge_item.erp_transaction_id = f"ERP-TX-{journal_entry.id}"
            charge_item.save(update_fields=["posted_to_erp", "erp_transaction_id"])

        self._dispatch_fhir_claim(tenant_id, charge_item, journal_entry.total_debit)
        return charge_item

    def _dispatch_fhir_claim(self, tenant_id, charge_item: ChargeItem, amount) -> None:
        from platform.cyintegrationhub.services import dispatch_fhir_resource

        claim = FHIRBillingService.to_fhir_claim(charge_item, amount)
        try:
            dispatch_fhir_resource(tenant_id, claim)
        except Exception:
            # FHIR interoperability dispatch is a side channel -- a down/misconfigured
            # partner endpoint must never block the GL posting that already committed.
            pass

    def _post_to_gl(self, tenant_id, charge_item: ChargeItem) -> JournalEntry:
        service = charge_item.service
        amount = service.price * charge_item.quantity

        ar_account, _ = Account.objects.get_or_create(
            tenant_id=tenant_id,
            code=AR_ACCOUNT_CODE,
            defaults={
                "name": "Accounts Receivable",
                "account_type": "asset",
                "currency": service.price_list.currency,
            },
        )
        revenue_account, _ = Account.objects.get_or_create(
            tenant_id=tenant_id,
            code=CLINICAL_REVENUE_ACCOUNT_CODE,
            defaults={
                "name": "Clinical Service Revenue",
                "account_type": "revenue",
                "currency": service.price_list.currency,
            },
        )

        journal_entry = JournalEntry.objects.create(
            tenant_id=tenant_id,
            entry_date=timezone.now().date(),
            description=f"Clinic charge: encounter {charge_item.encounter_id}, service {service.charge_code.code}",
            reference=f"CHG-{charge_item.id}",
            status="posted",
            posted_at=timezone.now(),
            total_debit=amount,
            total_credit=amount,
        )
        JournalLine.objects.create(
            tenant_id=tenant_id,
            journal=journal_entry,
            account=ar_account,
            debit=amount,
            credit=0,
            description=f"AR for charge {charge_item.id}",
        )
        JournalLine.objects.create(
            tenant_id=tenant_id,
            journal=journal_entry,
            account=revenue_account,
            debit=0,
            credit=amount,
            description=f"Revenue for charge {charge_item.id}",
        )

        ar_account.balance += amount
        ar_account.save(update_fields=["balance"])
        revenue_account.balance += amount
        revenue_account.save(update_fields=["balance"])

        return journal_entry

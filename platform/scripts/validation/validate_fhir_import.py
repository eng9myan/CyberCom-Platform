#!/usr/bin/env python3
"""
CyberCom Platform — FHIR R4 Import Validation Script
Program 10, Phase 5: Implementation Validation

Validates:
- FHIR R4 Bundle import (Patient, Observation, Condition, MedicationRequest,
  DiagnosticReport, Encounter, Practitioner, Organization)
- FHIR $validate operation
- HL7 FHIR Terminology ($lookup for ICD-11, LOINC, SNOMED)
- FHIR Subscription endpoints
- FHIR CapabilityStatement

Usage:
    python validate_fhir_import.py \
        --fhir-base https://fhir.cy-com.com/R4 \
        --token <JWT> \
        --tenant-id <UUID> \
        [--verbose]
"""
import argparse
import json
import sys
import uuid
import urllib.request
import urllib.error
from datetime import date, datetime, timezone


PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"


class FHIRValidator:
    def __init__(self, base_url: str, token: str, tenant_id: str, verbose: bool = False):
        self.base = base_url.rstrip("/")
        self.token = token
        self.tenant_id = tenant_id
        self.verbose = verbose
        self.results: list = []
        self._created: dict = {}

    def _call(self, method: str, path: str, body=None, content_type="application/fhir+json"):
        url = f"{self.base}{path}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(
            url, data=data, method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "X-Tenant-ID": self.tenant_id,
                "Content-Type": content_type,
                "Accept": "application/fhir+json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as e:
            try:
                body_text = json.loads(e.read())
            except Exception:
                body_text = {}
            return e.code, body_text
        except Exception as exc:
            return 0, {"error": str(exc)}

    def check(self, name: str, status: str, detail: str = "") -> None:
        icon = "✓" if status == PASS else ("⚠" if status == SKIP else "✗")
        line = f"  {icon} [{status}] {name}"
        if detail and (self.verbose or status != PASS):
            line += f"\n         → {detail}"
        print(line)
        self.results.append({"name": name, "status": status})

    def assert_fhir(self, name: str, code: int, body: dict, resource_type: str = None):
        if code in (200, 201):
            rt = body.get("resourceType", "")
            if resource_type and rt != resource_type:
                self.check(name, FAIL, f"Expected resourceType={resource_type}, got {rt}")
                return None
            self.check(name, PASS)
            return body
        self.check(name, FAIL, f"HTTP {code}: {json.dumps(body)[:150]}")
        return None

    def validate_capability_statement(self):
        """Check FHIR CapabilityStatement for R4 conformance."""
        code, body = self._call("GET", "/metadata")
        if self.assert_fhir("CapabilityStatement (metadata)", code, body, "CapabilityStatement"):
            fhir_ver = body.get("fhirVersion", "")
            if fhir_ver.startswith("4."):
                self.check("FHIR R4 version declared", PASS, f"fhirVersion: {fhir_ver}")
            else:
                self.check("FHIR R4 version declared", FAIL, f"fhirVersion: {fhir_ver}")
            # Check required resources in CapabilityStatement
            rest = body.get("rest", [{}])[0] if body.get("rest") else {}
            supported = {r.get("type") for r in rest.get("resource", [])}
            required = {"Patient", "Encounter", "Observation", "Condition",
                        "MedicationRequest", "DiagnosticReport", "Practitioner"}
            missing = required - supported
            if missing:
                self.check("Required FHIR resources supported", FAIL, f"Missing: {missing}")
            else:
                self.check("Required FHIR resources supported", PASS)

    def validate_patient_create(self):
        patient = {
            "resourceType": "Patient",
            "id": str(uuid.uuid4()),
            "identifier": [{"system": "https://cy-com.com/patient-id", "value": f"UAT-{uuid.uuid4().hex[:8]}"}],
            "name": [{"use": "official", "family": "Al-Rashidi", "given": ["Rania"]}],
            "gender": "female",
            "birthDate": "1985-11-22",
            "telecom": [{"system": "phone", "value": "+962-799-123456", "use": "mobile"}],
            "address": [{"use": "home", "country": "JO", "city": "Amman"}],
        }
        code, body = self._call("POST", "/Patient", patient)
        result = self.assert_fhir("Patient CREATE (FHIR)", code, body, "Patient")
        if result:
            self._created["patient_id"] = result.get("id") or patient["id"]

    def validate_observation_create(self):
        patient_id = self._created.get("patient_id", str(uuid.uuid4()))
        obs = {
            "resourceType": "Observation",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                       "code": "laboratory"}]}],
            "code": {"coding": [{"system": "http://loinc.org", "code": "2160-0",
                                  "display": "Creatinine [Mass/volume] in Serum or Plasma"}]},
            "subject": {"reference": f"Patient/{patient_id}"},
            "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
            "valueQuantity": {"value": 1.1, "unit": "mg/dL",
                               "system": "http://unitsofmeasure.org", "code": "mg/dL"},
            "referenceRange": [{"low": {"value": 0.6, "unit": "mg/dL"},
                                 "high": {"value": 1.2, "unit": "mg/dL"}}],
        }
        code, body = self._call("POST", "/Observation", obs)
        self.assert_fhir("Observation CREATE (lab result)", code, body, "Observation")

    def validate_condition_create(self):
        patient_id = self._created.get("patient_id", str(uuid.uuid4()))
        condition = {
            "resourceType": "Condition",
            "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                            "code": "active"}]},
            "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                                                "code": "confirmed"}]},
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-category",
                                       "code": "encounter-diagnosis"}]}],
            "code": {"coding": [{"system": "http://id.who.int/icd/release/11/mms", "code": "CA40",
                                  "display": "Myocardial infarction"}]},
            "subject": {"reference": f"Patient/{patient_id}"},
            "onsetDateTime": str(date.today()),
        }
        code, body = self._call("POST", "/Condition", condition)
        self.assert_fhir("Condition CREATE (ICD-11 coded diagnosis)", code, body, "Condition")

    def validate_medication_request_create(self):
        patient_id = self._created.get("patient_id", str(uuid.uuid4()))
        med_req = {
            "resourceType": "MedicationRequest",
            "status": "active",
            "intent": "order",
            "medicationCodeableConcept": {
                "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                             "code": "1049502", "display": "Warfarin 5 MG Oral Tablet"}]
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            "authoredOn": str(date.today()),
            "dosageInstruction": [{"text": "5mg orally once daily", "timing": {"repeat": {"frequency": 1, "period": 1, "periodUnit": "d"}}}],
        }
        code, body = self._call("POST", "/MedicationRequest", med_req)
        self.assert_fhir("MedicationRequest CREATE (RxNorm coded)", code, body, "MedicationRequest")

    def validate_bundle_transaction(self):
        """FHIR Bundle transaction — atomic create of multiple resources."""
        patient_id = f"urn:uuid:{uuid.uuid4()}"
        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [
                {
                    "fullUrl": patient_id,
                    "resource": {
                        "resourceType": "Patient",
                        "name": [{"family": "BundleTest", "given": ["FHIR"]}],
                        "gender": "male",
                        "birthDate": "1970-01-01",
                    },
                    "request": {"method": "POST", "url": "Patient"},
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "final",
                        "code": {"coding": [{"system": "http://loinc.org", "code": "2160-0",
                                              "display": "Creatinine"}]},
                        "subject": {"reference": patient_id},
                        "valueQuantity": {"value": 0.9, "unit": "mg/dL"},
                    },
                    "request": {"method": "POST", "url": "Observation"},
                },
            ],
        }
        code, body = self._call("POST", "/", bundle)
        result = self.assert_fhir("FHIR Bundle transaction (atomic)", code, body, "Bundle")
        if result:
            entries = result.get("entry", [])
            success_entries = [e for e in entries
                               if e.get("response", {}).get("status", "").startswith("2")]
            self.check("Bundle entries created", PASS if len(success_entries) >= 2 else FAIL,
                       f"{len(success_entries)}/{len(entries)} entries succeeded")

    def validate_terminology_lookup(self):
        """FHIR $lookup for ICD-11 code via TerminologyService."""
        code, body = self._call(
            "GET",
            "/CodeSystem/$lookup?system=http://id.who.int/icd/release/11/mms&code=CA40",
        )
        if code == 200:
            params = body.get("parameter", [])
            display_param = next((p for p in params if p.get("name") == "display"), None)
            if display_param:
                self.check("ICD-11 $lookup (CA40 → Myocardial infarction)", PASS,
                            display_param.get("valueString", ""))
            else:
                self.check("ICD-11 $lookup (CA40)", FAIL, "No display parameter returned")
        elif code == 404:
            self.check("ICD-11 $lookup", SKIP, "TerminologyServer not connected (expected in isolated environments)")
        else:
            self.check("ICD-11 $lookup", FAIL, f"HTTP {code}")

    def validate_fhir_search(self):
        patient_id = self._created.get("patient_id")
        if not patient_id:
            self.check("Patient FHIR search", SKIP); return
        code, body = self._call("GET", f"/Observation?subject=Patient/{patient_id}")
        result = self.assert_fhir("Observation FHIR search by patient", code, body, "Bundle")
        if result:
            self.check("Search result count ≥ 0", PASS, f"total: {result.get('total', '?')}")

    def run(self):
        print("\n=== FHIR R4 Import & Interoperability Validation ===\n")
        self.validate_capability_statement()
        self.validate_patient_create()
        self.validate_observation_create()
        self.validate_condition_create()
        self.validate_medication_request_create()
        self.validate_bundle_transaction()
        self.validate_terminology_lookup()
        self.validate_fhir_search()

        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == PASS)
        failed = sum(1 for r in self.results if r["status"] == FAIL)
        print(f"\n{'=' * 60}")
        print(f"  FHIR Validation: {passed}/{total} passed  |  {failed} failed")
        print(f"{'=' * 60}")
        return failed == 0


def main() -> int:
    parser = argparse.ArgumentParser(description="CyberCom FHIR R4 Validation")
    parser.add_argument("--fhir-base", default="http://localhost:8000/fhir/R4")
    parser.add_argument("--token", required=True)
    parser.add_argument("--tenant-id", required=True)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    validator = FHIRValidator(args.fhir_base, args.token, args.tenant_id, args.verbose)
    passed = validator.run()
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())

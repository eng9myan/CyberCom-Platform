# Security Policy

The CyberCom Platform handles healthcare, financial, and government data. Security is a first-class concern.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report vulnerabilities privately to:

- **Email:** `security@cybercom.example` (replace with the official address once provisioned)
- **PGP:** A public key will be published at `/.well-known/security.txt` once the production domain is live.

We aim to acknowledge reports within **2 business days** and to provide a remediation plan within **10 business days** for high-severity issues.

## Supported Versions

This repository is in the **initialization** phase. No application versions are released yet. Once releases begin, supported versions will be tracked here.

## Scope

In scope:
- All code, infrastructure, and documentation in this repository.
- All CyberCom products: CyIdentity, CyCitizen, CyIntegration Hub, CyData, CyAI, CyMed, CyCom, CyShop, CyGov.

Out of scope (during foundation phase):
- Third-party services not yet integrated.
- Demo/sample environments.

## Security Principles

CyberCom is built on:

1. **Zero Trust** — never trust, always verify.
2. **Defense in Depth** — multiple, layered controls.
3. **Least Privilege** — minimum access necessary.
4. **Secure by Default** — secure configuration out of the box.
5. **Auditability** — every privileged action is logged and traceable.
6. **Compliance** — aligned to HIPAA, GDPR, ISO 27001, SOC 2, NIST 800-53, and applicable local regulations.

## Disclosure Policy

We follow **coordinated disclosure**. Reporters who follow this policy in good faith will be credited (with permission) in our security acknowledgments.

## Hardening Checklist (Foundation)

- [ ] Branch protection on `main`
- [ ] Required code review (CODEOWNERS)
- [ ] Secret scanning enabled
- [ ] Dependabot enabled
- [ ] CodeQL enabled
- [ ] Signed commits required (target)
- [ ] SBOM generation in CI (target)

"""
Field-level encryption for PHI at rest (HIPAA Security Rule 164.312(a)(2)(iv)).

Encrypts on write, decrypts on read, transparently to callers -- the model
still sees plaintext strings. Only applied to free-text PHI fields that do
not require database-level uniqueness, ordering, or equality lookups:
Fernet's output is non-deterministic (a random nonce per encryption), so a
UNIQUE constraint or ORDER BY on an encrypted column would silently stop
working -- two identical plaintexts produce different ciphertext, and
lexicographic order on ciphertext bytes is meaningless. Fields like
Patient.mrn/national_id and ordering-by-name are deliberately left
unencrypted at this layer; they rely on transport encryption (SECURE_SSL_REDIRECT)
and production-grade Postgres TDE instead (infra-provisioned, not app code).
"""

import os

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models

_cached_key: bytes | None = None


def _load_key() -> bytes:
    """
    Note: deliberately does NOT read through VaultClient
    (platform/common/security/vault.py) -- that client is a documented local/
    dev mock whose fallback for any unrecognized path is a hardcoded literal
    ("mock-secret-value"), which is not a valid Fernet key and would either
    crash Fernet() or, worse, silently succeed with a guessable key in some
    future refactor. A real secrets-manager integration for this key should
    replace the env var read below, not route through that mock.
    """
    global _cached_key
    if _cached_key is not None:
        return _cached_key

    raw_key = os.environ.get("PHI_FIELD_ENCRYPTION_KEY")

    if not raw_key:
        if settings.DEBUG:
            # Random per-process dev key so local runs work without extra
            # setup -- never reachable when DEBUG is False.
            _cached_key = Fernet.generate_key()
            return _cached_key
        raise ImproperlyConfigured(
            "PHI_FIELD_ENCRYPTION_KEY is not set. Refusing to start with "
            "DEBUG=False: silently encrypting PHI with a fallback key would "
            "be worse than an explicit startup failure."
        )

    key = raw_key.encode()
    try:
        Fernet(key)  # validates it's exactly 32 url-safe base64-encoded bytes
    except Exception as exc:
        raise ImproperlyConfigured(
            "PHI_FIELD_ENCRYPTION_KEY is set but is not a valid Fernet key "
            "(expected 32 url-safe base64-encoded bytes, e.g. the output of "
            "`Fernet.generate_key()`)."
        ) from exc

    _cached_key = key
    return _cached_key


class _EncryptedFieldMixin:
    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        fernet = Fernet(_load_key())
        return fernet.encrypt(str(value).encode()).decode()

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        fernet = Fernet(_load_key())
        try:
            return fernet.decrypt(value.encode()).decode()
        except InvalidToken:
            # Pre-existing plaintext row from before encryption was enabled,
            # or a key rotation in progress -- surface the raw value rather
            # than raising, so a migration/backfill can re-save it.
            return value


class EncryptedCharField(_EncryptedFieldMixin, models.CharField):
    """Encrypted at rest. Ciphertext is longer than plaintext -- give this a
    generously larger max_length than the plaintext would need."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 500)
        super().__init__(*args, **kwargs)


class EncryptedTextField(_EncryptedFieldMixin, models.TextField):
    pass


class EncryptedEmailField(_EncryptedFieldMixin, models.EmailField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 400)
        super().__init__(*args, **kwargs)

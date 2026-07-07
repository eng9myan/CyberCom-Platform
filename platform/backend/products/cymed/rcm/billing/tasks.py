"""
Celery autodiscovery entrypoint (core/celery.py's app.autodiscover_tasks()
scans each installed app for a tasks.py module). The real task logic lives
in hybrid_sync_worker.py per the Phase 7 naming requirement; this file just
re-exports it so autodiscovery finds it without needing an explicit
`include=[...]` entry per app.
"""
from .hybrid_sync_worker import retry_offline_tax_queue  # noqa: F401

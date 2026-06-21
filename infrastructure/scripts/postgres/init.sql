-- CyberCom PostgreSQL Initialization Script
-- ADR-0002: Multi-tenancy via Row Level Security
-- Runs once on first container start (docker-entrypoint-initdb.d)

-- Enable pgAudit if available (ADR-0028)
-- CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create application user with limited privileges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cybercom_app') THEN
    CREATE ROLE cybercom_app WITH LOGIN PASSWORD 'change-me-in-production';
  END IF;
END;
$$;

GRANT CONNECT ON DATABASE cybercom_dev TO cybercom_app;
GRANT USAGE ON SCHEMA public TO cybercom_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cybercom_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cybercom_app;

-- RLS session variable function (ADR-0002: T-Shared)
CREATE OR REPLACE FUNCTION app.get_current_tenant_id()
RETURNS UUID AS $$
  SELECT current_setting('app.current_tenant_id', true)::UUID;
$$ LANGUAGE SQL STABLE;

-- Schema for app-level settings
CREATE SCHEMA IF NOT EXISTS app;

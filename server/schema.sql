-- SHGConnect PostgreSQL Synchronization Engine DDL Schema

-- 1. Global monotonic log sequence
CREATE SEQUENCE IF NOT EXISTS server_seq_generator
    AS BIGINT
    START WITH 100
    INCREMENT BY 1;

-- 2. Processed operations (Authoritative Idempotency Table)
CREATE TABLE IF NOT EXISTS processed_operations (
    op_id UUID PRIMARY KEY,
    shg_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('ACKNOWLEDGED', 'CONFLICT', 'REJECTED')),
    server_seq BIGINT,
    conflict_details JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (status = 'ACKNOWLEDGED' AND server_seq IS NOT NULL)
        OR
        (status IN ('CONFLICT', 'REJECTED') AND server_seq IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_processed_ops_shg
    ON processed_operations(shg_id);

-- 3. Canonical Server Operation Log (Pull Stream Source)
CREATE TABLE IF NOT EXISTS server_operation_log (
    server_seq BIGINT PRIMARY KEY,
    op_id UUID NOT NULL UNIQUE
        REFERENCES processed_operations(op_id),
    shg_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    hlc_timestamp VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    entity_version INT,
    type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_op_log_pull
    ON server_operation_log(shg_id, server_seq ASC);

-- 4. Canonical Domain Entity Tables with Row-Level OCC
CREATE TABLE IF NOT EXISTS server_members (
    id VARCHAR(64) NOT NULL,
    shg_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    entity_version INT NOT NULL DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shg_id, id)
);

CREATE TABLE IF NOT EXISTS server_loans (
    id VARCHAR(64) NOT NULL,
    shg_id VARCHAR(64) NOT NULL,
    entity_version INT NOT NULL DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shg_id, id)
);

CREATE TABLE IF NOT EXISTS server_group_info (
    shg_id VARCHAR(64) PRIMARY KEY,
    entity_version INT NOT NULL DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

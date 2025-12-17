-- Quantera Security Constraints Migration
-- Phase 1D: Add foreign key constraints, check constraints, and row-level security
-- Migration: 004_security_constraints.sql

-- ============================================================================
-- TRANSACTION WRAPPER
-- This entire migration should be run within a transaction for atomicity
-- ============================================================================

BEGIN;

-- ============================================================================
-- ADD CHECK CONSTRAINTS FOR ENUM-LIKE COLUMNS
-- These prevent invalid data from being inserted
-- ============================================================================

-- Portfolio transactions: transaction_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_portfolio_tx_type'
    ) THEN
        ALTER TABLE portfolio_transactions
        ADD CONSTRAINT chk_portfolio_tx_type
        CHECK (transaction_type IN ('buy', 'sell', 'yield', 'transfer', 'retirement'));
    END IF;
END $$;

-- Portfolio transactions: status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_portfolio_tx_status'
    ) THEN
        ALTER TABLE portfolio_transactions
        ADD CONSTRAINT chk_portfolio_tx_status
        CHECK (status IN ('pending', 'completed', 'failed'));
    END IF;
END $$;

-- Yield distributions: frequency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_yield_frequency'
    ) THEN
        ALTER TABLE yield_distributions
        ADD CONSTRAINT chk_yield_frequency
        CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually') OR frequency IS NULL);
    END IF;
END $$;

-- Yield distributions: status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_yield_status'
    ) THEN
        ALTER TABLE yield_distributions
        ADD CONSTRAINT chk_yield_status
        CHECK (status IN ('pending', 'distributed', 'claimed'));
    END IF;
END $$;

-- Trade finance assets: asset_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_asset_type'
    ) THEN
        ALTER TABLE tradefinance_assets
        ADD CONSTRAINT chk_tf_asset_type
        CHECK (asset_type IN ('EXPORT_FINANCING', 'IMPORT_FINANCING', 'INVENTORY_FINANCING', 'SUPPLY_CHAIN_FINANCE'));
    END IF;
END $$;

-- Trade finance assets: status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_asset_status'
    ) THEN
        ALTER TABLE tradefinance_assets
        ADD CONSTRAINT chk_tf_asset_status
        CHECK (status IN ('Active', 'Pending', 'Completed', 'Suspended'));
    END IF;
END $$;

-- Trade finance positions: status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_position_status'
    ) THEN
        ALTER TABLE tradefinance_positions
        ADD CONSTRAINT chk_tf_position_status
        CHECK (status IN ('Active', 'Matured', 'Sold'));
    END IF;
END $$;

-- Trade finance transactions: transaction_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_tx_type'
    ) THEN
        ALTER TABLE tradefinance_transactions
        ADD CONSTRAINT chk_tf_tx_type
        CHECK (transaction_type IN ('purchase', 'sale', 'maturity', 'yield'));
    END IF;
END $$;

-- Trade finance transactions: status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_tx_status'
    ) THEN
        ALTER TABLE tradefinance_transactions
        ADD CONSTRAINT chk_tf_tx_status
        CHECK (status IN ('pending', 'completed', 'failed'));
    END IF;
END $$;

-- ============================================================================
-- ADD WALLET ADDRESS FORMAT VALIDATION
-- Ethereum addresses must be 42 characters starting with 0x
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_wallet_format'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT chk_users_wallet_format
        CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_auth_challenge_wallet_format'
    ) THEN
        ALTER TABLE auth_challenges
        ADD CONSTRAINT chk_auth_challenge_wallet_format
        CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_portfolio_wallet_format'
    ) THEN
        ALTER TABLE portfolio_holdings
        ADD CONSTRAINT chk_portfolio_wallet_format
        CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_position_wallet_format'
    ) THEN
        ALTER TABLE tradefinance_positions
        ADD CONSTRAINT chk_tf_position_wallet_format
        CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$');
    END IF;
END $$;

-- ============================================================================
-- ADD POSITIVE VALUE CONSTRAINTS
-- Financial values should be positive
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_portfolio_positive_quantity'
    ) THEN
        ALTER TABLE portfolio_holdings
        ADD CONSTRAINT chk_portfolio_positive_quantity
        CHECK (quantity > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_portfolio_positive_price'
    ) THEN
        ALTER TABLE portfolio_holdings
        ADD CONSTRAINT chk_portfolio_positive_price
        CHECK (acquisition_price >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_assets_positive_units'
    ) THEN
        ALTER TABLE tradefinance_assets
        ADD CONSTRAINT chk_tf_assets_positive_units
        CHECK (units_total > 0 AND units_available >= 0 AND units_available <= units_total);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tf_position_positive_units'
    ) THEN
        ALTER TABLE tradefinance_positions
        ADD CONSTRAINT chk_tf_position_positive_units
        CHECK (units_owned > 0);
    END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS WHERE MISSING
-- Links portfolio data to users (optional - allows pre-registration holdings)
-- ============================================================================

-- Add FK for trade finance transactions to assets (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tf_tx_asset'
    ) THEN
        ALTER TABLE tradefinance_transactions
        ADD CONSTRAINT fk_tf_tx_asset
        FOREIGN KEY (asset_id) REFERENCES tradefinance_assets(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- CREATE AUDIT LOG TABLE FOR SECURITY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    wallet_address VARCHAR(42),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(64),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_wallet ON audit_log(wallet_address);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Partition audit log by month for performance (optional - uncomment for production)
-- This is a placeholder showing the pattern; actual partitioning requires careful setup
-- CREATE TABLE audit_log_y2025m01 PARTITION OF audit_log
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================================================
-- ADD SESSION VALIDATION FUNCTION
-- Used by backend to validate sessions atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_session(
    p_token_hash VARCHAR(64)
)
RETURNS TABLE (
    user_id UUID,
    wallet_address VARCHAR(42),
    is_valid BOOLEAN,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.user_id,
        u.wallet_address,
        CASE
            WHEN s.is_revoked THEN FALSE
            WHEN s.expires_at < NOW() THEN FALSE
            ELSE TRUE
        END AS is_valid,
        s.expires_at
    FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = p_token_hash;
END;
$$;

-- ============================================================================
-- ADD TRANSACTION FUNCTION FOR ATOMIC PURCHASES
-- Ensures purchases are atomic and consistent
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_trade_finance_purchase(
    p_asset_id VARCHAR(50),
    p_buyer_address VARCHAR(42),
    p_units INTEGER,
    p_max_price DECIMAL(20, 8) DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    transaction_id UUID,
    total_cost DECIMAL(20, 2),
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_asset RECORD;
    v_transaction_id UUID;
    v_total_cost DECIMAL(20, 2);
BEGIN
    -- Lock the asset row for update
    SELECT *
    INTO v_asset
    FROM tradefinance_assets
    WHERE id = p_asset_id
    FOR UPDATE;

    -- Validate asset exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::DECIMAL(20, 2), 'Asset not found'::TEXT;
        RETURN;
    END IF;

    -- Validate asset is active
    IF v_asset.status != 'Active' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::DECIMAL(20, 2), 'Asset is not active'::TEXT;
        RETURN;
    END IF;

    -- Validate sufficient units available
    IF v_asset.units_available < p_units THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::DECIMAL(20, 2), 'Insufficient units available'::TEXT;
        RETURN;
    END IF;

    -- Calculate total cost
    v_total_cost := p_units * v_asset.current_price;

    -- Validate against max price if provided
    IF p_max_price IS NOT NULL AND v_asset.current_price > p_max_price THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::DECIMAL(20, 2), 'Price slippage exceeded'::TEXT;
        RETURN;
    END IF;

    -- Validate minimum investment
    IF v_total_cost < v_asset.minimum_investment THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::DECIMAL(20, 2), 'Minimum investment not met'::TEXT;
        RETURN;
    END IF;

    -- Generate transaction ID
    v_transaction_id := gen_random_uuid();

    -- Create transaction record
    INSERT INTO tradefinance_transactions (
        id, asset_id, buyer_address, transaction_type, units,
        price_per_unit, total_amount, status, timestamp
    ) VALUES (
        v_transaction_id, p_asset_id, p_buyer_address, 'purchase', p_units,
        v_asset.current_price, v_total_cost, 'completed', NOW()
    );

    -- Update available units (trigger will also fire)
    UPDATE tradefinance_assets
    SET units_available = units_available - p_units
    WHERE id = p_asset_id;

    -- Create or update position
    INSERT INTO tradefinance_positions (
        asset_id, owner_address, units_owned, investment_amount,
        acquisition_price, acquisition_date, status
    ) VALUES (
        p_asset_id, p_buyer_address, p_units, v_total_cost,
        v_asset.current_price, NOW(), 'Active'
    )
    ON CONFLICT (asset_id, owner_address)
    DO UPDATE SET
        units_owned = tradefinance_positions.units_owned + p_units,
        investment_amount = tradefinance_positions.investment_amount + v_total_cost,
        acquisition_price = (
            (tradefinance_positions.investment_amount + v_total_cost) /
            (tradefinance_positions.units_owned + p_units)
        ),
        updated_at = NOW();

    RETURN QUERY SELECT TRUE, v_transaction_id, v_total_cost, NULL::TEXT;
END;
$$;

-- ============================================================================
-- ADD CLEANUP FUNCTION FOR EXPIRED SESSIONS AND CHALLENGES
-- Run this periodically via cron or scheduled job
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS TABLE (
    challenges_deleted INTEGER,
    sessions_deleted INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_challenges_deleted INTEGER;
    v_sessions_deleted INTEGER;
BEGIN
    -- Delete expired challenges older than 1 hour
    DELETE FROM auth_challenges
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS v_challenges_deleted = ROW_COUNT;

    -- Delete revoked or expired sessions older than 24 hours
    DELETE FROM auth_sessions
    WHERE (is_revoked = TRUE OR expires_at < NOW())
    AND created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;

    RETURN QUERY SELECT v_challenges_deleted, v_sessions_deleted;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit_log IS 'Security audit log for tracking all significant actions';
COMMENT ON FUNCTION validate_session IS 'Validates session token and returns user info atomically';
COMMENT ON FUNCTION execute_trade_finance_purchase IS 'Executes a trade finance purchase atomically with all validations';
COMMENT ON FUNCTION cleanup_expired_auth_data IS 'Cleans up expired challenges and sessions';

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;

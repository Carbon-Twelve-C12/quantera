-- Quantera Trade Finance Schema
-- Phase 5: Trading API Implementation
-- Migration: 003_tradefinance_schema.sql

-- ============================================================================
-- TRADE FINANCE ASSETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tradefinance_assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type VARCHAR(50) NOT NULL, -- 'EXPORT_FINANCING', 'IMPORT_FINANCING', 'INVENTORY_FINANCING', 'SUPPLY_CHAIN_FINANCE'
  issuer VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  image_url TEXT,
  yield_rate INTEGER NOT NULL, -- Basis points (595 = 5.95%)
  maturity_date TIMESTAMPTZ NOT NULL,
  nominal_value DECIMAL(20, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  fractional_units INTEGER NOT NULL,
  units_total INTEGER NOT NULL,
  units_available INTEGER NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Active', 'Pending', 'Completed'
  risk_rating INTEGER NOT NULL CHECK (risk_rating >= 1 AND risk_rating <= 5),
  minimum_investment DECIMAL(20, 2) NOT NULL,
  settlement_currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
  verified_entities BOOLEAN DEFAULT false,
  trade_documentation_hash TEXT,
  invoice_hash TEXT,
  contract_hash TEXT,
  issuer_kyc_status VARCHAR(20),
  recipient_kyc_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tf_assets_type ON tradefinance_assets(asset_type);
CREATE INDEX idx_tf_assets_status ON tradefinance_assets(status);
CREATE INDEX idx_tf_assets_maturity ON tradefinance_assets(maturity_date);
CREATE INDEX idx_tf_assets_risk ON tradefinance_assets(risk_rating);
CREATE INDEX idx_tf_assets_yield ON tradefinance_assets(yield_rate DESC);
CREATE INDEX idx_tf_assets_available ON tradefinance_assets(units_available) WHERE units_available > 0;

-- ============================================================================
-- TRADE FINANCE POSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tradefinance_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(50) NOT NULL REFERENCES tradefinance_assets(id) ON DELETE CASCADE,
  owner_address VARCHAR(42) NOT NULL,
  units_owned INTEGER NOT NULL,
  investment_amount DECIMAL(20, 2) NOT NULL,
  acquisition_price DECIMAL(20, 8) NOT NULL,
  acquisition_date TIMESTAMPTZ NOT NULL,
  purchase_tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Matured', 'Sold'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tf_positions_owner ON tradefinance_positions(owner_address);
CREATE INDEX idx_tf_positions_asset ON tradefinance_positions(asset_id);
CREATE INDEX idx_tf_positions_status ON tradefinance_positions(status);
CREATE UNIQUE INDEX idx_tf_positions_unique ON tradefinance_positions(asset_id, owner_address);

-- ============================================================================
-- TRADE FINANCE TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tradefinance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(50) NOT NULL,
  buyer_address VARCHAR(42),
  seller_address VARCHAR(42),
  transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'sale', 'maturity', 'yield'
  units INTEGER NOT NULL,
  price_per_unit DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 2) NOT NULL,
  fee DECIMAL(20, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  tx_hash VARCHAR(66),
  block_number BIGINT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tf_txs_asset ON tradefinance_transactions(asset_id);
CREATE INDEX idx_tf_txs_buyer ON tradefinance_transactions(buyer_address);
CREATE INDEX idx_tf_txs_seller ON tradefinance_transactions(seller_address);
CREATE INDEX idx_tf_txs_timestamp ON tradefinance_transactions(timestamp DESC);
CREATE INDEX idx_tf_txs_type ON tradefinance_transactions(transaction_type);
CREATE INDEX idx_tf_txs_status ON tradefinance_transactions(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tradefinance_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tf_assets_timestamp
BEFORE UPDATE ON tradefinance_assets
FOR EACH ROW
EXECUTE FUNCTION update_tradefinance_assets_timestamp();

CREATE OR REPLACE FUNCTION update_tradefinance_positions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tf_positions_timestamp
BEFORE UPDATE ON tradefinance_positions
FOR EACH ROW
EXECUTE FUNCTION update_tradefinance_positions_timestamp();

-- ============================================================================
-- TRIGGER TO UPDATE units_available ON PURCHASE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_units_available_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'purchase' AND NEW.status = 'completed' THEN
        UPDATE tradefinance_assets
        SET units_available = units_available - NEW.units
        WHERE id = NEW.asset_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_units_available
AFTER INSERT OR UPDATE ON tradefinance_transactions
FOR EACH ROW
EXECUTE FUNCTION update_units_available_on_purchase();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tradefinance_assets IS 'Trade finance investment opportunities';
COMMENT ON TABLE tradefinance_positions IS 'User positions in trade finance assets';
COMMENT ON TABLE tradefinance_transactions IS 'All trade finance transaction history';

COMMENT ON COLUMN tradefinance_assets.yield_rate IS 'Yield in basis points (595 = 5.95%)';
COMMENT ON COLUMN tradefinance_assets.risk_rating IS 'Risk rating from 1 (lowest) to 5 (highest)';
COMMENT ON COLUMN tradefinance_assets.units_available IS 'Remaining units available for purchase';
COMMENT ON COLUMN tradefinance_assets.verified_entities IS 'Whether issuer and recipient are KYC verified';

COMMENT ON COLUMN tradefinance_positions.status IS 'Position status: Active, Matured, Sold';

COMMENT ON COLUMN tradefinance_transactions.transaction_type IS 'Type: purchase, sale, maturity, yield';

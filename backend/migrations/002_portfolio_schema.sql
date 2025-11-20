-- Quantera Portfolio Management Schema
-- Phase 5: Portfolio API Implementation
-- Migration: 002_portfolio_schema.sql

-- ============================================================================
-- PORTFOLIO HOLDINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  asset_id VARCHAR(66) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  acquisition_price DECIMAL(20, 8) NOT NULL,
  acquisition_date TIMESTAMPTZ NOT NULL,
  asset_type VARCHAR(50),
  asset_category VARCHAR(50),
  asset_class VARCHAR(50),
  maturity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, asset_id)
);

CREATE INDEX idx_portfolio_holdings_wallet ON portfolio_holdings(wallet_address);
CREATE INDEX idx_portfolio_holdings_asset ON portfolio_holdings(asset_id);
CREATE INDEX idx_portfolio_holdings_category ON portfolio_holdings(asset_category);
CREATE INDEX idx_portfolio_holdings_created ON portfolio_holdings(created_at DESC);

-- ============================================================================
-- PORTFOLIO TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'yield', 'transfer', 'retirement'
  asset_id VARCHAR(66) NOT NULL,
  asset_name VARCHAR(255),
  asset_symbol VARCHAR(20),
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8),
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  tx_hash VARCHAR(66),
  block_number BIGINT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_txs_wallet ON portfolio_transactions(wallet_address);
CREATE INDEX idx_portfolio_txs_asset ON portfolio_transactions(asset_id);
CREATE INDEX idx_portfolio_txs_timestamp ON portfolio_transactions(timestamp DESC);
CREATE INDEX idx_portfolio_txs_type ON portfolio_transactions(transaction_type);
CREATE INDEX idx_portfolio_txs_status ON portfolio_transactions(status);

-- ============================================================================
-- YIELD DISTRIBUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS yield_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) NOT NULL,
  asset_id VARCHAR(66) NOT NULL,
  asset_name VARCHAR(255),
  amount DECIMAL(20, 8) NOT NULL,
  yield_rate DECIMAL(10, 4),
  distribution_date TIMESTAMPTZ NOT NULL,
  next_distribution_date TIMESTAMPTZ,
  frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
  tx_hash VARCHAR(66),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_yield_dist_wallet ON yield_distributions(wallet_address);
CREATE INDEX idx_yield_dist_asset ON yield_distributions(asset_id);
CREATE INDEX idx_yield_dist_date ON yield_distributions(distribution_date DESC);
CREATE INDEX idx_yield_dist_status ON yield_distributions(status);

-- ============================================================================
-- UPDATE TRIGGER FOR portfolio_holdings
-- ============================================================================

CREATE OR REPLACE FUNCTION update_portfolio_holdings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_holdings_timestamp
BEFORE UPDATE ON portfolio_holdings
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_holdings_timestamp();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE portfolio_holdings IS 'User portfolio holdings tracking';
COMMENT ON TABLE portfolio_transactions IS 'Complete transaction history for portfolio activity';
COMMENT ON TABLE yield_distributions IS 'Yield/dividend distribution tracking';

COMMENT ON COLUMN portfolio_holdings.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN portfolio_holdings.asset_id IS 'Unique asset identifier (contract address or custom ID)';
COMMENT ON COLUMN portfolio_holdings.quantity IS 'Number of units held (supports decimals)';
COMMENT ON COLUMN portfolio_holdings.acquisition_price IS 'Average cost basis per unit';

COMMENT ON COLUMN portfolio_transactions.transaction_type IS 'Type: buy, sell, yield, transfer, retirement';
COMMENT ON COLUMN portfolio_transactions.status IS 'Transaction status: pending, completed, failed';

COMMENT ON COLUMN yield_distributions.frequency IS 'Distribution frequency: daily, weekly, monthly, quarterly, annually';
COMMENT ON COLUMN yield_distributions.status IS 'Distribution status: pending, completed';

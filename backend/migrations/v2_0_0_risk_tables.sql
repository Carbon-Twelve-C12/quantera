-- Quantera v2.0.0-alpha Risk Management Tables
-- Migration for risk metrics and related data

-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Risk metrics time series table with partitioning
CREATE TABLE IF NOT EXISTS risk_metrics (
    id BIGSERIAL,
    portfolio_address VARCHAR(42) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    var_95 NUMERIC(20, 8),
    var_99 NUMERIC(20, 8),
    expected_shortfall NUMERIC(20, 8),
    sharpe_ratio NUMERIC(10, 4),
    sortino_ratio NUMERIC(10, 4),
    max_drawdown NUMERIC(10, 4),
    beta NUMERIC(10, 4),
    alpha NUMERIC(10, 4),
    volatility NUMERIC(10, 4),
    liquidity_score INTEGER CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
    concentration_risk NUMERIC(10, 4),
    leverage_ratio NUMERIC(10, 4),
    risk_grade VARCHAR(1) CHECK (risk_grade IN ('A', 'B', 'C', 'D', 'F')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create partitions for the next 12 months
CREATE TABLE risk_metrics_2024_10 PARTITION OF risk_metrics
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE risk_metrics_2024_11 PARTITION OF risk_metrics
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE risk_metrics_2024_12 PARTITION OF risk_metrics
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE risk_metrics_2025_01 PARTITION OF risk_metrics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE risk_metrics_2025_02 PARTITION OF risk_metrics
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE risk_metrics_2025_03 PARTITION OF risk_metrics
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for efficient querying
CREATE INDEX idx_risk_metrics_portfolio ON risk_metrics(portfolio_address, timestamp DESC);
CREATE INDEX idx_risk_metrics_risk_grade ON risk_metrics(risk_grade, timestamp DESC);
CREATE INDEX idx_risk_metrics_var ON risk_metrics(var_95, var_99);
CREATE INDEX idx_risk_metrics_timestamp ON risk_metrics(timestamp DESC);

-- Convert to TimescaleDB hypertable for better time-series performance
SELECT create_hypertable('risk_metrics', 'timestamp', 
    partitioning_column => 'portfolio_address',
    number_partitions => 4,
    if_not_exists => TRUE
);

-- Portfolio positions table
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id BIGSERIAL PRIMARY KEY,
    portfolio_address VARCHAR(42) NOT NULL,
    asset_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    entry_price NUMERIC(20, 8) NOT NULL,
    current_price NUMERIC(20, 8),
    unrealized_pnl NUMERIC(20, 8),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(portfolio_address, asset_address)
);

CREATE INDEX idx_portfolio_positions_portfolio ON portfolio_positions(portfolio_address);
CREATE INDEX idx_portfolio_positions_asset ON portfolio_positions(asset_address);

-- Risk limits configuration
CREATE TABLE IF NOT EXISTS risk_limits (
    id BIGSERIAL PRIMARY KEY,
    portfolio_address VARCHAR(42) NOT NULL UNIQUE,
    max_position_size NUMERIC(10, 4), -- basis points
    max_leverage NUMERIC(10, 2),
    max_drawdown_limit NUMERIC(10, 4), -- basis points
    min_liquidity_score INTEGER,
    max_var_95 NUMERIC(10, 4),
    emergency_shutdown BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_limits_portfolio ON risk_limits(portfolio_address);

-- Risk alerts table
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_address VARCHAR(42) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Info', 'Warning', 'Critical')),
    message TEXT NOT NULL,
    metric_value NUMERIC(20, 8),
    threshold NUMERIC(20, 8),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(42),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_alerts_portfolio ON risk_alerts(portfolio_address, created_at DESC);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts(severity, acknowledged);
CREATE INDEX idx_risk_alerts_type ON risk_alerts(alert_type);

-- Historical returns for VaR calculation
CREATE TABLE IF NOT EXISTS historical_returns (
    id BIGSERIAL PRIMARY KEY,
    portfolio_address VARCHAR(42) NOT NULL,
    asset_address VARCHAR(42) NOT NULL,
    return_value NUMERIC(20, 8) NOT NULL,
    return_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(portfolio_address, asset_address, return_date)
);

CREATE INDEX idx_historical_returns_portfolio ON historical_returns(portfolio_address, return_date DESC);
CREATE INDEX idx_historical_returns_date ON historical_returns(return_date DESC);

-- Correlation matrix cache
CREATE TABLE IF NOT EXISTS correlation_matrix (
    id BIGSERIAL PRIMARY KEY,
    portfolio_address VARCHAR(42) NOT NULL,
    asset1_address VARCHAR(42) NOT NULL,
    asset2_address VARCHAR(42) NOT NULL,
    correlation NUMERIC(5, 4) NOT NULL CHECK (correlation >= -1 AND correlation <= 1),
    calculation_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(portfolio_address, asset1_address, asset2_address, calculation_date)
);

CREATE INDEX idx_correlation_portfolio ON correlation_matrix(portfolio_address, calculation_date DESC);

-- Market scenarios for stress testing
CREATE TABLE IF NOT EXISTS market_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    volatility_multiplier NUMERIC(10, 4) DEFAULT 1.0,
    correlation_adjustment NUMERIC(5, 4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(42),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario price shocks
CREATE TABLE IF NOT EXISTS scenario_price_shocks (
    id BIGSERIAL PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES market_scenarios(id) ON DELETE CASCADE,
    asset_address VARCHAR(42) NOT NULL,
    price_shock NUMERIC(10, 4) NOT NULL, -- Percentage change
    UNIQUE(scenario_id, asset_address)
);

CREATE INDEX idx_scenario_shocks_scenario ON scenario_price_shocks(scenario_id);

-- Stress test results
CREATE TABLE IF NOT EXISTS stress_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_address VARCHAR(42) NOT NULL,
    scenario_id UUID NOT NULL REFERENCES market_scenarios(id),
    portfolio_value_change NUMERIC(20, 8),
    var_impact NUMERIC(20, 8),
    probability NUMERIC(5, 4),
    test_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stress_test_portfolio ON stress_test_results(portfolio_address, test_date DESC);
CREATE INDEX idx_stress_test_scenario ON stress_test_results(scenario_id);

-- Risk model versions for ML tracking
CREATE TABLE IF NOT EXISTS risk_model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    accuracy NUMERIC(5, 4),
    training_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    parameters JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_name, version)
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for risk_limits table
CREATE TRIGGER update_risk_limits_updated_at BEFORE UPDATE ON risk_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE);
    FOR i IN 0..11 LOOP
        end_date := start_date + interval '1 month';
        partition_name := 'risk_metrics_' || to_char(start_date, 'YYYY_MM');
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = partition_name
        ) THEN
            EXECUTE format('CREATE TABLE %I PARTITION OF risk_metrics FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date);
        END IF;
        
        start_date := end_date;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule partition creation (requires pg_cron extension)
-- SELECT cron.schedule('create-risk-partitions', '0 0 1 * *', 'SELECT create_monthly_partitions();');

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO quantera_api;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO quantera_api;

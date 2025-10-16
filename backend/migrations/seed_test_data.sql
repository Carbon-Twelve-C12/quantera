-- Seed test data for Risk Management System testing

-- Insert test portfolio positions
INSERT INTO portfolio_positions (portfolio_address, asset_address, amount, entry_price, current_price, unrealized_pnl)
VALUES 
    ('0x1234567890123456789012345678901234567890', '0xBTC0000000000000000000000000000000000001', 1000000000000000000, 50000.00, 52000.00, 2000.00),
    ('0x1234567890123456789012345678901234567890', '0xETH0000000000000000000000000000000000002', 5000000000000000000, 3000.00, 3100.00, 500.00),
    ('0x1234567890123456789012345678901234567890', '0xUSDC000000000000000000000000000000000003', 100000000000, 1.00, 1.00, 0.00),
    ('0x1234567890123456789012345678901234567890', '0xLINK000000000000000000000000000000000004', 10000000000000000000, 15.00, 14.50, -50.00)
ON CONFLICT (portfolio_address, asset_address) DO NOTHING;

-- Insert test risk limits
INSERT INTO risk_limits (portfolio_address, max_position_size, max_leverage, max_drawdown_limit, min_liquidity_score, max_var_95, emergency_shutdown)
VALUES 
    ('0x1234567890123456789012345678901234567890', 4000, 2.00, 2000, 60, 1000, FALSE)
ON CONFLICT (portfolio_address) DO NOTHING;

-- Insert test risk metrics
INSERT INTO risk_metrics (portfolio_address, timestamp, var_95, var_99, expected_shortfall, sharpe_ratio, sortino_ratio, max_drawdown, beta, alpha, volatility, liquidity_score, concentration_risk, leverage_ratio, risk_grade)
VALUES 
    ('0x1234567890123456789012345678901234567890', NOW() - INTERVAL '5 days', 0.0750, 0.1100, 0.1400, 1.15, 1.35, 0.1500, 0.92, 0.02, 0.1800, 75, 0.3200, 1.20, 'B'),
    ('0x1234567890123456789012345678901234567890', NOW() - INTERVAL '4 days', 0.0780, 0.1150, 0.1450, 1.18, 1.38, 0.1550, 0.94, 0.025, 0.1850, 76, 0.3300, 1.25, 'B'),
    ('0x1234567890123456789012345678901234567890', NOW() - INTERVAL '3 days', 0.0800, 0.1200, 0.1500, 1.20, 1.40, 0.1600, 0.95, 0.03, 0.1900, 77, 0.3400, 1.30, 'B'),
    ('0x1234567890123456789012345678901234567890', NOW() - INTERVAL '2 days', 0.0820, 0.1250, 0.1550, 1.22, 1.42, 0.1650, 0.96, 0.028, 0.1950, 78, 0.3500, 1.35, 'B'),
    ('0x1234567890123456789012345678901234567890', NOW() - INTERVAL '1 day', 0.0850, 0.1300, 0.1600, 1.25, 1.45, 0.1700, 0.97, 0.032, 0.2000, 79, 0.3600, 1.40, 'B'),
    ('0x1234567890123456789012345678901234567890', NOW(), 0.0880, 0.1350, 0.1650, 1.28, 1.48, 0.1750, 0.98, 0.035, 0.2050, 80, 0.3700, 1.45, 'B');

-- Insert test historical returns
INSERT INTO historical_returns (portfolio_address, asset_address, return_value, return_date)
SELECT 
    '0x1234567890123456789012345678901234567890',
    '0xBTC0000000000000000000000000000000000001',
    (RANDOM() * 0.1 - 0.05), -- Random returns between -5% and 5%
    CURRENT_DATE - generate_series(1, 30)
ON CONFLICT DO NOTHING;

-- Insert test market scenarios
INSERT INTO market_scenarios (id, name, description, volatility_multiplier, correlation_adjustment, is_active, created_by)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Black Swan Event', 'Extreme market downturn scenario', 3.00, 0.20, TRUE, '0xAdmin0000000000000000000000000000000001'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Bull Market Rally', 'Strong market uptrend scenario', 0.50, -0.10, TRUE, '0xAdmin0000000000000000000000000000000001'),
    ('550e8400-e29b-41d4-a716-446655440003', 'High Volatility', 'Increased market volatility without direction', 2.00, 0.00, TRUE, '0xAdmin0000000000000000000000000000000001')
ON CONFLICT DO NOTHING;

-- Insert scenario price shocks
INSERT INTO scenario_price_shocks (scenario_id, asset_address, price_shock)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '0xBTC0000000000000000000000000000000000001', -30.00),
    ('550e8400-e29b-41d4-a716-446655440001', '0xETH0000000000000000000000000000000000002', -35.00),
    ('550e8400-e29b-41d4-a716-446655440002', '0xBTC0000000000000000000000000000000000001', 25.00),
    ('550e8400-e29b-41d4-a716-446655440002', '0xETH0000000000000000000000000000000000002', 30.00)
ON CONFLICT DO NOTHING;

-- Insert test risk alerts
INSERT INTO risk_alerts (portfolio_address, alert_type, severity, message, metric_value, threshold, acknowledged)
VALUES 
    ('0x1234567890123456789012345678901234567890', 'VaRBreach', 'Warning', 'VaR approaching limit', 0.0850, 0.1000, FALSE),
    ('0x1234567890123456789012345678901234567890', 'ConcentrationRisk', 'Info', 'High concentration in single asset', 0.3700, 0.4000, FALSE);

-- Insert test correlation matrix
INSERT INTO correlation_matrix (portfolio_address, asset1_address, asset2_address, correlation, calculation_date)
VALUES 
    ('0x1234567890123456789012345678901234567890', '0xBTC0000000000000000000000000000000000001', '0xETH0000000000000000000000000000000000002', 0.65, CURRENT_DATE),
    ('0x1234567890123456789012345678901234567890', '0xBTC0000000000000000000000000000000000001', '0xUSDC000000000000000000000000000000000003', -0.10, CURRENT_DATE),
    ('0x1234567890123456789012345678901234567890', '0xBTC0000000000000000000000000000000000001', '0xLINK000000000000000000000000000000000004', 0.45, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Insert test risk model version
INSERT INTO risk_model_versions (model_name, version, accuracy, training_date, is_active, parameters)
VALUES 
    ('VaR_MonteCarlo', '2.0.0', 0.9450, NOW() - INTERVAL '7 days', TRUE, '{"simulations": 10000, "confidence_levels": [95, 99], "horizon_days": 1}')
ON CONFLICT DO NOTHING;

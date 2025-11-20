-- Quantera Test Data Seed
-- Phase 5: Portfolio & Trade Finance Test Data
-- File: seed_test_data.sql

-- ============================================================================
-- TRADE FINANCE ASSETS (Sample Data)
-- ============================================================================

INSERT INTO tradefinance_assets (
  id, name, description, asset_type, issuer, recipient,
  image_url, yield_rate, maturity_date, nominal_value, currency,
  fractional_units, units_total, units_available, current_price,
  status, risk_rating, minimum_investment, settlement_currency,
  verified_entities, issuer_kyc_status, recipient_kyc_status
) VALUES
(
  'tf-001',
  'Taiwan Semiconductor Supply Chain Finance',
  'Supply chain financing for semiconductor component manufacturer in Taiwan with multinational technology company buyers.',
  'SUPPLY_CHAIN_FINANCE',
  'Global Trade Finance Partners',
  'Taiwan Advanced Semiconductor Manufacturing',
  '/images/assets/supply-chain-finance/taiwan-semiconductor.jpg',
  595, -- 5.95% yield
  NOW() + INTERVAL '180 days',
  100000,
  'USD',
  1000,
  1000,
  856, -- 856 units still available
  95.50,
  'Active',
  3,
  1000,
  'USDC',
  true,
  'APPROVED',
  'APPROVED'
),
(
  'tf-002',
  'German Auto Parts Export Finance',
  'Export financing for German automotive parts manufacturer shipping to international markets.',
  'EXPORT_FINANCING',
  'European Trade Bank',
  'German Precision Auto Parts GmbH',
  '/images/assets/supply-chain-finance/auto-parts.jpg',
  475, -- 4.75% yield
  NOW() + INTERVAL '90 days',
  200000,
  'EUR',
  2000,
  2000,
  1875,
  97.25,
  'Active',
  2,
  500,
  'USDC',
  true,
  'APPROVED',
  'APPROVED'
),
(
  'tf-003',
  'Brazilian Coffee Harvest Inventory Finance',
  'Pre-export inventory financing for premium coffee producers in Brazil.',
  'INVENTORY_FINANCING',
  'South American Trade Solutions',
  'Brazilian Coffee Exporters Association',
  '/images/assets/supply-chain-finance/coffee-inventory.jpg',
  650, -- 6.50% yield
  NOW() + INTERVAL '120 days',
  150000,
  'USD',
  1500,
  1500,
  1320,
  94.75,
  'Active',
  4,
  750,
  'USDC',
  true,
  'APPROVED',
  'APPROVED'
),
(
  'tf-004',
  'Japanese Electronics Import Financing',
  'Import financing for electronics distributor sourcing components from Japan.',
  'IMPORT_FINANCING',
  'Asia-Pacific Trade Bank',
  'US Electronics Distributor Inc.',
  '/images/assets/supply-chain-finance/electronics-import.jpg',
  525, -- 5.25% yield
  NOW() + INTERVAL '60 days',
  180000,
  'USD',
  1800,
  1800,
  1650,
  96.80,
  'Active',
  2,
  1000,
  'USDC',
  true,
  'APPROVED',
  'APPROVED'
),
(
  'tf-005',
  'Singapore Tech Hardware Export',
  'Export financing for technology hardware manufacturer in Singapore.',
  'EXPORT_FINANCING',
  'Asian Trade Finance Ltd',
  'Singapore Tech Manufacturing',
  '/images/assets/supply-chain-finance/tech-hardware.jpg',
  510, -- 5.10% yield
  NOW() + INTERVAL '75 days',
  120000,
  'USD',
  1200,
  1200,
  980,
  98.10,
  'Active',
  2,
  500,
  'USDC',
  true,
  'APPROVED',
  'APPROVED'
);

-- ============================================================================
-- PORTFOLIO HOLDINGS (Sample Data for Test Wallet)
-- ============================================================================

-- Test wallet address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e (Hardhat #0)

INSERT INTO portfolio_holdings (
  wallet_address, asset_id, asset_name, asset_symbol,
  quantity, acquisition_price, acquisition_date,
  asset_type, asset_category, asset_class, maturity_date
) VALUES
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  '0x1',
  '3-Month T-Bill',
  'TBILL3M',
  50,
  97.85,
  NOW() - INTERVAL '30 days',
  'T-Bill',
  'treasury',
  'TREASURY',
  NOW() + INTERVAL '60 days'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  '0x2',
  '2-Year T-Note',
  'TNOTE2Y',
  120,
  94.25,
  NOW() - INTERVAL '60 days',
  'T-Note',
  'treasury',
  'TREASURY',
  NOW() + INTERVAL '630 days'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'tf-001',
  'Taiwan Semiconductor Supply Chain Finance',
  'TSMC-SCF',
  5,
  100.00,
  NOW() - INTERVAL '15 days',
  'Supply Chain Finance',
  'trade_finance',
  'TRADE_FINANCE',
  NOW() + INTERVAL '165 days'
);

-- ============================================================================
-- PORTFOLIO TRANSACTIONS (Sample Data)
-- ============================================================================

INSERT INTO portfolio_transactions (
  wallet_address, transaction_type, asset_id, asset_name, asset_symbol,
  quantity, price, total_value, fee, status, tx_hash, timestamp
) VALUES
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'buy',
  '0x1',
  '3-Month T-Bill',
  'TBILL3M',
  50,
  97.85,
  4892.50,
  24.46,
  'completed',
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  NOW() - INTERVAL '30 days'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'buy',
  '0x2',
  '2-Year T-Note',
  'TNOTE2Y',
  120,
  94.25,
  11310.00,
  56.55,
  'completed',
  '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
  NOW() - INTERVAL '60 days'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'buy',
  'tf-001',
  'Taiwan Semiconductor Supply Chain Finance',
  'TSMC-SCF',
  5,
  100.00,
  5000.00,
  25.00,
  'completed',
  '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
  NOW() - INTERVAL '15 days'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'yield',
  '0x1',
  '3-Month T-Bill',
  'TBILL3M',
  0,
  0,
  45.55,
  0,
  'completed',
  '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
  NOW() - INTERVAL '15 days'
);

-- ============================================================================
-- YIELD DISTRIBUTIONS (Sample Data)
-- ============================================================================

INSERT INTO yield_distributions (
  wallet_address, asset_id, asset_name, amount, yield_rate,
  distribution_date, next_distribution_date, frequency, status, tx_hash
) VALUES
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  '0x1',
  '3-Month T-Bill',
  45.55,
  3.75,
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '15 days',
  'monthly',
  'completed',
  '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef'
),
(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  '0x2',
  '2-Year T-Note',
  118.75,
  4.15,
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '75 days',
  'quarterly',
  'completed',
  '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef'
);

-- ============================================================================
-- TRADE FINANCE POSITIONS (Sample Data)
-- ============================================================================

INSERT INTO tradefinance_positions (
  asset_id, owner_address, units_owned, investment_amount,
  acquisition_price, acquisition_date, purchase_tx_hash, status
) VALUES
(
  'tf-001',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  5,
  5000.00,
  100.00,
  NOW() - INTERVAL '15 days',
  '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
  'Active'
);

-- ============================================================================
-- TRADE FINANCE TRANSACTIONS (Sample Data)
-- ============================================================================

INSERT INTO tradefinance_transactions (
  asset_id, buyer_address, transaction_type, units,
  price_per_unit, total_amount, fee, status, tx_hash, timestamp
) VALUES
(
  'tf-001',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  'purchase',
  5,
  100.00,
  5000.00,
  25.00,
  'completed',
  '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
  NOW() - INTERVAL '15 days'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify trade finance assets inserted
SELECT 'Trade Finance Assets:', COUNT(*) FROM tradefinance_assets;

-- Verify portfolio holdings inserted
SELECT 'Portfolio Holdings:', COUNT(*) FROM portfolio_holdings;

-- Verify transactions inserted
SELECT 'Portfolio Transactions:', COUNT(*) FROM portfolio_transactions;
SELECT 'Trade Finance Transactions:', COUNT(*) FROM tradefinance_transactions;

-- Verify yield distributions inserted
SELECT 'Yield Distributions:', COUNT(*) FROM yield_distributions;

-- Verify positions inserted
SELECT 'Trade Finance Positions:', COUNT(*) FROM tradefinance_positions;
-- Quantera v2.0.0-alpha Compliance Service Tables
-- Migration for compliance, KYC, sanctions, and tax data

-- ============ Investor Profiles ============

CREATE TABLE IF NOT EXISTS investor_profiles (
    id BIGSERIAL PRIMARY KEY,
    address BYTEA NOT NULL UNIQUE,
    jurisdiction VARCHAR(10) NOT NULL,
    kyc_level SMALLINT NOT NULL DEFAULT 0,
    kyc_expiry TIMESTAMPTZ,
    accreditation_level SMALLINT NOT NULL DEFAULT 0,
    risk_score INT NOT NULL DEFAULT 0,
    total_invested NUMERIC(20, 8) DEFAULT 0,
    documents_ipfs TEXT[],
    last_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pep BOOLEAN NOT NULL DEFAULT false,
    sanctioned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investor_profiles_address ON investor_profiles(address);
CREATE INDEX idx_investor_profiles_jurisdiction ON investor_profiles(jurisdiction);
CREATE INDEX idx_investor_profiles_kyc_level ON investor_profiles(kyc_level);

-- ============ Compliance Reports ============

CREATE TABLE IF NOT EXISTS compliance_reports (
    id BIGSERIAL PRIMARY KEY,
    report_id UUID NOT NULL UNIQUE,
    investor_address BYTEA NOT NULL,
    asset_address BYTEA,
    amount NUMERIC(20, 8),
    jurisdiction VARCHAR(10) NOT NULL,
    kyc_verified BOOLEAN NOT NULL DEFAULT false,
    sanctions_passed BOOLEAN NOT NULL DEFAULT false,
    violations JSONB,
    recommendations JSONB,
    ipfs_hash TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_reports_investor ON compliance_reports(investor_address);
CREATE INDEX idx_compliance_reports_report_id ON compliance_reports(report_id);
CREATE INDEX idx_compliance_reports_generated_at ON compliance_reports(generated_at DESC);

-- ============ KYC Verifications ============

CREATE TABLE IF NOT EXISTS kyc_verifications (
    id BIGSERIAL PRIMARY KEY,
    verification_id VARCHAR(255) NOT NULL UNIQUE,
    investor_address BYTEA NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    kyc_level SMALLINT NOT NULL DEFAULT 0,
    checks JSONB,
    metadata JSONB,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expiry_at TIMESTAMPTZ
);

CREATE INDEX idx_kyc_verifications_investor ON kyc_verifications(investor_address);
CREATE INDEX idx_kyc_verifications_verification_id ON kyc_verifications(verification_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);

-- ============ Sanctions Screening ============

CREATE TABLE IF NOT EXISTS sanctions_screenings (
    id BIGSERIAL PRIMARY KEY,
    address BYTEA,
    name TEXT,
    is_sanctioned BOOLEAN NOT NULL DEFAULT false,
    lists TEXT[],
    match_score NUMERIC(5, 2),
    details TEXT,
    screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sanctions_screenings_address ON sanctions_screenings(address);
CREATE INDEX idx_sanctions_screenings_name ON sanctions_screenings(name);
CREATE INDEX idx_sanctions_screenings_screened_at ON sanctions_screenings(screened_at DESC);

-- ============ Tax Reports ============

CREATE TABLE IF NOT EXISTS tax_reports (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    investor_address BYTEA NOT NULL,
    jurisdiction VARCHAR(10) NOT NULL,
    amount NUMERIC(20, 8),
    cost_basis NUMERIC(20, 8),
    gain_loss NUMERIC(20, 8),
    is_long_term BOOLEAN,
    tax_rate NUMERIC(5, 4),
    tax_due NUMERIC(20, 8),
    wash_sale BOOLEAN DEFAULT false,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_reports_investor ON tax_reports(investor_address);
CREATE INDEX idx_tax_reports_transaction_id ON tax_reports(transaction_id);
CREATE INDEX idx_tax_reports_calculated_at ON tax_reports(calculated_at DESC);

-- ============ Form 1099 Records ============

CREATE TABLE IF NOT EXISTS form_1099_records (
    id BIGSERIAL PRIMARY KEY,
    tax_year INT NOT NULL,
    investor_address BYTEA NOT NULL,
    payer_name VARCHAR(255),
    payer_tin VARCHAR(20),
    recipient_tin VARCHAR(20),
    gross_proceeds NUMERIC(20, 2),
    cost_basis NUMERIC(20, 2),
    short_term_gain_loss NUMERIC(20, 2),
    long_term_gain_loss NUMERIC(20, 2),
    federal_tax_withheld NUMERIC(20, 2),
    wash_sale_loss_disallowed NUMERIC(20, 2),
    transaction_count INT,
    ipfs_hash TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tax_year, investor_address)
);

CREATE INDEX idx_form_1099_investor ON form_1099_records(investor_address);
CREATE INDEX idx_form_1099_tax_year ON form_1099_records(tax_year);

-- ============ Document Storage ============

CREATE TABLE IF NOT EXISTS compliance_documents (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    investor_address BYTEA NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    ipfs_hash TEXT NOT NULL,
    encrypted BOOLEAN NOT NULL DEFAULT true,
    mime_type VARCHAR(100),
    size_bytes INT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_at TIMESTAMPTZ,
    verified BOOLEAN DEFAULT false,
    verifier VARCHAR(255)
);

CREATE INDEX idx_compliance_documents_investor ON compliance_documents(investor_address);
CREATE INDEX idx_compliance_documents_type ON compliance_documents(document_type);
CREATE INDEX idx_compliance_documents_ipfs ON compliance_documents(ipfs_hash);

-- ============ Jurisdiction Rules Cache ============

CREATE TABLE IF NOT EXISTS jurisdiction_rules (
    id SERIAL PRIMARY KEY,
    jurisdiction_code VARCHAR(10) NOT NULL UNIQUE,
    kyc_required BOOLEAN NOT NULL DEFAULT true,
    kyc_level_required SMALLINT NOT NULL DEFAULT 1,
    min_investment NUMERIC(20, 8),
    max_investment NUMERIC(20, 8),
    accreditation_required BOOLEAN NOT NULL DEFAULT false,
    allowed_asset_types TEXT[],
    restricted_asset_types TEXT[],
    tax_rate NUMERIC(5, 4),
    withholding_rate NUMERIC(5, 4),
    reporting_required BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jurisdiction_rules_code ON jurisdiction_rules(jurisdiction_code);

-- ============ Audit Log ============

CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    actor VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_audit_log_entity ON compliance_audit_log(entity_type, entity_id);
CREATE INDEX idx_compliance_audit_log_actor ON compliance_audit_log(actor);
CREATE INDEX idx_compliance_audit_log_created_at ON compliance_audit_log(created_at DESC);

-- ============ Functions ============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============ Triggers ============

CREATE TRIGGER update_investor_profiles_updated_at
    BEFORE UPDATE ON investor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jurisdiction_rules_updated_at
    BEFORE UPDATE ON jurisdiction_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============ Initial Data ============

-- Insert default jurisdiction rules
INSERT INTO jurisdiction_rules (jurisdiction_code, kyc_required, kyc_level_required, min_investment, max_investment, accreditation_required, tax_rate, withholding_rate)
VALUES 
    ('US', true, 2, 100, 10000000, true, 0.20, 0.24),
    ('EU', true, 1, 500, 5000000, false, 0.25, 0.25),
    ('GB', true, 1, 1000, 5000000, false, 0.20, 0.20),
    ('SG', true, 1, 1000, NULL, false, 0.00, 0.00),
    ('JP', true, 2, 10000, 1000000, false, 0.20, 0.2042),
    ('CH', true, 1, 5000, NULL, false, 0.15, 0.15),
    ('AE', false, 0, 1000, NULL, false, 0.00, 0.00)
ON CONFLICT (jurisdiction_code) DO NOTHING;

-- ============ Comments ============

COMMENT ON TABLE investor_profiles IS 'KYC and compliance profiles for investors';
COMMENT ON TABLE compliance_reports IS 'Generated compliance check reports';
COMMENT ON TABLE kyc_verifications IS 'KYC verification records from providers';
COMMENT ON TABLE sanctions_screenings IS 'Sanctions screening results';
COMMENT ON TABLE tax_reports IS 'Tax calculation reports for transactions';
COMMENT ON TABLE form_1099_records IS 'IRS Form 1099 records for US investors';
COMMENT ON TABLE compliance_documents IS 'IPFS-stored compliance documents';
COMMENT ON TABLE jurisdiction_rules IS 'Cached jurisdiction compliance rules';
COMMENT ON TABLE compliance_audit_log IS 'Audit trail for compliance operations';

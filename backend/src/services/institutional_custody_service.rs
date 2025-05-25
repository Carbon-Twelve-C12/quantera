use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum CustodyType {
    SelfCustody,           // Institution manages own keys
    ThirdPartyCustody,     // External custodian
    HybridCustody,         // Combination of self and third-party
    MultiSigCustody,       // Multi-signature arrangement
    DelegatedCustody,      // Delegated to authorized parties
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum SegregationLevel {
    Omnibus,                // Pooled account
    Segregated,             // Individual segregated account
    IndividuallySeparated,  // Fully isolated individual account
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionalAccount {
    pub institution_address: String,
    pub institution_name: String,
    pub custody_type: CustodyType,
    pub segregation_level: SegregationLevel,
    pub custodians: Vec<String>,
    pub signatories: Vec<String>,
    pub required_signatures: u32,
    pub asset_balances: HashMap<String, u128>,
    pub authorized_assets: Vec<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub jurisdiction: String,
    pub compliance_hash: String,
    pub aum: u128, // Assets Under Management
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustodianInfo {
    pub custodian_address: String,
    pub name: String,
    pub license: String,
    pub jurisdiction: String,
    pub is_active: bool,
    pub total_assets_under_custody: u128,
    pub registration_date: DateTime<Utc>,
    pub authorized_institutions: Vec<String>,
    pub custody_fee_rate: u32, // In basis points
    pub insurance_coverage: u128,
    pub regulatory_approvals: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionProposal {
    pub proposal_id: u64,
    pub institution: String,
    pub asset: String,
    pub to: String,
    pub amount: u128,
    pub description: String,
    pub approvers: Vec<String>,
    pub approvals_count: u32,
    pub required_approvals: u32,
    pub executed: bool,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub proposal_type: ProposalType,
    pub risk_score: u32,
    pub compliance_checked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProposalType {
    Withdrawal,
    Transfer,
    AssetAuthorization,
    CustodyArrangementChange,
    SignatoryUpdate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustodyMetrics {
    pub total_institutions: u32,
    pub total_custodians: u32,
    pub total_aum: u128,
    pub average_custody_fee: f64,
    pub custody_type_distribution: HashMap<CustodyType, u32>,
    pub segregation_level_distribution: HashMap<SegregationLevel, u32>,
    pub pending_proposals: u32,
    pub executed_proposals_24h: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub institution: String,
    pub overall_risk_score: u32,
    pub liquidity_risk: u32,
    pub operational_risk: u32,
    pub compliance_risk: u32,
    pub concentration_risk: u32,
    pub recommendations: Vec<String>,
    pub last_assessment: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustodyReport {
    pub institution: String,
    pub reporting_period: String,
    pub total_assets: u128,
    pub asset_breakdown: HashMap<String, u128>,
    pub transaction_count: u32,
    pub custody_fees_paid: u128,
    pub compliance_status: String,
    pub risk_metrics: RiskAssessment,
    pub generated_at: DateTime<Utc>,
}

pub struct InstitutionalCustodyService {
    institutions: HashMap<String, InstitutionalAccount>,
    custodians: HashMap<String, CustodianInfo>,
    transaction_proposals: HashMap<u64, TransactionProposal>,
    institution_proposals: HashMap<String, Vec<u64>>,
    next_proposal_id: u64,
    risk_assessments: HashMap<String, RiskAssessment>,
    custody_reports: HashMap<String, Vec<CustodyReport>>,
}

impl InstitutionalCustodyService {
    pub fn new() -> Self {
        Self {
            institutions: HashMap::new(),
            custodians: HashMap::new(),
            transaction_proposals: HashMap::new(),
            institution_proposals: HashMap::new(),
            next_proposal_id: 1,
            risk_assessments: HashMap::new(),
            custody_reports: HashMap::new(),
        }
    }

    pub async fn register_custodian(
        &mut self,
        custodian_address: String,
        name: String,
        license: String,
        jurisdiction: String,
        custody_fee_rate: u32,
        insurance_coverage: u128,
        regulatory_approvals: Vec<String>,
    ) -> Result<()> {
        if self.custodians.contains_key(&custodian_address) {
            return Err(anyhow!("Custodian {} already registered", custodian_address));
        }

        let custodian = CustodianInfo {
            custodian_address: custodian_address.clone(),
            name,
            license,
            jurisdiction,
            is_active: true,
            total_assets_under_custody: 0,
            registration_date: Utc::now(),
            authorized_institutions: Vec::new(),
            custody_fee_rate,
            insurance_coverage,
            regulatory_approvals,
        };

        self.custodians.insert(custodian_address.clone(), custodian);
        println!("Custodian {} registered successfully", custodian_address);
        Ok(())
    }

    pub async fn create_institutional_account(
        &mut self,
        institution_address: String,
        institution_name: String,
        custody_type: CustodyType,
        segregation_level: SegregationLevel,
        custodians: Vec<String>,
        signatories: Vec<String>,
        required_signatures: u32,
        jurisdiction: String,
        compliance_hash: String,
    ) -> Result<()> {
        if self.institutions.contains_key(&institution_address) {
            return Err(anyhow!("Institution {} already registered", institution_address));
        }

        // Validate custodians
        for custodian in &custodians {
            if !self.custodians.contains_key(custodian) {
                return Err(anyhow!("Custodian {} not found", custodian));
            }
        }

        // Validate required signatures
        if required_signatures < 2 {
            return Err(anyhow!("Minimum 2 signatures required"));
        }
        if required_signatures > signatories.len() as u32 {
            return Err(anyhow!("Required signatures exceed available signatories"));
        }

        let account = InstitutionalAccount {
            institution_address: institution_address.clone(),
            institution_name,
            custody_type,
            segregation_level,
            custodians: custodians.clone(),
            signatories,
            required_signatures,
            asset_balances: HashMap::new(),
            authorized_assets: Vec::new(),
            is_active: true,
            created_at: Utc::now(),
            last_activity: Utc::now(),
            jurisdiction,
            compliance_hash,
            aum: 0,
        };

        self.institutions.insert(institution_address.clone(), account);
        self.institution_proposals.insert(institution_address.clone(), Vec::new());

        // Update custodian authorized institutions
        for custodian_address in &custodians {
            if let Some(custodian) = self.custodians.get_mut(custodian_address) {
                custodian.authorized_institutions.push(institution_address.clone());
            }
        }

        println!("Institutional account {} created successfully", institution_address);
        Ok(())
    }

    pub async fn deposit_asset(
        &mut self,
        institution_address: String,
        asset: String,
        amount: u128,
        custodian_address: String,
    ) -> Result<()> {
        let institution = self.institutions.get_mut(&institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        // Verify custodian is authorized
        if !institution.custodians.contains(&custodian_address) {
            return Err(anyhow!("Custodian {} not authorized for institution {}", custodian_address, institution_address));
        }

        // Verify asset is authorized
        if !institution.authorized_assets.contains(&asset) {
            return Err(anyhow!("Asset {} not authorized for institution {}", asset, institution_address));
        }

        // Update balances
        *institution.asset_balances.entry(asset.clone()).or_insert(0) += amount;
        institution.aum += amount;
        institution.last_activity = Utc::now();

        // Update custodian statistics
        if let Some(custodian) = self.custodians.get_mut(&custodian_address) {
            custodian.total_assets_under_custody += amount;
        }

        println!("Deposited {} of asset {} for institution {}", amount, asset, institution_address);
        Ok(())
    }

    pub async fn propose_withdrawal(
        &mut self,
        institution_address: String,
        asset: String,
        to: String,
        amount: u128,
        description: String,
    ) -> Result<u64> {
        let institution = self.institutions.get(&institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        // Check balance
        let current_balance = institution.asset_balances.get(&asset).unwrap_or(&0);
        if *current_balance < amount {
            return Err(anyhow!("Insufficient balance for asset {}", asset));
        }

        // Create proposal
        let proposal_id = self.next_proposal_id;
        self.next_proposal_id += 1;

        let risk_score = self.calculate_transaction_risk(&institution_address, &asset, amount).await?;

        let proposal = TransactionProposal {
            proposal_id,
            institution: institution_address.clone(),
            asset,
            to,
            amount,
            description,
            approvers: Vec::new(),
            approvals_count: 0,
            required_approvals: institution.required_signatures,
            executed: false,
            created_at: Utc::now(),
            expires_at: Utc::now() + Duration::days(7),
            proposal_type: ProposalType::Withdrawal,
            risk_score,
            compliance_checked: false,
        };

        self.transaction_proposals.insert(proposal_id, proposal);
        
        if let Some(proposals) = self.institution_proposals.get_mut(&institution_address) {
            proposals.push(proposal_id);
        }

        println!("Withdrawal proposal {} created for institution {}", proposal_id, institution_address);
        Ok(proposal_id)
    }

    pub async fn approve_transaction(
        &mut self,
        proposal_id: u64,
        approver: String,
    ) -> Result<bool> {
        let proposal = self.transaction_proposals.get_mut(&proposal_id)
            .ok_or_else(|| anyhow!("Proposal {} not found", proposal_id))?;

        // Check if proposal is still valid
        if proposal.executed {
            return Err(anyhow!("Proposal {} already executed", proposal_id));
        }
        if Utc::now() > proposal.expires_at {
            return Err(anyhow!("Proposal {} has expired", proposal_id));
        }

        // Check if approver is authorized
        let institution = self.institutions.get(&proposal.institution)
            .ok_or_else(|| anyhow!("Institution {} not found", proposal.institution))?;
        
        if !institution.signatories.contains(&approver) {
            return Err(anyhow!("Approver {} not authorized for institution {}", approver, proposal.institution));
        }

        // Check if already approved by this signatory
        if proposal.approvers.contains(&approver) {
            return Err(anyhow!("Already approved by {}", approver));
        }

        // Add approval
        proposal.approvers.push(approver.clone());
        proposal.approvals_count += 1;

        println!("Proposal {} approved by {} ({}/{})", proposal_id, approver, proposal.approvals_count, proposal.required_approvals);

        // Auto-execute if enough approvals
        if proposal.approvals_count >= proposal.required_approvals {
            return self.execute_transaction(proposal_id).await;
        }

        Ok(false)
    }

    pub async fn execute_transaction(&mut self, proposal_id: u64) -> Result<bool> {
        // First, get the proposal data we need without holding a mutable reference
        let (proposal_type, institution, asset, amount, to, executed, approvals_count, required_approvals) = {
            let proposal = self.transaction_proposals.get(&proposal_id)
                .ok_or_else(|| anyhow!("Proposal {} not found", proposal_id))?;

            if proposal.executed {
                return Err(anyhow!("Proposal {} already executed", proposal_id));
            }

            if proposal.approvals_count < proposal.required_approvals {
                return Err(anyhow!("Insufficient approvals for proposal {}", proposal_id));
            }

            (
                proposal.proposal_type.clone(),
                proposal.institution.clone(),
                proposal.asset.clone(),
                proposal.amount,
                proposal.to.clone(),
                proposal.executed,
                proposal.approvals_count,
                proposal.required_approvals,
            )
        };

        // Execute the transaction based on type
        match proposal_type {
            ProposalType::Withdrawal => {
                self.execute_withdrawal_internal(institution, asset, amount, to).await?;
            },
            ProposalType::Transfer => {
                self.execute_transfer_internal(institution, asset, amount, to).await?;
            },
            _ => {
                return Err(anyhow!("Unsupported proposal type"));
            }
        }

        // Now mark the proposal as executed
        if let Some(proposal) = self.transaction_proposals.get_mut(&proposal_id) {
            proposal.executed = true;
        }

        println!("Proposal {} executed successfully", proposal_id);
        Ok(true)
    }

    async fn execute_withdrawal_internal(
        &mut self,
        institution: String,
        asset: String,
        amount: u128,
        to: String,
    ) -> Result<()> {
        let institution_account = self.institutions.get_mut(&institution)
            .ok_or_else(|| anyhow!("Institution {} not found", institution))?;

        // Update balances
        let current_balance = institution_account.asset_balances.get_mut(&asset)
            .ok_or_else(|| anyhow!("Asset {} not found in institution balance", asset))?;

        if *current_balance < amount {
            return Err(anyhow!("Insufficient balance for withdrawal"));
        }

        *current_balance -= amount;
        institution_account.aum -= amount;
        institution_account.last_activity = Utc::now();

        // In a real implementation, this would trigger the actual blockchain transaction
        println!("Executed withdrawal of {} {} to {}", amount, asset, to);
        Ok(())
    }

    async fn execute_transfer_internal(
        &mut self,
        institution: String,
        asset: String,
        amount: u128,
        to: String,
    ) -> Result<()> {
        // Implementation for internal transfers between accounts
        println!("Executed transfer of {} {} from {} to {}", amount, asset, institution, to);
        Ok(())
    }

    async fn execute_withdrawal(&mut self, proposal_id: u64) -> Result<()> {
        let proposal = self.transaction_proposals.get(&proposal_id)
            .ok_or_else(|| anyhow!("Proposal {} not found", proposal_id))?;

        let institution = self.institutions.get_mut(&proposal.institution)
            .ok_or_else(|| anyhow!("Institution {} not found", proposal.institution))?;

        // Update balances
        let current_balance = institution.asset_balances.get_mut(&proposal.asset)
            .ok_or_else(|| anyhow!("Asset {} not found in institution balance", proposal.asset))?;

        if *current_balance < proposal.amount {
            return Err(anyhow!("Insufficient balance for withdrawal"));
        }

        *current_balance -= proposal.amount;
        institution.aum -= proposal.amount;
        institution.last_activity = Utc::now();

        // In a real implementation, this would trigger the actual blockchain transaction
        println!("Executed withdrawal of {} {} to {}", proposal.amount, proposal.asset, proposal.to);
        Ok(())
    }

    async fn execute_transfer(&mut self, proposal_id: u64) -> Result<()> {
        // Implementation for internal transfers between accounts
        let proposal = self.transaction_proposals.get(&proposal_id)
            .ok_or_else(|| anyhow!("Proposal {} not found", proposal_id))?;

        println!("Executed transfer of {} {} to {}", proposal.amount, proposal.asset, proposal.to);
        Ok(())
    }

    pub async fn authorize_asset(&mut self, institution_address: String, asset: String) -> Result<()> {
        let institution = self.institutions.get_mut(&institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        if !institution.authorized_assets.contains(&asset) {
            institution.authorized_assets.push(asset.clone());
            println!("Asset {} authorized for institution {}", asset, institution_address);
        }

        Ok(())
    }

    pub async fn calculate_transaction_risk(&self, institution_address: &str, asset: &str, amount: u128) -> Result<u32> {
        let institution = self.institutions.get(institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        let mut risk_score = 0u32;

        // Calculate risk based on transaction size relative to total balance
        let current_balance = institution.asset_balances.get(asset).unwrap_or(&0);
        if *current_balance > 0 {
            let percentage = (amount * 100) / *current_balance;
            if percentage > 50 {
                risk_score += 30; // High risk for large withdrawals
            } else if percentage > 20 {
                risk_score += 15; // Medium risk
            } else {
                risk_score += 5;  // Low risk
            }
        }

        // Add risk based on custody type
        match institution.custody_type {
            CustodyType::SelfCustody => risk_score += 10,
            CustodyType::ThirdPartyCustody => risk_score += 5,
            CustodyType::MultiSigCustody => risk_score += 3,
            _ => risk_score += 7,
        }

        // Add risk based on segregation level
        match institution.segregation_level {
            SegregationLevel::Omnibus => risk_score += 10,
            SegregationLevel::Segregated => risk_score += 5,
            SegregationLevel::IndividuallySeparated => risk_score += 2,
        }

        Ok(risk_score.min(100)) // Cap at 100
    }

    pub async fn generate_custody_report(&self, institution_address: &str, period: &str) -> Result<CustodyReport> {
        let institution = self.institutions.get(institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        let risk_assessment = self.risk_assessments.get(institution_address)
            .cloned()
            .unwrap_or_else(|| RiskAssessment {
                institution: institution_address.to_string(),
                overall_risk_score: 50,
                liquidity_risk: 30,
                operational_risk: 40,
                compliance_risk: 20,
                concentration_risk: 35,
                recommendations: vec!["Regular risk assessment recommended".to_string()],
                last_assessment: Utc::now(),
            });

        let report = CustodyReport {
            institution: institution_address.to_string(),
            reporting_period: period.to_string(),
            total_assets: institution.aum,
            asset_breakdown: institution.asset_balances.clone(),
            transaction_count: self.get_institution_transaction_count(institution_address),
            custody_fees_paid: self.calculate_custody_fees(institution_address).await?,
            compliance_status: "Compliant".to_string(),
            risk_metrics: risk_assessment,
            generated_at: Utc::now(),
        };

        Ok(report)
    }

    pub fn get_custody_metrics(&self) -> CustodyMetrics {
        let mut custody_type_distribution = HashMap::new();
        let mut segregation_level_distribution = HashMap::new();
        let mut total_aum = 0u128;

        for institution in self.institutions.values() {
            *custody_type_distribution.entry(institution.custody_type.clone()).or_insert(0) += 1;
            *segregation_level_distribution.entry(institution.segregation_level.clone()).or_insert(0) += 1;
            total_aum += institution.aum;
        }

        let pending_proposals = self.transaction_proposals.values()
            .filter(|p| !p.executed && Utc::now() <= p.expires_at)
            .count() as u32;

        let executed_proposals_24h = self.transaction_proposals.values()
            .filter(|p| p.executed && Utc::now().signed_duration_since(p.created_at).num_hours() <= 24)
            .count() as u32;

        let average_custody_fee = if !self.custodians.is_empty() {
            self.custodians.values()
                .map(|c| c.custody_fee_rate as f64)
                .sum::<f64>() / self.custodians.len() as f64
        } else {
            0.0
        };

        CustodyMetrics {
            total_institutions: self.institutions.len() as u32,
            total_custodians: self.custodians.len() as u32,
            total_aum,
            average_custody_fee,
            custody_type_distribution,
            segregation_level_distribution,
            pending_proposals,
            executed_proposals_24h,
        }
    }

    pub fn get_institution_account(&self, institution_address: &str) -> Option<&InstitutionalAccount> {
        self.institutions.get(institution_address)
    }

    pub fn get_custodian_info(&self, custodian_address: &str) -> Option<&CustodianInfo> {
        self.custodians.get(custodian_address)
    }

    pub fn get_transaction_proposal(&self, proposal_id: u64) -> Option<&TransactionProposal> {
        self.transaction_proposals.get(&proposal_id)
    }

    pub fn get_institution_proposals(&self, institution_address: &str) -> Vec<&TransactionProposal> {
        if let Some(proposal_ids) = self.institution_proposals.get(institution_address) {
            proposal_ids.iter()
                .filter_map(|id| self.transaction_proposals.get(id))
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_all_institutions(&self) -> Vec<&InstitutionalAccount> {
        self.institutions.values().collect()
    }

    pub fn get_all_custodians(&self) -> Vec<&CustodianInfo> {
        self.custodians.values().collect()
    }

    // Private helper methods

    fn get_institution_transaction_count(&self, institution_address: &str) -> u32 {
        self.transaction_proposals.values()
            .filter(|p| p.institution == institution_address && p.executed)
            .count() as u32
    }

    async fn calculate_custody_fees(&self, institution_address: &str) -> Result<u128> {
        let institution = self.institutions.get(institution_address)
            .ok_or_else(|| anyhow!("Institution {} not found", institution_address))?;

        let mut total_fees = 0u128;

        for custodian_address in &institution.custodians {
            if let Some(custodian) = self.custodians.get(custodian_address) {
                // Calculate annual custody fee based on AUM
                let annual_fee = (institution.aum * custodian.custody_fee_rate as u128) / 10000;
                total_fees += annual_fee;
            }
        }

        Ok(total_fees)
    }
} 
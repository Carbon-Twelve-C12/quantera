use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum RegulatoryFramework {
    MiCA,           // EU Markets in Crypto-Assets
    SECRegulation,  // US Securities and Exchange Commission
    FCARegulation,  // UK Financial Conduct Authority
    MASRegulation,  // Singapore Monetary Authority
    JFSARegulation, // Japan Financial Services Agency
    BaFinRegulation, // Germany Federal Financial Supervisory Authority
    AMFRegulation,  // France Autorité des marchés financiers
    CSRCRegulation, // China Securities Regulatory Commission
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceRequirement {
    pub requirement_id: String,
    pub framework: RegulatoryFramework,
    pub description: String,
    pub is_mandatory: bool,
    pub verification_method: VerificationMethod,
    pub applicable_asset_types: Vec<String>,
    pub minimum_investment_threshold: Option<u128>,
    pub maximum_investment_threshold: Option<u128>,
    pub cooling_period_days: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VerificationMethod {
    KYC,
    AML,
    AccreditedInvestorCheck,
    QualifiedInvestorStatus,
    GeographicRestriction,
    InvestmentLimitCheck,
    CoolingPeriodCheck,
    SuitabilityAssessment,
    ProfessionalInvestorVerification,
    InstitutionalInvestorCheck,
    TaxResidencyVerification,
    SanctionsScreening,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorProfile {
    pub investor_id: String,
    pub jurisdiction: String,
    pub tax_residency: Vec<String>,
    pub investor_type: InvestorType,
    pub kyc_status: KYCStatus,
    pub aml_status: AMLStatus,
    pub accreditation_status: AccreditationStatus,
    pub investment_limits: HashMap<String, InvestmentLimit>,
    pub last_updated: DateTime<Utc>,
    pub compliance_score: u8, // 0-100
    pub risk_rating: RiskRating,
    pub sanctions_status: SanctionsStatus,
    pub cooling_periods: HashMap<String, DateTime<Utc>>, // Asset type -> last investment date
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InvestorType {
    Retail,
    Professional,
    Institutional,
    QualifiedInvestor,
    AccreditedInvestor,
    EligibleCounterparty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KYCStatus {
    NotStarted,
    InProgress,
    Completed,
    Expired,
    Rejected,
    UnderReview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AMLStatus {
    Clear,
    UnderReview,
    Flagged,
    Blocked,
    RequiresEnhancedDueDiligence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccreditationStatus {
    NotApplicable,
    Pending,
    Verified,
    Expired,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskRating {
    Low,
    Medium,
    High,
    Prohibited,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SanctionsStatus {
    Clear,
    UnderReview,
    Flagged,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestmentLimit {
    pub asset_type: String,
    pub maximum_amount: u128,
    pub current_exposure: u128,
    pub reset_period: Duration,
    pub last_reset: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceCheck {
    pub requirement_id: String,
    pub framework: RegulatoryFramework,
    pub passed: bool,
    pub message: String,
    pub severity: ComplianceSeverity,
    pub remediation_steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComplianceSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Serialize)]
pub struct ComplianceResult {
    pub is_compliant: bool,
    pub overall_score: u8,
    pub checks: Vec<ComplianceCheck>,
    pub recommendations: Vec<String>,
    pub required_actions: Vec<String>,
    pub estimated_completion_time: Option<Duration>,
}

#[derive(Debug)]
pub enum ComplianceError {
    InvestorNotFound,
    JurisdictionNotSupported,
    FrameworkNotSupported,
    VerificationFailed(String),
    InsufficientData,
    SystemError(String),
}

impl std::fmt::Display for ComplianceError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ComplianceError::InvestorNotFound => write!(f, "Investor not found"),
            ComplianceError::JurisdictionNotSupported => write!(f, "Jurisdiction not supported"),
            ComplianceError::FrameworkNotSupported => write!(f, "Regulatory framework not supported"),
            ComplianceError::VerificationFailed(msg) => write!(f, "Verification failed: {}", msg),
            ComplianceError::InsufficientData => write!(f, "Insufficient data for compliance check"),
            ComplianceError::SystemError(msg) => write!(f, "System error: {}", msg),
        }
    }
}

impl std::error::Error for ComplianceError {}

pub struct EnhancedComplianceEngine {
    frameworks: HashMap<String, Vec<ComplianceRequirement>>,
    investor_profiles: HashMap<String, InvestorProfile>,
    jurisdiction_mappings: HashMap<String, Vec<RegulatoryFramework>>,
    asset_type_requirements: HashMap<String, Vec<String>>, // Asset type -> requirement IDs
    sanctions_lists: HashMap<String, Vec<String>>, // Jurisdiction -> sanctioned entities
}

impl EnhancedComplianceEngine {
    pub fn new() -> Self {
        let mut engine = Self {
            frameworks: HashMap::new(),
            investor_profiles: HashMap::new(),
            jurisdiction_mappings: HashMap::new(),
            asset_type_requirements: HashMap::new(),
            sanctions_lists: HashMap::new(),
        };
        
        engine.initialize_frameworks();
        engine.initialize_jurisdiction_mappings();
        engine.initialize_asset_type_requirements();
        
        engine
    }

    fn initialize_frameworks(&mut self) {
        // Initialize MiCA requirements (EU)
        self.frameworks.insert("EU".to_string(), vec![
            ComplianceRequirement {
                requirement_id: "MICA_KYC_001".to_string(),
                framework: RegulatoryFramework::MiCA,
                description: "Customer identification and verification under MiCA".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::KYC,
                applicable_asset_types: vec!["*".to_string()], // All asset types
                minimum_investment_threshold: None,
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
            ComplianceRequirement {
                requirement_id: "MICA_AML_001".to_string(),
                framework: RegulatoryFramework::MiCA,
                description: "Anti-money laundering checks under MiCA".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::AML,
                applicable_asset_types: vec!["*".to_string()],
                minimum_investment_threshold: None,
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
            ComplianceRequirement {
                requirement_id: "MICA_PROF_001".to_string(),
                framework: RegulatoryFramework::MiCA,
                description: "Professional investor classification".to_string(),
                is_mandatory: false,
                verification_method: VerificationMethod::ProfessionalInvestorVerification,
                applicable_asset_types: vec!["complex_instruments".to_string()],
                minimum_investment_threshold: Some(100_000_000_000_000_000_000), // 100 ETH equivalent
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
        ]);

        // Initialize SEC requirements (US)
        self.frameworks.insert("US".to_string(), vec![
            ComplianceRequirement {
                requirement_id: "SEC_AI_001".to_string(),
                framework: RegulatoryFramework::SECRegulation,
                description: "Accredited investor verification under Regulation D".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::AccreditedInvestorCheck,
                applicable_asset_types: vec!["securities".to_string(), "private_equity".to_string()],
                minimum_investment_threshold: Some(1_000_000_000_000_000_000), // 1 ETH equivalent
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
            ComplianceRequirement {
                requirement_id: "SEC_QI_001".to_string(),
                framework: RegulatoryFramework::SECRegulation,
                description: "Qualified institutional buyer status".to_string(),
                is_mandatory: false,
                verification_method: VerificationMethod::QualifiedInvestorStatus,
                applicable_asset_types: vec!["institutional_securities".to_string()],
                minimum_investment_threshold: Some(100_000_000_000_000_000_000_000), // 100,000 ETH equivalent
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
            ComplianceRequirement {
                requirement_id: "SEC_COOL_001".to_string(),
                framework: RegulatoryFramework::SECRegulation,
                description: "Cooling period for retail investors".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::CoolingPeriodCheck,
                applicable_asset_types: vec!["high_risk".to_string()],
                minimum_investment_threshold: None,
                maximum_investment_threshold: Some(10_000_000_000_000_000_000), // 10 ETH equivalent
                cooling_period_days: Some(7),
            },
        ]);

        // Initialize MAS requirements (Singapore)
        self.frameworks.insert("SG".to_string(), vec![
            ComplianceRequirement {
                requirement_id: "MAS_AI_001".to_string(),
                framework: RegulatoryFramework::MASRegulation,
                description: "Accredited investor status under MAS".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::AccreditedInvestorCheck,
                applicable_asset_types: vec!["securities".to_string()],
                minimum_investment_threshold: Some(200_000_000_000_000_000_000), // 200 SGD equivalent
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
            ComplianceRequirement {
                requirement_id: "MAS_SUIT_001".to_string(),
                framework: RegulatoryFramework::MASRegulation,
                description: "Suitability assessment for complex products".to_string(),
                is_mandatory: true,
                verification_method: VerificationMethod::SuitabilityAssessment,
                applicable_asset_types: vec!["derivatives".to_string(), "structured_products".to_string()],
                minimum_investment_threshold: None,
                maximum_investment_threshold: None,
                cooling_period_days: None,
            },
        ]);
    }

    fn initialize_jurisdiction_mappings(&mut self) {
        self.jurisdiction_mappings.insert("EU".to_string(), vec![RegulatoryFramework::MiCA]);
        self.jurisdiction_mappings.insert("US".to_string(), vec![RegulatoryFramework::SECRegulation]);
        self.jurisdiction_mappings.insert("UK".to_string(), vec![RegulatoryFramework::FCARegulation]);
        self.jurisdiction_mappings.insert("SG".to_string(), vec![RegulatoryFramework::MASRegulation]);
        self.jurisdiction_mappings.insert("JP".to_string(), vec![RegulatoryFramework::JFSARegulation]);
        self.jurisdiction_mappings.insert("DE".to_string(), vec![RegulatoryFramework::BaFinRegulation, RegulatoryFramework::MiCA]);
        self.jurisdiction_mappings.insert("FR".to_string(), vec![RegulatoryFramework::AMFRegulation, RegulatoryFramework::MiCA]);
    }

    fn initialize_asset_type_requirements(&mut self) {
        self.asset_type_requirements.insert("securities".to_string(), vec![
            "SEC_AI_001".to_string(),
            "MAS_AI_001".to_string(),
            "MICA_KYC_001".to_string(),
            "MICA_AML_001".to_string(),
        ]);
        
        self.asset_type_requirements.insert("real_estate".to_string(), vec![
            "MICA_KYC_001".to_string(),
            "MICA_AML_001".to_string(),
        ]);
        
        self.asset_type_requirements.insert("commodities".to_string(), vec![
            "MICA_KYC_001".to_string(),
            "MICA_AML_001".to_string(),
        ]);
        
        self.asset_type_requirements.insert("high_risk".to_string(), vec![
            "SEC_COOL_001".to_string(),
            "MICA_PROF_001".to_string(),
        ]);
    }

    pub async fn comprehensive_compliance_check(
        &self,
        investor_id: &str,
        asset_type: &str,
        investment_amount: u128,
        jurisdiction: &str,
    ) -> Result<ComplianceResult, ComplianceError> {
        // Get investor profile
        let profile = self.investor_profiles.get(investor_id)
            .ok_or(ComplianceError::InvestorNotFound)?;

        // Get applicable frameworks for jurisdiction
        let frameworks = self.jurisdiction_mappings.get(jurisdiction)
            .ok_or(ComplianceError::JurisdictionNotSupported)?;

        // Get applicable requirements for asset type
        let empty_vec = vec![];
        let asset_requirements = self.asset_type_requirements.get(asset_type)
            .unwrap_or(&empty_vec);

        let mut compliance_checks = Vec::new();
        let mut overall_score = 100u8;

        // Perform framework-specific checks
        for framework in frameworks {
            let framework_requirements = self.frameworks.get(jurisdiction)
                .ok_or(ComplianceError::FrameworkNotSupported)?;

            for requirement in framework_requirements {
                if requirement.framework == *framework &&
                   (requirement.applicable_asset_types.contains(&"*".to_string()) ||
                    requirement.applicable_asset_types.contains(&asset_type.to_string()) ||
                    asset_requirements.contains(&requirement.requirement_id)) {
                    
                    let check_result = self.perform_compliance_check(
                        profile,
                        requirement,
                        asset_type,
                        investment_amount,
                    ).await?;
                    
                    if !check_result.passed {
                        match check_result.severity {
                            ComplianceSeverity::Critical => overall_score = overall_score.saturating_sub(30),
                            ComplianceSeverity::Error => overall_score = overall_score.saturating_sub(20),
                            ComplianceSeverity::Warning => overall_score = overall_score.saturating_sub(10),
                            ComplianceSeverity::Info => overall_score = overall_score.saturating_sub(5),
                        }
                    }
                    
                    compliance_checks.push(check_result);
                }
            }
        }

        // Perform additional risk-based checks
        self.perform_risk_based_checks(profile, asset_type, investment_amount, &mut compliance_checks).await?;

        // Determine overall compliance
        let is_compliant = compliance_checks.iter().all(|check| 
            check.passed || !matches!(check.severity, ComplianceSeverity::Critical | ComplianceSeverity::Error)
        );

        let recommendations = self.generate_recommendations(&compliance_checks);
        let required_actions = self.generate_required_actions(&compliance_checks);
        let estimated_completion_time = self.estimate_completion_time(&compliance_checks);

        Ok(ComplianceResult {
            is_compliant,
            overall_score,
            checks: compliance_checks,
            recommendations,
            required_actions,
            estimated_completion_time,
        })
    }

    async fn perform_compliance_check(
        &self,
        profile: &InvestorProfile,
        requirement: &ComplianceRequirement,
        asset_type: &str,
        investment_amount: u128,
    ) -> Result<ComplianceCheck, ComplianceError> {
        match requirement.verification_method {
            VerificationMethod::KYC => {
                let passed = matches!(profile.kyc_status, KYCStatus::Completed);
                let severity = if requirement.is_mandatory && !passed {
                    ComplianceSeverity::Critical
                } else if !passed {
                    ComplianceSeverity::Warning
                } else {
                    ComplianceSeverity::Info
                };

                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("KYC verification status: {:?}", profile.kyc_status),
                    severity,
                    remediation_steps: if !passed {
                        vec!["Complete KYC verification process".to_string()]
                    } else {
                        vec![]
                    },
                })
            },

            VerificationMethod::AML => {
                let passed = matches!(profile.aml_status, AMLStatus::Clear);
                let severity = if requirement.is_mandatory && !passed {
                    ComplianceSeverity::Critical
                } else if !passed {
                    ComplianceSeverity::Error
                } else {
                    ComplianceSeverity::Info
                };

                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("AML screening status: {:?}", profile.aml_status),
                    severity,
                    remediation_steps: if !passed {
                        vec!["Complete AML screening process".to_string()]
                    } else {
                        vec![]
                    },
                })
            },

            VerificationMethod::AccreditedInvestorCheck => {
                let passed = matches!(profile.accreditation_status, AccreditationStatus::Verified) ||
                           matches!(profile.investor_type, InvestorType::AccreditedInvestor | InvestorType::Institutional);
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Accredited investor status: {:?}", profile.accreditation_status),
                    severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Provide accredited investor documentation".to_string()]
                    } else {
                        vec![]
                    },
                })
            },

            VerificationMethod::InvestmentLimitCheck => {
                if let Some(limit) = profile.investment_limits.get(asset_type) {
                    let remaining_capacity = limit.maximum_amount.saturating_sub(limit.current_exposure);
                    let passed = investment_amount <= remaining_capacity;
                    
                    Ok(ComplianceCheck {
                        requirement_id: requirement.requirement_id.clone(),
                        framework: requirement.framework.clone(),
                        passed,
                        message: format!(
                            "Investment limit check: {} <= {} (remaining capacity)",
                            investment_amount, remaining_capacity
                        ),
                        severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                        remediation_steps: if !passed {
                            vec![format!("Reduce investment amount to {} or below", remaining_capacity)]
                        } else {
                            vec![]
                        },
                    })
                } else {
                    Ok(ComplianceCheck {
                        requirement_id: requirement.requirement_id.clone(),
                        framework: requirement.framework.clone(),
                        passed: true,
                        message: "No investment limits configured for this asset type".to_string(),
                        severity: ComplianceSeverity::Info,
                        remediation_steps: vec![],
                    })
                }
            },

            VerificationMethod::CoolingPeriodCheck => {
                if let Some(cooling_period_days) = requirement.cooling_period_days {
                    if let Some(last_investment) = profile.cooling_periods.get(asset_type) {
                        let cooling_period = Duration::days(cooling_period_days as i64);
                        let time_since_last = Utc::now() - *last_investment;
                        let passed = time_since_last >= cooling_period;
                        
                        Ok(ComplianceCheck {
                            requirement_id: requirement.requirement_id.clone(),
                            framework: requirement.framework.clone(),
                            passed,
                            message: format!(
                                "Cooling period check: {} days since last investment (required: {} days)",
                                time_since_last.num_days(), cooling_period_days
                            ),
                            severity: if !passed { ComplianceSeverity::Warning } else { ComplianceSeverity::Info },
                            remediation_steps: if !passed {
                                vec![format!("Wait {} more days before next investment", 
                                    (cooling_period - time_since_last).num_days())]
                            } else {
                                vec![]
                            },
                        })
                    } else {
                        Ok(ComplianceCheck {
                            requirement_id: requirement.requirement_id.clone(),
                            framework: requirement.framework.clone(),
                            passed: true,
                            message: "First investment in this asset type".to_string(),
                            severity: ComplianceSeverity::Info,
                            remediation_steps: vec![],
                        })
                    }
                } else {
                    Ok(ComplianceCheck {
                        requirement_id: requirement.requirement_id.clone(),
                        framework: requirement.framework.clone(),
                        passed: true,
                        message: "No cooling period required".to_string(),
                        severity: ComplianceSeverity::Info,
                        remediation_steps: vec![],
                    })
                }
            },

            VerificationMethod::SanctionsScreening => {
                let passed = matches!(profile.sanctions_status, SanctionsStatus::Clear);
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Sanctions screening status: {:?}", profile.sanctions_status),
                    severity: if !passed { ComplianceSeverity::Critical } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Contact compliance team for sanctions review".to_string()]
                    } else {
                        vec![]
                    },
                })
            },

            _ => Ok(ComplianceCheck {
                requirement_id: requirement.requirement_id.clone(),
                framework: requirement.framework.clone(),
                passed: true,
                message: "Verification method not implemented".to_string(),
                severity: ComplianceSeverity::Info,
                remediation_steps: vec![],
            }),
        }
    }

    async fn perform_risk_based_checks(
        &self,
        profile: &InvestorProfile,
        asset_type: &str,
        investment_amount: u128,
        checks: &mut Vec<ComplianceCheck>,
    ) -> Result<(), ComplianceError> {
        // Risk rating check
        let risk_check = match profile.risk_rating {
            RiskRating::Prohibited => ComplianceCheck {
                requirement_id: "RISK_001".to_string(),
                framework: RegulatoryFramework::MiCA, // Default framework
                passed: false,
                message: "Investor risk rating prohibits investment".to_string(),
                severity: ComplianceSeverity::Critical,
                remediation_steps: vec!["Contact compliance team for risk assessment review".to_string()],
            },
            RiskRating::High => ComplianceCheck {
                requirement_id: "RISK_002".to_string(),
                framework: RegulatoryFramework::MiCA,
                passed: investment_amount <= 10_000_000_000_000_000_000, // 10 ETH limit for high risk
                message: "High risk investor - investment amount limited".to_string(),
                severity: ComplianceSeverity::Warning,
                remediation_steps: vec!["Consider reducing investment amount".to_string()],
            },
            _ => ComplianceCheck {
                requirement_id: "RISK_003".to_string(),
                framework: RegulatoryFramework::MiCA,
                passed: true,
                message: format!("Risk rating acceptable: {:?}", profile.risk_rating),
                severity: ComplianceSeverity::Info,
                remediation_steps: vec![],
            },
        };
        
        checks.push(risk_check);

        // Compliance score check
        let score_check = ComplianceCheck {
            requirement_id: "SCORE_001".to_string(),
            framework: RegulatoryFramework::MiCA,
            passed: profile.compliance_score >= 70,
            message: format!("Compliance score: {}/100", profile.compliance_score),
            severity: if profile.compliance_score < 50 {
                ComplianceSeverity::Error
            } else if profile.compliance_score < 70 {
                ComplianceSeverity::Warning
            } else {
                ComplianceSeverity::Info
            },
            remediation_steps: if profile.compliance_score < 70 {
                vec!["Improve compliance score by completing outstanding requirements".to_string()]
            } else {
                vec![]
            },
        };
        
        checks.push(score_check);

        Ok(())
    }

    fn generate_recommendations(&self, checks: &[ComplianceCheck]) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        for check in checks {
            if !check.passed {
                match check.requirement_id.as_str() {
                    id if id.contains("KYC") => {
                        recommendations.push("Complete KYC verification to improve compliance status".to_string());
                    },
                    id if id.contains("AML") => {
                        recommendations.push("Complete AML screening for regulatory compliance".to_string());
                    },
                    id if id.contains("AI") => {
                        recommendations.push("Obtain accredited investor status for access to more investment opportunities".to_string());
                    },
                    id if id.contains("COOL") => {
                        recommendations.push("Consider diversifying investments to avoid cooling period restrictions".to_string());
                    },
                    _ => {
                        recommendations.push(format!("Address compliance requirement: {}", check.requirement_id));
                    },
                }
            }
        }
        
        recommendations.dedup();
        recommendations
    }

    fn generate_required_actions(&self, checks: &[ComplianceCheck]) -> Vec<String> {
        checks.iter()
            .filter(|check| !check.passed && matches!(check.severity, ComplianceSeverity::Critical | ComplianceSeverity::Error))
            .flat_map(|check| check.remediation_steps.clone())
            .collect()
    }

    fn estimate_completion_time(&self, checks: &[ComplianceCheck]) -> Option<Duration> {
        let failed_checks: Vec<_> = checks.iter()
            .filter(|check| !check.passed)
            .collect();

        if failed_checks.is_empty() {
            return None;
        }

        let mut total_days = 0i64;
        
        for check in failed_checks {
            let days = match check.requirement_id.as_str() {
                id if id.contains("KYC") => 3,
                id if id.contains("AML") => 5,
                id if id.contains("AI") => 7,
                id if id.contains("COOL") => 7,
                _ => 1,
            };
            total_days = total_days.max(days); // Take maximum, not sum (parallel processing)
        }

        Some(Duration::days(total_days))
    }

    pub async fn update_investor_profile(
        &mut self,
        investor_id: String,
        profile: InvestorProfile,
    ) -> Result<(), ComplianceError> {
        self.investor_profiles.insert(investor_id, profile);
        Ok(())
    }

    pub async fn get_investor_profile(&self, investor_id: &str) -> Option<&InvestorProfile> {
        self.investor_profiles.get(investor_id)
    }

    pub async fn get_supported_jurisdictions(&self) -> Vec<String> {
        self.jurisdiction_mappings.keys().cloned().collect()
    }

    pub async fn get_framework_requirements(&self, jurisdiction: &str) -> Option<&Vec<ComplianceRequirement>> {
        self.frameworks.get(jurisdiction)
    }
} 
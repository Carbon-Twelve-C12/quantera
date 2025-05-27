use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc, Duration};
use sha2::{Sha256, Digest};
use uuid::Uuid;
use tracing::{info, warn, error};

/// Security-enhanced compliance engine with comprehensive access control
/// and data protection measures for institutional-grade compliance management
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
    // Security fields
    pub data_hash: String, // For integrity verification
    pub access_level: AccessLevel,
    pub created_by: String,
    pub last_accessed: DateTime<Utc>,
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
pub enum AccessLevel {
    ReadOnly,
    Standard,
    Elevated,
    Administrative,
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
    pub check_timestamp: DateTime<Utc>,
    pub check_id: String,
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
    pub audit_trail_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AuditLogEntry {
    pub entry_id: String,
    pub timestamp: DateTime<Utc>,
    pub action: String,
    pub investor_id: String,
    pub performed_by: String,
    pub details: HashMap<String, String>,
    pub compliance_result: Option<bool>,
    pub risk_level: RiskRating,
}

#[derive(Debug)]
pub enum ComplianceError {
    InvestorNotFound,
    JurisdictionNotSupported,
    FrameworkNotSupported,
    VerificationFailed(String),
    InsufficientData,
    SystemError(String),
    AccessDenied,
    InvalidInput(String),
    DataIntegrityError,
    AuditLogError,
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
            ComplianceError::AccessDenied => write!(f, "Access denied"),
            ComplianceError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            ComplianceError::DataIntegrityError => write!(f, "Data integrity error"),
            ComplianceError::AuditLogError => write!(f, "Audit log error"),
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
    audit_log: Vec<AuditLogEntry>,
    encryption_key: String, // In production, this would be properly managed
    access_control: HashMap<String, AccessLevel>, // User ID -> Access Level
}

impl EnhancedComplianceEngine {
    pub fn new() -> Self {
        let mut engine = Self {
            frameworks: HashMap::new(),
            investor_profiles: HashMap::new(),
            jurisdiction_mappings: HashMap::new(),
            asset_type_requirements: HashMap::new(),
            sanctions_lists: HashMap::new(),
            audit_log: Vec::new(),
            encryption_key: "secure_key_placeholder".to_string(), // Would be from secure key management
            access_control: HashMap::new(),
        };
        
        engine.initialize_frameworks();
        engine.initialize_jurisdiction_mappings();
        engine.initialize_asset_type_requirements();
        engine.initialize_sanctions_lists();
        
        engine
    }

    /// Validate input parameters for security
    fn validate_inputs(
        &self,
        investor_id: &str,
        asset_type: &str,
        investment_amount: u128,
        jurisdiction: &str,
    ) -> Result<(), ComplianceError> {
        // Validate investor ID format
        if investor_id.is_empty() || investor_id.len() > 100 {
            return Err(ComplianceError::InvalidInput("Invalid investor ID format".to_string()));
        }

        // Validate asset type
        if asset_type.is_empty() || asset_type.len() > 50 {
            return Err(ComplianceError::InvalidInput("Invalid asset type".to_string()));
        }

        // Validate investment amount
        if investment_amount == 0 || investment_amount > u128::MAX / 2 {
            return Err(ComplianceError::InvalidInput("Invalid investment amount".to_string()));
        }

        // Validate jurisdiction
        if jurisdiction.is_empty() || jurisdiction.len() > 10 {
            return Err(ComplianceError::InvalidInput("Invalid jurisdiction format".to_string()));
        }

        Ok(())
    }

    /// Check access permissions
    fn check_access(&self, user_id: &str, required_level: AccessLevel) -> Result<(), ComplianceError> {
        let user_level = self.access_control.get(user_id)
            .ok_or(ComplianceError::AccessDenied)?;

        let has_access = match required_level {
            AccessLevel::ReadOnly => true,
            AccessLevel::Standard => matches!(user_level, AccessLevel::Standard | AccessLevel::Elevated | AccessLevel::Administrative),
            AccessLevel::Elevated => matches!(user_level, AccessLevel::Elevated | AccessLevel::Administrative),
            AccessLevel::Administrative => matches!(user_level, AccessLevel::Administrative),
        };

        if !has_access {
            return Err(ComplianceError::AccessDenied);
        }

        Ok(())
    }

    /// Generate data hash for integrity verification
    fn generate_data_hash(&self, data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        hasher.update(self.encryption_key.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Verify data integrity
    fn verify_data_integrity(&self, profile: &InvestorProfile) -> Result<(), ComplianceError> {
        let profile_data = format!("{}{}{:?}{:?}", 
            profile.investor_id, 
            profile.jurisdiction, 
            profile.investor_type, 
            profile.last_updated
        );
        let expected_hash = self.generate_data_hash(&profile_data);
        
        if profile.data_hash != expected_hash {
            error!("Data integrity check failed for investor: {}", profile.investor_id);
            return Err(ComplianceError::DataIntegrityError);
        }

        Ok(())
    }

    /// Log audit entry
    fn log_audit_entry(
        &mut self,
        action: String,
        investor_id: String,
        performed_by: String,
        details: HashMap<String, String>,
        compliance_result: Option<bool>,
        risk_level: RiskRating,
    ) -> Result<String, ComplianceError> {
        let entry_id = Uuid::new_v4().to_string();
        
        let entry = AuditLogEntry {
            entry_id: entry_id.clone(),
            timestamp: Utc::now(),
            action,
            investor_id,
            performed_by,
            details,
            compliance_result,
            risk_level,
        };

        self.audit_log.push(entry);
        
        // In production, this would be written to a secure audit database
        info!("Audit entry created: {}", entry_id);
        
        Ok(entry_id)
    }

    pub async fn comprehensive_compliance_check(
        &mut self,
        investor_id: &str,
        asset_type: &str,
        investment_amount: u128,
        jurisdiction: &str,
        performed_by: &str,
    ) -> Result<ComplianceResult, ComplianceError> {
        // Check access permissions
        self.check_access(performed_by, AccessLevel::Standard)?;

        // Validate inputs
        self.validate_inputs(investor_id, asset_type, investment_amount, jurisdiction)?;

        // Get investor profile
        let profile = self.investor_profiles.get(investor_id)
            .ok_or(ComplianceError::InvestorNotFound)?;

        // Verify data integrity
        self.verify_data_integrity(profile)?;

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

        // Create audit log entry
        let mut audit_details = HashMap::new();
        audit_details.insert("asset_type".to_string(), asset_type.to_string());
        audit_details.insert("investment_amount".to_string(), investment_amount.to_string());
        audit_details.insert("jurisdiction".to_string(), jurisdiction.to_string());
        audit_details.insert("overall_score".to_string(), overall_score.to_string());

        let audit_trail_id = self.log_audit_entry(
            "comprehensive_compliance_check".to_string(),
            investor_id.to_string(),
            performed_by.to_string(),
            audit_details,
            Some(is_compliant),
            profile.risk_rating.clone(),
        )?;

        Ok(ComplianceResult {
            is_compliant,
            overall_score,
            checks: compliance_checks,
            recommendations,
            required_actions,
            estimated_completion_time,
            audit_trail_id,
        })
    }

    async fn perform_compliance_check(
        &self,
        profile: &InvestorProfile,
        requirement: &ComplianceRequirement,
        asset_type: &str,
        investment_amount: u128,
    ) -> Result<ComplianceCheck, ComplianceError> {
        let check_id = Uuid::new_v4().to_string();
        let check_timestamp = Utc::now();

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
                    check_timestamp,
                    check_id,
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
                    check_timestamp,
                    check_id,
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
                    check_timestamp,
                    check_id,
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
                        message: format!("Investment limit check: {} / {} remaining", 
                                       remaining_capacity, limit.maximum_amount),
                        severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                        remediation_steps: if !passed {
                            vec!["Reduce investment amount or wait for limit reset".to_string()]
                        } else {
                            vec![]
                        },
                        check_timestamp,
                        check_id,
                    })
                } else {
                    Ok(ComplianceCheck {
                        requirement_id: requirement.requirement_id.clone(),
                        framework: requirement.framework.clone(),
                        passed: false,
                        message: "No investment limit configured for asset type".to_string(),
                        severity: ComplianceSeverity::Warning,
                        remediation_steps: vec!["Configure investment limits".to_string()],
                        check_timestamp,
                        check_id,
                    })
                }
            },

            VerificationMethod::CoolingPeriodCheck => {
                if let Some(cooling_period_days) = requirement.cooling_period_days {
                    if let Some(last_investment) = profile.cooling_periods.get(asset_type) {
                        let cooling_period = Duration::days(cooling_period_days as i64);
                        let time_since_last = Utc::now().signed_duration_since(*last_investment);
                        let passed = time_since_last >= cooling_period;
                        
                        Ok(ComplianceCheck {
                            requirement_id: requirement.requirement_id.clone(),
                            framework: requirement.framework.clone(),
                            passed,
                            message: format!("Cooling period check: {} days since last investment", 
                                           time_since_last.num_days()),
                            severity: if !passed { ComplianceSeverity::Warning } else { ComplianceSeverity::Info },
                            remediation_steps: if !passed {
                                vec![format!("Wait {} more days before next investment", 
                                           (cooling_period - time_since_last).num_days())]
                            } else {
                                vec![]
                            },
                            check_timestamp,
                            check_id,
                        })
                    } else {
                        // First investment, no cooling period required
                        Ok(ComplianceCheck {
                            requirement_id: requirement.requirement_id.clone(),
                            framework: requirement.framework.clone(),
                            passed: true,
                            message: "First investment in asset type".to_string(),
                            severity: ComplianceSeverity::Info,
                            remediation_steps: vec![],
                            check_timestamp,
                            check_id,
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
                        check_timestamp,
                        check_id,
                    })
                }
            },

            VerificationMethod::SanctionsScreening => {
                let passed = matches!(profile.sanctions_status, SanctionsStatus::Clear);
                let severity = if !passed {
                    ComplianceSeverity::Critical
                } else {
                    ComplianceSeverity::Info
                };

                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Sanctions screening status: {:?}", profile.sanctions_status),
                    severity,
                    remediation_steps: if !passed {
                        vec!["Complete sanctions screening process".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::QualifiedInvestorStatus => {
                let passed = matches!(profile.investor_type, 
                    InvestorType::QualifiedInvestor | 
                    InvestorType::Institutional | 
                    InvestorType::EligibleCounterparty
                );
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Qualified investor status: {:?}", profile.investor_type),
                    severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Obtain qualified investor certification".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::ProfessionalInvestorVerification => {
                let passed = matches!(profile.investor_type, 
                    InvestorType::Professional | 
                    InvestorType::Institutional | 
                    InvestorType::EligibleCounterparty
                );
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Professional investor status: {:?}", profile.investor_type),
                    severity: if !passed { ComplianceSeverity::Warning } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Obtain professional investor classification".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::InstitutionalInvestorCheck => {
                let passed = matches!(profile.investor_type, InvestorType::Institutional);
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Institutional investor status: {:?}", profile.investor_type),
                    severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Provide institutional investor documentation".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::TaxResidencyVerification => {
                let passed = !profile.tax_residency.is_empty();
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Tax residency verification: {} jurisdictions", profile.tax_residency.len()),
                    severity: if !passed { ComplianceSeverity::Warning } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Provide tax residency documentation".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::SuitabilityAssessment => {
                // Check if investor has appropriate risk rating for the asset
                let passed = match profile.risk_rating {
                    RiskRating::Prohibited => false,
                    RiskRating::High => asset_type != "high_risk",
                    RiskRating::Medium => !["high_risk", "derivatives"].contains(&asset_type),
                    RiskRating::Low => ["securities", "real_estate", "commodities"].contains(&asset_type),
                };
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Suitability assessment: {:?} risk rating for {} asset", 
                                   profile.risk_rating, asset_type),
                    severity: if !passed { ComplianceSeverity::Error } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Complete suitability assessment or choose appropriate asset type".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },

            VerificationMethod::GeographicRestriction => {
                // Check if jurisdiction allows investment in this asset type
                let restricted_jurisdictions = vec!["CN", "KP", "IR"]; // Example restricted jurisdictions
                let passed = !restricted_jurisdictions.contains(&profile.jurisdiction.as_str());
                
                Ok(ComplianceCheck {
                    requirement_id: requirement.requirement_id.clone(),
                    framework: requirement.framework.clone(),
                    passed,
                    message: format!("Geographic restriction check for jurisdiction: {}", profile.jurisdiction),
                    severity: if !passed { ComplianceSeverity::Critical } else { ComplianceSeverity::Info },
                    remediation_steps: if !passed {
                        vec!["Investment not permitted from this jurisdiction".to_string()]
                    } else {
                        vec![]
                    },
                    check_timestamp,
                    check_id,
                })
            },
        }
    }

    async fn perform_risk_based_checks(
        &self,
        profile: &InvestorProfile,
        asset_type: &str,
        investment_amount: u128,
        checks: &mut Vec<ComplianceCheck>,
    ) -> Result<(), ComplianceError> {
        let check_timestamp = Utc::now();

        // High-value transaction check
        if investment_amount > 1_000_000_000_000_000_000_000 { // > 1000 ETH equivalent
            checks.push(ComplianceCheck {
                requirement_id: "RISK_HIGH_VALUE".to_string(),
                framework: RegulatoryFramework::MiCA, // Default framework
                passed: matches!(profile.investor_type, InvestorType::Institutional | InvestorType::AccreditedInvestor),
                message: "High-value transaction requires institutional or accredited investor status".to_string(),
                severity: ComplianceSeverity::Warning,
                remediation_steps: vec!["Verify institutional or accredited investor status".to_string()],
                check_timestamp,
                check_id: Uuid::new_v4().to_string(),
            });
        }

        // Compliance score check
        if profile.compliance_score < 70 {
            checks.push(ComplianceCheck {
                requirement_id: "RISK_LOW_SCORE".to_string(),
                framework: RegulatoryFramework::MiCA,
                passed: false,
                message: format!("Low compliance score: {}/100", profile.compliance_score),
                severity: ComplianceSeverity::Warning,
                remediation_steps: vec!["Improve compliance score through additional verification".to_string()],
                check_timestamp,
                check_id: Uuid::new_v4().to_string(),
            });
        }

        // Profile freshness check
        let profile_age = Utc::now().signed_duration_since(profile.last_updated);
        if profile_age > Duration::days(90) {
            checks.push(ComplianceCheck {
                requirement_id: "RISK_STALE_PROFILE".to_string(),
                framework: RegulatoryFramework::MiCA,
                passed: false,
                message: format!("Profile last updated {} days ago", profile_age.num_days()),
                severity: ComplianceSeverity::Warning,
                remediation_steps: vec!["Update investor profile information".to_string()],
                check_timestamp,
                check_id: Uuid::new_v4().to_string(),
            });
        }

        Ok(())
    }

    fn generate_recommendations(&self, checks: &[ComplianceCheck]) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        let failed_checks = checks.iter().filter(|check| !check.passed).count();
        let critical_failures = checks.iter().filter(|check| 
            !check.passed && matches!(check.severity, ComplianceSeverity::Critical)
        ).count();

        if critical_failures > 0 {
            recommendations.push("Address critical compliance failures immediately".to_string());
        }

        if failed_checks > 3 {
            recommendations.push("Consider comprehensive compliance review".to_string());
        }

        if checks.iter().any(|check| check.requirement_id.contains("KYC") && !check.passed) {
            recommendations.push("Complete KYC verification to improve compliance standing".to_string());
        }

        if checks.iter().any(|check| check.requirement_id.contains("AML") && !check.passed) {
            recommendations.push("Complete AML screening to ensure regulatory compliance".to_string());
        }

        recommendations
    }

    fn generate_required_actions(&self, checks: &[ComplianceCheck]) -> Vec<String> {
        checks.iter()
            .filter(|check| !check.passed && matches!(check.severity, ComplianceSeverity::Critical | ComplianceSeverity::Error))
            .flat_map(|check| check.remediation_steps.iter())
            .cloned()
            .collect()
    }

    fn estimate_completion_time(&self, checks: &[ComplianceCheck]) -> Option<Duration> {
        let failed_checks = checks.iter().filter(|check| !check.passed).count();
        
        if failed_checks == 0 {
            return None;
        }

        // Estimate based on typical completion times
        let estimated_days = match failed_checks {
            1..=2 => 1,
            3..=5 => 3,
            6..=10 => 7,
            _ => 14,
        };

        Some(Duration::days(estimated_days))
    }

    pub async fn update_investor_profile(
        &mut self,
        investor_id: String,
        mut profile: InvestorProfile,
        performed_by: &str,
    ) -> Result<(), ComplianceError> {
        // Check access permissions
        self.check_access(performed_by, AccessLevel::Standard)?;

        // Validate inputs
        if investor_id.is_empty() || investor_id.len() > 100 {
            return Err(ComplianceError::InvalidInput("Invalid investor ID".to_string()));
        }

        // Generate data hash for integrity
        let profile_data = format!("{}{}{:?}{:?}", 
            profile.investor_id, 
            profile.jurisdiction, 
            profile.investor_type, 
            profile.last_updated
        );
        profile.data_hash = self.generate_data_hash(&profile_data);
        profile.last_updated = Utc::now();
        profile.last_accessed = Utc::now();

        // Store profile
        self.investor_profiles.insert(investor_id.clone(), profile);

        // Create audit log entry
        let mut audit_details = HashMap::new();
        audit_details.insert("action".to_string(), "profile_update".to_string());
        
        self.log_audit_entry(
            "update_investor_profile".to_string(),
            investor_id,
            performed_by.to_string(),
            audit_details,
            None,
            RiskRating::Low,
        )?;

        Ok(())
    }

    pub async fn get_investor_profile(
        &mut self,
        investor_id: &str,
        requested_by: &str,
    ) -> Result<Option<&InvestorProfile>, ComplianceError> {
        // Check access permissions
        self.check_access(requested_by, AccessLevel::ReadOnly)?;

        // Validate input
        if investor_id.is_empty() {
            return Err(ComplianceError::InvalidInput("Empty investor ID".to_string()));
        }

        if let Some(profile) = self.investor_profiles.get_mut(investor_id) {
            // Verify data integrity
            self.verify_data_integrity(profile)?;
            
            // Update last accessed time
            profile.last_accessed = Utc::now();
            
            Ok(Some(profile))
        } else {
            Ok(None)
        }
    }

    pub async fn get_supported_jurisdictions(&self) -> Vec<String> {
        self.jurisdiction_mappings.keys().cloned().collect()
    }

    pub async fn get_framework_requirements(
        &self, 
        jurisdiction: &str,
        requested_by: &str,
    ) -> Result<Option<&Vec<ComplianceRequirement>>, ComplianceError> {
        // Check access permissions
        self.check_access(requested_by, AccessLevel::ReadOnly)?;

        Ok(self.frameworks.get(jurisdiction))
    }

    pub fn grant_access(&mut self, user_id: String, access_level: AccessLevel) {
        self.access_control.insert(user_id, access_level);
    }

    pub fn revoke_access(&mut self, user_id: &str) {
        self.access_control.remove(user_id);
    }

    pub fn get_audit_log(&self, requested_by: &str) -> Result<&Vec<AuditLogEntry>, ComplianceError> {
        self.check_access(requested_by, AccessLevel::Elevated)?;
        Ok(&self.audit_log)
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

    fn initialize_sanctions_lists(&mut self) {
        // Initialize with example sanctioned entities (in production, this would be from official sources)
        self.sanctions_lists.insert("GLOBAL".to_string(), vec![
            "sanctioned_entity_1".to_string(),
            "sanctioned_entity_2".to_string(),
        ]);
        
        self.sanctions_lists.insert("US".to_string(), vec![
            "ofac_sanctioned_entity".to_string(),
        ]);
        
        self.sanctions_lists.insert("EU".to_string(), vec![
            "eu_sanctioned_entity".to_string(),
        ]);
    }
} 
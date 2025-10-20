// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITreasuryRegistry.sol";

/**
 * @title IComplianceModule
 * @dev Interface for the compliance module ensuring regulatory compliance for treasury token transfers
 */
interface IComplianceModule {
    /**
     * @dev Verification status enum
     */
    enum VerificationStatus {
        NONE,
        BASIC,
        VERIFIED,
        INSTITUTIONAL
    }
    
    /**
     * @dev Institutional staker information
     */
    struct InstitutionalInfo {
        uint256 stakeAmount;
        uint256 validatorCount;
        bytes blsPublicKey;
        bool active;
    }
    
    /**
     * @dev Emitted when investor status changes
     * @param investor The address of the investor
     * @param status The new verification status
     */
    event InvestorStatusChanged(address indexed investor, VerificationStatus status);

    /**
     * @dev Emitted when investment limits change
     * @param status The verification status
     * @param newLimit The new investment limit
     */
    event InvestmentLimitChanged(VerificationStatus status, uint256 newLimit);

    /**
     * @dev Emitted when institutional staker is registered
     * @param institution The address of the institution
     * @param stakeAmount The stake amount
     */
    event InstitutionalStakerRegistered(address indexed institution, uint256 stakeAmount);

    /**
     * @dev Emitted when institutional stake is updated
     * @param institution The address of the institution
     * @param newStakeAmount The new stake amount
     */
    event InstitutionalStakeUpdated(address indexed institution, uint256 newStakeAmount);
    
    /**
     * @dev Check if transfer complies with regulations
     * @param from The address sending tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens
     * @param treasuryId The unique identifier for the treasury
     * @return Whether the transfer complies, and any additional data
     */
    function checkCompliance(
        address from,
        address to,
        uint256 amount,
        bytes32 treasuryId
    ) external view returns (bool, bytes memory);

    /**
     * @dev Set investor verification status
     * @param investor The address of the investor
     * @param status The new verification status
     * @param jurisdiction The jurisdiction code (ISO 3166-1 alpha-2)
     */
    function setInvestorStatus(
        address investor,
        VerificationStatus status,
        bytes2 jurisdiction
    ) external;

    /**
     * @dev Set investment limit for verification level
     * @param status The verification status
     * @param limit The investment limit
     */
    function setInvestmentLimit(
        VerificationStatus status,
        uint256 limit
    ) external;

    /**
     * @dev Register institutional staker
     * @param institution The address of the institution
     * @param stakeAmount The stake amount
     * @param blsPublicKey The BLS public key
     * @return Success status
     */
    function registerInstitutionalStaker(
        address institution,
        uint256 stakeAmount,
        bytes calldata blsPublicKey
    ) external returns (bool);

    /**
     * @dev Update institutional stake
     * @param newStakeAmount The new stake amount
     * @return Success status
     */
    function updateInstitutionalStake(
        uint256 newStakeAmount
    ) external returns (bool);

    /**
     * @dev Get investor details
     * @param investor The address of the investor
     * @return The verification status, jurisdiction, and investment limit
     */
    function getInvestorDetails(address investor) 
        external 
        view 
        returns (VerificationStatus, bytes2, uint256);

    /**
     * @dev Get institutional staker details
     * @param institution The address of the institution
     * @return The institutional information
     */
    function getInstitutionalDetails(address institution)
        external
        view
        returns (InstitutionalInfo memory);
    
    // ============ Extended Interface for AutomatedComplianceEngine ============
    
    /**
     * @dev Check if a transaction can proceed based on compliance rules
     * @param investor The address of the investor
     * @param amount The transaction amount
     * @return canProceed Whether the transaction can proceed
     */
    function checkTransactionCompliance(address investor, uint256 amount) 
        external 
        view 
        returns (bool canProceed);
    
    /**
     * @dev Get investor's current compliance status
     * @param investor Address to check
     * @return isCompliant Whether investor is currently compliant
     * @return kycValid Whether KYC is valid
     * @return jurisdiction Investor's jurisdiction
     */
    function getComplianceStatus(address investor) 
        external 
        view 
        returns (
            bool isCompliant,
            bool kycValid,
            string memory jurisdiction
        );
} 
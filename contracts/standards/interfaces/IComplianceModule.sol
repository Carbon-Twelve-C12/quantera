// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComplianceModule
 * @dev Interface for compliance modules that enforce regulatory requirements
 * Supports multiple regulatory frameworks and jurisdictions
 */
interface IComplianceModule {
    
    /**
     * @dev Checks if a transfer is compliant with all applicable rules
     * @param from The address sending tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens to transfer
     * @return Whether the transfer is compliant
     */
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool);
    
    /**
     * @dev Returns the reason why a transfer would be blocked
     * @param from The address sending tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens to transfer
     * @return The reason for blocking the transfer
     */
    function getTransferBlockReason(
        address from,
        address to,
        uint256 amount
    ) external view returns (string memory);
    
    /**
     * @dev Checks if an address is compliant for receiving tokens
     * @param account The address to check
     * @return Whether the address is compliant
     */
    function isCompliantAddress(address account) external view returns (bool);
    
    /**
     * @dev Checks if an address meets accredited investor requirements
     * @param account The address to check
     * @return Whether the address is an accredited investor
     */
    function isAccreditedInvestor(address account) external view returns (bool);
    
    /**
     * @dev Checks if an address is in a supported jurisdiction
     * @param account The address to check
     * @return Whether the address is in a supported jurisdiction
     */
    function isSupportedJurisdiction(address account) external view returns (bool);
    
    /**
     * @dev Gets the maximum investment amount for an address
     * @param account The address to check
     * @return The maximum investment amount
     */
    function getMaxInvestmentAmount(address account) external view returns (uint256);
    
    /**
     * @dev Gets the current investment amount for an address
     * @param account The address to check
     * @return The current investment amount
     */
    function getCurrentInvestmentAmount(address account) external view returns (uint256);
    
    /**
     * @dev Checks if a transfer would exceed investment limits
     * @param to The address receiving tokens
     * @param amount The amount of tokens to transfer
     * @return Whether the transfer would exceed limits
     */
    function wouldExceedInvestmentLimit(
        address to,
        uint256 amount
    ) external view returns (bool);
    
    /**
     * @dev Updates compliance rules for a specific regulatory framework
     * @param framework The regulatory framework (e.g., "SEC", "MiCA", "MAS")
     * @param rules The encoded compliance rules
     */
    function updateComplianceRules(
        string memory framework,
        bytes memory rules
    ) external;
    
    /**
     * @dev Adds a supported jurisdiction
     * @param jurisdiction The jurisdiction code (e.g., "US", "EU", "SG")
     */
    function addSupportedJurisdiction(string memory jurisdiction) external;
    
    /**
     * @dev Removes a supported jurisdiction
     * @param jurisdiction The jurisdiction code to remove
     */
    function removeSupportedJurisdiction(string memory jurisdiction) external;
    
    /**
     * @dev Sets the minimum investment amount
     * @param amount The minimum investment amount
     */
    function setMinimumInvestment(uint256 amount) external;
    
    /**
     * @dev Sets the maximum number of investors
     * @param maxInvestors The maximum number of investors
     */
    function setMaximumInvestors(uint256 maxInvestors) external;
    
    /**
     * @dev Enables or disables a specific compliance rule
     * @param ruleId The ID of the rule
     * @param enabled Whether the rule should be enabled
     */
    function setRuleEnabled(bytes32 ruleId, bool enabled) external;
    
    /**
     * @dev Gets the list of active compliance rules
     * @return Array of active rule IDs
     */
    function getActiveRules() external view returns (bytes32[] memory);
    
    /**
     * @dev Checks if a specific rule is enabled
     * @param ruleId The ID of the rule
     * @return Whether the rule is enabled
     */
    function isRuleEnabled(bytes32 ruleId) external view returns (bool);
    
    // Events
    event ComplianceRulesUpdated(string indexed framework, bytes rules);
    event JurisdictionAdded(string indexed jurisdiction);
    event JurisdictionRemoved(string indexed jurisdiction);
    event MinimumInvestmentSet(uint256 amount);
    event MaximumInvestorsSet(uint256 maxInvestors);
    event RuleEnabledChanged(bytes32 indexed ruleId, bool enabled);
    event TransferApproved(address indexed from, address indexed to, uint256 amount);
    event TransferRejected(address indexed from, address indexed to, uint256 amount, string reason);
} 
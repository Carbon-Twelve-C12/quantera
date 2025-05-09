// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title ISmartAccountTemplates
 * @dev Interface for the SmartAccountTemplates contract
 */
interface ISmartAccountTemplates {
    /**
     * @dev Enum for the types of smart account templates
     */
    enum TemplateType {
        YIELD_REINVESTMENT,
        AUTOMATED_TRADING,
        PORTFOLIO_REBALANCING,
        CONDITIONAL_TRANSFER,
        DELEGATION,
        MULTI_SIGNATURE,
        TIMELOCKED_TRANSFER,
        DOLLAR_COST_AVERAGING,
        CUSTOM
    }

    /**
     * @dev Struct for execution parameters
     */
    struct ExecutionParams {
        uint256 gasLimit;
        uint256 gasPrice;
        uint256 value;
        bool delegated;
        address delegate;
        uint64 validUntil;
        uint256 nonce;
    }

    /**
     * @dev Struct for account templates
     */
    struct AccountTemplate {
        bytes32 templateId;
        string name;
        string description;
        TemplateType templateType;
        address creator;
        bytes code;
        bool isPublic;
        bool isVerified;
        uint64 creationDate;
        uint64 verificationDate;
        string parametersSchema;
        string version;
        uint256 usageCount;
    }

    /**
     * @dev Struct for smart accounts
     */
    struct SmartAccount {
        bytes32 accountId;
        address owner;
        bytes32 templateId;
        bytes code;
        bytes32 codeHash;
        uint64 creationDate;
        uint64 lastExecution;
        uint256 executionCount;
        mapping(string => string) parameters;
        bool isActive;
        address[] delegates;
    }

    /**
     * @dev Struct for execution results
     */
    struct ExecutionResult {
        bool success;
        bytes resultData;
        string[] logs;
        uint256 gasUsed;
        string errorMessage;
    }

    /**
     * @dev Struct for smart account operations
     */
    struct SmartAccountOperation {
        bytes32 operationId;
        bytes32 accountId;
        string operationType;
        uint64 timestamp;
        bytes data;
        ExecutionResult result;
        address executedBy;
    }

    /**
     * @dev Struct for verification results
     */
    struct VerificationResult {
        bool isVerified;
        uint8 vulnerabilityRisk; // 0-100 score
        string[] securityNotes;
        uint8 performanceRisk; // 0-100 score
        address verifier;
        uint64 verificationTimestamp;
    }

    /**
     * @dev Create a new account template
     * @param name Template name
     * @param description Template description
     * @param templateType Type of template
     * @param code Code for the template
     * @param isPublic Whether the template is public
     * @param parametersSchema JSON schema for parameters
     * @param version Version string
     * @return templateId ID of the created template
     */
    function createTemplate(
        string calldata name,
        string calldata description,
        TemplateType templateType,
        bytes calldata code,
        bool isPublic,
        string calldata parametersSchema,
        string calldata version
    ) external returns (bytes32);

    /**
     * @dev Update an existing template
     * @param templateId Template ID to update
     * @param name Updated name
     * @param description Updated description
     * @param code Updated code
     * @param isPublic Updated visibility
     * @param parametersSchema Updated parameters schema
     * @param version Updated version
     * @return success Whether the update was successful
     */
    function updateTemplate(
        bytes32 templateId,
        string calldata name,
        string calldata description,
        bytes calldata code,
        bool isPublic,
        string calldata parametersSchema,
        string calldata version
    ) external returns (bool);

    /**
     * @dev Get template details
     * @param templateId Template ID
     * @return Template details
     */
    function getTemplate(bytes32 templateId) external view returns (AccountTemplate memory);

    /**
     * @dev Verify a template
     * @param templateId Template ID to verify
     * @param vulnerabilityRisk Risk score for vulnerabilities (0-100)
     * @param securityNotes Notes about security concerns
     * @param performanceRisk Risk score for performance issues (0-100)
     * @return success Whether the verification was successful
     */
    function verifyTemplate(
        bytes32 templateId,
        uint8 vulnerabilityRisk,
        string[] calldata securityNotes,
        uint8 performanceRisk
    ) external returns (bool);

    /**
     * @dev Get verification result for a template
     * @param templateId Template ID
     * @return Verification result
     */
    function getVerificationResult(bytes32 templateId) external view returns (VerificationResult memory);

    /**
     * @dev Deploy a smart account from a template
     * @param templateId Template ID to use
     * @param parameters Parameters for initialization
     * @return accountId ID of the deployed account
     */
    function deployAccount(
        bytes32 templateId,
        mapping(string => string) calldata parameters
    ) external returns (bytes32);

    /**
     * @dev Deploy a custom smart account
     * @param code Custom code for the account
     * @param parameters Parameters for initialization
     * @return accountId ID of the deployed account
     */
    function deployCustomAccount(
        bytes calldata code,
        mapping(string => string) calldata parameters
    ) external returns (bytes32);

    /**
     * @dev Update an existing smart account
     * @param accountId Account ID to update
     * @param code Updated code
     * @param parameters Updated parameters
     * @param isActive Updated active status
     * @return success Whether the update was successful
     */
    function updateAccount(
        bytes32 accountId,
        bytes calldata code,
        mapping(string => string) calldata parameters,
        bool isActive
    ) external returns (bool);

    /**
     * @dev Get smart account details
     * @param accountId Account ID
     * @return Account details
     */
    function getAccount(bytes32 accountId) external view returns (SmartAccount memory);

    /**
     * @dev Execute smart account code
     * @param accountId Account ID to execute
     * @param data Execution data
     * @param executionParams Execution parameters
     * @return result Execution result
     */
    function executeAccount(
        bytes32 accountId,
        bytes calldata data,
        ExecutionParams calldata executionParams
    ) external returns (ExecutionResult memory);

    /**
     * @dev Simulate execution without state changes
     * @param accountId Account ID to simulate
     * @param data Execution data
     * @return result Execution result
     */
    function simulateExecution(
        bytes32 accountId,
        bytes calldata data
    ) external view returns (ExecutionResult memory);

    /**
     * @dev Add a delegate to a smart account
     * @param accountId Account ID
     * @param delegate Address to add as delegate
     * @return success Whether the operation was successful
     */
    function addDelegate(
        bytes32 accountId,
        address delegate
    ) external returns (bool);

    /**
     * @dev Remove a delegate from a smart account
     * @param accountId Account ID
     * @param delegate Address to remove as delegate
     * @return success Whether the operation was successful
     */
    function removeDelegate(
        bytes32 accountId,
        address delegate
    ) external returns (bool);

    /**
     * @dev Get all delegates for a smart account
     * @param accountId Account ID
     * @return Array of delegate addresses
     */
    function getDelegates(bytes32 accountId) external view returns (address[] memory);

    /**
     * @dev Check if an address is a delegate for a smart account
     * @param accountId Account ID
     * @param delegate Address to check
     * @return isDelegate Whether the address is a delegate
     */
    function isDelegate(
        bytes32 accountId,
        address delegate
    ) external view returns (bool);

    /**
     * @dev Get operation history for a smart account
     * @param accountId Account ID
     * @return Array of operations
     */
    function getOperationHistory(
        bytes32 accountId
    ) external view returns (SmartAccountOperation[] memory);

    /**
     * @dev Get accounts owned by a user
     * @param owner Owner address
     * @return Array of account IDs
     */
    function getAccountsByOwner(address owner) external view returns (bytes32[] memory);

    /**
     * @dev Get accounts where an address is a delegate
     * @param delegate Delegate address
     * @return Array of account IDs
     */
    function getAccountsByDelegate(address delegate) external view returns (bytes32[] memory);

    /**
     * @dev Get templates by type
     * @param templateType Type of template
     * @return Array of template IDs
     */
    function getTemplatesByType(TemplateType templateType) external view returns (bytes32[] memory);

    /**
     * @dev Get templates created by a user
     * @param creator Creator address
     * @return Array of template IDs
     */
    function getTemplatesByCreator(address creator) external view returns (bytes32[] memory);

    /**
     * @dev Get all public templates
     * @return Array of template IDs
     */
    function getPublicTemplates() external view returns (bytes32[] memory);

    /**
     * @dev Get all verified templates
     * @return Array of template IDs
     */
    function getVerifiedTemplates() external view returns (bytes32[] memory);

    /**
     * @dev Generate a nonce for account execution
     * @param accountId Account ID
     * @return nonce Generated nonce
     */
    function generateNonce(bytes32 accountId) external returns (uint256);

    /**
     * @dev Verify signature for delegated execution
     * @param accountId Account ID
     * @param data Execution data
     * @param nonce Nonce used
     * @param signature Signature to verify
     * @return isValid Whether the signature is valid
     */
    function verifySignature(
        bytes32 accountId,
        bytes calldata data,
        uint256 nonce,
        bytes calldata signature
    ) external view returns (bool);

    /**
     * @dev Create a yield reinvestment template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param autoCompoundFrequency Frequency of auto-compounding (in seconds)
     * @param minReinvestAmount Minimum amount to reinvest
     * @param reinvestmentTargets Target assets for reinvestment
     * @param reinvestmentAllocations Allocation percentages for reinvestment targets
     * @return templateId ID of the created template
     */
    function createYieldReinvestmentTemplate(
        string calldata name,
        string calldata description,
        bool isPublic,
        uint64 autoCompoundFrequency,
        uint256 minReinvestAmount,
        address[] calldata reinvestmentTargets,
        uint8[] calldata reinvestmentAllocations
    ) external returns (bytes32);

    /**
     * @dev Create an automated trading template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param targetTokens Target tokens for trading
     * @param priceThresholds Price thresholds for triggers
     * @param isPriceAbove Whether to trigger when price is above threshold
     * @param orderSizes Order sizes for each target
     * @param expirationStrategy Strategy for order expiration
     * @return templateId ID of the created template
     */
    function createAutomatedTradingTemplate(
        string calldata name,
        string calldata description,
        bool isPublic,
        address[] calldata targetTokens,
        uint256[] calldata priceThresholds,
        bool[] calldata isPriceAbove,
        uint256[] calldata orderSizes,
        uint8 expirationStrategy
    ) external returns (bytes32);

    /**
     * @dev Create a portfolio rebalancing template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param targetAssets Target assets for rebalancing
     * @param targetAllocations Target allocation percentages
     * @param rebalanceThreshold Threshold percentage to trigger rebalance
     * @param rebalanceFrequency Frequency of rebalance checks (in seconds)
     * @param maxSlippage Maximum slippage percentage allowed
     * @return templateId ID of the created template
     */
    function createPortfolioRebalancingTemplate(
        string calldata name,
        string calldata description,
        bool isPublic,
        address[] calldata targetAssets,
        uint8[] calldata targetAllocations,
        uint8 rebalanceThreshold,
        uint64 rebalanceFrequency,
        uint8 maxSlippage
    ) external returns (bytes32);

    /**
     * @dev Create a dollar cost averaging template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param sourceAsset Source asset for investment
     * @param targetAsset Target asset for investment
     * @param investmentAmount Amount to invest each time
     * @param frequency Frequency of investments (in seconds)
     * @param duration Total duration of DCA strategy (in seconds)
     * @param maxSlippage Maximum slippage percentage allowed
     * @return templateId ID of the created template
     */
    function createDCATemplate(
        string calldata name,
        string calldata description,
        bool isPublic,
        address sourceAsset,
        address targetAsset,
        uint256 investmentAmount,
        uint64 frequency,
        uint64 duration,
        uint8 maxSlippage
    ) external returns (bytes32);

    /**
     * @dev Create a multi-signature template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param signers Signer addresses
     * @param threshold Number of signatures required
     * @param executionTimelock Timelock period before execution (in seconds)
     * @return templateId ID of the created template
     */
    function createMultiSigTemplate(
        string calldata name,
        string calldata description,
        bool isPublic,
        address[] calldata signers,
        uint8 threshold,
        uint64 executionTimelock
    ) external returns (bytes32);
} 
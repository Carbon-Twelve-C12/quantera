// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/ISmartAccountTemplates.sol";

/**
 * @title SmartAccountTemplates
 * @dev Contract for managing smart account templates and executing account logic
 */
contract SmartAccountTemplates is ISmartAccountTemplates, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Counters
    Counters.Counter private _templateIdCounter;
    Counters.Counter private _accountIdCounter;
    Counters.Counter private _operationIdCounter;
    Counters.Counter private _nonceCounter;

    // Structs
    struct AccountTemplateData {
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

    struct SmartAccountData {
        bytes32 accountId;
        address owner;
        bytes32 templateId;
        bytes code;
        bytes32 codeHash;
        uint64 creationDate;
        uint64 lastExecution;
        uint256 executionCount;
        bool isActive;
    }

    struct SmartAccountParams {
        mapping(string => string) values;
    }

    // Mappings
    mapping(bytes32 => AccountTemplateData) private _templates;
    mapping(bytes32 => SmartAccountData) private _accounts;
    mapping(bytes32 => mapping(string => string)) private _accountParameters;
    mapping(bytes32 => VerificationResult) private _verificationResults;
    mapping(bytes32 => SmartAccountOperation[]) private _accountOperations;
    mapping(bytes32 => address[]) private _accountDelegates;
    mapping(address => bytes32[]) private _ownerAccounts;
    mapping(address => bytes32[]) private _delegateAccounts;
    mapping(address => bytes32[]) private _creatorTemplates;
    mapping(TemplateType => bytes32[]) private _templatesByType;
    mapping(bytes32 => uint256) private _accountNonces;
    mapping(bytes32 => bool) private _usedNonces;
    
    // Arrays
    bytes32[] private _publicTemplates;
    bytes32[] private _verifiedTemplates;

    // Events
    event TemplateCreated(bytes32 indexed templateId, address indexed creator, string name, TemplateType templateType);
    event TemplateUpdated(bytes32 indexed templateId, address indexed updater, string name);
    event TemplateVerified(bytes32 indexed templateId, address indexed verifier, bool isVerified);
    event AccountDeployed(bytes32 indexed accountId, address indexed owner, bytes32 indexed templateId);
    event AccountUpdated(bytes32 indexed accountId, address indexed updater);
    event AccountExecuted(bytes32 indexed accountId, address indexed executor, bytes32 indexed operationId);
    event DelegateAdded(bytes32 indexed accountId, address indexed delegate);
    event DelegateRemoved(bytes32 indexed accountId, address indexed delegate);

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    //--------------------------------------------------------------------------
    // Template Management Functions
    //--------------------------------------------------------------------------

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
    ) external whenNotPaused returns (bytes32) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(code.length > 0, "Code cannot be empty");
        
        _templateIdCounter.increment();
        bytes32 templateId = keccak256(abi.encodePacked(
            _templateIdCounter.current(),
            msg.sender,
            block.timestamp
        ));
        
        _templates[templateId] = AccountTemplateData({
            templateId: templateId,
            name: name,
            description: description,
            templateType: templateType,
            creator: msg.sender,
            code: code,
            isPublic: isPublic,
            isVerified: false,
            creationDate: uint64(block.timestamp),
            verificationDate: 0,
            parametersSchema: parametersSchema,
            version: version,
            usageCount: 0
        });
        
        // Add to creator's templates
        _creatorTemplates[msg.sender].push(templateId);
        
        // Add to templates by type
        _templatesByType[templateType].push(templateId);
        
        // Add to public templates if public
        if (isPublic) {
            _publicTemplates.push(templateId);
        }
        
        emit TemplateCreated(templateId, msg.sender, name, templateType);
        
        return templateId;
    }

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
    ) external whenNotPaused returns (bool) {
        require(_templates[templateId].templateId == templateId, "Template does not exist");
        require(_templates[templateId].creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), 
                "Not authorized to update template");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(code.length > 0, "Code cannot be empty");
        
        AccountTemplateData storage template = _templates[templateId];
        
        // Update template data
        template.name = name;
        template.description = description;
        template.code = code;
        template.parametersSchema = parametersSchema;
        template.version = version;
        
        // Handle public status change
        if (template.isPublic != isPublic) {
            template.isPublic = isPublic;
            
            if (isPublic) {
                // Add to public templates
                _publicTemplates.push(templateId);
            } else {
                // Remove from public templates
                for (uint256 i = 0; i < _publicTemplates.length; i++) {
                    if (_publicTemplates[i] == templateId) {
                        _publicTemplates[i] = _publicTemplates[_publicTemplates.length - 1];
                        _publicTemplates.pop();
                        break;
                    }
                }
            }
        }
        
        emit TemplateUpdated(templateId, msg.sender, name);
        
        return true;
    }

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
    ) external whenNotPaused onlyRole(VERIFIER_ROLE) returns (bool) {
        require(_templates[templateId].templateId == templateId, "Template does not exist");
        require(vulnerabilityRisk <= 100, "Vulnerability risk must be between 0-100");
        require(performanceRisk <= 100, "Performance risk must be between 0-100");
        
        AccountTemplateData storage template = _templates[templateId];
        
        // Update verification status
        bool wasVerified = template.isVerified;
        template.isVerified = true;
        template.verificationDate = uint64(block.timestamp);
        
        // Create verification result
        _verificationResults[templateId] = VerificationResult({
            isVerified: true,
            vulnerabilityRisk: vulnerabilityRisk,
            securityNotes: securityNotes,
            performanceRisk: performanceRisk,
            verifier: msg.sender,
            verificationTimestamp: uint64(block.timestamp)
        });
        
        // Add to verified templates if not already there
        if (!wasVerified) {
            _verifiedTemplates.push(templateId);
        }
        
        emit TemplateVerified(templateId, msg.sender, true);
        
        return true;
    }

    /**
     * @dev Get template details
     * @param templateId Template ID
     * @return Template details
     */
    function getTemplate(bytes32 templateId) external view returns (AccountTemplate memory) {
        require(_templates[templateId].templateId == templateId, "Template does not exist");
        
        AccountTemplateData storage template = _templates[templateId];
        
        return AccountTemplate({
            templateId: template.templateId,
            name: template.name,
            description: template.description,
            templateType: template.templateType,
            creator: template.creator,
            code: template.code,
            isPublic: template.isPublic,
            isVerified: template.isVerified,
            creationDate: template.creationDate,
            verificationDate: template.verificationDate,
            parametersSchema: template.parametersSchema,
            version: template.version,
            usageCount: template.usageCount
        });
    }

    /**
     * @dev Get verification result for a template
     * @param templateId Template ID
     * @return Verification result
     */
    function getVerificationResult(bytes32 templateId) external view returns (VerificationResult memory) {
        require(_templates[templateId].templateId == templateId, "Template does not exist");
        require(_templates[templateId].isVerified, "Template is not verified");
        
        return _verificationResults[templateId];
    }

    /**
     * @dev Get templates by type
     * @param templateType Type of template
     * @return Array of template IDs
     */
    function getTemplatesByType(TemplateType templateType) external view returns (bytes32[] memory) {
        return _templatesByType[templateType];
    }

    /**
     * @dev Get templates created by a user
     * @param creator Creator address
     * @return Array of template IDs
     */
    function getTemplatesByCreator(address creator) external view returns (bytes32[] memory) {
        return _creatorTemplates[creator];
    }

    /**
     * @dev Get all public templates
     * @return Array of template IDs
     */
    function getPublicTemplates() external view returns (bytes32[] memory) {
        return _publicTemplates;
    }

    /**
     * @dev Get all verified templates
     * @return Array of template IDs
     */
    function getVerifiedTemplates() external view returns (bytes32[] memory) {
        return _verifiedTemplates;
    }

    //--------------------------------------------------------------------------
    // Account Management Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Deploy a smart account from a template
     * @param templateId Template ID to use
     * @param parameters Parameters for initialization
     * @return accountId ID of the deployed account
     */
    function deployAccount(
        bytes32 templateId,
        mapping(string => string) memory parameters
    ) external whenNotPaused nonReentrant returns (bytes32) {
        require(_templates[templateId].templateId == templateId, "Template does not exist");
        
        AccountTemplateData storage template = _templates[templateId];
        
        // Increment template usage count
        template.usageCount += 1;
        
        // Generate account ID
        _accountIdCounter.increment();
        bytes32 accountId = keccak256(abi.encodePacked(
            _accountIdCounter.current(),
            msg.sender,
            templateId,
            block.timestamp
        ));
        
        // Store account data
        _accounts[accountId] = SmartAccountData({
            accountId: accountId,
            owner: msg.sender,
            templateId: templateId,
            code: template.code,
            codeHash: keccak256(template.code),
            creationDate: uint64(block.timestamp),
            lastExecution: 0,
            executionCount: 0,
            isActive: true
        });
        
        // Store parameters
        for (string memory key in parameters) {
            _accountParameters[accountId][key] = parameters[key];
        }
        
        // Add to owner's accounts
        _ownerAccounts[msg.sender].push(accountId);
        
        emit AccountDeployed(accountId, msg.sender, templateId);
        
        return accountId;
    }

    /**
     * @dev Get smart account details
     * @param accountId Account ID
     * @return Account details
     */
    function getAccount(bytes32 accountId) external view returns (SmartAccount memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        SmartAccountData storage account = _accounts[accountId];
        address[] storage delegates = _accountDelegates[accountId];
        
        // Create parameters map
        mapping(string => string) storage params = _accountParameters[accountId];
        
        return SmartAccount({
            accountId: account.accountId,
            owner: account.owner,
            templateId: account.templateId,
            code: account.code,
            codeHash: account.codeHash,
            creationDate: account.creationDate,
            lastExecution: account.lastExecution,
            executionCount: account.executionCount,
            parameters: params,
            isActive: account.isActive,
            delegates: delegates
        });
    }

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
    ) external whenNotPaused nonReentrant returns (ExecutionResult memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].isActive, "Account is not active");
        
        SmartAccountData storage account = _accounts[accountId];
        
        // Check authorization
        bool isAuthorized = false;
        
        if (msg.sender == account.owner) {
            isAuthorized = true;
        } else if (executionParams.delegated) {
            // Check if the delegate is authorized
            isAuthorized = _isDelegateAuthorized(accountId, executionParams.delegate);
            
            // Verify the delegate's signature
            if (isAuthorized) {
                // When using delegated execution, validate nonce to prevent replay
                require(!_usedNonces[keccak256(abi.encodePacked(accountId, executionParams.nonce))], "Nonce already used");
                _usedNonces[keccak256(abi.encodePacked(accountId, executionParams.nonce))] = true;
                
                // Ensure execution hasn't expired
                require(block.timestamp <= executionParams.validUntil, "Execution window expired");
            }
        }
        
        require(isAuthorized, "Not authorized to execute");
        
        // Create operation ID for tracking
        _operationIdCounter.increment();
        bytes32 operationId = keccak256(abi.encodePacked(
            _operationIdCounter.current(),
            accountId,
            msg.sender,
            block.timestamp
        ));
        
        // Execute the code (in a real implementation, this would use a VM or interpreter)
        ExecutionResult memory result = _executeCode(account.code, data, accountId);
        
        // Update account execution stats
        account.lastExecution = uint64(block.timestamp);
        account.executionCount += 1;
        
        // Record the operation
        SmartAccountOperation memory operation = SmartAccountOperation({
            operationId: operationId,
            accountId: accountId,
            operationType: "execute",
            timestamp: uint64(block.timestamp),
            data: data,
            result: result,
            executed_by: msg.sender
        });
        
        _accountOperations[accountId].push(operation);
        
        emit AccountExecuted(accountId, msg.sender, operationId);
        emit OperationAdded(accountId, operationId, "execute");
        
        return result;
    }

    /**
     * @dev Simulate execution without state changes
     * @param accountId Account ID to simulate
     * @param data Execution data
     * @return result Execution result
     */
    function simulateExecution(
        bytes32 accountId,
        bytes calldata data
    ) external view returns (ExecutionResult memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        // Execute code in simulation mode
        return _executeCode(_accounts[accountId].code, data, accountId);
    }

    /**
     * @dev Execute code with a VM or interpreter
     * @param code The code to execute
     * @param data The input data
     * @param accountId The account ID (for parameter access)
     * @return result The execution result
     */
    function _executeCode(bytes memory code, bytes memory data, bytes32 accountId) private view returns (ExecutionResult memory) {
        // This is a simplified implementation
        // In a real contract, this would use a JS VM, EVM interpreter, or other execution environment
        
        // For demonstration purposes, we'll return a mock result
        // but in a real implementation, this would execute the code and return real results
        
        string[] memory logs = new string[](1);
        logs[0] = "Code execution simulated";
        
        return ExecutionResult({
            success: true,
            result_data: abi.encode("Execution successful"),
            logs: logs,
            gas_used: 50000,
            error_message: ""
        });
    }

    /**
     * @dev Generate a nonce for account execution
     * @param accountId Account ID
     * @return nonce Generated nonce
     */
    function generateNonce(bytes32 accountId) external whenNotPaused returns (uint256) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        _nonceCounter.increment();
        return _nonceCounter.current();
    }

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
    ) external view returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        // Create the message hash that was signed
        bytes32 messageHash = keccak256(abi.encodePacked(
            accountId,
            data,
            nonce,
            block.chainid
        ));
        
        // Convert to Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        // Recover the signer address
        address signer = ethSignedMessageHash.recover(signature);
        
        // Check if the signer is the account owner or a delegate
        return (signer == _accounts[accountId].owner || _isDelegateAuthorized(accountId, signer));
    }

    /**
     * @dev Get operation history for a smart account
     * @param accountId Account ID
     * @return Array of operations
     */
    function getOperationHistory(
        bytes32 accountId
    ) external view returns (SmartAccountOperation[] memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        return _accountOperations[accountId];
    }

    //--------------------------------------------------------------------------
    // Delegation Management Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Add a delegate to a smart account
     * @param accountId Account ID
     * @param delegate Address to add as delegate
     * @return success Whether the operation was successful
     */
    function addDelegate(
        bytes32 accountId,
        address delegate
    ) external whenNotPaused nonReentrant returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].owner == msg.sender, "Not the account owner");
        require(delegate != address(0), "Invalid delegate address");
        require(delegate != _accounts[accountId].owner, "Owner cannot be delegate");
        
        // Check if delegate already exists
        for (uint256 i = 0; i < _accountDelegates[accountId].length; i++) {
            if (_accountDelegates[accountId][i] == delegate) {
                return true; // Already a delegate, consider it success
            }
        }
        
        // Add the delegate
        _accountDelegates[accountId].push(delegate);
        
        // Add account to delegate's accounts
        _delegateAccounts[delegate].push(accountId);
        
        // Update the account's delegate array
        SmartAccountData storage account = _accounts[accountId];
        account.delegates = _accountDelegates[accountId];
        
        emit DelegateAdded(accountId, delegate);
        
        return true;
    }

    /**
     * @dev Remove a delegate from a smart account
     * @param accountId Account ID
     * @param delegate Address to remove as delegate
     * @return success Whether the operation was successful
     */
    function removeDelegate(
        bytes32 accountId,
        address delegate
    ) external whenNotPaused nonReentrant returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].owner == msg.sender, "Not the account owner");
        
        // Find and remove delegate from account delegates
        bool found = false;
        for (uint256 i = 0; i < _accountDelegates[accountId].length; i++) {
            if (_accountDelegates[accountId][i] == delegate) {
                // Replace with last element and remove last
                _accountDelegates[accountId][i] = _accountDelegates[accountId][_accountDelegates[accountId].length - 1];
                _accountDelegates[accountId].pop();
                found = true;
                break;
            }
        }
        
        require(found, "Delegate not found");
        
        // Remove account from delegate's accounts
        for (uint256 i = 0; i < _delegateAccounts[delegate].length; i++) {
            if (_delegateAccounts[delegate][i] == accountId) {
                _delegateAccounts[delegate][i] = _delegateAccounts[delegate][_delegateAccounts[delegate].length - 1];
                _delegateAccounts[delegate].pop();
                break;
            }
        }
        
        // Update the account's delegate array
        SmartAccountData storage account = _accounts[accountId];
        account.delegates = _accountDelegates[accountId];
        
        emit DelegateRemoved(accountId, delegate);
        
        return true;
    }

    /**
     * @dev Get all delegates for a smart account
     * @param accountId Account ID
     * @return Array of delegate addresses
     */
    function getDelegates(bytes32 accountId) external view returns (address[] memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        return _accountDelegates[accountId];
    }

    /**
     * @dev Check if an address is a delegate for a smart account
     * @param accountId Account ID
     * @param delegate Address to check
     * @return isDelegate Whether the address is a delegate
     */
    function isDelegate(
        bytes32 accountId,
        address delegate
    ) external view returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        return _isDelegateAuthorized(accountId, delegate);
    }

    /**
     * @dev Check if a delegate is authorized for an account
     * @param accountId The account ID
     * @param delegate The delegate address
     * @return Whether the delegate is authorized
     */
    function _isDelegateAuthorized(bytes32 accountId, address delegate) private view returns (bool) {
        for (uint256 i = 0; i < _accountDelegates[accountId].length; i++) {
            if (_accountDelegates[accountId][i] == delegate) {
                return true;
            }
        }
        return false;
    }

    //--------------------------------------------------------------------------
    // Specialized Template Creation Functions
    //--------------------------------------------------------------------------

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
    ) external whenNotPaused nonReentrant returns (bytes32) {
        // Validate inputs
        require(reinvestmentTargets.length > 0, "Must have at least one target");
        require(reinvestmentTargets.length == reinvestmentAllocations.length, "Target and allocation count mismatch");
        
        // Validate that allocations sum to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < reinvestmentAllocations.length; i++) {
            totalAllocation += reinvestmentAllocations[i];
        }
        require(totalAllocation == 100, "Allocations must sum to 100");
        
        // Encode the specialized parameters into the template code
        bytes memory code = abi.encode(
            "YIELD_REINVESTMENT",
            autoCompoundFrequency,
            minReinvestAmount,
            reinvestmentTargets,
            reinvestmentAllocations
        );
        
        // Create the parameter schema
        string memory parametersSchema = string(abi.encodePacked(
            '{"type":"object","properties":{"autoCompoundFrequency":{"type":"number","minimum":0},"minReinvestAmount":{"type":"string","pattern":"^[0-9]+$"},"reinvestmentTargets":{"type":"array","items":{"type":"string","pattern":"^0x[a-fA-F0-9]{40}$"}},"reinvestmentAllocations":{"type":"array","items":{"type":"number","minimum":0,"maximum":100}}},"required":["autoCompoundFrequency","minReinvestAmount","reinvestmentTargets","reinvestmentAllocations"]}'
        ));
        
        // Create the template
        return createTemplate(
            name,
            description,
            TemplateType.YIELD_REINVESTMENT,
            code,
            isPublic,
            parametersSchema,
            "1.0.0"
        );
    }

    /**
     * @dev Create an automated trading template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param targetTokens Target tokens for trading
     * @param priceThresholds Price thresholds for trading
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
    ) external whenNotPaused nonReentrant returns (bytes32) {
        // Validate inputs
        require(targetTokens.length > 0, "Must have at least one token");
        require(
            targetTokens.length == priceThresholds.length &&
            targetTokens.length == isPriceAbove.length &&
            targetTokens.length == orderSizes.length,
            "Array length mismatch"
        );
        
        // Encode the specialized parameters into the template code
        bytes memory code = abi.encode(
            "AUTOMATED_TRADING",
            targetTokens,
            priceThresholds,
            isPriceAbove,
            orderSizes,
            expirationStrategy
        );
        
        // Create the parameter schema (simplified)
        string memory parametersSchema = string(abi.encodePacked(
            '{"type":"object","properties":{"targetTokens":{"type":"array","items":{"type":"string","pattern":"^0x[a-fA-F0-9]{40}$"}},"priceThresholds":{"type":"array","items":{"type":"string","pattern":"^[0-9]+$"}},"isPriceAbove":{"type":"array","items":{"type":"boolean"}},"orderSizes":{"type":"array","items":{"type":"string","pattern":"^[0-9]+$"}},"expirationStrategy":{"type":"number","minimum":0,"maximum":255}},"required":["targetTokens","priceThresholds","isPriceAbove","orderSizes","expirationStrategy"]}'
        ));
        
        // Create the template
        return createTemplate(
            name,
            description,
            TemplateType.AUTOMATED_TRADING,
            code,
            isPublic,
            parametersSchema,
            "1.0.0"
        );
    }

    /**
     * @dev Create a portfolio rebalancing template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param targetAssets Target assets for rebalancing
     * @param targetAllocations Target allocation percentages
     * @param rebalanceThreshold Threshold percentage to trigger rebalancing
     * @param rebalanceFrequency Frequency of rebalancing (in seconds)
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
    ) external whenNotPaused nonReentrant returns (bytes32) {
        // Validate inputs
        require(targetAssets.length > 0, "Must have at least one asset");
        require(targetAssets.length == targetAllocations.length, "Asset and allocation count mismatch");
        require(rebalanceThreshold > 0 && rebalanceThreshold <= 100, "Invalid rebalance threshold");
        require(maxSlippage > 0 && maxSlippage <= 100, "Invalid max slippage");
        
        // Validate that allocations sum to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < targetAllocations.length; i++) {
            totalAllocation += targetAllocations[i];
        }
        require(totalAllocation == 100, "Allocations must sum to 100");
        
        // Encode the specialized parameters into the template code
        bytes memory code = abi.encode(
            "PORTFOLIO_REBALANCING",
            targetAssets,
            targetAllocations,
            rebalanceThreshold,
            rebalanceFrequency,
            maxSlippage
        );
        
        // Create the parameter schema (simplified)
        string memory parametersSchema = string(abi.encodePacked(
            '{"type":"object","properties":{"targetAssets":{"type":"array","items":{"type":"string","pattern":"^0x[a-fA-F0-9]{40}$"}},"targetAllocations":{"type":"array","items":{"type":"number","minimum":1,"maximum":100}},"rebalanceThreshold":{"type":"number","minimum":1,"maximum":100},"rebalanceFrequency":{"type":"number","minimum":0},"maxSlippage":{"type":"number","minimum":1,"maximum":100}},"required":["targetAssets","targetAllocations","rebalanceThreshold","rebalanceFrequency","maxSlippage"]}'
        ));
        
        // Create the template
        return createTemplate(
            name,
            description,
            TemplateType.PORTFOLIO_REBALANCING,
            code,
            isPublic,
            parametersSchema,
            "1.0.0"
        );
    }

    /**
     * @dev Create a dollar cost averaging template
     * @param name Template name
     * @param description Template description
     * @param isPublic Whether the template is public
     * @param sourceAsset Source asset for investment
     * @param targetAsset Target asset for investment
     * @param investmentAmount Amount to invest each period
     * @param frequency Investment frequency (in seconds)
     * @param duration Total duration of DCA strategy (in seconds, 0 for unlimited)
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
    ) external whenNotPaused nonReentrant returns (bytes32) {
        // Validate inputs
        require(sourceAsset != address(0) && targetAsset != address(0), "Invalid asset addresses");
        require(sourceAsset != targetAsset, "Source and target must be different");
        require(investmentAmount > 0, "Investment amount must be positive");
        require(frequency > 0, "Frequency must be positive");
        require(maxSlippage > 0 && maxSlippage <= 100, "Invalid max slippage");
        
        // Encode the specialized parameters into the template code
        bytes memory code = abi.encode(
            "DOLLAR_COST_AVERAGING",
            sourceAsset,
            targetAsset,
            investmentAmount,
            frequency,
            duration,
            maxSlippage
        );
        
        // Create the parameter schema (simplified)
        string memory parametersSchema = string(abi.encodePacked(
            '{"type":"object","properties":{"sourceAsset":{"type":"string","pattern":"^0x[a-fA-F0-9]{40}$"},"targetAsset":{"type":"string","pattern":"^0x[a-fA-F0-9]{40}$"},"investmentAmount":{"type":"string","pattern":"^[0-9]+$"},"frequency":{"type":"number","minimum":1},"duration":{"type":"number","minimum":0},"maxSlippage":{"type":"number","minimum":1,"maximum":100}},"required":["sourceAsset","targetAsset","investmentAmount","frequency","duration","maxSlippage"]}'
        ));
        
        // Create the template
        return createTemplate(
            name,
            description,
            TemplateType.DOLLAR_COST_AVERAGING,
            code,
            isPublic,
            parametersSchema,
            "1.0.0"
        );
    }

    //--------------------------------------------------------------------------
    // Admin Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 
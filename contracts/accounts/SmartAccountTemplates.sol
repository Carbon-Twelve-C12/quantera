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
contract SmartAccountTemplates is AccessControl, Pausable, ReentrancyGuard {
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
    ) external payable whenNotPaused nonReentrant returns (ExecutionResult memory) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].isActive, "Account is not active");
        
        SmartAccountData storage account = _accounts[accountId];
        
        // Check authorization
        bool isAuthorized = account.owner == msg.sender;
        
        // Check delegation if caller is not the owner
        if (!isAuthorized && executionParams.delegated) {
            require(executionParams.delegate == msg.sender, "Invalid delegate address");
            require(isDelegate(accountId, msg.sender), "Not a delegate for this account");
            require(block.timestamp <= executionParams.validUntil, "Execution request expired");
            require(!_usedNonces[keccak256(abi.encodePacked(accountId, executionParams.nonce))], "Nonce already used");
            
            // Mark nonce as used
            _usedNonces[keccak256(abi.encodePacked(accountId, executionParams.nonce))] = true;
            
            isAuthorized = true;
        }
        
        require(isAuthorized, "Not authorized to execute account");
        
        // Create operation ID
        _operationIdCounter.increment();
        bytes32 operationId = keccak256(abi.encodePacked(
            accountId,
            _operationIdCounter.current(),
            block.timestamp
        ));
        
        // Initialize result
        ExecutionResult memory result = ExecutionResult({
            success: false,
            resultData: new bytes(0),
            logs: new string[](0),
            gasUsed: 0,
            errorMessage: ""
        });
        
        // Execute code using an isolated execution environment
        // In a real implementation, this would use a secure VM or interpreter
        // For now, we'll simulate the execution
        
        // Simplified execution logic (placeholder)
        result.success = true;
        result.resultData = abi.encode("Execution Successful");
        string[] memory logs = new string[](1);
        logs[0] = "Execution log: Account executed successfully";
        result.logs = logs;
        result.gasUsed = gasleft();
        
        // Update account state
        account.lastExecution = uint64(block.timestamp);
        account.executionCount += 1;
        
        // Record operation
        SmartAccountOperation memory operation = SmartAccountOperation({
            operationId: operationId,
            accountId: accountId,
            operationType: "Execute",
            timestamp: uint64(block.timestamp),
            data: data,
            result: result,
            executedBy: msg.sender
        });
        
        _accountOperations[accountId].push(operation);
        
        emit AccountExecuted(accountId, msg.sender, operationId);
        
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
        
        // Simulate execution without state changes
        // In a real implementation, this would use a secure VM or interpreter in view mode
        // For now, we'll simulate the execution
        
        // Simplified simulation logic (placeholder)
        ExecutionResult memory result = ExecutionResult({
            success: true,
            resultData: abi.encode("Simulation Successful"),
            logs: new string[](1),
            gasUsed: 100000,
            errorMessage: ""
        });
        result.logs[0] = "Simulation log: Account execution would succeed";
        
        return result;
    }

    /**
     * @dev Add a delegate to a smart account
     * @param accountId Account ID
     * @param delegate Address to add as delegate
     * @return success Whether the operation was successful
     */
    function addDelegate(
        bytes32 accountId,
        address delegate
    ) external whenNotPaused returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].owner == msg.sender, "Not the account owner");
        require(delegate != address(0), "Invalid delegate address");
        require(!isDelegate(accountId, delegate), "Already a delegate");
        
        // Add delegate
        _accountDelegates[accountId].push(delegate);
        
        // Add account to delegate's accounts
        _delegateAccounts[delegate].push(accountId);
        
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
    ) external whenNotPaused returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        require(_accounts[accountId].owner == msg.sender, "Not the account owner");
        require(isDelegate(accountId, delegate), "Not a delegate");
        
        // Remove delegate from account's delegates
        address[] storage delegates = _accountDelegates[accountId];
        for (uint256 i = 0; i < delegates.length; i++) {
            if (delegates[i] == delegate) {
                delegates[i] = delegates[delegates.length - 1];
                delegates.pop();
                break;
            }
        }
        
        // Remove account from delegate's accounts
        bytes32[] storage delegateAccts = _delegateAccounts[delegate];
        for (uint256 i = 0; i < delegateAccts.length; i++) {
            if (delegateAccts[i] == accountId) {
                delegateAccts[i] = delegateAccts[delegateAccts.length - 1];
                delegateAccts.pop();
                break;
            }
        }
        
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
    ) public view returns (bool) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        address[] storage delegates = _accountDelegates[accountId];
        for (uint256 i = 0; i < delegates.length; i++) {
            if (delegates[i] == delegate) {
                return true;
            }
        }
        
        return false;
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

    /**
     * @dev Get accounts owned by a user
     * @param owner Owner address
     * @return Array of account IDs
     */
    function getAccountsByOwner(address owner) external view returns (bytes32[] memory) {
        return _ownerAccounts[owner];
    }

    /**
     * @dev Get accounts where an address is a delegate
     * @param delegate Delegate address
     * @return Array of account IDs
     */
    function getAccountsByDelegate(address delegate) external view returns (bytes32[] memory) {
        return _delegateAccounts[delegate];
    }

    /**
     * @dev Generate a nonce for account execution
     * @param accountId Account ID
     * @return nonce Generated nonce
     */
    function generateNonce(bytes32 accountId) external whenNotPaused returns (uint256) {
        require(_accounts[accountId].accountId == accountId, "Account does not exist");
        
        _nonceCounter.increment();
        uint256 nonce = _nonceCounter.current();
        _accountNonces[accountId] = nonce;
        
        return nonce;
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
        
        SmartAccountData storage account = _accounts[accountId];
        
        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            accountId,
            data,
            nonce,
            block.chainid
        ));
        
        // Recover signer
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        // Check if signer is the owner
        if (signer == account.owner) {
            return true;
        }
        
        // Check if signer is a delegate
        return isDelegate(accountId, signer);
    }

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
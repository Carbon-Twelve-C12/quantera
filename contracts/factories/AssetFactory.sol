// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../interfaces/IAssetFactory.sol";
import "../interfaces/ITreasuryRegistry.sol";
import "../interfaces/ITreasuryToken.sol";
import "../interfaces/IComplianceModule.sol";
import "../TreasuryToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AssetFactory
 * @dev Implementation of the Asset Factory contract that creates and manages tokenized assets
 * of different classes.
 * 
 * Security Enhancements (v0.9.7):
 * - Added custom errors for gas-efficient error handling
 * - Enhanced role-based access control in critical functions
 * - Implemented additional security checks for sensitive operations
 * - Improved input validation with custom errors
 * - Better adherence to checks-effects-interactions pattern
 */
contract AssetFactory is IAssetFactory, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant TEMPLATE_CREATOR_ROLE = keccak256("TEMPLATE_CREATOR_ROLE");
    bytes32 public constant ASSET_CREATOR_ROLE = keccak256("ASSET_CREATOR_ROLE");
    bytes32 public constant MODULE_MANAGER_ROLE = keccak256("MODULE_MANAGER_ROLE");
    
    // Custom errors for gas efficiency
    error Unauthorized(address caller, bytes32 requiredRole);
    error InvalidZeroAddress();
    error TemplateNotFound(bytes32 templateId);
    error EmptyString(string paramName);
    error InvalidAssetAddress(address assetAddress);
    error AssetAlreadyRegistered(address assetAddress);
    error InvalidModule(bytes32 moduleId);
    error NotTemplateCreator(address caller, address creator);
    error InvalidAssetParameter(string paramName);
    error TemplateNotCompatible(bytes32 templateId, address caller);
    
    // Registry for treasuries and other assets
    ITreasuryRegistry public treasury_registry;
    IComplianceModule public compliance_module;
    
    // Asset template storage
    mapping(bytes32 => AssetTemplate) private _templates;
    mapping(AssetClass => bytes32[]) private _templatesByClass;
    mapping(address => bytes32[]) private _templatesByCreator;
    mapping(bool => bytes32[]) private _templatesByVisibility;  // true = public templates
    
    // Asset storage
    mapping(bytes32 => address) private _assetAddresses;
    mapping(bytes32 => AssetClass) private _assetClasses;
    mapping(bytes32 => address) private _assetIssuers;
    mapping(address => bool) private _isAsset;
    
    // Module storage
    mapping(bytes32 => mapping(bytes32 => bool)) private _moduleEnabled;
    mapping(bytes32 => bytes32[]) private _templateModules;
    
    // Counters for generating unique IDs
    Counters.Counter private _templateIdCounter;
    Counters.Counter private _assetIdCounter;
    
    /**
     * @dev Constructor
     * @param treasury_registry_address Address of the TreasuryRegistry contract
     * @param compliance_module_address Address of the ComplianceModule contract
     */
    constructor(address treasury_registry_address, address compliance_module_address) {
        // Validate input parameters using custom errors
        if (treasury_registry_address == address(0)) {
            revert InvalidZeroAddress();
        }
        if (compliance_module_address == address(0)) {
            revert InvalidZeroAddress();
        }
        
        treasury_registry = ITreasuryRegistry(treasury_registry_address);
        compliance_module = IComplianceModule(compliance_module_address);
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TEMPLATE_CREATOR_ROLE, msg.sender);
        _setupRole(ASSET_CREATOR_ROLE, msg.sender);
        _setupRole(MODULE_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new asset template
     * @param name Name of the template
     * @param assetClass Class of asset this template is for
     * @param isPublic Whether the template is publicly available
     * @param metadataURI URI pointing to the template metadata
     * @param compatibleModules Array of module IDs compatible with this template
     * @return templateId ID of the created template
     */
    function createTemplate(
        string calldata name,
        AssetClass assetClass,
        bool isPublic,
        string calldata metadataURI,
        bytes32[] calldata compatibleModules
    ) external override nonReentrant returns (bytes32 templateId) {
        // Check for required role
        if (!hasRole(TEMPLATE_CREATOR_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, TEMPLATE_CREATOR_ROLE);
        }
        
        // Validate input parameters
        if (bytes(name).length == 0) {
            revert EmptyString("name");
        }
        if (bytes(metadataURI).length == 0) {
            revert EmptyString("metadataURI");
        }
        
        // Generate unique template ID
        _templateIdCounter.increment();
        templateId = keccak256(abi.encodePacked(
            _templateIdCounter.current(),
            assetClass,
            msg.sender,
            block.timestamp
        ));
        
        // Create template
        AssetTemplate storage template = _templates[templateId];
        template.templateId = templateId;
        template.name = name;
        template.assetClass = assetClass;
        template.creator = msg.sender;
        template.creationDate = block.timestamp;
        template.isPublic = isPublic;
        template.metadataURI = metadataURI;
        
        // Store compatible modules
        for (uint256 i = 0; i < compatibleModules.length; i++) {
            bytes32 moduleId = compatibleModules[i];
            if (moduleId != bytes32(0)) {
                _moduleEnabled[templateId][moduleId] = true;
                _templateModules[templateId].push(moduleId);
            }
        }
        
        // Add to indexes
        _templatesByClass[assetClass].push(templateId);
        _templatesByCreator[msg.sender].push(templateId);
        _templatesByVisibility[isPublic].push(templateId);
        
        emit TemplateCreated(templateId, assetClass, msg.sender, name, isPublic);
        
        return templateId;
    }
    
    /**
     * @dev Updates an existing template
     * @param templateId ID of the template to update
     * @param isPublic New public status
     * @param metadataURI New metadata URI
     * @return success Boolean indicating if the update was successful
     */
    function updateTemplate(
        bytes32 templateId,
        bool isPublic,
        string calldata metadataURI
    ) external override nonReentrant returns (bool success) {
        // Get template and validate it exists
        AssetTemplate storage template = _templates[templateId];
        if (template.templateId != templateId) {
            revert TemplateNotFound(templateId);
        }
        
        // Verify caller is template creator or admin
        if (template.creator != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotTemplateCreator(msg.sender, template.creator);
        }
        
        // Validate input
        if (bytes(metadataURI).length == 0) {
            revert EmptyString("metadataURI");
        }
        
        // Update template visibility in indexes if changed
        if (template.isPublic != isPublic) {
            // Remove from old visibility index
            _removeFromArray(_templatesByVisibility[template.isPublic], templateId);
            
            // Add to new visibility index
            _templatesByVisibility[isPublic].push(templateId);
            
            // Update template
            template.isPublic = isPublic;
        }
        
        // Update metadata URI
        template.metadataURI = metadataURI;
        
        emit TemplateUpdated(templateId, metadataURI, isPublic);
        
        return true;
    }
    
    /**
     * @dev Creates a new asset from a template
     * @param templateId ID of the template to use
     * @param assetParams Parameters for the asset
     * @param tokenomics Tokenomics configuration
     * @param modules Array of module configurations
     * @return assetAddress Address of the created asset token contract
     * @return assetId Unique ID of the created asset
     */
    function createAsset(
        bytes32 templateId,
        AssetParams calldata assetParams,
        TokenomicsConfig calldata tokenomics,
        ModuleConfig[] calldata modules
    ) external override nonReentrant returns (address assetAddress, bytes32 assetId) {
        // Check role
        if (!hasRole(ASSET_CREATOR_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, ASSET_CREATOR_ROLE);
        }
        
        // Validate template exists
        AssetTemplate storage template = _templates[templateId];
        if (template.templateId != templateId) {
            revert TemplateNotFound(templateId);
        }
        
        // Check template accessibility 
        if (!template.isPublic && template.creator != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert TemplateNotCompatible(templateId, msg.sender);
        }
        
        // Validate asset parameters
        if (bytes(assetParams.name).length == 0) {
            revert EmptyString("name");
        }
        if (bytes(assetParams.symbol).length == 0) {
            revert EmptyString("symbol");
        }
        if (assetParams.totalSupply == 0) {
            revert InvalidAssetParameter("totalSupply");
        }
        if (assetParams.issuer == address(0)) {
            revert InvalidZeroAddress();
        }
        
        // Generate unique asset ID - effects
        _assetIdCounter.increment();
        assetId = keccak256(abi.encodePacked(
            _assetIdCounter.current(),
            templateId,
            assetParams.name,
            assetParams.symbol,
            block.timestamp
        ));
        
        // Create the asset based on asset class - interactions
        if (template.assetClass == AssetClass.TREASURY) {
            assetAddress = _createTreasuryAsset(templateId, assetParams, tokenomics);
        } else {
            // For other asset classes, we'll implement custom token deployment
            assetAddress = _createCustomAsset(templateId, assetParams, tokenomics);
        }
        
        // Store asset information - effects
        _assetAddresses[assetId] = assetAddress;
        _assetClasses[assetId] = template.assetClass;
        _assetIssuers[assetId] = assetParams.issuer;
        _isAsset[assetAddress] = true;
        
        // Apply module configurations - effects and interactions
        for (uint256 i = 0; i < modules.length; i++) {
            bytes32 moduleId = modules[i].moduleId;
            if (_moduleEnabled[templateId][moduleId]) {
                // Apply module configuration - implementation will depend on module type
                // This is a placeholder for module application logic
            }
        }
        
        emit AssetCreated(templateId, assetAddress, assetId, template.assetClass, assetParams.issuer, assetParams.totalSupply);
        
        return (assetAddress, assetId);
    }
    
    /**
     * @dev Registers an existing asset with the factory
     * @param assetAddress Address of the existing asset token contract
     * @param assetClass Class of the asset
     * @param assetParams Parameters for the asset
     * @return assetId Unique ID of the registered asset
     */
    function registerExistingAsset(
        address assetAddress,
        AssetClass assetClass,
        AssetParams calldata assetParams
    ) external override nonReentrant returns (bytes32 assetId) {
        // Check role
        if (!hasRole(ASSET_CREATOR_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, ASSET_CREATOR_ROLE);
        }
        
        // Validate parameters
        if (assetAddress == address(0)) {
            revert InvalidZeroAddress();
        }
        if (_isAsset[assetAddress]) {
            revert AssetAlreadyRegistered(assetAddress);
        }
        
        // Validate asset parameters
        if (bytes(assetParams.name).length == 0) {
            revert EmptyString("name");
        }
        if (bytes(assetParams.symbol).length == 0) {
            revert EmptyString("symbol");
        }
        if (assetParams.issuer == address(0)) {
            revert InvalidZeroAddress();
        }
        
        // For Treasury assets, validate that they're in the registry
        if (assetClass == AssetClass.TREASURY) {
            // Check if token exists in registry - this is implementation specific
            // This is a placeholder for verification logic
        }
        
        // Generate unique asset ID
        _assetIdCounter.increment();
        assetId = keccak256(abi.encodePacked(
            _assetIdCounter.current(),
            assetClass,
            assetParams.name,
            assetParams.symbol,
            block.timestamp
        ));
        
        // Store asset information
        _assetAddresses[assetId] = assetAddress;
        _assetClasses[assetId] = assetClass;
        _assetIssuers[assetId] = assetParams.issuer;
        _isAsset[assetAddress] = true;
        
        // No template to associate, so we don't emit TemplateCreated
        // Instead we emit an AssetCreated event with bytes32(0) as templateId
        emit AssetCreated(bytes32(0), assetAddress, assetId, assetClass, assetParams.issuer, assetParams.totalSupply);
        
        return assetId;
    }
    
    /**
     * @dev Enables or disables a module for a template
     * @param templateId ID of the template
     * @param moduleId ID of the module
     * @param isEnabled Whether the module should be enabled
     * @return success Boolean indicating if the operation was successful
     */
    function setModuleStatus(
        bytes32 templateId,
        bytes32 moduleId,
        bool isEnabled
    ) external override nonReentrant returns (bool success) {
        // Check role
        if (!hasRole(MODULE_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, MODULE_MANAGER_ROLE);
        }
        
        // Validate template exists
        if (_templates[templateId].templateId != templateId) {
            revert TemplateNotFound(templateId);
        }
        
        // Validate module
        if (moduleId == bytes32(0)) {
            revert InvalidModule(bytes32(0));
        }
        
        bool currentStatus = _moduleEnabled[templateId][moduleId];
        
        if (currentStatus != isEnabled) {
            _moduleEnabled[templateId][moduleId] = isEnabled;
            
            if (isEnabled) {
                // Add to template modules if not already there
                bool found = false;
                for (uint256 i = 0; i < _templateModules[templateId].length; i++) {
                    if (_templateModules[templateId][i] == moduleId) {
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    _templateModules[templateId].push(moduleId);
                }
            }
            
            emit ModuleStatusChanged(templateId, moduleId, isEnabled);
        }
        
        return true;
    }
    
    /**
     * @dev Gets template details
     * @param templateId ID of the template
     * @return template The template details
     */
    function getTemplate(bytes32 templateId) external view override returns (AssetTemplate memory template) {
        return _templates[templateId];
    }
    
    /**
     * @dev Gets all templates for a specific asset class
     * @param assetClass The asset class to filter by
     * @return templateIds Array of template IDs for the specified asset class
     */
    function getTemplatesByClass(AssetClass assetClass) external view override returns (bytes32[] memory templateIds) {
        return _templatesByClass[assetClass];
    }
    
    /**
     * @dev Gets all public templates
     * @return templateIds Array of public template IDs
     */
    function getPublicTemplates() external view override returns (bytes32[] memory templateIds) {
        return _templatesByVisibility[true];
    }
    
    /**
     * @dev Gets templates created by a specific address
     * @param creator Address of the template creator
     * @return templateIds Array of template IDs created by the specified address
     */
    function getTemplatesByCreator(address creator) external view override returns (bytes32[] memory templateIds) {
        return _templatesByCreator[creator];
    }
    
    /**
     * @dev Gets all modules compatible with a template
     * @param templateId ID of the template
     * @return moduleIds Array of compatible module IDs
     */
    function getCompatibleModules(bytes32 templateId) external view override returns (bytes32[] memory moduleIds) {
        return _templateModules[templateId];
    }
    
    /**
     * @dev Gets asset details
     * @param assetId ID of the asset
     * @return assetAddress Address of the asset token contract
     * @return assetClass Class of the asset
     * @return issuer Address of the asset issuer
     */
    function getAssetDetails(bytes32 assetId) external view override returns (
        address assetAddress,
        AssetClass assetClass,
        address issuer
    ) {
        return (_assetAddresses[assetId], _assetClasses[assetId], _assetIssuers[assetId]);
    }
    
    /**
     * @dev Checks if an address is an asset created by this factory
     * @param assetAddress Address to check
     * @return isAsset Boolean indicating if the address is an asset created by this factory
     */
    function isAsset(address assetAddress) external view override returns (bool) {
        return _isAsset[assetAddress];
    }
    
    /**
     * @dev Creates a treasury asset
     * @param templateId ID of the template to use
     * @param assetParams Parameters for the asset
     * @param tokenomics Tokenomics configuration
     * @return assetAddress Address of the created treasury token contract
     */
    function _createTreasuryAsset(
        bytes32 templateId,
        AssetParams calldata assetParams,
        TokenomicsConfig calldata tokenomics
    ) internal returns (address assetAddress) {
        // Create new treasury token
        TreasuryToken newToken = new TreasuryToken(
            assetParams.name,
            assetParams.symbol,
            assetParams.totalSupply,
            bytes32(0), // Treasury ID will be assigned by registry
            ITreasuryRegistry.TreasuryType.TBILL, // Default to T-BILL, can be updated
            assetParams.faceValue,
            uint16(assetParams.yieldRate), // Convert to uint16 for yieldRate
            assetParams.issuanceDate,
            assetParams.maturityDate,
            assetParams.issuer,
            address(treasury_registry)
        );
        
        assetAddress = address(newToken);
        
        // Register the token with the treasury registry
        // This would typically be done through the registry, but we're simplifying here
        // In a real implementation, you'd request the registry to register the token
        
        return assetAddress;
    }
    
    /**
     * @dev Creates a custom asset for non-treasury asset classes
     * @param templateId ID of the template to use
     * @param assetParams Parameters for the asset
     * @param tokenomics Tokenomics configuration
     * @return assetAddress Address of the created custom token contract
     */
    function _createCustomAsset(
        bytes32 templateId,
        AssetParams calldata assetParams,
        TokenomicsConfig calldata tokenomics
    ) internal returns (address assetAddress) {
        // This is a placeholder for custom asset creation logic
        // In a full implementation, this would deploy different contracts based on asset class
        // For now, we'll just reuse the treasury token contract as an example
        
        TreasuryToken newToken = new TreasuryToken(
            assetParams.name,
            assetParams.symbol,
            assetParams.totalSupply,
            bytes32(0), // No treasury ID for non-treasury assets
            ITreasuryRegistry.TreasuryType.TBILL, // Default type, not relevant for non-treasury
            assetParams.faceValue,
            uint16(assetParams.yieldRate),
            assetParams.issuanceDate,
            assetParams.maturityDate,
            assetParams.issuer,
            address(treasury_registry)
        );
        
        assetAddress = address(newToken);
        
        return assetAddress;
    }
    
    /**
     * @dev Removes an item from an array
     * @param array The array to remove from
     * @param value The value to remove
     */
    function _removeFromArray(bytes32[] storage array, bytes32 value) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                // Move the last element to the position of the element to delete
                array[i] = array[array.length - 1];
                // Remove the last element
                array.pop();
                break;
            }
        }
    }
} 
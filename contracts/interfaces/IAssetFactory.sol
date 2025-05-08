// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title IAssetFactory
 * @dev Interface for the Asset Factory contract, which creates and manages tokenized assets
 * of different classes. This factory serves as the foundation for Quantera's multi-asset support.
 */
interface IAssetFactory {
    /**
     * @dev Enum representing different asset classes supported by the factory
     */
    enum AssetClass {
        TREASURY,        // U.S. Treasury securities (bills, notes, bonds)
        REAL_ESTATE,     // Real estate properties
        CORPORATE_BOND,  // Corporate bonds
        ENVIRONMENTAL_ASSET,  // Environmental assets including carbon credits, biodiversity credits, and renewable energy certificates
        IP_RIGHT,        // Intellectual property rights
        INVOICE,         // Account receivables and invoices
        COMMODITY,       // Physical commodities
        INFRASTRUCTURE,  // Infrastructure projects
        CUSTOM          // Custom asset class with configurable parameters
    }

    /**
     * @dev Structure to store asset template information
     */
    struct AssetTemplate {
        bytes32 templateId;
        string name;
        AssetClass assetClass;
        address creator;
        uint256 creationDate;
        bool isPublic;
        string metadataURI;
        bytes32[] compatibleModules;
    }

    /**
     * @dev Structure to store asset specific parameters
     */
    struct AssetParams {
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 faceValue;
        uint256 issuanceDate;
        uint256 maturityDate;
        uint256 yieldRate;
        address issuer;
        string metadataURI;
        bytes extraData;
    }

    /**
     * @dev Structure to store asset tokenomics configuration
     */
    struct TokenomicsConfig {
        bool hasTransferRestrictions;
        bool hasDividends;
        bool hasMaturity;
        bool hasRoyalties;
        uint256 feeRate;        // In basis points (e.g., 25 = 0.25%)
        address feeRecipient;
        bytes customTokenomics;  // For complex tokenomics models
    }

    /**
     * @dev Structure to store module configuration
     */
    struct ModuleConfig {
        bytes32 moduleId;
        bool isEnabled;
        bytes moduleData;
    }

    /**
     * @dev Emitted when a new asset template is created
     */
    event TemplateCreated(
        bytes32 indexed templateId,
        AssetClass indexed assetClass,
        address indexed creator,
        string name,
        bool isPublic
    );

    /**
     * @dev Emitted when a template is updated
     */
    event TemplateUpdated(
        bytes32 indexed templateId,
        string metadataURI,
        bool isPublic
    );

    /**
     * @dev Emitted when a new asset is created from a template
     */
    event AssetCreated(
        bytes32 indexed templateId,
        address indexed assetAddress,
        bytes32 indexed assetId,
        AssetClass assetClass,
        address issuer,
        uint256 totalSupply
    );

    /**
     * @dev Emitted when a module is enabled or disabled for a template
     */
    event ModuleStatusChanged(
        bytes32 indexed templateId,
        bytes32 indexed moduleId,
        bool isEnabled
    );

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
    ) external returns (bytes32 templateId);

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
    ) external returns (bool success);

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
    ) external returns (address assetAddress, bytes32 assetId);

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
    ) external returns (bytes32 assetId);

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
    ) external returns (bool success);

    /**
     * @dev Gets template details
     * @param templateId ID of the template
     * @return template The template details
     */
    function getTemplate(bytes32 templateId) external view returns (AssetTemplate memory template);

    /**
     * @dev Gets all templates for a specific asset class
     * @param assetClass The asset class to filter by
     * @return templateIds Array of template IDs for the specified asset class
     */
    function getTemplatesByClass(AssetClass assetClass) external view returns (bytes32[] memory templateIds);

    /**
     * @dev Gets all public templates
     * @return templateIds Array of public template IDs
     */
    function getPublicTemplates() external view returns (bytes32[] memory templateIds);

    /**
     * @dev Gets templates created by a specific address
     * @param creator Address of the template creator
     * @return templateIds Array of template IDs created by the specified address
     */
    function getTemplatesByCreator(address creator) external view returns (bytes32[] memory templateIds);

    /**
     * @dev Gets all modules compatible with a template
     * @param templateId ID of the template
     * @return moduleIds Array of compatible module IDs
     */
    function getCompatibleModules(bytes32 templateId) external view returns (bytes32[] memory moduleIds);

    /**
     * @dev Gets asset details
     * @param assetId ID of the asset
     * @return assetAddress Address of the asset token contract
     * @return assetClass Class of the asset
     * @return issuer Address of the asset issuer
     */
    function getAssetDetails(bytes32 assetId) external view returns (
        address assetAddress,
        AssetClass assetClass,
        address issuer
    );

    /**
     * @dev Checks if an address is an asset created by this factory
     * @param assetAddress Address to check
     * @return isAsset Boolean indicating if the address is an asset created by this factory
     */
    function isAsset(address assetAddress) external view returns (bool isAsset);
} 
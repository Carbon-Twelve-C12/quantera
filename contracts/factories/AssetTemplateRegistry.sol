// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IComplianceModule.sol";
import "../tokens/ComplianceAwareToken.sol";

/**
 * @title AssetTemplateRegistry
 * @author Quantera Team
 * @notice Registry for managing asset class templates for rapid tokenization
 * @dev Implements factory pattern for deploying standardized asset tokens
 */
contract AssetTemplateRegistry is AccessControl, Pausable, ReentrancyGuard, Initializable {
    using Counters for Counters.Counter;

    // ============ Roles ============
    bytes32 public constant TEMPLATE_ADMIN_ROLE = keccak256("TEMPLATE_ADMIN");
    bytes32 public constant ASSET_DEPLOYER_ROLE = keccak256("ASSET_DEPLOYER");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE");

    // ============ Structs ============
    
    /**
     * @notice Asset template configuration
     * @param templateType Type of asset (RealEstate, TradeFinance, Environmental, Treasury)
     * @param name Human-readable template name
     * @param version Template version for upgradability
     * @param bytecode Compiled contract bytecode for deployment
     * @param isActive Whether template is available for deployment
     * @param isCompliant Whether template has passed compliance review
     * @param requiredRole Role required to deploy this template
     * @param deploymentCount Number of times template has been deployed
     * @param creator Address that created the template
     * @param metadata IPFS hash containing template documentation
     */
    struct AssetTemplate {
        AssetType templateType;
        string name;
        uint256 version;
        bytes bytecode;
        bool isActive;
        bool isCompliant;
        bytes32 requiredRole;
        uint256 deploymentCount;
        address creator;
        string metadata;
    }

    /**
     * @notice Configuration parameters for asset deployment
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Initial supply
     * @param decimals Token decimals
     * @param complianceModule Compliance module address
     * @param transferRestrictions Transfer restriction flags
     * @param dividendEnabled Enable dividend distribution
     * @param votingEnabled Enable voting rights
     * @param maturityDate Token maturity timestamp (0 for perpetual)
     * @param interestRate Annual interest rate (basis points)
     */
    struct DeploymentConfig {
        string name;
        string symbol;
        uint256 totalSupply;
        uint8 decimals;
        address complianceModule;
        uint256 transferRestrictions;
        bool dividendEnabled;
        bool votingEnabled;
        uint256 maturityDate;
        uint256 interestRate;
    }

    /**
     * @notice Deployed asset instance tracking
     */
    struct DeployedAsset {
        uint256 templateId;
        address assetAddress;
        address deployer;
        uint256 deployedAt;
        DeploymentConfig config;
        bool isActive;
    }

    // ============ Enums ============
    enum AssetType {
        RealEstate,
        TradeFinance,
        Environmental,
        Treasury,
        Commodity,
        PrivateEquity,
        Custom
    }

    // ============ State Variables ============
    Counters.Counter private _templateIdCounter;
    Counters.Counter private _deploymentIdCounter;

    mapping(uint256 => AssetTemplate) public templates;
    mapping(uint256 => DeployedAsset) public deployedAssets;
    mapping(address => uint256[]) public deployerAssets;
    mapping(AssetType => uint256[]) public templatesByType;
    mapping(address => bool) public authorizedContracts;

    uint256 public constant MAX_TEMPLATE_BYTECODE_SIZE = 24576; // 24KB max
    uint256 public constant MIN_VERSION = 100; // v1.0.0 = 100
    uint256 public deploymentFee = 0.01 ether;

    // Pre-built template bytecode hashes for verification
    mapping(bytes32 => bool) public verifiedBytecodes;

    // ============ Events ============
    event TemplateRegistered(
        uint256 indexed templateId,
        AssetType indexed templateType,
        string name,
        uint256 version,
        address creator
    );

    event TemplateUpdated(
        uint256 indexed templateId,
        uint256 newVersion,
        bool isActive
    );

    event AssetDeployed(
        uint256 indexed deploymentId,
        uint256 indexed templateId,
        address indexed assetAddress,
        address deployer,
        string name,
        string symbol
    );

    event TemplateDeactivated(uint256 indexed templateId, string reason);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event TemplateComplianceUpdated(uint256 indexed templateId, bool isCompliant);

    // ============ Custom Errors ============
    error InvalidTemplate();
    error TemplateNotActive();
    error TemplateNotCompliant();
    error InsufficientDeploymentFee();
    error BytecodeTooLarge();
    error InvalidVersion();
    error UnauthorizedDeployer();
    error DeploymentFailed();
    error InvalidConfiguration();
    error TemplateAlreadyExists();
    error AssetNotFound();

    // ============ Constructor ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TEMPLATE_ADMIN_ROLE, msg.sender);
        _grantRole(ASSET_DEPLOYER_ROLE, msg.sender);
    }

    // ============ External Functions ============

    /**
     * @notice Register a new asset template
     * @param _type Asset type category
     * @param _name Template name
     * @param _bytecode Compiled contract bytecode
     * @param _metadata IPFS hash of template documentation
     * @param _requiredRole Role required for deployment
     * @return templateId Unique template identifier
     */
    function registerTemplate(
        AssetType _type,
        string calldata _name,
        bytes calldata _bytecode,
        string calldata _metadata,
        bytes32 _requiredRole
    ) external onlyRole(TEMPLATE_ADMIN_ROLE) returns (uint256) {
        if (_bytecode.length == 0) revert InvalidTemplate();
        if (_bytecode.length > MAX_TEMPLATE_BYTECODE_SIZE) revert BytecodeTooLarge();
        if (bytes(_name).length == 0) revert InvalidTemplate();

        _templateIdCounter.increment();
        uint256 templateId = _templateIdCounter.current();

        AssetTemplate storage template = templates[templateId];
        template.templateType = _type;
        template.name = _name;
        template.version = MIN_VERSION;
        template.bytecode = _bytecode;
        template.isActive = false; // Requires activation
        template.isCompliant = false; // Requires compliance review
        template.requiredRole = _requiredRole;
        template.creator = msg.sender;
        template.metadata = _metadata;

        templatesByType[_type].push(templateId);
        
        // Store bytecode hash for verification
        verifiedBytecodes[keccak256(_bytecode)] = true;

        emit TemplateRegistered(templateId, _type, _name, MIN_VERSION, msg.sender);

        return templateId;
    }

    /**
     * @notice Deploy an asset using a template
     * @param _templateId Template to use for deployment
     * @param _config Deployment configuration parameters
     * @return deploymentId Unique deployment identifier
     * @return assetAddress Address of deployed asset
     */
    function deployAsset(
        uint256 _templateId,
        DeploymentConfig calldata _config
    ) external payable nonReentrant whenNotPaused returns (uint256 deploymentId, address assetAddress) {
        AssetTemplate storage template = templates[_templateId];
        
        // Validations
        if (template.bytecode.length == 0) revert InvalidTemplate();
        if (!template.isActive) revert TemplateNotActive();
        if (!template.isCompliant) revert TemplateNotCompliant();
        if (msg.value < deploymentFee) revert InsufficientDeploymentFee();
        
        // Check deployer authorization
        if (template.requiredRole != bytes32(0)) {
            if (!hasRole(template.requiredRole, msg.sender)) {
                revert UnauthorizedDeployer();
            }
        }

        // Validate configuration
        if (bytes(_config.name).length == 0 || bytes(_config.symbol).length == 0) {
            revert InvalidConfiguration();
        }
        if (_config.totalSupply == 0) revert InvalidConfiguration();
        if (_config.decimals == 0 || _config.decimals > 18) revert InvalidConfiguration();

        // Deploy the asset contract
        bytes memory bytecode = template.bytecode;
        bytes32 salt = keccak256(abi.encodePacked(_templateId, msg.sender, block.timestamp));
        
        assembly {
            assetAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(assetAddress)) {
                revert(0, 0)
            }
        }

        if (assetAddress == address(0)) revert DeploymentFailed();

        // Initialize the deployed contract
        _initializeAsset(assetAddress, _config);

        // Record deployment
        _deploymentIdCounter.increment();
        deploymentId = _deploymentIdCounter.current();
        
        DeployedAsset storage deployment = deployedAssets[deploymentId];
        deployment.templateId = _templateId;
        deployment.assetAddress = assetAddress;
        deployment.deployer = msg.sender;
        deployment.deployedAt = block.timestamp;
        deployment.config = _config;
        deployment.isActive = true;

        template.deploymentCount++;
        deployerAssets[msg.sender].push(deploymentId);
        authorizedContracts[assetAddress] = true;

        emit AssetDeployed(
            deploymentId,
            _templateId,
            assetAddress,
            msg.sender,
            _config.name,
            _config.symbol
        );

        return (deploymentId, assetAddress);
    }

    /**
     * @notice Activate a template for deployment
     * @param _templateId Template to activate
     */
    function activateTemplate(uint256 _templateId) 
        external 
        onlyRole(TEMPLATE_ADMIN_ROLE) 
    {
        AssetTemplate storage template = templates[_templateId];
        if (template.bytecode.length == 0) revert InvalidTemplate();
        if (!template.isCompliant) revert TemplateNotCompliant();
        
        template.isActive = true;
        emit TemplateUpdated(_templateId, template.version, true);
    }

    /**
     * @notice Deactivate a template
     * @param _templateId Template to deactivate
     * @param _reason Reason for deactivation
     */
    function deactivateTemplate(uint256 _templateId, string calldata _reason) 
        external 
        onlyRole(TEMPLATE_ADMIN_ROLE) 
    {
        AssetTemplate storage template = templates[_templateId];
        if (template.bytecode.length == 0) revert InvalidTemplate();
        
        template.isActive = false;
        emit TemplateDeactivated(_templateId, _reason);
        emit TemplateUpdated(_templateId, template.version, false);
    }

    /**
     * @notice Mark template as compliant
     * @param _templateId Template to mark compliant
     */
    function setTemplateCompliance(uint256 _templateId, bool _isCompliant) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        AssetTemplate storage template = templates[_templateId];
        if (template.bytecode.length == 0) revert InvalidTemplate();
        
        template.isCompliant = _isCompliant;
        emit TemplateComplianceUpdated(_templateId, _isCompliant);
    }

    /**
     * @notice Update template version
     * @param _templateId Template to update
     * @param _newBytecode New contract bytecode
     * @param _newVersion New version number
     */
    function updateTemplate(
        uint256 _templateId,
        bytes calldata _newBytecode,
        uint256 _newVersion
    ) external onlyRole(TEMPLATE_ADMIN_ROLE) {
        AssetTemplate storage template = templates[_templateId];
        if (template.bytecode.length == 0) revert InvalidTemplate();
        if (_newVersion <= template.version) revert InvalidVersion();
        if (_newBytecode.length > MAX_TEMPLATE_BYTECODE_SIZE) revert BytecodeTooLarge();
        
        template.bytecode = _newBytecode;
        template.version = _newVersion;
        template.isCompliant = false; // Requires re-review
        
        verifiedBytecodes[keccak256(_newBytecode)] = true;
        
        emit TemplateUpdated(_templateId, _newVersion, template.isActive);
    }

    /**
     * @notice Update deployment fee
     * @param _newFee New fee amount in wei
     */
    function updateDeploymentFee(uint256 _newFee) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        uint256 oldFee = deploymentFee;
        deploymentFee = _newFee;
        emit DeploymentFeeUpdated(oldFee, _newFee);
    }

    /**
     * @notice Withdraw collected deployment fees
     * @param _to Address to send fees to
     */
    function withdrawFees(address _to) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        uint256 balance = address(this).balance;
        (bool success, ) = _to.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============ View Functions ============

    /**
     * @notice Get all templates for an asset type
     * @param _type Asset type to query
     * @return Array of template IDs
     */
    function getTemplatesByType(AssetType _type) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return templatesByType[_type];
    }

    /**
     * @notice Get all assets deployed by an address
     * @param _deployer Deployer address
     * @return Array of deployment IDs
     */
    function getDeployerAssets(address _deployer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return deployerAssets[_deployer];
    }

    /**
     * @notice Check if an asset address is authorized
     * @param _asset Asset address to check
     * @return Whether asset is authorized
     */
    function isAuthorizedAsset(address _asset) 
        external 
        view 
        returns (bool) 
    {
        return authorizedContracts[_asset];
    }

    /**
     * @notice Get template details
     * @param _templateId Template ID
     * @return Template details
     */
    function getTemplate(uint256 _templateId) 
        external 
        view 
        returns (AssetTemplate memory) 
    {
        return templates[_templateId];
    }

    /**
     * @notice Get deployment details
     * @param _deploymentId Deployment ID
     * @return Deployment details
     */
    function getDeployment(uint256 _deploymentId) 
        external 
        view 
        returns (DeployedAsset memory) 
    {
        return deployedAssets[_deploymentId];
    }

    // ============ Internal Functions ============

    /**
     * @notice Initialize a deployed asset contract
     * @param _asset Asset contract address
     * @param _config Deployment configuration
     */
    function _initializeAsset(address _asset, DeploymentConfig memory _config) private {
        // Call initialize function on the deployed contract
        // This is a simplified version - actual implementation would depend on template
        (bool success, ) = _asset.call(
            abi.encodeWithSignature(
                "initialize(string,string,uint256,uint8,address)",
                _config.name,
                _config.symbol,
                _config.totalSupply,
                _config.decimals,
                _config.complianceModule
            )
        );
        
        if (!success) revert DeploymentFailed();
        
        // Set additional configurations if supported
        if (_config.dividendEnabled) {
            (_asset.call(abi.encodeWithSignature("enableDividends()")));
        }
        
        if (_config.votingEnabled) {
            (_asset.call(abi.encodeWithSignature("enableVoting()")));
        }
        
        if (_config.maturityDate > 0) {
            (_asset.call(abi.encodeWithSignature("setMaturityDate(uint256)", _config.maturityDate)));
        }
    }

    // ============ Emergency Functions ============

    /**
     * @notice Pause all deployments
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Resume deployments
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

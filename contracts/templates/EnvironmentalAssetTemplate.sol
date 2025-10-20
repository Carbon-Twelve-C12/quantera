// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title EnvironmentalAssetTemplate
 * @author Quantera Team
 * @notice Template for tokenizing environmental assets (carbon credits, RECs, biodiversity)
 * @dev Includes impact tracking, retirement mechanisms, and certification management
 */
contract EnvironmentalAssetTemplate is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable 
{
    // ============ Roles ============
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER");
    bytes32 public constant RETIREMENT_ROLE = keccak256("RETIREMENT");
    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY");

    // ============ Enums ============
    enum AssetCategory {
        CarbonCredit,
        RenewableEnergyCredit,
        BiodiversityCredit,
        WaterCredit,
        PlasticCredit,
        NatureBasedSolution
    }

    enum CertificationStandard {
        VCS, // Verified Carbon Standard
        GoldStandard,
        CDM, // Clean Development Mechanism
        CAR, // Climate Action Reserve
        ACR, // American Carbon Registry
        ISO14064,
        Other
    }

    enum ProjectType {
        Reforestation,
        RenewableEnergy,
        EnergyEfficiency,
        DirectAirCapture,
        BlueCarbon,
        SoilCarbon,
        Biodiversity,
        WaterConservation
    }

    // ============ Structs ============
    
    struct EnvironmentalProject {
        AssetCategory category;
        ProjectType projectType;
        string projectName;
        string projectLocation;
        string coordinates; // GPS coordinates
        uint256 projectStartDate;
        uint256 creditingPeriod; // In years
        string certificationNumber;
        CertificationStandard standard;
        string methodologyCode;
        string projectDeveloper;
    }

    struct ImpactMetrics {
        uint256 co2Equivalent; // Tonnes of CO2e per credit
        uint256 additionalityScore; // 0-100 score
        uint256 permanenceYears; // Years of permanence
        uint256 leakagePercentage; // Basis points
        uint256 bufferPoolContribution; // Percentage allocated to buffer
        uint256 verificationDate;
        string verificationReport; // IPFS hash
        address verifier;
    }

    struct RetirementRecord {
        address beneficiary;
        uint256 amount;
        uint256 timestamp;
        string purpose;
        string retirementCertificate; // IPFS hash
        uint256 retirementId;
    }

    struct Vintage {
        uint256 year;
        uint256 totalIssued;
        uint256 totalRetired;
        uint256 totalActive;
        uint256 pricePerCredit;
        bool isVerified;
    }

    // ============ State Variables ============
    EnvironmentalProject public project;
    ImpactMetrics public impact;
    
    mapping(uint256 => Vintage) public vintages;
    mapping(address => uint256) public retiredBalance;
    mapping(uint256 => RetirementRecord) public retirements;
    
    uint256 public totalRetired;
    uint256 public retirementCounter;
    uint256 public currentVintage;
    
    address public registryContract;
    address public complianceModule;
    
    bool public retirementEnabled;
    bool public transfersAllowed;
    bool public isVerified;
    
    uint256 public constant CO2_MULTIPLIER = 1e18; // For precision
    uint256 public constant BASIS_POINTS = 10000;
    
    string public projectDocumentationURI;
    string public monitoringReportURI;
    
    // Co-benefits tracking
    mapping(string => uint256) public coBenefits; // SDG goal => impact value
    string[] public coBenefitKeys;
    
    // ============ Events ============
    event ProjectRegistered(
        string projectName,
        AssetCategory category,
        ProjectType projectType,
        uint256 vintage
    );
    event ImpactVerified(
        uint256 co2Equivalent,
        uint256 additionalityScore,
        address verifier
    );
    event CreditsRetired(
        address indexed beneficiary,
        uint256 amount,
        uint256 retirementId,
        string purpose
    );
    event VintageCreated(uint256 year, uint256 totalIssued);
    event CoBenefitAdded(string sdgGoal, uint256 impactValue);
    event VerificationCompleted(uint256 timestamp, string reportURI);
    event PriceUpdated(uint256 vintage, uint256 newPrice);
    
    // ============ Custom Errors ============
    error ProjectNotVerified();
    error RetirementDisabled();
    error InsufficientCredits();
    error InvalidVintage();
    error TransfersNotAllowed();
    error AlreadyRetired();
    error InvalidImpactMetrics();
    error UnauthorizedVerifier();
    error InvalidCertification();
    
    // ============ Initializer ============
    
    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint8 _decimals,
        address _complianceModule
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(REGISTRY_ROLE, msg.sender);
        
        complianceModule = _complianceModule;
        transfersAllowed = true;
        retirementEnabled = true;
        
        // Mint initial credits
        _mint(msg.sender, _totalSupply);
    }
    
    // ============ Project Setup ============
    
    /**
     * @notice Register environmental project details
     * @param _category Asset category
     * @param _projectType Type of project
     * @param _projectName Name of the project
     * @param _location Project location
     * @param _coordinates GPS coordinates
     * @param _certNumber Certification number
     * @param _standard Certification standard
     */
    function registerProject(
        AssetCategory _category,
        ProjectType _projectType,
        string calldata _projectName,
        string calldata _location,
        string calldata _coordinates,
        string calldata _certNumber,
        CertificationStandard _standard
    ) external onlyRole(REGISTRY_ROLE) {
        project.category = _category;
        project.projectType = _projectType;
        project.projectName = _projectName;
        project.projectLocation = _location;
        project.coordinates = _coordinates;
        project.projectStartDate = block.timestamp;
        project.certificationNumber = _certNumber;
        project.standard = _standard;
        
        currentVintage = block.timestamp / 365 days + 1970; // Current year
        
        emit ProjectRegistered(
            _projectName,
            _category,
            _projectType,
            currentVintage
        );
    }
    
    /**
     * @notice Set project documentation
     * @param _developer Project developer name
     * @param _methodology Methodology code
     * @param _creditingPeriod Years of crediting period
     * @param _documentationURI IPFS URI for documentation
     */
    function setProjectDocumentation(
        string calldata _developer,
        string calldata _methodology,
        uint256 _creditingPeriod,
        string calldata _documentationURI
    ) external onlyRole(REGISTRY_ROLE) {
        project.projectDeveloper = _developer;
        project.methodologyCode = _methodology;
        project.creditingPeriod = _creditingPeriod;
        projectDocumentationURI = _documentationURI;
    }
    
    // ============ Impact Verification ============
    
    /**
     * @notice Verify and set impact metrics
     * @param _co2e CO2 equivalent per credit
     * @param _additionality Additionality score (0-100)
     * @param _permanence Years of permanence
     * @param _leakage Leakage percentage in basis points
     * @param _bufferPool Buffer pool contribution percentage
     * @param _reportURI Verification report IPFS URI
     */
    function verifyImpact(
        uint256 _co2e,
        uint256 _additionality,
        uint256 _permanence,
        uint256 _leakage,
        uint256 _bufferPool,
        string calldata _reportURI
    ) external onlyRole(VERIFIER_ROLE) {
        if (_co2e == 0) revert InvalidImpactMetrics();
        if (_additionality > 100) revert InvalidImpactMetrics();
        if (_leakage > BASIS_POINTS) revert InvalidImpactMetrics();
        
        impact.co2Equivalent = _co2e;
        impact.additionalityScore = _additionality;
        impact.permanenceYears = _permanence;
        impact.leakagePercentage = _leakage;
        impact.bufferPoolContribution = _bufferPool;
        impact.verificationDate = block.timestamp;
        impact.verificationReport = _reportURI;
        impact.verifier = msg.sender;
        
        isVerified = true;
        
        emit ImpactVerified(_co2e, _additionality, msg.sender);
        emit VerificationCompleted(block.timestamp, _reportURI);
    }
    
    /**
     * @notice Add co-benefits (SDG impacts)
     * @param _sdgGoal SDG goal identifier
     * @param _impactValue Impact value/score
     */
    function addCoBenefit(string calldata _sdgGoal, uint256 _impactValue) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        if (coBenefits[_sdgGoal] == 0) {
            coBenefitKeys.push(_sdgGoal);
        }
        coBenefits[_sdgGoal] = _impactValue;
        
        emit CoBenefitAdded(_sdgGoal, _impactValue);
    }
    
    // ============ Vintage Management ============
    
    /**
     * @notice Create new vintage of credits
     * @param _year Vintage year
     * @param _amount Amount to issue
     * @param _pricePerCredit Initial price per credit
     */
    function createVintage(
        uint256 _year,
        uint256 _amount,
        uint256 _pricePerCredit
    ) external onlyRole(REGISTRY_ROLE) {
        if (_year < 2020 || _year > block.timestamp / 365 days + 1970) {
            revert InvalidVintage();
        }
        
        Vintage storage vintage = vintages[_year];
        vintage.year = _year;
        vintage.totalIssued = _amount;
        vintage.totalActive = _amount;
        vintage.pricePerCredit = _pricePerCredit;
        vintage.isVerified = false; // Requires verification
        
        currentVintage = _year;
        
        emit VintageCreated(_year, _amount);
    }
    
    /**
     * @notice Update vintage price
     * @param _year Vintage year
     * @param _newPrice New price per credit
     */
    function updateVintagePrice(uint256 _year, uint256 _newPrice) 
        external 
        onlyRole(REGISTRY_ROLE) 
    {
        if (vintages[_year].year == 0) revert InvalidVintage();
        
        vintages[_year].pricePerCredit = _newPrice;
        
        emit PriceUpdated(_year, _newPrice);
    }
    
    // ============ Retirement Functions ============
    
    /**
     * @notice Retire environmental credits
     * @param _amount Amount to retire
     * @param _beneficiary Beneficiary of retirement
     * @param _purpose Purpose of retirement
     * @return retirementId Unique retirement identifier
     */
    function retireCredits(
        uint256 _amount,
        address _beneficiary,
        string calldata _purpose
    ) external whenNotPaused returns (uint256) {
        if (!retirementEnabled) revert RetirementDisabled();
        if (!isVerified) revert ProjectNotVerified();
        if (balanceOf(msg.sender) < _amount) revert InsufficientCredits();
        
        // Burn the credits
        _burn(msg.sender, _amount);
        
        // Record retirement
        retirementCounter++;
        uint256 retirementId = retirementCounter;
        
        RetirementRecord storage record = retirements[retirementId];
        record.beneficiary = _beneficiary;
        record.amount = _amount;
        record.timestamp = block.timestamp;
        record.purpose = _purpose;
        record.retirementId = retirementId;
        
        // Update balances
        retiredBalance[_beneficiary] += _amount;
        totalRetired += _amount;
        
        // Update vintage
        Vintage storage vintage = vintages[currentVintage];
        vintage.totalRetired += _amount;
        vintage.totalActive -= _amount;
        
        emit CreditsRetired(_beneficiary, _amount, retirementId, _purpose);
        
        return retirementId;
    }
    
    /**
     * @notice Generate retirement certificate
     * @param _retirementId Retirement ID
     * @param _certificateURI IPFS URI of certificate
     */
    function generateRetirementCertificate(
        uint256 _retirementId,
        string calldata _certificateURI
    ) external onlyRole(REGISTRY_ROLE) {
        RetirementRecord storage record = retirements[_retirementId];
        if (record.amount == 0) revert InvalidCertification();
        
        record.retirementCertificate = _certificateURI;
    }
    
    // ============ Transfer Controls ============
    
    /**
     * @notice Override transfer to enforce restrictions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
        
        // Check if transfers are allowed
        if (from != address(0) && to != address(0)) { // Not mint or burn
            if (!transfersAllowed) revert TransfersNotAllowed();
            if (!isVerified) revert ProjectNotVerified();
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Calculate total CO2 impact
     * @return Total CO2e reduced/removed
     */
    function getTotalImpact() external view returns (uint256) {
        return (totalSupply() + totalRetired) * impact.co2Equivalent / CO2_MULTIPLIER;
    }
    
    /**
     * @notice Get active credits for vintage
     * @param _year Vintage year
     * @return Active credit amount
     */
    function getActiveCredits(uint256 _year) external view returns (uint256) {
        return vintages[_year].totalActive;
    }
    
    /**
     * @notice Get retirement details
     * @param _retirementId Retirement ID
     * @return Retirement record
     */
    function getRetirement(uint256 _retirementId) 
        external 
        view 
        returns (RetirementRecord memory) 
    {
        return retirements[_retirementId];
    }
    
    /**
     * @notice Get all co-benefits
     * @return SDG goals and impact values
     */
    function getCoBenefits() 
        external 
        view 
        returns (string[] memory goals, uint256[] memory values) 
    {
        uint256 length = coBenefitKeys.length;
        goals = new string[](length);
        values = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            goals[i] = coBenefitKeys[i];
            values[i] = coBenefits[coBenefitKeys[i]];
        }
        
        return (goals, values);
    }
    
    /**
     * @notice Check if address has retired credits
     * @param _address Address to check
     * @return Amount of retired credits
     */
    function getRetiredBalance(address _address) 
        external 
        view 
        returns (uint256) 
    {
        return retiredBalance[_address];
    }
    
    /**
     * @notice Calculate price for amount of credits
     * @param _amount Amount of credits
     * @return Total price
     */
    function calculatePrice(uint256 _amount) 
        external 
        view 
        returns (uint256) 
    {
        return _amount * vintages[currentVintage].pricePerCredit;
    }
    
    // ============ Configuration Functions ============
    
    /**
     * @notice Enable or disable transfers
     * @param _allowed Whether transfers are allowed
     */
    function setTransfersAllowed(bool _allowed) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        transfersAllowed = _allowed;
    }
    
    /**
     * @notice Enable or disable retirement
     * @param _enabled Whether retirement is enabled
     */
    function setRetirementEnabled(bool _enabled) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        retirementEnabled = _enabled;
    }
    
    /**
     * @notice Set monitoring report URI
     * @param _uri IPFS URI of monitoring report
     */
    function setMonitoringReport(string calldata _uri) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        monitoringReportURI = _uri;
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

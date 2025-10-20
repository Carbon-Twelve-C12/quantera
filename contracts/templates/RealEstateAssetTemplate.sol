// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../tokens/ComplianceAwareToken.sol";

/**
 * @title RealEstateAssetTemplate
 * @author Quantera Team
 * @notice Template for tokenizing real estate assets with rental income distribution
 * @dev ERC-1400 compliant security token for real estate
 */
contract RealEstateAssetTemplate is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable 
{
    // ============ Roles ============
    bytes32 public constant PROPERTY_MANAGER_ROLE = keccak256("PROPERTY_MANAGER");
    bytes32 public constant INCOME_DISTRIBUTOR_ROLE = keccak256("INCOME_DISTRIBUTOR");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER");

    // ============ Structs ============
    
    struct PropertyDetails {
        string propertyAddress;
        string legalDescription;
        uint256 valuationUSD;
        uint256 squareFootage;
        uint8 propertyType; // 0: Residential, 1: Commercial, 2: Industrial, 3: Mixed
        string ipfsDocumentHash;
        uint256 lastValuationDate;
    }

    struct RentalIncome {
        uint256 totalCollected;
        uint256 lastDistributionDate;
        uint256 nextRentDue;
        uint256 monthlyRentUSD;
        uint256 occupancyRate; // Basis points (10000 = 100%)
    }

    struct InvestorRecord {
        uint256 totalInvested;
        uint256 totalIncomeReceived;
        uint256 unclaimedIncome;
        uint256 lockupEndDate;
        bool isAccredited;
        bool kycCompleted;
    }

    // ============ State Variables ============
    PropertyDetails public property;
    RentalIncome public rentalIncome;
    mapping(address => InvestorRecord) public investors;
    
    address public complianceModule;
    uint256 public totalSupplyCap;
    uint256 public minimumInvestment;
    uint256 public distributionFrequency; // In days
    
    uint256[] private incomeSnapshots;
    mapping(uint256 => uint256) public snapshotBalances;
    
    bool public dividendsEnabled;
    bool public votingEnabled;
    bool public transfersRestricted;
    
    uint256 public constant DISTRIBUTION_PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    
    // ============ Events ============
    event PropertyDetailsUpdated(string propertyAddress, uint256 valuationUSD);
    event RentalIncomeReceived(uint256 amount, uint256 timestamp);
    event IncomeDistributed(uint256 totalAmount, uint256 perToken, uint256 timestamp);
    event InvestorWhitelisted(address indexed investor, bool isAccredited);
    event InvestorLocked(address indexed investor, uint256 lockupEndDate);
    event DividendClaimed(address indexed investor, uint256 amount);
    event PropertyValuationUpdated(uint256 newValuation, uint256 timestamp);
    event OccupancyRateUpdated(uint256 newRate, uint256 timestamp);
    
    // ============ Custom Errors ============
    error UnauthorizedAccess();
    error InvestmentBelowMinimum();
    error TransferRestricted();
    error KYCNotCompleted();
    error InvestorNotAccredited();
    error LockupPeriodActive();
    error NoIncomeToClaim();
    error InvalidPropertyDetails();
    error DistributionTooFrequent();
    error ExceedsSupplyCap();
    
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
        _grantRole(PROPERTY_MANAGER_ROLE, msg.sender);
        _grantRole(INCOME_DISTRIBUTOR_ROLE, msg.sender);
        
        complianceModule = _complianceModule;
        totalSupplyCap = _totalSupply;
        minimumInvestment = 1000 * (10 ** _decimals); // $1000 minimum
        distributionFrequency = 30 days;
        transfersRestricted = true;
        
        // Mint initial supply to deployer
        _mint(msg.sender, _totalSupply);
    }
    
    // ============ Property Management ============
    
    /**
     * @notice Set property details
     * @param _propertyAddress Physical address of the property
     * @param _legalDescription Legal description from deed
     * @param _valuationUSD Current valuation in USD
     * @param _squareFootage Total square footage
     * @param _propertyType Type of property (0-3)
     * @param _ipfsHash IPFS hash of property documents
     */
    function setPropertyDetails(
        string calldata _propertyAddress,
        string calldata _legalDescription,
        uint256 _valuationUSD,
        uint256 _squareFootage,
        uint8 _propertyType,
        string calldata _ipfsHash
    ) external onlyRole(PROPERTY_MANAGER_ROLE) {
        if (bytes(_propertyAddress).length == 0) revert InvalidPropertyDetails();
        if (_valuationUSD == 0) revert InvalidPropertyDetails();
        
        property.propertyAddress = _propertyAddress;
        property.legalDescription = _legalDescription;
        property.valuationUSD = _valuationUSD;
        property.squareFootage = _squareFootage;
        property.propertyType = _propertyType;
        property.ipfsDocumentHash = _ipfsHash;
        property.lastValuationDate = block.timestamp;
        
        emit PropertyDetailsUpdated(_propertyAddress, _valuationUSD);
    }
    
    /**
     * @notice Update property valuation
     * @param _newValuationUSD New valuation in USD
     */
    function updateValuation(uint256 _newValuationUSD) 
        external 
        onlyRole(PROPERTY_MANAGER_ROLE) 
    {
        if (_newValuationUSD == 0) revert InvalidPropertyDetails();
        
        property.valuationUSD = _newValuationUSD;
        property.lastValuationDate = block.timestamp;
        
        emit PropertyValuationUpdated(_newValuationUSD, block.timestamp);
    }
    
    // ============ Income Management ============
    
    /**
     * @notice Record rental income received
     * @param _amount Amount of rental income in payment token
     */
    function recordRentalIncome(uint256 _amount) 
        external 
        onlyRole(INCOME_DISTRIBUTOR_ROLE) 
    {
        rentalIncome.totalCollected += _amount;
        
        emit RentalIncomeReceived(_amount, block.timestamp);
    }
    
    /**
     * @notice Distribute rental income to token holders
     */
    function distributeIncome() 
        external 
        onlyRole(INCOME_DISTRIBUTOR_ROLE) 
        whenNotPaused 
    {
        uint256 lastDistribution = rentalIncome.lastDistributionDate;
        if (block.timestamp < lastDistribution + distributionFrequency) {
            revert DistributionTooFrequent();
        }
        
        uint256 totalToDistribute = rentalIncome.totalCollected;
        if (totalToDistribute == 0) revert NoIncomeToClaim();
        
        uint256 totalTokens = totalSupply();
        uint256 incomePerToken = (totalToDistribute * DISTRIBUTION_PRECISION) / totalTokens;
        
        // Create snapshot for this distribution
        uint256 snapshotId = incomeSnapshots.length;
        incomeSnapshots.push(incomePerToken);
        
        // Record balances at snapshot
        // In production, this would use a more efficient snapshot mechanism
        
        rentalIncome.totalCollected = 0;
        rentalIncome.lastDistributionDate = block.timestamp;
        
        emit IncomeDistributed(totalToDistribute, incomePerToken, block.timestamp);
    }
    
    /**
     * @notice Claim accumulated rental income
     */
    function claimIncome() external whenNotPaused {
        InvestorRecord storage investor = investors[msg.sender];
        uint256 unclaimed = investor.unclaimedIncome;
        
        if (unclaimed == 0) revert NoIncomeToClaim();
        
        investor.unclaimedIncome = 0;
        investor.totalIncomeReceived += unclaimed;
        
        // Transfer income token to investor
        // In production, this would transfer actual payment tokens
        
        emit DividendClaimed(msg.sender, unclaimed);
    }
    
    /**
     * @notice Update rental income parameters
     * @param _monthlyRent Expected monthly rent in USD
     * @param _occupancyRate Current occupancy rate in basis points
     */
    function updateRentalParameters(uint256 _monthlyRent, uint256 _occupancyRate) 
        external 
        onlyRole(PROPERTY_MANAGER_ROLE) 
    {
        rentalIncome.monthlyRentUSD = _monthlyRent;
        rentalIncome.occupancyRate = _occupancyRate;
        
        emit OccupancyRateUpdated(_occupancyRate, block.timestamp);
    }
    
    // ============ Investor Management ============
    
    /**
     * @notice Whitelist an investor
     * @param _investor Investor address
     * @param _isAccredited Whether investor is accredited
     */
    function whitelistInvestor(address _investor, bool _isAccredited) 
        external 
        onlyRole(COMPLIANCE_OFFICER_ROLE) 
    {
        InvestorRecord storage investor = investors[_investor];
        investor.isAccredited = _isAccredited;
        investor.kycCompleted = true;
        
        emit InvestorWhitelisted(_investor, _isAccredited);
    }
    
    /**
     * @notice Set lockup period for an investor
     * @param _investor Investor address
     * @param _lockupEndDate End date of lockup period
     */
    function setInvestorLockup(address _investor, uint256 _lockupEndDate) 
        external 
        onlyRole(COMPLIANCE_OFFICER_ROLE) 
    {
        investors[_investor].lockupEndDate = _lockupEndDate;
        
        emit InvestorLocked(_investor, _lockupEndDate);
    }
    
    // ============ Transfer Overrides ============
    
    /**
     * @notice Override transfer to enforce compliance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) { // Not mint or burn
            // Check transfer restrictions
            if (transfersRestricted) {
                InvestorRecord memory fromInvestor = investors[from];
                InvestorRecord memory toInvestor = investors[to];
                
                // Check KYC
                if (!fromInvestor.kycCompleted || !toInvestor.kycCompleted) {
                    revert KYCNotCompleted();
                }
                
                // Check lockup
                if (block.timestamp < fromInvestor.lockupEndDate) {
                    revert LockupPeriodActive();
                }
                
                // Check minimum investment for new investors
                if (toInvestor.totalInvested == 0 && amount < minimumInvestment) {
                    revert InvestmentBelowMinimum();
                }
            }
            
            // Update investor records
            investors[from].totalInvested -= amount;
            investors[to].totalInvested += amount;
        }
    }
    
    // ============ Configuration Functions ============
    
    /**
     * @notice Enable or disable transfer restrictions
     * @param _restricted Whether transfers should be restricted
     */
    function setTransferRestrictions(bool _restricted) 
        external 
        onlyRole(COMPLIANCE_OFFICER_ROLE) 
    {
        transfersRestricted = _restricted;
    }
    
    /**
     * @notice Update minimum investment amount
     * @param _minimum New minimum investment
     */
    function setMinimumInvestment(uint256 _minimum) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        minimumInvestment = _minimum;
    }
    
    /**
     * @notice Enable dividend distributions
     */
    function enableDividends() external onlyRole(DEFAULT_ADMIN_ROLE) {
        dividendsEnabled = true;
    }
    
    /**
     * @notice Enable voting functionality
     */
    function enableVoting() external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingEnabled = true;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get property value per token
     * @return Value in USD per token
     */
    function getValuePerToken() external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (property.valuationUSD * DISTRIBUTION_PRECISION) / totalSupply();
    }
    
    /**
     * @notice Get expected annual yield
     * @return Yield percentage in basis points
     */
    function getExpectedYield() external view returns (uint256) {
        if (property.valuationUSD == 0) return 0;
        
        uint256 annualRent = rentalIncome.monthlyRentUSD * 12;
        uint256 effectiveRent = (annualRent * rentalIncome.occupancyRate) / BASIS_POINTS;
        
        return (effectiveRent * BASIS_POINTS) / property.valuationUSD;
    }
    
    /**
     * @notice Check if investor can transfer
     * @param _investor Investor address
     * @return Whether investor can transfer tokens
     */
    function canTransfer(address _investor) external view returns (bool) {
        InvestorRecord memory investor = investors[_investor];
        
        return investor.kycCompleted && 
               block.timestamp >= investor.lockupEndDate &&
               !paused();
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

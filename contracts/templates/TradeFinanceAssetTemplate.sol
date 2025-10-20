// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TradeFinanceAssetTemplate
 * @author Quantera Team
 * @notice Template for tokenizing trade finance instruments (LC, invoices, receivables)
 * @dev Short-term asset with automatic maturity and settlement
 */
contract TradeFinanceAssetTemplate is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable 
{
    // ============ Roles ============
    bytes32 public constant TRADE_ADMIN_ROLE = keccak256("TRADE_ADMIN");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR");

    // ============ Enums ============
    enum InstrumentType {
        LetterOfCredit,
        InvoiceReceivable,
        SupplyChainFinance,
        ExportCredit,
        WarehouseReceipt,
        BillOfLading
    }

    enum InstrumentStatus {
        Pending,
        Active,
        Matured,
        Settled,
        Defaulted,
        Disputed
    }

    // ============ Structs ============
    
    struct TradeInstrument {
        InstrumentType instrumentType;
        InstrumentStatus status;
        uint256 faceValue;
        uint256 discountRate; // Basis points
        uint256 issuanceDate;
        uint256 maturityDate;
        uint256 settlementDate;
        string referenceNumber;
        string documentHash; // IPFS hash of trade documents
    }

    struct TradeParties {
        address issuer;
        address beneficiary;
        string exporterName;
        string importerName;
        string issuingBank;
        string confirmingBank;
        string shipmentPort;
        string destinationPort;
    }

    struct Settlement {
        uint256 principalAmount;
        uint256 interestAmount;
        uint256 totalSettlement;
        uint256 settlementTimestamp;
        bool isSettled;
        address settlementToken;
    }

    struct InvestorPosition {
        uint256 investmentAmount;
        uint256 purchasePrice; // Price paid per token
        uint256 expectedReturn;
        uint256 actualReturn;
        uint256 investmentDate;
        bool hasClaimedSettlement;
    }

    // ============ State Variables ============
    TradeInstrument public instrument;
    TradeParties public parties;
    Settlement public settlement;
    
    mapping(address => InvestorPosition) public positions;
    address[] public investors;
    
    address public complianceModule;
    address public settlementToken; // USDC, USDT, etc.
    
    uint256 public minimumInvestment;
    uint256 public totalInvested;
    uint256 public totalReturned;
    
    bool public autoSettlementEnabled;
    bool public fractionalOwnershipEnabled;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DAYS_IN_YEAR = 365;
    
    // ============ Events ============
    event InstrumentCreated(
        InstrumentType indexed instrumentType,
        uint256 faceValue,
        uint256 maturityDate,
        string referenceNumber
    );
    event InvestmentMade(
        address indexed investor,
        uint256 amount,
        uint256 expectedReturn
    );
    event InstrumentMatured(uint256 maturityDate);
    event SettlementCompleted(
        uint256 principalAmount,
        uint256 interestAmount,
        uint256 totalSettlement
    );
    event ReturnsClaimed(address indexed investor, uint256 amount);
    event InstrumentDefaulted(string reason);
    event DocumentsUpdated(string newDocumentHash);
    event StatusChanged(InstrumentStatus oldStatus, InstrumentStatus newStatus);
    
    // ============ Custom Errors ============
    error InstrumentNotActive();
    error MaturityNotReached();
    error AlreadySettled();
    error InvestmentBelowMinimum();
    error InvestmentPeriodClosed();
    error NoReturnsAvailable();
    error SettlementFailed();
    error InvalidMaturityDate();
    error UnauthorizedOperation();
    error ExceedsFaceValue();
    
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
        _grantRole(TRADE_ADMIN_ROLE, msg.sender);
        _grantRole(SETTLEMENT_ROLE, msg.sender);
        
        complianceModule = _complianceModule;
        minimumInvestment = 1000 * (10 ** _decimals); // $1000 minimum
        fractionalOwnershipEnabled = true;
        autoSettlementEnabled = true;
        
        // Mint tokens representing the instrument
        _mint(msg.sender, _totalSupply);
    }
    
    // ============ Instrument Setup ============
    
    /**
     * @notice Configure trade instrument details
     * @param _instrumentType Type of trade finance instrument
     * @param _faceValue Face value of the instrument
     * @param _discountRate Discount rate in basis points
     * @param _maturityDate Maturity date timestamp
     * @param _referenceNumber Trade reference number
     * @param _documentHash IPFS hash of trade documents
     */
    function setupInstrument(
        InstrumentType _instrumentType,
        uint256 _faceValue,
        uint256 _discountRate,
        uint256 _maturityDate,
        string calldata _referenceNumber,
        string calldata _documentHash
    ) external onlyRole(TRADE_ADMIN_ROLE) {
        if (_maturityDate <= block.timestamp) revert InvalidMaturityDate();
        if (_faceValue == 0) revert InvalidMaturityDate();
        
        instrument.instrumentType = _instrumentType;
        instrument.status = InstrumentStatus.Pending;
        instrument.faceValue = _faceValue;
        instrument.discountRate = _discountRate;
        instrument.issuanceDate = block.timestamp;
        instrument.maturityDate = _maturityDate;
        instrument.referenceNumber = _referenceNumber;
        instrument.documentHash = _documentHash;
        
        emit InstrumentCreated(
            _instrumentType,
            _faceValue,
            _maturityDate,
            _referenceNumber
        );
    }
    
    /**
     * @notice Set trade party details
     * @param _exporterName Name of exporter
     * @param _importerName Name of importer
     * @param _issuingBank Issuing bank name
     * @param _confirmingBank Confirming bank name
     * @param _shipmentPort Port of shipment
     * @param _destinationPort Port of destination
     */
    function setTradeParties(
        string calldata _exporterName,
        string calldata _importerName,
        string calldata _issuingBank,
        string calldata _confirmingBank,
        string calldata _shipmentPort,
        string calldata _destinationPort
    ) external onlyRole(TRADE_ADMIN_ROLE) {
        parties.exporterName = _exporterName;
        parties.importerName = _importerName;
        parties.issuingBank = _issuingBank;
        parties.confirmingBank = _confirmingBank;
        parties.shipmentPort = _shipmentPort;
        parties.destinationPort = _destinationPort;
        parties.issuer = msg.sender;
    }
    
    /**
     * @notice Activate instrument for investment
     */
    function activateInstrument() external onlyRole(VALIDATOR_ROLE) {
        if (instrument.status != InstrumentStatus.Pending) {
            revert InstrumentNotActive();
        }
        
        instrument.status = InstrumentStatus.Active;
        emit StatusChanged(InstrumentStatus.Pending, InstrumentStatus.Active);
    }
    
    // ============ Investment Functions ============
    
    /**
     * @notice Invest in trade finance instrument
     * @param _amount Amount to invest
     */
    function invest(uint256 _amount) external whenNotPaused {
        if (instrument.status != InstrumentStatus.Active) {
            revert InstrumentNotActive();
        }
        if (_amount < minimumInvestment) {
            revert InvestmentBelowMinimum();
        }
        if (totalInvested + _amount > instrument.faceValue) {
            revert ExceedsFaceValue();
        }
        if (block.timestamp >= instrument.maturityDate) {
            revert InvestmentPeriodClosed();
        }
        
        // Calculate expected return
        uint256 timeToMaturity = instrument.maturityDate - block.timestamp;
        uint256 daysToMaturity = timeToMaturity / 1 days;
        uint256 interestRate = instrument.discountRate;
        uint256 expectedInterest = (_amount * interestRate * daysToMaturity) / (BASIS_POINTS * DAYS_IN_YEAR);
        uint256 expectedReturn = _amount + expectedInterest;
        
        // Record position
        InvestorPosition storage position = positions[msg.sender];
        if (position.investmentAmount == 0) {
            investors.push(msg.sender);
        }
        
        position.investmentAmount += _amount;
        position.purchasePrice = _amount * 1e18 / totalSupply(); // Price per token
        position.expectedReturn += expectedReturn;
        position.investmentDate = block.timestamp;
        
        totalInvested += _amount;
        
        // Transfer tokens to investor
        _transfer(address(this), msg.sender, _amount);
        
        emit InvestmentMade(msg.sender, _amount, expectedReturn);
    }
    
    // ============ Settlement Functions ============
    
    /**
     * @notice Check if instrument has matured
     */
    function checkMaturity() external {
        if (block.timestamp >= instrument.maturityDate && 
            instrument.status == InstrumentStatus.Active) {
            
            instrument.status = InstrumentStatus.Matured;
            emit InstrumentMatured(instrument.maturityDate);
            
            if (autoSettlementEnabled) {
                _executeSettlement();
            }
        }
    }
    
    /**
     * @notice Execute settlement at maturity
     */
    function executeSettlement() external onlyRole(SETTLEMENT_ROLE) {
        _executeSettlement();
    }
    
    /**
     * @notice Internal settlement execution
     */
    function _executeSettlement() private {
        if (instrument.status != InstrumentStatus.Matured) {
            revert MaturityNotReached();
        }
        if (settlement.isSettled) {
            revert AlreadySettled();
        }
        
        // Calculate settlement amounts
        uint256 principal = instrument.faceValue;
        uint256 timeHeld = instrument.maturityDate - instrument.issuanceDate;
        uint256 daysHeld = timeHeld / 1 days;
        uint256 interest = (principal * instrument.discountRate * daysHeld) / (BASIS_POINTS * DAYS_IN_YEAR);
        uint256 total = principal + interest;
        
        settlement.principalAmount = principal;
        settlement.interestAmount = interest;
        settlement.totalSettlement = total;
        settlement.settlementTimestamp = block.timestamp;
        settlement.isSettled = true;
        settlement.settlementToken = settlementToken;
        
        instrument.status = InstrumentStatus.Settled;
        instrument.settlementDate = block.timestamp;
        
        totalReturned = total;
        
        emit SettlementCompleted(principal, interest, total);
        emit StatusChanged(InstrumentStatus.Matured, InstrumentStatus.Settled);
    }
    
    /**
     * @notice Claim settlement returns
     */
    function claimReturns() external whenNotPaused {
        if (!settlement.isSettled) {
            revert MaturityNotReached();
        }
        
        InvestorPosition storage position = positions[msg.sender];
        if (position.investmentAmount == 0) {
            revert NoReturnsAvailable();
        }
        if (position.hasClaimedSettlement) {
            revert NoReturnsAvailable();
        }
        
        // Calculate pro-rata share of settlement
        uint256 investorShare = (position.investmentAmount * 1e18) / totalInvested;
        uint256 returnAmount = (settlement.totalSettlement * investorShare) / 1e18;
        
        position.actualReturn = returnAmount;
        position.hasClaimedSettlement = true;
        
        // Burn investor's tokens
        _burn(msg.sender, position.investmentAmount);
        
        // Transfer returns (in production, would transfer actual settlement tokens)
        // For now, we emit the event
        emit ReturnsClaimed(msg.sender, returnAmount);
    }
    
    // ============ Default Handling ============
    
    /**
     * @notice Mark instrument as defaulted
     * @param _reason Reason for default
     */
    function markDefault(string calldata _reason) 
        external 
        onlyRole(TRADE_ADMIN_ROLE) 
    {
        if (instrument.status == InstrumentStatus.Settled) {
            revert AlreadySettled();
        }
        
        InstrumentStatus oldStatus = instrument.status;
        instrument.status = InstrumentStatus.Defaulted;
        
        emit InstrumentDefaulted(_reason);
        emit StatusChanged(oldStatus, InstrumentStatus.Defaulted);
    }
    
    // ============ Document Management ============
    
    /**
     * @notice Update trade documents
     * @param _newDocumentHash New IPFS hash
     */
    function updateDocuments(string calldata _newDocumentHash) 
        external 
        onlyRole(TRADE_ADMIN_ROLE) 
    {
        instrument.documentHash = _newDocumentHash;
        emit DocumentsUpdated(_newDocumentHash);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Calculate current discount value
     * @return Current discounted value
     */
    function getCurrentValue() external view returns (uint256) {
        if (instrument.status != InstrumentStatus.Active) {
            return 0;
        }
        
        uint256 timeToMaturity = 0;
        if (block.timestamp < instrument.maturityDate) {
            timeToMaturity = instrument.maturityDate - block.timestamp;
        }
        
        uint256 daysToMaturity = timeToMaturity / 1 days;
        uint256 discountAmount = (instrument.faceValue * instrument.discountRate * daysToMaturity) / 
                                 (BASIS_POINTS * DAYS_IN_YEAR);
        
        return instrument.faceValue - discountAmount;
    }
    
    /**
     * @notice Get investor count
     * @return Number of investors
     */
    function getInvestorCount() external view returns (uint256) {
        return investors.length;
    }
    
    /**
     * @notice Get days until maturity
     * @return Days remaining
     */
    function getDaysToMaturity() external view returns (uint256) {
        if (block.timestamp >= instrument.maturityDate) {
            return 0;
        }
        return (instrument.maturityDate - block.timestamp) / 1 days;
    }
    
    /**
     * @notice Get expected APY
     * @return APY in basis points
     */
    function getExpectedAPY() external view returns (uint256) {
        return instrument.discountRate;
    }
    
    /**
     * @notice Check if can invest
     * @return Whether investment is open
     */
    function canInvest() external view returns (bool) {
        return instrument.status == InstrumentStatus.Active &&
               block.timestamp < instrument.maturityDate &&
               totalInvested < instrument.faceValue &&
               !paused();
    }
    
    // ============ Configuration ============
    
    /**
     * @notice Set settlement token address
     * @param _token Settlement token address
     */
    function setSettlementToken(address _token) 
        external 
        onlyRole(TRADE_ADMIN_ROLE) 
    {
        settlementToken = _token;
    }
    
    /**
     * @notice Set auto settlement
     * @param _enabled Whether to auto-settle at maturity
     */
    function setAutoSettlement(bool _enabled) 
        external 
        onlyRole(TRADE_ADMIN_ROLE) 
    {
        autoSettlementEnabled = _enabled;
    }
    
    /**
     * @notice Set maturity date (for instruments with flexible maturity)
     * @param _maturityDate New maturity date
     */
    function setMaturityDate(uint256 _maturityDate) 
        external 
        onlyRole(TRADE_ADMIN_ROLE) 
    {
        if (_maturityDate <= block.timestamp) revert InvalidMaturityDate();
        if (instrument.status != InstrumentStatus.Active) revert InstrumentNotActive();
        
        instrument.maturityDate = _maturityDate;
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

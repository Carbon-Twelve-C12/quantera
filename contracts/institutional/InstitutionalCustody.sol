// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title InstitutionalCustody
 * @dev Provides institutional-grade custody solutions with multi-custodial arrangements
 * Addresses WEF report's emphasis on flexible custodial arrangements for tokenized assets
 * Supports segregated accounts, multi-signature controls, and regulatory compliance
 */
contract InstitutionalCustody is Ownable, Pausable, ReentrancyGuard {
    using Math for uint256;

    // Custody arrangement types
    enum CustodyType {
        SELF_CUSTODY,           // Institution manages own keys
        THIRD_PARTY_CUSTODY,    // External custodian
        HYBRID_CUSTODY,         // Combination of self and third-party
        MULTI_SIG_CUSTODY,      // Multi-signature arrangement
        DELEGATED_CUSTODY       // Delegated to authorized parties
    }

    // Account segregation levels
    enum SegregationLevel {
        OMNIBUS,                // Pooled account
        SEGREGATED,             // Individual segregated account
        INDIVIDUALLY_SEGREGATED // Fully isolated individual account
    }

    // Institutional account structure
    struct InstitutionalAccount {
        address institution;
        string institutionName;
        CustodyType custodyType;
        SegregationLevel segregationLevel;
        address[] custodians;           // Authorized custodians
        address[] signatories;          // Multi-sig signatories
        uint256 requiredSignatures;    // Required signatures for transactions
        mapping(address => uint256) assetBalances;
        mapping(address => bool) authorizedAssets;
        bool isActive;
        uint256 createdAt;
        uint256 lastActivity;
        string jurisdiction;
        bytes32 complianceHash;         // Hash of compliance documentation
    }

    // Custodian information
    struct CustodianInfo {
        address custodianAddress;
        string name;
        string license;
        string jurisdiction;
        bool isActive;
        uint256 totalAssetsUnderCustody;
        uint256 registrationDate;
        mapping(address => bool) authorizedInstitutions;
    }

    // Transaction proposal for multi-sig operations
    struct TransactionProposal {
        uint256 proposalId;
        address institution;
        address asset;
        address to;
        uint256 amount;
        string description;
        address[] approvers;
        uint256 approvalsCount;
        uint256 requiredApprovals;
        bool executed;
        uint256 createdAt;
        uint256 expiresAt;
        mapping(address => bool) hasApproved;
    }

    // State variables
    mapping(address => InstitutionalAccount) public institutionalAccounts;
    mapping(address => CustodianInfo) public custodians;
    mapping(uint256 => TransactionProposal) public transactionProposals;
    mapping(address => uint256[]) public institutionProposals;
    
    address[] public registeredInstitutions;
    address[] public registeredCustodians;
    uint256 public nextProposalId = 1;
    
    // Configuration parameters
    uint256 public constant MAX_CUSTODIANS_PER_ACCOUNT = 10;
    uint256 public constant MAX_SIGNATORIES_PER_ACCOUNT = 20;
    uint256 public constant PROPOSAL_EXPIRY_TIME = 7 days;
    uint256 public constant MIN_REQUIRED_SIGNATURES = 2;
    
    // Fees and limits
    uint256 public custodyFeeRate = 25; // 0.25% annual custody fee
    uint256 public transactionFeeFlat = 10 * 10**18; // 10 tokens flat fee
    address public feeCollector;
    uint256 public totalFeesCollected;

    // Events
    event InstitutionalAccountCreated(
        address indexed institution,
        CustodyType custodyType,
        SegregationLevel segregationLevel,
        address[] custodians
    );
    
    event CustodianRegistered(
        address indexed custodian,
        string name,
        string jurisdiction,
        string license
    );
    
    event AssetDeposited(
        address indexed institution,
        address indexed asset,
        uint256 amount,
        address indexed custodian
    );
    
    event AssetWithdrawn(
        address indexed institution,
        address indexed asset,
        uint256 amount,
        address to
    );
    
    event TransactionProposed(
        uint256 indexed proposalId,
        address indexed institution,
        address indexed asset,
        uint256 amount,
        address to
    );
    
    event TransactionApproved(
        uint256 indexed proposalId,
        address indexed approver,
        uint256 approvalsCount,
        uint256 requiredApprovals
    );
    
    event TransactionExecuted(
        uint256 indexed proposalId,
        address indexed institution,
        address indexed asset,
        uint256 amount
    );
    
    event CustodyArrangementUpdated(
        address indexed institution,
        CustodyType newCustodyType,
        address[] newCustodians
    );

    // Modifiers
    modifier onlyInstitution() {
        require(institutionalAccounts[msg.sender].isActive, "Not an active institution");
        _;
    }

    modifier onlyAuthorizedCustodian(address institution) {
        require(_isAuthorizedCustodian(institution, msg.sender), "Not authorized custodian");
        _;
    }

    modifier onlySignatory(address institution) {
        require(_isSignatory(institution, msg.sender), "Not authorized signatory");
        _;
    }

    modifier validProposal(uint256 proposalId) {
        require(proposalId < nextProposalId, "Invalid proposal ID");
        require(!transactionProposals[proposalId].executed, "Proposal already executed");
        require(block.timestamp <= transactionProposals[proposalId].expiresAt, "Proposal expired");
        _;
    }

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Register a new custodian
     */
    function registerCustodian(
        address _custodianAddress,
        string memory _name,
        string memory _license,
        string memory _jurisdiction
    ) external onlyOwner {
        require(_custodianAddress != address(0), "Invalid custodian address");
        require(bytes(_name).length > 0, "Custodian name required");
        require(!custodians[_custodianAddress].isActive, "Custodian already registered");

        custodians[_custodianAddress].custodianAddress = _custodianAddress;
        custodians[_custodianAddress].name = _name;
        custodians[_custodianAddress].license = _license;
        custodians[_custodianAddress].jurisdiction = _jurisdiction;
        custodians[_custodianAddress].isActive = true;
        custodians[_custodianAddress].registrationDate = block.timestamp;

        registeredCustodians.push(_custodianAddress);

        emit CustodianRegistered(_custodianAddress, _name, _jurisdiction, _license);
    }

    /**
     * @dev Create institutional custody account
     */
    function createInstitutionalAccount(
        address _institution,
        string memory _institutionName,
        CustodyType _custodyType,
        SegregationLevel _segregationLevel,
        address[] memory _custodians,
        address[] memory _signatories,
        uint256 _requiredSignatures,
        string memory _jurisdiction,
        bytes32 _complianceHash
    ) external onlyOwner {
        require(_institution != address(0), "Invalid institution address");
        require(bytes(_institutionName).length > 0, "Institution name required");
        require(_custodians.length <= MAX_CUSTODIANS_PER_ACCOUNT, "Too many custodians");
        require(_signatories.length <= MAX_SIGNATORIES_PER_ACCOUNT, "Too many signatories");
        require(_requiredSignatures >= MIN_REQUIRED_SIGNATURES, "Insufficient required signatures");
        require(_requiredSignatures <= _signatories.length, "Required signatures exceed signatories");
        require(!institutionalAccounts[_institution].isActive, "Institution already registered");

        // Validate custodians
        for (uint256 i = 0; i < _custodians.length; i++) {
            require(custodians[_custodians[i]].isActive, "Invalid custodian");
        }

        InstitutionalAccount storage account = institutionalAccounts[_institution];
        account.institution = _institution;
        account.institutionName = _institutionName;
        account.custodyType = _custodyType;
        account.segregationLevel = _segregationLevel;
        account.custodians = _custodians;
        account.signatories = _signatories;
        account.requiredSignatures = _requiredSignatures;
        account.isActive = true;
        account.createdAt = block.timestamp;
        account.lastActivity = block.timestamp;
        account.jurisdiction = _jurisdiction;
        account.complianceHash = _complianceHash;

        registeredInstitutions.push(_institution);

        emit InstitutionalAccountCreated(_institution, _custodyType, _segregationLevel, _custodians);
    }

    /**
     * @dev Deposit assets into institutional custody
     */
    function depositAsset(
        address _institution,
        address _asset,
        uint256 _amount
    ) external onlyAuthorizedCustodian(_institution) nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(institutionalAccounts[_institution].authorizedAssets[_asset], "Asset not authorized");

        // Transfer asset to custody contract
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);

        // Update balances
        institutionalAccounts[_institution].assetBalances[_asset] += _amount;
        institutionalAccounts[_institution].lastActivity = block.timestamp;

        // Update custodian statistics
        custodians[msg.sender].totalAssetsUnderCustody += _amount;

        emit AssetDeposited(_institution, _asset, _amount, msg.sender);
    }

    /**
     * @dev Propose asset withdrawal (for multi-sig accounts)
     */
    function proposeWithdrawal(
        address _asset,
        address _to,
        uint256 _amount,
        string memory _description
    ) external onlyInstitution returns (uint256) {
        require(_amount > 0, "Amount must be greater than zero");
        require(_to != address(0), "Invalid recipient address");
        require(institutionalAccounts[msg.sender].assetBalances[_asset] >= _amount, "Insufficient balance");

        uint256 proposalId = nextProposalId++;
        TransactionProposal storage proposal = transactionProposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.institution = msg.sender;
        proposal.asset = _asset;
        proposal.to = _to;
        proposal.amount = _amount;
        proposal.description = _description;
        proposal.requiredApprovals = institutionalAccounts[msg.sender].requiredSignatures;
        proposal.createdAt = block.timestamp;
        proposal.expiresAt = block.timestamp + PROPOSAL_EXPIRY_TIME;

        institutionProposals[msg.sender].push(proposalId);

        emit TransactionProposed(proposalId, msg.sender, _asset, _amount, _to);
        return proposalId;
    }

    /**
     * @dev Approve transaction proposal
     */
    function approveTransaction(uint256 _proposalId) 
        external 
        validProposal(_proposalId) 
        onlySignatory(transactionProposals[_proposalId].institution) 
    {
        TransactionProposal storage proposal = transactionProposals[_proposalId];
        require(!proposal.hasApproved[msg.sender], "Already approved");

        proposal.hasApproved[msg.sender] = true;
        proposal.approvalsCount++;
        proposal.approvers.push(msg.sender);

        emit TransactionApproved(_proposalId, msg.sender, proposal.approvalsCount, proposal.requiredApprovals);

        // Auto-execute if enough approvals
        if (proposal.approvalsCount >= proposal.requiredApprovals) {
            _executeTransaction(_proposalId);
        }
    }

    /**
     * @dev Execute approved transaction
     */
    function executeTransaction(uint256 _proposalId) external validProposal(_proposalId) {
        TransactionProposal storage proposal = transactionProposals[_proposalId];
        require(proposal.approvalsCount >= proposal.requiredApprovals, "Insufficient approvals");
        
        _executeTransaction(_proposalId);
    }

    /**
     * @dev Internal function to execute transaction
     */
    function _executeTransaction(uint256 _proposalId) internal {
        TransactionProposal storage proposal = transactionProposals[_proposalId];
        
        // Update balances
        institutionalAccounts[proposal.institution].assetBalances[proposal.asset] -= proposal.amount;
        institutionalAccounts[proposal.institution].lastActivity = block.timestamp;

        // Calculate and collect fees
        uint256 fee = transactionFeeFlat;
        if (proposal.amount > fee) {
            totalFeesCollected += fee;
            IERC20(proposal.asset).transfer(proposal.to, proposal.amount - fee);
            IERC20(proposal.asset).transfer(feeCollector, fee);
        } else {
            IERC20(proposal.asset).transfer(proposal.to, proposal.amount);
        }

        proposal.executed = true;

        emit TransactionExecuted(_proposalId, proposal.institution, proposal.asset, proposal.amount);
        emit AssetWithdrawn(proposal.institution, proposal.asset, proposal.amount, proposal.to);
    }

    /**
     * @dev Authorize asset for institution
     */
    function authorizeAsset(address _institution, address _asset) external onlyOwner {
        institutionalAccounts[_institution].authorizedAssets[_asset] = true;
    }

    /**
     * @dev Update custody arrangement
     */
    function updateCustodyArrangement(
        address _institution,
        CustodyType _newCustodyType,
        address[] memory _newCustodians,
        uint256 _newRequiredSignatures
    ) external onlyOwner {
        require(institutionalAccounts[_institution].isActive, "Institution not found");
        require(_newCustodians.length <= MAX_CUSTODIANS_PER_ACCOUNT, "Too many custodians");

        // Validate new custodians
        for (uint256 i = 0; i < _newCustodians.length; i++) {
            require(custodians[_newCustodians[i]].isActive, "Invalid custodian");
        }

        institutionalAccounts[_institution].custodyType = _newCustodyType;
        institutionalAccounts[_institution].custodians = _newCustodians;
        institutionalAccounts[_institution].requiredSignatures = _newRequiredSignatures;

        emit CustodyArrangementUpdated(_institution, _newCustodyType, _newCustodians);
    }

    /**
     * @dev Get institution account details
     */
    function getInstitutionAccount(address _institution) external view returns (
        string memory institutionName,
        CustodyType custodyType,
        SegregationLevel segregationLevel,
        address[] memory custodiansList,
        address[] memory signatories,
        uint256 requiredSignatures,
        bool isActive,
        string memory jurisdiction
    ) {
        InstitutionalAccount storage account = institutionalAccounts[_institution];
        return (
            account.institutionName,
            account.custodyType,
            account.segregationLevel,
            account.custodians,
            account.signatories,
            account.requiredSignatures,
            account.isActive,
            account.jurisdiction
        );
    }

    /**
     * @dev Get asset balance for institution
     */
    function getAssetBalance(address _institution, address _asset) external view returns (uint256) {
        return institutionalAccounts[_institution].assetBalances[_asset];
    }

    /**
     * @dev Get transaction proposal details
     */
    function getTransactionProposal(uint256 _proposalId) external view returns (
        address institution,
        address asset,
        address to,
        uint256 amount,
        string memory description,
        address[] memory approvers,
        uint256 approvalsCount,
        uint256 requiredApprovals,
        bool executed,
        uint256 createdAt,
        uint256 expiresAt
    ) {
        TransactionProposal storage proposal = transactionProposals[_proposalId];
        return (
            proposal.institution,
            proposal.asset,
            proposal.to,
            proposal.amount,
            proposal.description,
            proposal.approvers,
            proposal.approvalsCount,
            proposal.requiredApprovals,
            proposal.executed,
            proposal.createdAt,
            proposal.expiresAt
        );
    }

    /**
     * @dev Get institution proposals
     */
    function getInstitutionProposals(address _institution) external view returns (uint256[] memory) {
        return institutionProposals[_institution];
    }

    /**
     * @dev Get all registered institutions
     */
    function getRegisteredInstitutions() external view returns (address[] memory) {
        return registeredInstitutions;
    }

    /**
     * @dev Get all registered custodians
     */
    function getRegisteredCustodians() external view returns (address[] memory) {
        return registeredCustodians;
    }

    // Internal helper functions

    /**
     * @dev Check if address is authorized custodian for institution
     */
    function _isAuthorizedCustodian(address _institution, address _custodian) internal view returns (bool) {
        address[] memory custodiansList = institutionalAccounts[_institution].custodians;
        for (uint256 i = 0; i < custodiansList.length; i++) {
            if (custodiansList[i] == _custodian) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Check if address is authorized signatory for institution
     */
    function _isSignatory(address _institution, address _signatory) internal view returns (bool) {
        address[] memory signatories = institutionalAccounts[_institution].signatories;
        for (uint256 i = 0; i < signatories.length; i++) {
            if (signatories[i] == _signatory) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Update custody fee rate
     */
    function updateCustodyFeeRate(uint256 _newFeeRate) external onlyOwner {
        require(_newFeeRate <= 500, "Fee rate cannot exceed 5%"); // Max 5%
        custodyFeeRate = _newFeeRate;
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees to withdraw");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        payable(feeCollector).transfer(amount);
    }
} 
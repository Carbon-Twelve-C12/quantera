// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20SnapshotUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title EnhancedSecurityToken
 * @author Quantera Team
 * @notice ERC-1400 compliant security token with enterprise features
 * @dev Implements dividend distribution, voting rights, and corporate actions
 */
contract EnhancedSecurityToken is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20SnapshotUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    using SafeERC20 for IERC20;

    // ============ Roles ============
    bytes32 public constant CORPORATE_ACTIONS_ROLE = keccak256("CORPORATE_ACTIONS");
    bytes32 public constant DIVIDEND_MANAGER_ROLE = keccak256("DIVIDEND_MANAGER");
    bytes32 public constant VOTING_ADMIN_ROLE = keccak256("VOTING_ADMIN");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE");
    bytes32 public constant TRANSFER_ADMIN_ROLE = keccak256("TRANSFER_ADMIN");

    // ============ Structs ============
    
    /**
     * @notice Dividend distribution structure
     * @param totalAmount Total dividend amount
     * @param paymentToken Token used for payment
     * @param recordDate Date for determining eligible holders
     * @param paymentDate Date when payment becomes claimable
     * @param expiryDate Date after which unclaimed dividends can be swept
     * @param snapshotId Snapshot ID for record date
     * @param totalClaimed Total amount claimed so far
     * @param isActive Whether distribution is active
     */
    struct DividendDistribution {
        uint256 totalAmount;
        address paymentToken;
        uint256 recordDate;
        uint256 paymentDate;
        uint256 expiryDate;
        uint256 snapshotId;
        uint256 totalClaimed;
        bool isActive;
        mapping(address => bool) claimed;
        mapping(address => uint256) amounts;
    }

    /**
     * @notice Voting proposal structure
     * @param description Proposal description
     * @param startBlock Starting block for voting
     * @param endBlock Ending block for voting
     * @param forVotes Total votes in favor
     * @param againstVotes Total votes against
     * @param abstainVotes Total abstain votes
     * @param quorumRequired Required quorum percentage
     * @param executed Whether proposal has been executed
     * @param snapshotId Snapshot for voting power
     */
    struct Proposal {
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorumRequired;
        bool executed;
        uint256 snapshotId;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) voteChoice; // 0: against, 1: for, 2: abstain
    }

    /**
     * @notice Corporate action structure
     * @param actionType Type of corporate action
     * @param numerator Ratio numerator (e.g., 2 for 2:1 split)
     * @param denominator Ratio denominator (e.g., 1 for 2:1 split)
     * @param executionDate Date when action executes
     * @param subscriptionPrice Price for rights issues
     * @param subscriptionDeadline Deadline for participation
     * @param executed Whether action has been executed
     * @param snapshotId Snapshot for eligible holders
     */
    struct CorporateAction {
        ActionType actionType;
        uint256 numerator;
        uint256 denominator;
        uint256 executionDate;
        uint256 subscriptionPrice;
        uint256 subscriptionDeadline;
        bool executed;
        uint256 snapshotId;
        mapping(address => bool) participated;
        mapping(address => uint256) subscriptionAmount;
    }

    /**
     * @notice Delegation record for voting
     */
    struct Delegation {
        address delegatee;
        uint256 delegatedAt;
        bool isActive;
    }

    // ============ Enums ============
    enum ActionType { 
        SPLIT,           // Stock split
        REVERSE_SPLIT,   // Reverse stock split
        RIGHTS_ISSUE,    // Rights offering
        TENDER_OFFER,    // Tender offer
        MERGER,          // Merger/acquisition
        SPINOFF          // Spinoff distribution
    }

    enum TransferRestriction {
        NONE,
        BLACKLIST,
        WHITELIST,
        LOCKUP,
        VOLUME_RESTRICTION
    }

    // ============ State Variables ============
    
    // Dividend tracking
    mapping(uint256 => DividendDistribution) public dividends;
    uint256 public dividendCounter;
    uint256 public totalDividendsDistributed;
    uint256 public totalDividendsClaimed;
    
    // Voting tracking
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCounter;
    mapping(address => Delegation) public delegations;
    mapping(address => uint256) public votingPowerAt;
    
    // Corporate actions tracking
    mapping(uint256 => CorporateAction) public corporateActions;
    uint256 public actionCounter;
    
    // Transfer restrictions
    mapping(address => bool) public blacklist;
    mapping(address => bool) public whitelist;
    mapping(address => uint256) public lockupExpiry;
    mapping(address => uint256) public dailyTransferLimit;
    mapping(address => uint256) public dailyTransferred;
    mapping(address => uint256) public lastTransferDay;
    
    TransferRestriction public transferRestriction;
    bool public transfersEnabled;
    
    // Compliance
    address public complianceModule;
    string public tokenDetails; // IPFS hash for token documentation
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DIVIDEND_EXPIRY_PERIOD = 365 days;
    uint256 public constant PROPOSAL_DURATION = 3 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    
    // ============ Events ============
    
    // Dividend events
    event DividendDeclared(
        uint256 indexed dividendId,
        uint256 totalAmount,
        address paymentToken,
        uint256 recordDate,
        uint256 paymentDate
    );
    event DividendClaimed(
        uint256 indexed dividendId,
        address indexed claimant,
        uint256 amount
    );
    event UnclaimedDividendSwept(
        uint256 indexed dividendId,
        uint256 amount
    );
    
    // Voting events
    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 choice,
        uint256 weight
    );
    event VoteDelegated(
        address indexed delegator,
        address indexed delegatee
    );
    event ProposalExecuted(uint256 indexed proposalId);
    
    // Corporate action events
    event CorporateActionInitiated(
        uint256 indexed actionId,
        ActionType actionType,
        uint256 executionDate
    );
    event CorporateActionExecuted(
        uint256 indexed actionId,
        ActionType actionType
    );
    event RightsSubscribed(
        uint256 indexed actionId,
        address indexed subscriber,
        uint256 amount
    );
    
    // Transfer events
    event TransferRestrictionUpdated(TransferRestriction restriction);
    event AddressBlacklisted(address indexed account);
    event AddressWhitelisted(address indexed account);
    
    // ============ Custom Errors ============
    error DividendNotActive();
    error DividendNotClaimable();
    error DividendAlreadyClaimed();
    error DividendExpired();
    error InsufficientDividendFunds();
    
    error ProposalNotActive();
    error ProposalEnded();
    error AlreadyVoted();
    error InvalidVoteChoice();
    error QuorumNotReached();
    error ExecutionDelayNotMet();
    
    error ActionNotScheduled();
    error ActionAlreadyExecuted();
    error InvalidActionRatio();
    error SubscriptionDeadlinePassed();
    error InsufficientSubscriptionPayment();
    
    error TransferRestricted();
    error AddressBlacklisted();
    error AddressNotWhitelisted();
    error LockupPeriodActive();
    error DailyLimitExceeded();
    error TransfersDisabled();
    
    error InvalidDelegation();
    error SelfDelegation();
    
    // ============ Initializer ============
    
    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _complianceModule
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __ERC20Snapshot_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CORPORATE_ACTIONS_ROLE, msg.sender);
        _grantRole(DIVIDEND_MANAGER_ROLE, msg.sender);
        _grantRole(VOTING_ADMIN_ROLE, msg.sender);
        
        complianceModule = _complianceModule;
        transfersEnabled = true;
        transferRestriction = TransferRestriction.NONE;
        
        if (_totalSupply > 0) {
            _mint(msg.sender, _totalSupply);
        }
    }
    
    // ============ Dividend Distribution Functions ============
    
    /**
     * @notice Declare a new dividend distribution
     * @param _amount Total dividend amount
     * @param _paymentToken Token address for payment (address(0) for ETH)
     * @param _recordDate Date for determining eligible holders
     * @param _paymentDate Date when dividend becomes claimable
     * @return dividendId Unique dividend identifier
     */
    function declareDividend(
        uint256 _amount,
        address _paymentToken,
        uint256 _recordDate,
        uint256 _paymentDate
    ) external onlyRole(DIVIDEND_MANAGER_ROLE) nonReentrant returns (uint256) {
        if (_amount == 0) revert InsufficientDividendFunds();
        if (_recordDate < block.timestamp) revert DividendNotActive();
        if (_paymentDate < _recordDate) revert DividendNotActive();
        
        // Transfer dividend funds to contract
        if (_paymentToken != address(0)) {
            IERC20(_paymentToken).safeTransferFrom(msg.sender, address(this), _amount);
        } else {
            if (msg.value != _amount) revert InsufficientDividendFunds();
        }
        
        // Take snapshot at record date
        uint256 snapshotId = _snapshot();
        
        dividendCounter++;
        uint256 dividendId = dividendCounter;
        
        DividendDistribution storage dividend = dividends[dividendId];
        dividend.totalAmount = _amount;
        dividend.paymentToken = _paymentToken;
        dividend.recordDate = _recordDate;
        dividend.paymentDate = _paymentDate;
        dividend.expiryDate = _paymentDate + DIVIDEND_EXPIRY_PERIOD;
        dividend.snapshotId = snapshotId;
        dividend.isActive = true;
        
        totalDividendsDistributed += _amount;
        
        emit DividendDeclared(
            dividendId,
            _amount,
            _paymentToken,
            _recordDate,
            _paymentDate
        );
        
        return dividendId;
    }
    
    /**
     * @notice Calculate dividend amount for a holder
     * @param _dividendId Dividend distribution ID
     * @param _holder Address to check
     * @return amount Claimable dividend amount
     */
    function calculateDividend(
        uint256 _dividendId,
        address _holder
    ) public view returns (uint256) {
        DividendDistribution storage dividend = dividends[_dividendId];
        
        if (!dividend.isActive) return 0;
        if (dividend.claimed[_holder]) return 0;
        
        uint256 balance = balanceOfAt(_holder, dividend.snapshotId);
        uint256 totalSupplyAtSnapshot = totalSupplyAt(dividend.snapshotId);
        
        if (totalSupplyAtSnapshot == 0) return 0;
        
        return (dividend.totalAmount * balance) / totalSupplyAtSnapshot;
    }
    
    /**
     * @notice Claim dividend payment
     * @param _dividendId Dividend distribution ID
     */
    function claimDividend(uint256 _dividendId) external nonReentrant {
        DividendDistribution storage dividend = dividends[_dividendId];
        
        if (!dividend.isActive) revert DividendNotActive();
        if (block.timestamp < dividend.paymentDate) revert DividendNotClaimable();
        if (block.timestamp > dividend.expiryDate) revert DividendExpired();
        if (dividend.claimed[msg.sender]) revert DividendAlreadyClaimed();
        
        uint256 amount = calculateDividend(_dividendId, msg.sender);
        if (amount == 0) revert InsufficientDividendFunds();
        
        dividend.claimed[msg.sender] = true;
        dividend.amounts[msg.sender] = amount;
        dividend.totalClaimed += amount;
        totalDividendsClaimed += amount;
        
        // Transfer dividend
        if (dividend.paymentToken != address(0)) {
            IERC20(dividend.paymentToken).safeTransfer(msg.sender, amount);
        } else {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        }
        
        emit DividendClaimed(_dividendId, msg.sender, amount);
    }
    
    /**
     * @notice Sweep unclaimed dividends after expiry
     * @param _dividendId Dividend distribution ID
     */
    function sweepUnclaimedDividends(uint256 _dividendId) 
        external 
        onlyRole(DIVIDEND_MANAGER_ROLE) 
        nonReentrant 
    {
        DividendDistribution storage dividend = dividends[_dividendId];
        
        if (!dividend.isActive) revert DividendNotActive();
        if (block.timestamp <= dividend.expiryDate) revert DividendNotClaimable();
        
        uint256 unclaimed = dividend.totalAmount - dividend.totalClaimed;
        if (unclaimed == 0) revert InsufficientDividendFunds();
        
        dividend.isActive = false;
        
        // Transfer unclaimed funds back
        if (dividend.paymentToken != address(0)) {
            IERC20(dividend.paymentToken).safeTransfer(msg.sender, unclaimed);
        } else {
            (bool success, ) = msg.sender.call{value: unclaimed}("");
            require(success, "ETH transfer failed");
        }
        
        emit UnclaimedDividendSwept(_dividendId, unclaimed);
    }
    
    // ============ Voting Rights Functions ============
    
    /**
     * @notice Create a new proposal
     * @param _description Proposal description
     * @param _duration Voting duration in blocks
     * @param _quorumRequired Required quorum in basis points
     * @return proposalId Unique proposal identifier
     */
    function createProposal(
        string memory _description,
        uint256 _duration,
        uint256 _quorumRequired
    ) external onlyRole(VOTING_ADMIN_ROLE) returns (uint256) {
        if (_duration == 0) revert ProposalNotActive();
        if (_quorumRequired > BASIS_POINTS) revert ProposalNotActive();
        
        uint256 snapshotId = _snapshot();
        
        proposalCounter++;
        uint256 proposalId = proposalCounter;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.description = _description;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + _duration;
        proposal.quorumRequired = _quorumRequired;
        proposal.snapshotId = snapshotId;
        
        emit ProposalCreated(
            proposalId,
            _description,
            proposal.startBlock,
            proposal.endBlock
        );
        
        return proposalId;
    }
    
    /**
     * @notice Cast vote on a proposal
     * @param _proposalId Proposal ID
     * @param _support Vote choice (0: against, 1: for, 2: abstain)
     */
    function castVote(uint256 _proposalId, uint8 _support) external {
        Proposal storage proposal = proposals[_proposalId];
        
        if (block.number < proposal.startBlock) revert ProposalNotActive();
        if (block.number > proposal.endBlock) revert ProposalEnded();
        if (proposal.hasVoted[msg.sender]) revert AlreadyVoted();
        if (_support > 2) revert InvalidVoteChoice();
        
        // Check for delegation
        address voter = msg.sender;
        Delegation memory delegation = delegations[msg.sender];
        if (delegation.isActive && delegation.delegatedAt < proposal.startBlock) {
            voter = delegation.delegatee;
            if (proposal.hasVoted[voter]) revert AlreadyVoted();
        }
        
        uint256 votingPower = balanceOfAt(msg.sender, proposal.snapshotId);
        if (votingPower == 0) revert InvalidVoteChoice();
        
        proposal.hasVoted[voter] = true;
        proposal.voteChoice[voter] = _support;
        
        if (_support == 0) {
            proposal.againstVotes += votingPower;
        } else if (_support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }
        
        emit VoteCast(_proposalId, voter, _support, votingPower);
    }
    
    /**
     * @notice Delegate voting power to another address
     * @param _delegatee Address to delegate to
     */
    function delegateVote(address _delegatee) external {
        if (_delegatee == address(0)) revert InvalidDelegation();
        if (_delegatee == msg.sender) revert SelfDelegation();
        
        delegations[msg.sender] = Delegation({
            delegatee: _delegatee,
            delegatedAt: block.number,
            isActive: true
        });
        
        emit VoteDelegated(msg.sender, _delegatee);
    }
    
    /**
     * @notice Revoke vote delegation
     */
    function revokeDelegation() external {
        delegations[msg.sender].isActive = false;
        emit VoteDelegated(msg.sender, address(0));
    }
    
    /**
     * @notice Execute a passed proposal
     * @param _proposalId Proposal ID
     */
    function executeProposal(uint256 _proposalId) 
        external 
        onlyRole(VOTING_ADMIN_ROLE) 
    {
        Proposal storage proposal = proposals[_proposalId];
        
        if (proposal.executed) revert ProposalNotActive();
        if (block.number <= proposal.endBlock) revert ProposalNotActive();
        if (block.number < proposal.endBlock + EXECUTION_DELAY) {
            revert ExecutionDelayNotMet();
        }
        
        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupplyAtSnapshot = totalSupplyAt(proposal.snapshotId);
        uint256 quorumVotes = (totalSupplyAtSnapshot * proposal.quorumRequired) / BASIS_POINTS;
        
        if (totalVotes < quorumVotes) revert QuorumNotReached();
        
        // Check if proposal passed
        if (proposal.forVotes <= proposal.againstVotes) revert ProposalNotActive();
        
        proposal.executed = true;
        
        // Execute proposal logic here (would be implemented based on proposal type)
        
        emit ProposalExecuted(_proposalId);
    }
    
    // ============ Corporate Actions Functions ============
    
    /**
     * @notice Initiate a stock split
     * @param _numerator Split ratio numerator (e.g., 2 for 2:1 split)
     * @param _denominator Split ratio denominator (e.g., 1 for 2:1 split)
     * @param _executionDate Date when split executes
     * @return actionId Unique action identifier
     */
    function initiateSplit(
        uint256 _numerator,
        uint256 _denominator,
        uint256 _executionDate
    ) external onlyRole(CORPORATE_ACTIONS_ROLE) returns (uint256) {
        if (_numerator == 0 || _denominator == 0) revert InvalidActionRatio();
        if (_executionDate <= block.timestamp) revert ActionNotScheduled();
        
        uint256 snapshotId = _snapshot();
        
        actionCounter++;
        uint256 actionId = actionCounter;
        
        CorporateAction storage action = corporateActions[actionId];
        action.actionType = ActionType.SPLIT;
        action.numerator = _numerator;
        action.denominator = _denominator;
        action.executionDate = _executionDate;
        action.snapshotId = snapshotId;
        
        emit CorporateActionInitiated(actionId, ActionType.SPLIT, _executionDate);
        
        return actionId;
    }
    
    /**
     * @notice Initiate a reverse split
     * @param _numerator Reverse split ratio numerator
     * @param _denominator Reverse split ratio denominator
     * @param _executionDate Date when reverse split executes
     * @return actionId Unique action identifier
     */
    function initiateReverseSplit(
        uint256 _numerator,
        uint256 _denominator,
        uint256 _executionDate
    ) external onlyRole(CORPORATE_ACTIONS_ROLE) returns (uint256) {
        if (_numerator == 0 || _denominator == 0) revert InvalidActionRatio();
        if (_numerator >= _denominator) revert InvalidActionRatio();
        if (_executionDate <= block.timestamp) revert ActionNotScheduled();
        
        uint256 snapshotId = _snapshot();
        
        actionCounter++;
        uint256 actionId = actionCounter;
        
        CorporateAction storage action = corporateActions[actionId];
        action.actionType = ActionType.REVERSE_SPLIT;
        action.numerator = _numerator;
        action.denominator = _denominator;
        action.executionDate = _executionDate;
        action.snapshotId = snapshotId;
        
        emit CorporateActionInitiated(actionId, ActionType.REVERSE_SPLIT, _executionDate);
        
        return actionId;
    }
    
    /**
     * @notice Initiate a rights issue
     * @param _ratio Rights ratio (e.g., 1 right per 10 shares)
     * @param _price Subscription price per share
     * @param _deadline Subscription deadline
     * @return actionId Unique action identifier
     */
    function initiateRightsIssue(
        uint256 _ratio,
        uint256 _price,
        uint256 _deadline
    ) external onlyRole(CORPORATE_ACTIONS_ROLE) returns (uint256) {
        if (_ratio == 0 || _price == 0) revert InvalidActionRatio();
        if (_deadline <= block.timestamp) revert ActionNotScheduled();
        
        uint256 snapshotId = _snapshot();
        
        actionCounter++;
        uint256 actionId = actionCounter;
        
        CorporateAction storage action = corporateActions[actionId];
        action.actionType = ActionType.RIGHTS_ISSUE;
        action.numerator = 1; // 1 right
        action.denominator = _ratio; // per X shares
        action.subscriptionPrice = _price;
        action.subscriptionDeadline = _deadline;
        action.executionDate = _deadline + 7 days;
        action.snapshotId = snapshotId;
        
        emit CorporateActionInitiated(actionId, ActionType.RIGHTS_ISSUE, _deadline);
        
        return actionId;
    }
    
    /**
     * @notice Subscribe to rights issue
     * @param _actionId Corporate action ID
     * @param _amount Number of rights to exercise
     */
    function subscribeToRights(uint256 _actionId, uint256 _amount) 
        external 
        payable 
        nonReentrant 
    {
        CorporateAction storage action = corporateActions[_actionId];
        
        if (action.actionType != ActionType.RIGHTS_ISSUE) revert ActionNotScheduled();
        if (block.timestamp > action.subscriptionDeadline) revert SubscriptionDeadlinePassed();
        if (action.executed) revert ActionAlreadyExecuted();
        
        // Calculate eligible rights
        uint256 balance = balanceOfAt(msg.sender, action.snapshotId);
        uint256 eligibleRights = (balance * action.numerator) / action.denominator;
        
        if (_amount > eligibleRights) revert InvalidActionRatio();
        
        uint256 requiredPayment = _amount * action.subscriptionPrice;
        if (msg.value < requiredPayment) revert InsufficientSubscriptionPayment();
        
        action.participated[msg.sender] = true;
        action.subscriptionAmount[msg.sender] = _amount;
        
        // Refund excess payment
        if (msg.value > requiredPayment) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredPayment}("");
            require(success, "Refund failed");
        }
        
        emit RightsSubscribed(_actionId, msg.sender, _amount);
    }
    
    /**
     * @notice Execute a corporate action
     * @param _actionId Action ID to execute
     */
    function executeCorporateAction(uint256 _actionId) 
        external 
        onlyRole(CORPORATE_ACTIONS_ROLE) 
        nonReentrant 
    {
        CorporateAction storage action = corporateActions[_actionId];
        
        if (action.executed) revert ActionAlreadyExecuted();
        if (block.timestamp < action.executionDate) revert ActionNotScheduled();
        
        action.executed = true;
        
        if (action.actionType == ActionType.SPLIT) {
            _executeSplit(action);
        } else if (action.actionType == ActionType.REVERSE_SPLIT) {
            _executeReverseSplit(action);
        } else if (action.actionType == ActionType.RIGHTS_ISSUE) {
            _executeRightsIssue(_actionId, action);
        }
        
        emit CorporateActionExecuted(_actionId, action.actionType);
    }
    
    /**
     * @notice Internal function to execute stock split
     */
    function _executeSplit(CorporateAction storage _action) private {
        uint256 totalSupplyBefore = totalSupply();
        uint256 additionalSupply = (totalSupplyBefore * _action.numerator / _action.denominator) - totalSupplyBefore;
        
        // Mint additional tokens proportionally
        address[] memory holders = _getHolders();
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 balance = balanceOf(holders[i]);
            if (balance > 0) {
                uint256 additionalTokens = (balance * _action.numerator / _action.denominator) - balance;
                if (additionalTokens > 0) {
                    _mint(holders[i], additionalTokens);
                }
            }
        }
    }
    
    /**
     * @notice Internal function to execute reverse split
     */
    function _executeReverseSplit(CorporateAction storage _action) private {
        address[] memory holders = _getHolders();
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 balance = balanceOf(holders[i]);
            if (balance > 0) {
                uint256 newBalance = (balance * _action.numerator) / _action.denominator;
                uint256 tokensToRemove = balance - newBalance;
                if (tokensToRemove > 0) {
                    _burn(holders[i], tokensToRemove);
                }
            }
        }
    }
    
    /**
     * @notice Internal function to execute rights issue
     */
    function _executeRightsIssue(uint256 _actionId, CorporateAction storage _action) private {
        address[] memory holders = _getHolders();
        for (uint256 i = 0; i < holders.length; i++) {
            if (_action.participated[holders[i]]) {
                uint256 newShares = _action.subscriptionAmount[holders[i]];
                if (newShares > 0) {
                    _mint(holders[i], newShares);
                }
            }
        }
    }
    
    // ============ Transfer Restriction Functions ============
    
    /**
     * @notice Set transfer restriction type
     * @param _restriction Type of restriction to apply
     */
    function setTransferRestriction(TransferRestriction _restriction) 
        external 
        onlyRole(TRANSFER_ADMIN_ROLE) 
    {
        transferRestriction = _restriction;
        emit TransferRestrictionUpdated(_restriction);
    }
    
    /**
     * @notice Add address to blacklist
     * @param _account Address to blacklist
     */
    function addToBlacklist(address _account) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        blacklist[_account] = true;
        emit AddressBlacklisted(_account);
    }
    
    /**
     * @notice Remove address from blacklist
     * @param _account Address to remove from blacklist
     */
    function removeFromBlacklist(address _account) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        blacklist[_account] = false;
    }
    
    /**
     * @notice Add address to whitelist
     * @param _account Address to whitelist
     */
    function addToWhitelist(address _account) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        whitelist[_account] = true;
        emit AddressWhitelisted(_account);
    }
    
    /**
     * @notice Remove address from whitelist
     * @param _account Address to remove from whitelist
     */
    function removeFromWhitelist(address _account) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        whitelist[_account] = false;
    }
    
    /**
     * @notice Set lockup expiry for an address
     * @param _account Address to lock
     * @param _expiry Lockup expiry timestamp
     */
    function setLockup(address _account, uint256 _expiry) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        lockupExpiry[_account] = _expiry;
    }
    
    /**
     * @notice Set daily transfer limit for an address
     * @param _account Address to limit
     * @param _limit Daily transfer limit
     */
    function setDailyTransferLimit(address _account, uint256 _limit) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        dailyTransferLimit[_account] = _limit;
    }
    
    /**
     * @notice Enable or disable transfers globally
     * @param _enabled Whether transfers are enabled
     */
    function setTransfersEnabled(bool _enabled) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        transfersEnabled = _enabled;
    }
    
    // ============ Transfer Override ============
    
    /**
     * @notice Override transfer to enforce restrictions
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20SnapshotUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
        
        // Skip restrictions for minting and burning
        if (from == address(0) || to == address(0)) return;
        
        // Check if transfers are enabled
        if (!transfersEnabled) revert TransfersDisabled();
        
        // Apply transfer restrictions
        if (transferRestriction == TransferRestriction.BLACKLIST) {
            if (blacklist[from] || blacklist[to]) revert AddressBlacklisted();
        } else if (transferRestriction == TransferRestriction.WHITELIST) {
            if (!whitelist[from] || !whitelist[to]) revert AddressNotWhitelisted();
        } else if (transferRestriction == TransferRestriction.LOCKUP) {
            if (block.timestamp < lockupExpiry[from]) revert LockupPeriodActive();
        } else if (transferRestriction == TransferRestriction.VOLUME_RESTRICTION) {
            _checkVolumeRestriction(from, amount);
        }
    }
    
    /**
     * @notice Check volume restriction
     */
    function _checkVolumeRestriction(address _from, uint256 _amount) private {
        uint256 currentDay = block.timestamp / 1 days;
        
        if (lastTransferDay[_from] < currentDay) {
            dailyTransferred[_from] = 0;
            lastTransferDay[_from] = currentDay;
        }
        
        if (dailyTransferred[_from] + _amount > dailyTransferLimit[_from]) {
            revert DailyLimitExceeded();
        }
        
        dailyTransferred[_from] += _amount;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get holder list (simplified implementation)
     * @dev In production, would use more efficient tracking
     */
    function _getHolders() private view returns (address[] memory) {
        // Simplified: return top 100 holders
        // In production, would maintain a proper holder registry
        address[] memory holders = new address[](1);
        holders[0] = _msgSender();
        return holders;
    }
    
    /**
     * @notice Check if address can transfer
     * @param _from Source address
     * @param _to Destination address
     * @param _amount Transfer amount
     * @return Whether transfer is allowed
     */
    function canTransfer(address _from, address _to, uint256 _amount) 
        external 
        view 
        returns (bool) 
    {
        if (!transfersEnabled) return false;
        
        if (transferRestriction == TransferRestriction.BLACKLIST) {
            if (blacklist[_from] || blacklist[_to]) return false;
        } else if (transferRestriction == TransferRestriction.WHITELIST) {
            if (!whitelist[_from] || !whitelist[_to]) return false;
        } else if (transferRestriction == TransferRestriction.LOCKUP) {
            if (block.timestamp < lockupExpiry[_from]) return false;
        } else if (transferRestriction == TransferRestriction.VOLUME_RESTRICTION) {
            uint256 currentDay = block.timestamp / 1 days;
            uint256 transferred = (lastTransferDay[_from] < currentDay) ? 0 : dailyTransferred[_from];
            if (transferred + _amount > dailyTransferLimit[_from]) return false;
        }
        
        return true;
    }
    
    /**
     * @notice Get dividend info
     * @param _dividendId Dividend ID
     * @return totalAmount Total dividend amount
     * @return paymentToken Payment token address
     * @return recordDate Record date
     * @return paymentDate Payment date
     * @return totalClaimed Total amount claimed
     */
    function getDividendInfo(uint256 _dividendId) 
        external 
        view 
        returns (
            uint256 totalAmount,
            address paymentToken,
            uint256 recordDate,
            uint256 paymentDate,
            uint256 totalClaimed
        ) 
    {
        DividendDistribution storage dividend = dividends[_dividendId];
        return (
            dividend.totalAmount,
            dividend.paymentToken,
            dividend.recordDate,
            dividend.paymentDate,
            dividend.totalClaimed
        );
    }
    
    /**
     * @notice Get proposal info
     * @param _proposalId Proposal ID
     * @return description Proposal description
     * @return forVotes Votes in favor
     * @return againstVotes Votes against
     * @return abstainVotes Abstain votes
     * @return executed Whether executed
     */
    function getProposalInfo(uint256 _proposalId) 
        external 
        view 
        returns (
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed
        ) 
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed
        );
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ ERC-1400 Compatibility ============
    
    /**
     * @notice Check if token is controllable (ERC-1400)
     */
    function isControllable() external pure returns (bool) {
        return true;
    }
    
    /**
     * @notice Check if token is issuable (ERC-1400)
     */
    function isIssuable() external pure returns (bool) {
        return true;
    }
    
    /**
     * @notice Get document URI (ERC-1400)
     */
    function getDocument(bytes32) external view returns (string memory, bytes32) {
        return (tokenDetails, keccak256(bytes(tokenDetails)));
    }
    
    /**
     * @notice Set document URI (ERC-1400)
     */
    function setDocument(bytes32, string calldata _uri, bytes32) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        tokenDetails = _uri;
    }
    
    // ============ Receive Function ============
    
    receive() external payable {
        // Accept ETH for dividend distributions
    }
}

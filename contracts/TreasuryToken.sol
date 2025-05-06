// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITreasuryToken.sol";
import "./interfaces/ITreasuryRegistry.sol";
import "./interfaces/IComplianceModule.sol";

/**
 * @title TreasuryToken
 * @dev Implementation of the ERC-1400 compatible security token representing a treasury security
 * with enhanced features from Ethereum's Pectra upgrade (EIP-7702, EIP-2537)
 */
contract TreasuryToken is ITreasuryToken {
    // ERC-1400 token data
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    
    // Treasury-specific data
    bytes32 private _treasuryId;
    uint256 private _faceValue;
    uint256 private _yieldRate;
    uint256 private _issuanceDate;
    uint256 private _maturityDate;
    uint256 private _lastYieldDistribution;
    uint256 private _yieldDistributionInterval;
    address private _issuer;
    ITreasuryRegistry private _registry;
    IComplianceModule private _complianceModule;
    ITreasuryRegistry.TreasuryType private _treasuryType;
    
    // Mapping from token holder to balance
    mapping(address => uint256) private _balances;
    
    // Mapping of authorized operators
    mapping(address => mapping(address => bool)) private _authorizedOperator;
    
    // Mapping for smart account code storage (EIP-7702)
    mapping(address => bytes) private _accountCode;
    
    // Mapping for BLS signature verification (EIP-2537)
    mapping(bytes => bool) private _verifiedSignatures;
    
    // Mapping for pending yield
    mapping(address => uint256) private _pendingYield;
    
    // Error codes for ERC-1400
    byte constant private TRANSFER_FAILURE = 0x50;  // Transfer failure
    byte constant private INSUFFICIENT_BALANCE = 0x52;  // Insufficient balance
    byte constant private INSUFFICIENT_ALLOWANCE = 0x53;  // Insufficient allowance
    byte constant private TRANSFERS_HALTED = 0x54;  // Transfers halted
    byte constant private FUNDS_LOCKED = 0x55;  // Funds locked (related to maturity)
    byte constant private INVALID_SENDER = 0x56;  // Invalid sender
    byte constant private INVALID_RECEIVER = 0x57;  // Invalid receiver
    byte constant private INVALID_OPERATOR = 0x58;  // Invalid operator
    byte constant private COMPLIANCE_FAILURE = 0x5A;  // Compliance validation failed
    
    // Events (in addition to interface events)
    event TransferWithData(address indexed from, address indexed to, uint256 value, bytes data);
    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
    event RevokedOperator(address indexed operator, address indexed tokenHolder);
    
    /**
     * @dev Modifier to check if caller is the token issuer
     */
    modifier onlyIssuer() {
        require(msg.sender == _issuer, "TreasuryToken: caller is not the issuer");
        _;
    }
    
    /**
     * @dev Modifier to check if token has not matured
     */
    modifier notMatured() {
        require(block.timestamp < _maturityDate, "TreasuryToken: treasury has matured");
        _;
    }
    
    /**
     * @dev Modifier to check if token has matured
     */
    modifier hasMatured() {
        require(block.timestamp >= _maturityDate, "TreasuryToken: treasury has not matured yet");
        _;
    }
    
    /**
     * @dev Constructor to initialize the treasury token
     */
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        bytes32 treasuryId,
        ITreasuryRegistry.TreasuryType treasuryType,
        uint256 faceValue,
        uint256 yieldRate,
        uint256 issuanceDate,
        uint256 maturityDate,
        address issuer,
        address registryAddress,
        address complianceModuleAddress
    ) {
        _name = tokenName;
        _symbol = tokenSymbol;
        _decimals = 18;
        _totalSupply = totalSupply;
        _treasuryId = treasuryId;
        _treasuryType = treasuryType;
        _faceValue = faceValue;
        _yieldRate = yieldRate;
        _issuanceDate = issuanceDate;
        _maturityDate = maturityDate;
        _issuer = issuer;
        _registry = ITreasuryRegistry(registryAddress);
        _complianceModule = IComplianceModule(complianceModuleAddress);
        
        // Set yield distribution interval based on treasury type
        if (treasuryType == ITreasuryRegistry.TreasuryType.TBILL) {
            // T-Bills don't have regular yield distributions (zero-coupon)
            _yieldDistributionInterval = 0;
        } else if (treasuryType == ITreasuryRegistry.TreasuryType.TNOTE || treasuryType == ITreasuryRegistry.TreasuryType.TBOND) {
            // T-Notes and T-Bonds have semi-annual payments (approximately 182 days)
            _yieldDistributionInterval = 182 days;
        }
        
        // Initial supply goes to the issuer
        _balances[issuer] = totalSupply;
        
        // Set the initial yield distribution timestamp
        _lastYieldDistribution = issuanceDate;
    }
    
    /**
     * @dev ERC-1400 transfer function with compliance checks
     * @param to The address to transfer to
     * @param value The amount to transfer
     * @param data Additional data for compliance checks
     * @return Success status
     */
    function transferWithData(
        address to,
        uint256 value,
        bytes calldata data
    ) external override returns (bool) {
        // Check if transfer is valid
        (bool isValid, byte errorCode, bytes32 errorParam) = canTransfer(to, value, data);
        require(isValid, string(abi.encodePacked("TreasuryToken: transfer not valid, error code: ", errorCode)));
        
        _transfer(msg.sender, to, value);
        
        emit TransferWithData(msg.sender, to, value, data);
        return true;
    }
    
    /**
     * @dev Check if transfer is valid
     * @param to The address to transfer to
     * @param value The amount to transfer
     * @param data Additional data for compliance checks
     * @return Whether the transfer is valid, an error code if not, and any additional data
     */
    function canTransfer(
        address to,
        uint256 value,
        bytes calldata data
    ) public view override returns (bool, byte, bytes32) {
        // Check basic conditions
        if (to == address(0)) {
            return (false, INVALID_RECEIVER, bytes32(0));
        }
        
        if (_balances[msg.sender] < value) {
            return (false, INSUFFICIENT_BALANCE, bytes32(0));
        }
        
        // Check if treasury has matured
        if (block.timestamp >= _maturityDate) {
            ITreasuryRegistry.TreasuryInfo memory info = _registry.getTreasuryDetails(_treasuryId);
            if (info.status == ITreasuryRegistry.TreasuryStatus.REDEEMED) {
                return (false, TRANSFERS_HALTED, bytes32(0));
            }
        }
        
        // Check compliance
        (bool compliant, bytes memory complianceData) = _complianceModule.checkCompliance(
            msg.sender,
            to,
            value,
            _treasuryId
        );
        
        if (!compliant) {
            return (false, COMPLIANCE_FAILURE, bytes32(complianceData.length > 32 ? bytes32(complianceData[0:32]) : bytes32(0)));
        }
        
        return (true, 0x00, bytes32(0));
    }
    
    /**
     * @dev Distribute yield to token holders
     * @return Success status
     */
    function distributeYield() external override onlyIssuer notMatured returns (bool) {
        // T-Bills don't have regular yield distributions
        if (_treasuryType == ITreasuryRegistry.TreasuryType.TBILL) {
            return false;
        }
        
        // Check if enough time has passed since last distribution
        require(
            block.timestamp >= _lastYieldDistribution + _yieldDistributionInterval,
            "TreasuryToken: not enough time passed since last yield distribution"
        );
        
        // Calculate total yield amount
        uint256 totalYieldAmount = (_totalSupply * _yieldRate) / 10000; // yield rate is in basis points (1% = 100)
        
        // Update yield distribution timestamp
        _lastYieldDistribution = block.timestamp;
        
        // Calculate and store yield for each holder
        address[] memory holders = _getTokenHolders();
        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            if (_balances[holder] > 0) {
                uint256 holderYield = (totalYieldAmount * _balances[holder]) / _totalSupply;
                _pendingYield[holder] += holderYield;
            }
        }
        
        emit YieldDistributed(totalYieldAmount, block.timestamp);
        return true;
    }
    
    /**
     * @dev Calculate yield amount for token holder
     * @param holder The address of the token holder
     * @return The yield amount for the holder
     */
    function calculateYieldAmount(address holder) external view override returns (uint256) {
        return _pendingYield[holder];
    }
    
    /**
     * @dev Process maturity of the treasury
     * @return Success status
     */
    function processMaturity() external override hasMatured returns (bool) {
        // Can only be called by issuer or registry admin
        require(
            msg.sender == _issuer || msg.sender == _registry.admin(),
            "TreasuryToken: caller is not authorized to process maturity"
        );
        
        // Get treasury info from registry
        ITreasuryRegistry.TreasuryInfo memory info = _registry.getTreasuryDetails(_treasuryId);
        
        // Check if already matured in the registry
        if (info.status == ITreasuryRegistry.TreasuryStatus.MATURED) {
            return false;
        }
        
        // Update status in registry
        _registry.updateTreasuryStatus(_treasuryId, ITreasuryRegistry.TreasuryStatus.MATURED);
        
        emit TreasuryMatured(_treasuryId, _maturityDate);
        return true;
    }
    
    /**
     * @dev Redeem tokens at maturity
     * @param amount The amount of tokens to redeem
     * @return Success status
     */
    function redeem(uint256 amount) external override hasMatured returns (bool) {
        require(_balances[msg.sender] >= amount, "TreasuryToken: insufficient balance for redemption");
        
        // Get treasury info from registry
        ITreasuryRegistry.TreasuryInfo memory info = _registry.getTreasuryDetails(_treasuryId);
        
        // Check if treasury is in MATURED state
        require(
            info.status == ITreasuryRegistry.TreasuryStatus.MATURED,
            "TreasuryToken: treasury not in MATURED state"
        );
        
        // Burn tokens
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        
        // Transfer any pending yield
        uint256 yieldAmount = _pendingYield[msg.sender];
        if (yieldAmount > 0) {
            _pendingYield[msg.sender] = 0;
        }
        
        // If all tokens are redeemed, update status to REDEEMED
        if (_totalSupply == 0) {
            _registry.updateTreasuryStatus(_treasuryId, ITreasuryRegistry.TreasuryStatus.REDEEMED);
        }
        
        emit TokensRedeemed(msg.sender, amount);
        return true;
    }
    
    /**
     * @dev Issue new tokens (restricted to issuer)
     * @param to The address to issue tokens to
     * @param amount The amount of tokens to issue
     * @return Success status
     */
    function issue(address to, uint256 amount) external override onlyIssuer notMatured returns (bool) {
        require(to != address(0), "TreasuryToken: issue to the zero address");
        
        // Increase total supply and balance
        _totalSupply += amount;
        _balances[to] += amount;
        
        emit TokensIssued(to, amount);
        return true;
    }
    
    /**
     * @dev Set smart account code (EIP-7702)
     * @param code The code to set for the account
     * @return Success status
     */
    function setAccountCode(bytes calldata code) external override returns (bool) {
        // Store the account code
        _accountCode[msg.sender] = code;
        
        // Calculate code hash
        bytes32 codeHash = keccak256(code);
        
        emit AccountCodeSet(msg.sender, codeHash);
        return true;
    }
    
    /**
     * @dev Execute smart account logic
     * @param data The data to execute
     * @return The result of the execution
     */
    function executeAccountCode(bytes calldata data) external override returns (bytes memory) {
        // Check if account has code
        bytes storage code = _accountCode[msg.sender];
        require(code.length > 0, "TreasuryToken: account has no code");
        
        // Calculate data hash for event
        bytes32 dataHash = keccak256(data);
        
        // This is a simplified execution since we can't actually execute arbitrary code in Solidity
        // In a real implementation, this would use EIP-7702 capabilities to execute the account code
        
        // For simulation purposes, we'll just emit an event and return a concatenation of code and data
        bytes memory result = abi.encodePacked(code, data);
        bytes32 resultHash = keccak256(result);
        
        emit AccountCodeExecuted(msg.sender, dataHash, resultHash);
        
        return result;
    }
    
    /**
     * @dev Validate BLS signature for institutional operations (EIP-2537)
     * @param signature The BLS signature
     * @param message The message that was signed
     * @param publicKey The public key to validate against
     * @return Whether the signature is valid
     */
    function validateBLSSignature(
        bytes calldata signature,
        bytes calldata message,
        bytes calldata publicKey
    ) external override returns (bool) {
        // Calculate signature hash for tracking
        bytes32 signatureHash = keccak256(signature);
        bytes32 messageHash = keccak256(message);
        
        // Check if signature has been verified before
        bytes memory sigMsgKey = abi.encodePacked(signatureHash, messageHash);
        if (_verifiedSignatures[sigMsgKey]) {
            return true;
        }
        
        // In a real implementation, this would call the EIP-2537 precompile
        // For simulation purposes, we'll just validate the public key format
        
        // Basic validation: public key should be 48 bytes for BLS12-381
        bool valid = publicKey.length == 48;
        
        // Store verification result
        if (valid) {
            _verifiedSignatures[sigMsgKey] = true;
        }
        
        emit BLSSignatureVerified(signatureHash, messageHash, valid);
        
        return valid;
    }
    
    /**
     * @dev Get the balance of an account
     * @param account The address to query the balance of
     * @return The account balance
     */
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Get the total supply of tokens
     * @return The total token supply
     */
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * @dev Get the name of the token
     * @return The name of the token
     */
    function name() external view override returns (string memory) {
        return _name;
    }
    
    /**
     * @dev Get the symbol of the token
     * @return The symbol of the token
     */
    function symbol() external view override returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev Get the decimals of the token
     * @return The decimals of the token
     */
    function decimals() external view override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Get the treasury ID
     * @return The unique identifier for the treasury
     */
    function treasuryId() external view override returns (bytes32) {
        return _treasuryId;
    }
    
    /**
     * @dev Get the treasury type
     * @return The type of treasury
     */
    function treasuryType() external view override returns (ITreasuryRegistry.TreasuryType) {
        return _treasuryType;
    }
    
    /**
     * @dev Get the face value of the treasury
     * @return The face value of the treasury
     */
    function faceValue() external view override returns (uint256) {
        return _faceValue;
    }
    
    /**
     * @dev Get the yield rate of the treasury
     * @return The yield rate of the treasury
     */
    function yieldRate() external view override returns (uint256) {
        return _yieldRate;
    }
    
    /**
     * @dev Get the issuance date of the treasury
     * @return The issuance date of the treasury
     */
    function issuanceDate() external view override returns (uint256) {
        return _issuanceDate;
    }
    
    /**
     * @dev Get the maturity date of the treasury
     * @return The maturity date of the treasury
     */
    function maturityDate() external view override returns (uint256) {
        return _maturityDate;
    }
    
    /**
     * @dev Get the address of the issuer
     * @return The address of the issuer
     */
    function issuer() external view override returns (address) {
        return _issuer;
    }
    
    /**
     * @dev Authorize an operator to transfer tokens on behalf of sender
     * @param operator The address to authorize
     */
    function authorizeOperator(address operator) external {
        require(operator != msg.sender, "TreasuryToken: authorizing self as operator");
        _authorizedOperator[msg.sender][operator] = true;
        emit AuthorizedOperator(operator, msg.sender);
    }
    
    /**
     * @dev Revoke operator authorization
     * @param operator The address to revoke
     */
    function revokeOperator(address operator) external {
        require(operator != msg.sender, "TreasuryToken: revoking self as operator");
        _authorizedOperator[msg.sender][operator] = false;
        emit RevokedOperator(operator, msg.sender);
    }
    
    /**
     * @dev Check if an address is an operator for a token holder
     * @param operator The address to check
     * @param tokenHolder The token holder
     * @return Whether the operator is authorized
     */
    function isOperator(address operator, address tokenHolder) public view returns (bool) {
        return operator == tokenHolder || _authorizedOperator[tokenHolder][operator];
    }
    
    /**
     * @dev Claim pending yield for the caller
     * @return The amount of yield claimed
     */
    function claimYield() external returns (uint256) {
        uint256 yieldAmount = _pendingYield[msg.sender];
        require(yieldAmount > 0, "TreasuryToken: no yield to claim");
        
        _pendingYield[msg.sender] = 0;
        
        // In a real implementation, this would transfer the yield amount to the user
        // This could be via stablecoin transfer or other mechanism
        
        return yieldAmount;
    }
    
    /**
     * @dev Internal transfer function
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param value The amount to transfer
     */
    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "TreasuryToken: transfer from the zero address");
        require(to != address(0), "TreasuryToken: transfer to the zero address");
        require(_balances[from] >= value, "TreasuryToken: insufficient balance");
        
        // Transfer tokens
        _balances[from] -= value;
        _balances[to] += value;
        
        // Transfer pro-rata pending yield
        if (_pendingYield[from] > 0) {
            uint256 yieldToTransfer = (_pendingYield[from] * value) / _balances[from] + value;
            _pendingYield[from] -= yieldToTransfer;
            _pendingYield[to] += yieldToTransfer;
        }
    }
    
    /**
     * @dev Get all token holders (simplified - in a real implementation this would be more efficient)
     * @return Array of token holder addresses
     */
    function _getTokenHolders() internal view returns (address[] memory) {
        // This is a placeholder implementation
        // In a real contract, we would maintain a separate array or mapping to track holders
        // For now, we're just returning the issuer as a placeholder
        address[] memory holders = new address[](1);
        holders[0] = _issuer;
        return holders;
    }
} 
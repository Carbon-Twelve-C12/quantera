// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IERC3643.sol";
import "./interfaces/IComplianceModule.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title ComplianceAwareToken
 * @dev Implementation of ERC-3643 (T-REX Protocol) for regulatory compliance
 * Addresses WEF report requirement for compliance-embedded tokens
 * Supports multiple jurisdictions and regulatory frameworks
 */
contract ComplianceAwareToken is ERC20, IERC3643, Ownable, Pausable, ReentrancyGuard {
    // Identity Registry for KYC/AML compliance
    IComplianceModule public complianceModule;
    IIdentityRegistry public identityRegistry;
    
    // Token information embedded in contract
    struct TokenInfo {
        string assetClass;          // Real Estate, Commodities, Securities, etc.
        string jurisdiction;        // US, EU, SG, etc.
        string regulatoryFramework; // SEC, MiCA, MAS, etc.
        uint256 minimumInvestment;  // Minimum investment amount
        bool fractionalAllowed;     // Whether fractional ownership is allowed
        uint256 maxHolders;         // Maximum number of token holders
        bool transfersEnabled;      // Whether transfers are currently enabled
    }
    
    TokenInfo public tokenInfo;
    
    // Compliance tracking
    mapping(address => bool) public frozenAddresses;
    mapping(address => uint256) public lastTransferTime;
    mapping(string => bool) public supportedJurisdictions;
    
    // Events for compliance tracking
    event ComplianceModuleSet(address indexed complianceModule);
    event IdentityRegistrySet(address indexed identityRegistry);
    event AddressFrozen(address indexed account, string reason);
    event AddressUnfrozen(address indexed account);
    event TransferBlocked(address indexed from, address indexed to, uint256 amount, string reason);
    event ComplianceCheckPassed(address indexed from, address indexed to, uint256 amount);
    
    // Modifiers
    modifier onlyCompliant(address _from, address _to, uint256 _amount) {
        require(!frozenAddresses[_from], "Sender address is frozen");
        require(!frozenAddresses[_to], "Recipient address is frozen");
        require(tokenInfo.transfersEnabled, "Transfers are currently disabled");
        
        bool isCompliant = complianceModule.canTransfer(_from, _to, _amount);
        if (!isCompliant) {
            string memory reason = complianceModule.getTransferBlockReason(_from, _to, _amount);
            emit TransferBlocked(_from, _to, _amount, reason);
            revert(string(abi.encodePacked("Transfer not compliant: ", reason)));
        }
        
        emit ComplianceCheckPassed(_from, _to, _amount);
        _;
    }
    
    modifier onlyVerifiedIdentity(address _address) {
        require(
            identityRegistry.isVerified(_address),
            "Address not verified in identity registry"
        );
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        TokenInfo memory _tokenInfo,
        address _complianceModule,
        address _identityRegistry
    ) ERC20(_name, _symbol) {
        tokenInfo = _tokenInfo;
        complianceModule = IComplianceModule(_complianceModule);
        identityRegistry = IIdentityRegistry(_identityRegistry);
        
        // Add initial supported jurisdiction
        supportedJurisdictions[_tokenInfo.jurisdiction] = true;
        
        emit ComplianceModuleSet(_complianceModule);
        emit IdentityRegistrySet(_identityRegistry);
    }
    
    /**
     * @dev Override transfer to include compliance checks
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused
        onlyCompliant(msg.sender, to, amount)
        onlyVerifiedIdentity(msg.sender)
        onlyVerifiedIdentity(to)
        returns (bool) 
    {
        _updateTransferTime(msg.sender);
        _checkHolderLimit(to);
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to include compliance checks
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused
        onlyCompliant(from, to, amount)
        onlyVerifiedIdentity(from)
        onlyVerifiedIdentity(to)
        returns (bool) 
    {
        _updateTransferTime(from);
        _checkHolderLimit(to);
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Mint tokens with compliance checks
     */
    function mint(address to, uint256 amount) 
        external 
        onlyOwner 
        whenNotPaused
        onlyVerifiedIdentity(to)
        nonReentrant
    {
        require(amount >= tokenInfo.minimumInvestment, "Amount below minimum investment");
        _checkHolderLimit(to);
        
        // Check if compliance module allows minting
        require(
            complianceModule.canTransfer(address(0), to, amount),
            "Minting not compliant"
        );
        
        _mint(to, amount);
        emit ComplianceCheckPassed(address(0), to, amount);
    }
    
    /**
     * @dev Burn tokens with compliance checks
     */
    function burn(address from, uint256 amount) 
        external 
        onlyOwner 
        whenNotPaused
        nonReentrant
    {
        require(
            complianceModule.canTransfer(from, address(0), amount),
            "Burning not compliant"
        );
        
        _burn(from, amount);
        emit ComplianceCheckPassed(from, address(0), amount);
    }
    
    /**
     * @dev Freeze an address for compliance reasons
     */
    function freezeAddress(address account, string memory reason) 
        external 
        onlyOwner 
    {
        frozenAddresses[account] = true;
        emit AddressFrozen(account, reason);
    }
    
    /**
     * @dev Unfreeze an address
     */
    function unfreezeAddress(address account) 
        external 
        onlyOwner 
    {
        frozenAddresses[account] = false;
        emit AddressUnfrozen(account);
    }
    
    /**
     * @dev Update compliance module
     */
    function setComplianceModule(address _complianceModule) 
        external 
        onlyOwner 
    {
        complianceModule = IComplianceModule(_complianceModule);
        emit ComplianceModuleSet(_complianceModule);
    }
    
    /**
     * @dev Update identity registry
     */
    function setIdentityRegistry(address _identityRegistry) 
        external 
        onlyOwner 
    {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistrySet(_identityRegistry);
    }
    
    /**
     * @dev Add supported jurisdiction
     */
    function addSupportedJurisdiction(string memory jurisdiction) 
        external 
        onlyOwner 
    {
        supportedJurisdictions[jurisdiction] = true;
    }
    
    /**
     * @dev Remove supported jurisdiction
     */
    function removeSupportedJurisdiction(string memory jurisdiction) 
        external 
        onlyOwner 
    {
        supportedJurisdictions[jurisdiction] = false;
    }
    
    /**
     * @dev Enable or disable transfers
     */
    function setTransfersEnabled(bool enabled) 
        external 
        onlyOwner 
    {
        tokenInfo.transfersEnabled = enabled;
    }
    
    /**
     * @dev Update token information
     */
    function updateTokenInfo(TokenInfo memory _tokenInfo) 
        external 
        onlyOwner 
    {
        tokenInfo = _tokenInfo;
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
     * @dev Get compliance status for a potential transfer
     */
    function getComplianceStatus(address from, address to, uint256 amount) 
        external 
        view 
        returns (bool isCompliant, string memory reason) 
    {
        if (frozenAddresses[from]) {
            return (false, "Sender address is frozen");
        }
        if (frozenAddresses[to]) {
            return (false, "Recipient address is frozen");
        }
        if (!tokenInfo.transfersEnabled) {
            return (false, "Transfers are currently disabled");
        }
        if (!identityRegistry.isVerified(from)) {
            return (false, "Sender not verified");
        }
        if (!identityRegistry.isVerified(to)) {
            return (false, "Recipient not verified");
        }
        
        bool moduleCompliant = complianceModule.canTransfer(from, to, amount);
        if (!moduleCompliant) {
            string memory moduleReason = complianceModule.getTransferBlockReason(from, to, amount);
            return (false, moduleReason);
        }
        
        return (true, "Transfer is compliant");
    }
    
    /**
     * @dev Get detailed token information
     */
    function getTokenInfo() 
        external 
        view 
        returns (TokenInfo memory) 
    {
        return tokenInfo;
    }
    
    /**
     * @dev Check if address is frozen
     */
    function isAddressFrozen(address account) 
        external 
        view 
        returns (bool) 
    {
        return frozenAddresses[account];
    }
    
    /**
     * @dev Get current number of holders
     */
    function getHolderCount() 
        external 
        view 
        returns (uint256) 
    {
        // This would need to be implemented with a holder tracking mechanism
        // For now, returning 0 as placeholder
        return 0;
    }
    
    /**
     * @dev Internal function to update last transfer time
     */
    function _updateTransferTime(address account) internal {
        lastTransferTime[account] = block.timestamp;
    }
    
    /**
     * @dev Internal function to check holder limit
     */
    function _checkHolderLimit(address to) internal view {
        if (balanceOf(to) == 0 && tokenInfo.maxHolders > 0) {
            // This would need proper holder counting implementation
            // For now, we'll skip this check
        }
    }
    
    /**
     * @dev Override _beforeTokenTransfer to add additional checks
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Additional pre-transfer checks can be added here
        if (from != address(0) && to != address(0)) {
            // Check minimum transfer amount for fractional restrictions
            if (!tokenInfo.fractionalAllowed) {
                require(amount >= 1 ether, "Fractional transfers not allowed");
            }
        }
    }
} 
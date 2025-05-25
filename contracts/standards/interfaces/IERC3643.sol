// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC3643
 * @dev Interface for the ERC3643 standard (T-REX Protocol)
 * This interface defines the standard for compliance-aware tokens
 * that can enforce regulatory requirements at the smart contract level
 */
interface IERC3643 is IERC20 {
    
    /**
     * @dev Returns the compliance module address
     */
    function complianceModule() external view returns (address);
    
    /**
     * @dev Returns the identity registry address
     */
    function identityRegistry() external view returns (address);
    
    /**
     * @dev Checks if a transfer is compliant
     * @param from The address sending tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens to transfer
     * @return isCompliant Whether the transfer is compliant
     * @return reason The reason if transfer is not compliant
     */
    function getComplianceStatus(
        address from, 
        address to, 
        uint256 amount
    ) external view returns (bool isCompliant, string memory reason);
    
    /**
     * @dev Freezes an address for compliance reasons
     * @param account The address to freeze
     * @param reason The reason for freezing
     */
    function freezeAddress(address account, string memory reason) external;
    
    /**
     * @dev Unfreezes an address
     * @param account The address to unfreeze
     */
    function unfreezeAddress(address account) external;
    
    /**
     * @dev Checks if an address is frozen
     * @param account The address to check
     * @return Whether the address is frozen
     */
    function isAddressFrozen(address account) external view returns (bool);
    
    /**
     * @dev Mints tokens to a compliant address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external;
    
    /**
     * @dev Burns tokens from an address
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external;
    
    /**
     * @dev Sets the compliance module
     * @param complianceModule The new compliance module address
     */
    function setComplianceModule(address complianceModule) external;
    
    /**
     * @dev Sets the identity registry
     * @param identityRegistry The new identity registry address
     */
    function setIdentityRegistry(address identityRegistry) external;
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() external;
    
    /**
     * @dev Unpauses token transfers
     */
    function unpause() external;
    
    /**
     * @dev Returns the current number of token holders
     */
    function getHolderCount() external view returns (uint256);
    
    // Events
    event ComplianceModuleSet(address indexed complianceModule);
    event IdentityRegistrySet(address indexed identityRegistry);
    event AddressFrozen(address indexed account, string reason);
    event AddressUnfrozen(address indexed account);
    event TransferBlocked(address indexed from, address indexed to, uint256 amount, string reason);
    event ComplianceCheckPassed(address indexed from, address indexed to, uint256 amount);
} 
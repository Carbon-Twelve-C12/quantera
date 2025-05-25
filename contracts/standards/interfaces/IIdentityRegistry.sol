// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIdentityRegistry
 * @dev Interface for identity registry that manages KYC/AML verification
 * Supports multiple identity providers and verification levels
 */
interface IIdentityRegistry {
    
    // Verification levels
    enum VerificationLevel {
        None,           // No verification
        Basic,          // Basic KYC
        Enhanced,       // Enhanced KYC + AML
        Institutional,  // Institutional verification
        Accredited      // Accredited investor verification
    }
    
    // Identity information structure
    struct Identity {
        bool isVerified;
        VerificationLevel level;
        string jurisdiction;
        uint256 verificationDate;
        uint256 expirationDate;
        address verifier;
        bytes32 identityHash;
        bool isAccredited;
        bool isInstitutional;
    }
    
    /**
     * @dev Checks if an address is verified
     * @param account The address to check
     * @return Whether the address is verified
     */
    function isVerified(address account) external view returns (bool);
    
    /**
     * @dev Gets the verification level of an address
     * @param account The address to check
     * @return The verification level
     */
    function getVerificationLevel(address account) external view returns (VerificationLevel);
    
    /**
     * @dev Gets the complete identity information for an address
     * @param account The address to check
     * @return The identity information
     */
    function getIdentity(address account) external view returns (Identity memory);
    
    /**
     * @dev Checks if an address is an accredited investor
     * @param account The address to check
     * @return Whether the address is accredited
     */
    function isAccreditedInvestor(address account) external view returns (bool);
    
    /**
     * @dev Checks if an address is an institutional investor
     * @param account The address to check
     * @return Whether the address is institutional
     */
    function isInstitutionalInvestor(address account) external view returns (bool);
    
    /**
     * @dev Gets the jurisdiction of an address
     * @param account The address to check
     * @return The jurisdiction code
     */
    function getJurisdiction(address account) external view returns (string memory);
    
    /**
     * @dev Checks if verification has expired
     * @param account The address to check
     * @return Whether verification has expired
     */
    function isVerificationExpired(address account) external view returns (bool);
    
    /**
     * @dev Registers a new identity
     * @param account The address to register
     * @param level The verification level
     * @param jurisdiction The jurisdiction code
     * @param expirationDate The expiration date of verification
     * @param identityHash The hash of identity documents
     * @param isAccredited Whether the investor is accredited
     * @param isInstitutional Whether the investor is institutional
     */
    function registerIdentity(
        address account,
        VerificationLevel level,
        string memory jurisdiction,
        uint256 expirationDate,
        bytes32 identityHash,
        bool isAccredited,
        bool isInstitutional
    ) external;
    
    /**
     * @dev Updates an existing identity
     * @param account The address to update
     * @param level The new verification level
     * @param jurisdiction The new jurisdiction code
     * @param expirationDate The new expiration date
     * @param identityHash The new identity hash
     * @param isAccredited Whether the investor is accredited
     * @param isInstitutional Whether the investor is institutional
     */
    function updateIdentity(
        address account,
        VerificationLevel level,
        string memory jurisdiction,
        uint256 expirationDate,
        bytes32 identityHash,
        bool isAccredited,
        bool isInstitutional
    ) external;
    
    /**
     * @dev Revokes verification for an address
     * @param account The address to revoke
     * @param reason The reason for revocation
     */
    function revokeVerification(address account, string memory reason) external;
    
    /**
     * @dev Renews verification for an address
     * @param account The address to renew
     * @param newExpirationDate The new expiration date
     */
    function renewVerification(address account, uint256 newExpirationDate) external;
    
    /**
     * @dev Adds an authorized verifier
     * @param verifier The address of the verifier
     * @param name The name of the verifier
     */
    function addVerifier(address verifier, string memory name) external;
    
    /**
     * @dev Removes an authorized verifier
     * @param verifier The address of the verifier
     */
    function removeVerifier(address verifier) external;
    
    /**
     * @dev Checks if an address is an authorized verifier
     * @param verifier The address to check
     * @return Whether the address is an authorized verifier
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool);
    
    /**
     * @dev Gets the list of all verified addresses
     * @return Array of verified addresses
     */
    function getVerifiedAddresses() external view returns (address[] memory);
    
    /**
     * @dev Gets the count of verified addresses
     * @return The number of verified addresses
     */
    function getVerifiedAddressCount() external view returns (uint256);
    
    /**
     * @dev Gets verified addresses by jurisdiction
     * @param jurisdiction The jurisdiction code
     * @return Array of verified addresses in the jurisdiction
     */
    function getVerifiedAddressesByJurisdiction(
        string memory jurisdiction
    ) external view returns (address[] memory);
    
    /**
     * @dev Gets verified addresses by verification level
     * @param level The verification level
     * @return Array of verified addresses with the specified level
     */
    function getVerifiedAddressesByLevel(
        VerificationLevel level
    ) external view returns (address[] memory);
    
    /**
     * @dev Batch verification for multiple addresses
     * @param accounts Array of addresses to verify
     * @param levels Array of verification levels
     * @param jurisdictions Array of jurisdiction codes
     * @param expirationDates Array of expiration dates
     * @param identityHashes Array of identity hashes
     * @param accreditedFlags Array of accredited flags
     * @param institutionalFlags Array of institutional flags
     */
    function batchRegisterIdentities(
        address[] memory accounts,
        VerificationLevel[] memory levels,
        string[] memory jurisdictions,
        uint256[] memory expirationDates,
        bytes32[] memory identityHashes,
        bool[] memory accreditedFlags,
        bool[] memory institutionalFlags
    ) external;
    
    /**
     * @dev Emergency pause function
     */
    function pause() external;
    
    /**
     * @dev Unpause function
     */
    function unpause() external;
    
    // Events
    event IdentityRegistered(
        address indexed account,
        VerificationLevel level,
        string jurisdiction,
        address indexed verifier
    );
    
    event IdentityUpdated(
        address indexed account,
        VerificationLevel level,
        string jurisdiction,
        address indexed verifier
    );
    
    event VerificationRevoked(
        address indexed account,
        string reason,
        address indexed revoker
    );
    
    event VerificationRenewed(
        address indexed account,
        uint256 newExpirationDate,
        address indexed renewer
    );
    
    event VerifierAdded(address indexed verifier, string name);
    event VerifierRemoved(address indexed verifier);
    
    event AccreditedStatusChanged(address indexed account, bool isAccredited);
    event InstitutionalStatusChanged(address indexed account, bool isInstitutional);
} 
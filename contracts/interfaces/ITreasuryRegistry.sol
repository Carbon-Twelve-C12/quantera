// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITreasuryRegistry
 * @dev Interface for the central registry of tokenized treasury securities
 */
interface ITreasuryRegistry {
    // Treasury types
    enum TreasuryType { TBILL, TNOTE, TBOND }
    
    // Treasury status
    enum TreasuryStatus { ACTIVE, MATURED, REDEEMED }
    
    // Treasury information structure
    struct TreasuryInfo {
        address tokenAddress;
        string metadataURI;
        TreasuryStatus status;
        uint256 currentPrice;
        uint256 issuanceDate;
        uint256 maturityDate;
        uint256 yieldRate;
        address issuer;
        bytes32 historicalDataHash; // For EIP-2935 block hash storage
    }
    
    /**
     * @dev Emitted when a new treasury is registered
     * @param tokenId The unique identifier for the treasury
     * @param tokenAddress The address of the token contract
     * @param treasuryType The type of treasury (TBILL, TNOTE, TBOND)
     */
    event TreasuryRegistered(bytes32 indexed tokenId, address tokenAddress, TreasuryType treasuryType);

    /**
     * @dev Emitted when treasury status is updated
     * @param tokenId The unique identifier for the treasury
     * @param newStatus The new status of the treasury
     */
    event TreasuryStatusUpdated(bytes32 indexed tokenId, TreasuryStatus newStatus);

    /**
     * @dev Emitted when treasury price is updated
     * @param tokenId The unique identifier for the treasury
     * @param newPrice The new price of the treasury
     */
    event TreasuryPriceUpdated(bytes32 indexed tokenId, uint256 newPrice);

    /**
     * @dev Emitted when issuer approval changes
     * @param issuer The address of the issuer
     * @param approved Whether the issuer is approved
     */
    event IssuerApprovalChanged(address indexed issuer, bool approved);

    /**
     * @dev Emitted when operator delegation changes
     * @param owner The address of the owner
     * @param operator The address of the operator
     * @param approved Whether the operator is approved
     */
    event OperatorDelegationChanged(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Emitted when delegated operation is executed
     * @param owner The address of the owner
     * @param operator The address of the operator
     * @param tokenId The unique identifier for the treasury
     */
    event DelegatedOperationExecuted(address indexed owner, address indexed operator, bytes32 indexed tokenId);
    
    /**
     * @dev Register a new treasury
     * @param tokenAddress The address of the token contract
     * @param tokenId The unique identifier for the treasury
     * @param metadataURI URI for the treasury metadata
     * @param treasuryType The type of treasury
     * @param issuanceDate The issuance date of the treasury
     * @param maturityDate The maturity date of the treasury
     * @param yieldRate The yield rate of the treasury
     * @return The unique identifier for the registered treasury
     */
    function registerTreasury(
        address tokenAddress,
        bytes32 tokenId,
        string calldata metadataURI,
        TreasuryType treasuryType,
        uint256 issuanceDate,
        uint256 maturityDate,
        uint256 yieldRate
    ) external returns (bytes32);

    /**
     * @dev Update treasury status
     * @param tokenId The unique identifier for the treasury
     * @param newStatus The new status of the treasury
     */
    function updateTreasuryStatus(bytes32 tokenId, TreasuryStatus newStatus) external;

    /**
     * @dev Update treasury price
     * @param tokenId The unique identifier for the treasury
     * @param newPrice The new price of the treasury
     */
    function updateTreasuryPrice(bytes32 tokenId, uint256 newPrice) external;

    /**
     * @dev Add approved issuer
     * @param issuer The address of the issuer to approve
     */
    function addApprovedIssuer(address issuer) external;

    /**
     * @dev Remove approved issuer
     * @param issuer The address of the issuer to remove
     */
    function removeApprovedIssuer(address issuer) external;

    /**
     * @dev Delegate operator permissions
     * @param operator The address of the operator
     * @param approved Whether the operator is approved
     */
    function delegateOperator(address operator, bool approved) external;

    /**
     * @dev Execute operation as delegated operator
     * @param owner The address of the owner
     * @param tokenId The unique identifier for the treasury
     * @param operationData The operation data to execute
     * @return Success status
     */
    function executeAsDelegated(
        address owner,
        bytes32 tokenId,
        bytes calldata operationData
    ) external returns (bool);

    /**
     * @dev Get treasury details
     * @param tokenId The unique identifier for the treasury
     * @return Treasury information
     */
    function getTreasuryDetails(bytes32 tokenId) external view returns (TreasuryInfo memory);

    /**
     * @dev Get all treasuries
     * @return Array of treasury IDs
     */
    function getAllTreasuries() external view returns (bytes32[] memory);

    /**
     * @dev Get treasuries by type
     * @param treasuryType The type of treasury to filter by
     * @return Array of treasury IDs
     */
    function getTreasuriesByType(TreasuryType treasuryType) external view returns (bytes32[] memory);

    /**
     * @dev Get treasuries by status
     * @param status The status to filter by
     * @return Array of treasury IDs
     */
    function getTreasuriesByStatus(TreasuryStatus status) external view returns (bytes32[] memory);

    /**
     * @dev Check if issuer is approved
     * @param issuer The address of the issuer to check
     * @return Whether the issuer is approved
     */
    function isApprovedIssuer(address issuer) external view returns (bool);

    /**
     * @dev Check if operator is delegated for an owner
     * @param owner The address of the owner
     * @param operator The address of the operator to check
     * @return Whether the operator is delegated
     */
    function isDelegatedOperator(address owner, address operator) external view returns (bool);
} 
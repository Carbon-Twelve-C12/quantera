// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITreasuryRegistry.sol";

/**
 * @title TreasuryRegistry
 * @dev Implementation of the central registry for tokenized treasury securities
 */
contract TreasuryRegistry is ITreasuryRegistry {
    // Mapping from token ID to treasury information
    mapping(bytes32 => TreasuryInfo) public treasuries;

    // List of approved issuers
    mapping(address => bool) public approvedIssuers;

    // Mapping of delegated operators
    mapping(address => mapping(address => bool)) public delegatedOperators;

    // Array of all treasury IDs
    bytes32[] private _treasuryIds;

    // Mapping of treasury IDs by type
    mapping(TreasuryType => bytes32[]) private _treasuryIdsByType;

    // Mapping of treasury IDs by status
    mapping(TreasuryStatus => bytes32[]) private _treasuryIdsByStatus;

    // Platform administrator
    address public admin;

    // Modifier to check if sender is admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "TreasuryRegistry: caller is not admin");
        _;
    }

    // Modifier to check if sender is approved issuer
    modifier onlyApprovedIssuer() {
        require(approvedIssuers[msg.sender], "TreasuryRegistry: caller is not approved issuer");
        _;
    }

    // Modifier to check if treasury exists
    modifier treasuryExists(bytes32 tokenId) {
        require(treasuries[tokenId].tokenAddress != address(0), "TreasuryRegistry: treasury does not exist");
        _;
    }

    /**
     * @dev Constructor to initialize the registry
     * @param _admin Address of the platform administrator
     */
    constructor(address _admin) {
        require(_admin != address(0), "TreasuryRegistry: admin is the zero address");
        admin = _admin;
        approvedIssuers[_admin] = true; // Admin is automatically an approved issuer
    }

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
    ) external override onlyApprovedIssuer returns (bytes32) {
        require(tokenAddress != address(0), "TreasuryRegistry: token address is zero");
        require(treasuries[tokenId].tokenAddress == address(0), "TreasuryRegistry: treasury already exists");
        require(bytes(metadataURI).length > 0, "TreasuryRegistry: metadata URI is empty");
        require(maturityDate > issuanceDate, "TreasuryRegistry: maturity date must be after issuance date");
        require(maturityDate > block.timestamp, "TreasuryRegistry: maturity date must be in the future");

        // Store treasury information
        treasuries[tokenId] = TreasuryInfo({
            tokenAddress: tokenAddress,
            metadataURI: metadataURI,
            status: TreasuryStatus.ACTIVE,
            currentPrice: 0, // Price will be updated separately
            issuanceDate: issuanceDate,
            maturityDate: maturityDate,
            yieldRate: yieldRate,
            issuer: msg.sender,
            historicalDataHash: blockhash(block.number - 1) // Store the previous block hash for historical verification
        });

        // Add to treasury ID arrays
        _treasuryIds.push(tokenId);
        _treasuryIdsByType[treasuryType].push(tokenId);
        _treasuryIdsByStatus[TreasuryStatus.ACTIVE].push(tokenId);

        emit TreasuryRegistered(tokenId, tokenAddress, treasuryType);

        return tokenId;
    }

    /**
     * @dev Update treasury status
     * @param tokenId The unique identifier for the treasury
     * @param newStatus The new status of the treasury
     */
    function updateTreasuryStatus(bytes32 tokenId, TreasuryStatus newStatus) 
        external 
        override 
        treasuryExists(tokenId) 
    {
        TreasuryInfo storage treasury = treasuries[tokenId];
        
        // Only issuer or admin can update status
        require(msg.sender == treasury.issuer || msg.sender == admin, 
            "TreasuryRegistry: caller is not issuer or admin");
        
        // Cannot change from REDEEMED to other status
        if (treasury.status == TreasuryStatus.REDEEMED) {
            require(newStatus == TreasuryStatus.REDEEMED, 
                "TreasuryRegistry: cannot change from REDEEMED status");
        }
        
        // If status is changing, update the status arrays
        if (treasury.status != newStatus) {
            // Remove from old status array
            _removeFromStatusArray(tokenId, treasury.status);
            
            // Add to new status array
            _treasuryIdsByStatus[newStatus].push(tokenId);
            
            // Update the status in storage
            treasury.status = newStatus;
            
            // Update historical data hash
            treasury.historicalDataHash = blockhash(block.number - 1);
            
            emit TreasuryStatusUpdated(tokenId, newStatus);
        }
    }

    /**
     * @dev Update treasury price
     * @param tokenId The unique identifier for the treasury
     * @param newPrice The new price of the treasury
     */
    function updateTreasuryPrice(bytes32 tokenId, uint256 newPrice) 
        external 
        override 
        treasuryExists(tokenId) 
    {
        TreasuryInfo storage treasury = treasuries[tokenId];
        
        // Only issuer or admin can update price
        require(msg.sender == treasury.issuer || msg.sender == admin, 
            "TreasuryRegistry: caller is not issuer or admin");
        
        // Cannot update price for REDEEMED treasuries
        require(treasury.status != TreasuryStatus.REDEEMED, 
            "TreasuryRegistry: cannot update price for REDEEMED treasury");
        
        treasury.currentPrice = newPrice;
        
        // Update historical data hash
        treasury.historicalDataHash = blockhash(block.number - 1);
        
        emit TreasuryPriceUpdated(tokenId, newPrice);
    }

    /**
     * @dev Add approved issuer
     * @param issuer The address of the issuer to approve
     */
    function addApprovedIssuer(address issuer) 
        external 
        override 
        onlyAdmin 
    {
        require(issuer != address(0), "TreasuryRegistry: issuer is the zero address");
        require(!approvedIssuers[issuer], "TreasuryRegistry: issuer already approved");
        
        approvedIssuers[issuer] = true;
        
        emit IssuerApprovalChanged(issuer, true);
    }

    /**
     * @dev Remove approved issuer
     * @param issuer The address of the issuer to remove
     */
    function removeApprovedIssuer(address issuer) 
        external 
        override 
        onlyAdmin 
    {
        require(issuer != admin, "TreasuryRegistry: cannot remove admin as issuer");
        require(approvedIssuers[issuer], "TreasuryRegistry: issuer not approved");
        
        approvedIssuers[issuer] = false;
        
        emit IssuerApprovalChanged(issuer, false);
    }

    /**
     * @dev Delegate operator permissions
     * @param operator The address of the operator
     * @param approved Whether the operator is approved
     */
    function delegateOperator(address operator, bool approved) 
        external 
        override 
    {
        require(operator != address(0), "TreasuryRegistry: operator is the zero address");
        require(operator != msg.sender, "TreasuryRegistry: cannot delegate to self");
        
        delegatedOperators[msg.sender][operator] = approved;
        
        emit OperatorDelegationChanged(msg.sender, operator, approved);
    }

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
    ) external override treasuryExists(tokenId) returns (bool) {
        require(isDelegatedOperator(owner, msg.sender), 
            "TreasuryRegistry: caller is not delegated operator");
        
        TreasuryInfo storage treasury = treasuries[tokenId];
        
        // Ensure the owner is the treasury issuer
        require(treasury.issuer == owner, 
            "TreasuryRegistry: owner is not the treasury issuer");
        
        // Execute the operation (simple call to the token contract)
        (bool success, ) = treasury.tokenAddress.call(operationData);
        require(success, "TreasuryRegistry: operation execution failed");
        
        emit DelegatedOperationExecuted(owner, msg.sender, tokenId);
        
        return true;
    }

    /**
     * @dev Get treasury details
     * @param tokenId The unique identifier for the treasury
     * @return Treasury information
     */
    function getTreasuryDetails(bytes32 tokenId) 
        external 
        view 
        override 
        treasuryExists(tokenId) 
        returns (TreasuryInfo memory) 
    {
        return treasuries[tokenId];
    }

    /**
     * @dev Get all treasuries
     * @return Array of treasury IDs
     */
    function getAllTreasuries() 
        external 
        view 
        override 
        returns (bytes32[] memory) 
    {
        return _treasuryIds;
    }

    /**
     * @dev Get treasuries by type
     * @param treasuryType The type of treasury to filter by
     * @return Array of treasury IDs
     */
    function getTreasuriesByType(TreasuryType treasuryType) 
        external 
        view 
        override 
        returns (bytes32[] memory) 
    {
        return _treasuryIdsByType[treasuryType];
    }

    /**
     * @dev Get treasuries by status
     * @param status The status to filter by
     * @return Array of treasury IDs
     */
    function getTreasuriesByStatus(TreasuryStatus status) 
        external 
        view 
        override 
        returns (bytes32[] memory) 
    {
        return _treasuryIdsByStatus[status];
    }

    /**
     * @dev Check if issuer is approved
     * @param issuer The address of the issuer to check
     * @return Whether the issuer is approved
     */
    function isApprovedIssuer(address issuer) 
        external 
        view 
        override 
        returns (bool) 
    {
        return approvedIssuers[issuer];
    }

    /**
     * @dev Check if operator is delegated for an owner
     * @param owner The address of the owner
     * @param operator The address of the operator to check
     * @return Whether the operator is delegated
     */
    function isDelegatedOperator(address owner, address operator) 
        public 
        view 
        override 
        returns (bool) 
    {
        return delegatedOperators[owner][operator];
    }

    /**
     * @dev Remove a treasury ID from its status array
     * @param tokenId The treasury ID to remove
     * @param status The status array to remove from
     */
    function _removeFromStatusArray(bytes32 tokenId, TreasuryStatus status) 
        private 
    {
        bytes32[] storage statusArray = _treasuryIdsByStatus[status];
        
        for (uint256 i = 0; i < statusArray.length; i++) {
            if (statusArray[i] == tokenId) {
                // Swap with the last element and pop
                statusArray[i] = statusArray[statusArray.length - 1];
                statusArray.pop();
                break;
            }
        }
    }
} 
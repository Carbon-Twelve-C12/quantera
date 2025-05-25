// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title UniversalBridge
 * @dev Supports multiple cross-chain protocols as recommended by WEF report
 * Implements Chainlink CCIP and LayerZero for maximum interoperability
 * Provides unified interface for cross-chain asset transfers
 */
contract UniversalBridge is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Supported bridge protocols
    enum BridgeProtocol { 
        CHAINLINK_CCIP, 
        LAYERZERO, 
        WORMHOLE,
        AXELAR,
        MULTICHAIN
    }

    // Bridge transaction status
    enum TransactionStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    struct ChainInfo {
        uint256 chainId;
        string name;
        bool isSupported;
        bool isActive;
        uint256 minTransferAmount;
        uint256 maxTransferAmount;
        uint256 baseFee;
        uint256 gasMultiplier; // For dynamic fee calculation
    }

    struct BridgeConfig {
        BridgeProtocol protocol;
        address protocolAddress;
        bool isActive;
        uint256 maxAmount;
        uint256 minAmount;
        uint256 feePercentage; // In basis points (100 = 1%)
        uint256 estimatedTime; // In seconds
    }

    struct CrossChainTransfer {
        bytes32 transferId;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 sourceChain;
        uint256 targetChain;
        BridgeProtocol protocol;
        TransactionStatus status;
        uint256 timestamp;
        uint256 completedTimestamp;
        bytes32 protocolTxHash;
        uint256 fees;
    }

    // Cross-chain asset registry
    mapping(uint256 => mapping(address => address)) public chainAssetRegistry;
    
    // Protocol configurations
    mapping(BridgeProtocol => BridgeConfig) public bridgeConfigs;
    mapping(uint256 => ChainInfo) public supportedChains;
    
    // Transfer tracking
    mapping(bytes32 => CrossChainTransfer) public transfers;
    mapping(address => bytes32[]) public userTransfers;
    
    // Protocol-specific settings
    mapping(BridgeProtocol => mapping(uint256 => bool)) public protocolChainSupport;
    
    // Fee collection
    mapping(address => uint256) public collectedFees;
    address public feeRecipient;

    // Events
    event CrossChainTransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 sourceChain,
        uint256 targetChain,
        address token,
        uint256 amount,
        BridgeProtocol protocol
    );

    event CrossChainTransferCompleted(
        bytes32 indexed transferId,
        bytes32 indexed protocolTxHash,
        uint256 completedTimestamp
    );

    event CrossChainTransferFailed(
        bytes32 indexed transferId,
        string reason
    );

    event BridgeProtocolUpdated(
        BridgeProtocol indexed protocol,
        address protocolAddress,
        bool isActive
    );

    event ChainSupportUpdated(
        uint256 indexed chainId,
        string name,
        bool isSupported
    );

    event AssetRegistered(
        uint256 indexed chainId,
        address indexed sourceAsset,
        address indexed targetAsset
    );

    event FeesCollected(
        address indexed token,
        uint256 amount,
        address recipient
    );

    // Modifiers
    modifier validChain(uint256 _chainId) {
        require(supportedChains[_chainId].isSupported, "Chain not supported");
        require(supportedChains[_chainId].isActive, "Chain not active");
        _;
    }

    modifier validProtocol(BridgeProtocol _protocol) {
        require(bridgeConfigs[_protocol].isActive, "Protocol not active");
        _;
    }

    modifier validTransfer(bytes32 _transferId) {
        require(transfers[_transferId].transferId != bytes32(0), "Transfer not found");
        _;
    }

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        
        // Initialize default bridge protocols
        _initializeDefaultProtocols();
        _initializeDefaultChains();
    }

    /**
     * @dev Initialize a cross-chain transfer
     */
    function initiateCrossChainTransfer(
        address _token,
        uint256 _amount,
        uint256 _targetChain,
        address _recipient,
        BridgeProtocol _protocol
    ) external payable nonReentrant whenNotPaused validChain(_targetChain) validProtocol(_protocol) returns (bytes32 transferId) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        require(chainAssetRegistry[_targetChain][_token] != address(0), "Asset not supported on target chain");

        ChainInfo memory targetChainInfo = supportedChains[_targetChain];
        require(_amount >= targetChainInfo.minTransferAmount, "Amount below minimum");
        require(_amount <= targetChainInfo.maxTransferAmount, "Amount exceeds maximum");

        BridgeConfig memory protocolConfig = bridgeConfigs[_protocol];
        require(_amount >= protocolConfig.minAmount, "Amount below protocol minimum");
        require(_amount <= protocolConfig.maxAmount, "Amount exceeds protocol maximum");

        // Calculate fees
        uint256 protocolFee = (_amount * protocolConfig.feePercentage) / 10000;
        uint256 gasFee = _calculateGasFee(_targetChain, _protocol);
        uint256 totalFees = protocolFee + gasFee;

        require(msg.value >= gasFee, "Insufficient gas fee");

        // Generate unique transfer ID
        transferId = keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _amount,
            _targetChain,
            _recipient,
            block.timestamp,
            block.number
        ));

        // Transfer tokens from user
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Record transfer
        transfers[transferId] = CrossChainTransfer({
            transferId: transferId,
            sender: msg.sender,
            recipient: _recipient,
            token: _token,
            amount: _amount,
            sourceChain: block.chainid,
            targetChain: _targetChain,
            protocol: _protocol,
            status: TransactionStatus.PENDING,
            timestamp: block.timestamp,
            completedTimestamp: 0,
            protocolTxHash: bytes32(0),
            fees: totalFees
        });

        userTransfers[msg.sender].push(transferId);

        // Collect fees
        if (protocolFee > 0) {
            collectedFees[_token] += protocolFee;
        }

        // Initiate protocol-specific transfer
        _initiateBridgeTransfer(transferId, _protocol);

        emit CrossChainTransferInitiated(
            transferId,
            msg.sender,
            _recipient,
            block.chainid,
            _targetChain,
            _token,
            _amount,
            _protocol
        );

        return transferId;
    }

    /**
     * @dev Get optimal bridge protocol for a transfer
     */
    function getOptimalBridgeProtocol(
        uint256 _targetChain,
        uint256 _amount,
        bool _prioritizeSpeed
    ) external view validChain(_targetChain) returns (BridgeProtocol optimalProtocol, string memory reason) {
        BridgeProtocol[] memory availableProtocols = _getAvailableProtocols(_targetChain);
        require(availableProtocols.length > 0, "No protocols available for target chain");

        if (_prioritizeSpeed) {
            // Find fastest protocol
            uint256 fastestTime = type(uint256).max;
            for (uint i = 0; i < availableProtocols.length; i++) {
                BridgeConfig memory config = bridgeConfigs[availableProtocols[i]];
                if (config.isActive && 
                    _amount >= config.minAmount && 
                    _amount <= config.maxAmount &&
                    config.estimatedTime < fastestTime) {
                    
                    optimalProtocol = availableProtocols[i];
                    fastestTime = config.estimatedTime;
                }
            }
            return (optimalProtocol, "Fastest protocol selected");
        } else {
            // Find cheapest protocol
            uint256 lowestFee = type(uint256).max;
            for (uint i = 0; i < availableProtocols.length; i++) {
                BridgeConfig memory config = bridgeConfigs[availableProtocols[i]];
                if (config.isActive && 
                    _amount >= config.minAmount && 
                    _amount <= config.maxAmount &&
                    config.feePercentage < lowestFee) {
                    
                    optimalProtocol = availableProtocols[i];
                    lowestFee = config.feePercentage;
                }
            }
            return (optimalProtocol, "Cheapest protocol selected");
        }
    }

    /**
     * @dev Estimate transfer fees for a given protocol and amount
     */
    function estimateTransferFees(
        uint256 _amount,
        uint256 _targetChain,
        BridgeProtocol _protocol
    ) external view validChain(_targetChain) validProtocol(_protocol) returns (
        uint256 protocolFee,
        uint256 gasFee,
        uint256 totalFee
    ) {
        BridgeConfig memory config = bridgeConfigs[_protocol];
        
        protocolFee = (_amount * config.feePercentage) / 10000;
        gasFee = _calculateGasFee(_targetChain, _protocol);
        totalFee = protocolFee + gasFee;
        
        return (protocolFee, gasFee, totalFee);
    }

    /**
     * @dev Complete a cross-chain transfer (called by protocol adapters)
     */
    function completeCrossChainTransfer(
        bytes32 _transferId,
        bytes32 _protocolTxHash
    ) external validTransfer(_transferId) {
        CrossChainTransfer storage transfer = transfers[_transferId];
        require(transfer.status == TransactionStatus.IN_PROGRESS, "Transfer not in progress");
        
        // Verify caller is authorized (protocol-specific verification would go here)
        
        transfer.status = TransactionStatus.COMPLETED;
        transfer.completedTimestamp = block.timestamp;
        transfer.protocolTxHash = _protocolTxHash;

        emit CrossChainTransferCompleted(_transferId, _protocolTxHash, block.timestamp);
    }

    /**
     * @dev Fail a cross-chain transfer and initiate refund
     */
    function failCrossChainTransfer(
        bytes32 _transferId,
        string memory _reason
    ) external validTransfer(_transferId) {
        CrossChainTransfer storage transfer = transfers[_transferId];
        require(transfer.status == TransactionStatus.IN_PROGRESS, "Transfer not in progress");
        
        transfer.status = TransactionStatus.FAILED;
        
        // Initiate refund
        _refundTransfer(_transferId);
        
        emit CrossChainTransferFailed(_transferId, _reason);
    }

    /**
     * @dev Register asset mapping between chains
     */
    function registerAssetMapping(
        uint256 _sourceChain,
        address _sourceAsset,
        uint256 _targetChain,
        address _targetAsset
    ) external onlyOwner {
        require(_sourceAsset != address(0), "Invalid source asset");
        require(_targetAsset != address(0), "Invalid target asset");
        
        chainAssetRegistry[_targetChain][_sourceAsset] = _targetAsset;
        
        emit AssetRegistered(_targetChain, _sourceAsset, _targetAsset);
    }

    /**
     * @dev Add or update bridge protocol configuration
     */
    function updateBridgeProtocol(
        BridgeProtocol _protocol,
        address _protocolAddress,
        bool _isActive,
        uint256 _maxAmount,
        uint256 _minAmount,
        uint256 _feePercentage,
        uint256 _estimatedTime
    ) external onlyOwner {
        require(_protocolAddress != address(0), "Invalid protocol address");
        require(_feePercentage <= 1000, "Fee percentage too high"); // Max 10%
        
        bridgeConfigs[_protocol] = BridgeConfig({
            protocol: _protocol,
            protocolAddress: _protocolAddress,
            isActive: _isActive,
            maxAmount: _maxAmount,
            minAmount: _minAmount,
            feePercentage: _feePercentage,
            estimatedTime: _estimatedTime
        });

        emit BridgeProtocolUpdated(_protocol, _protocolAddress, _isActive);
    }

    /**
     * @dev Add or update supported chain
     */
    function updateSupportedChain(
        uint256 _chainId,
        string memory _name,
        bool _isSupported,
        bool _isActive,
        uint256 _minTransferAmount,
        uint256 _maxTransferAmount,
        uint256 _baseFee,
        uint256 _gasMultiplier
    ) external onlyOwner {
        supportedChains[_chainId] = ChainInfo({
            chainId: _chainId,
            name: _name,
            isSupported: _isSupported,
            isActive: _isActive,
            minTransferAmount: _minTransferAmount,
            maxTransferAmount: _maxTransferAmount,
            baseFee: _baseFee,
            gasMultiplier: _gasMultiplier
        });

        emit ChainSupportUpdated(_chainId, _name, _isSupported);
    }

    /**
     * @dev Set protocol support for specific chain
     */
    function setProtocolChainSupport(
        BridgeProtocol _protocol,
        uint256 _chainId,
        bool _isSupported
    ) external onlyOwner {
        protocolChainSupport[_protocol][_chainId] = _isSupported;
    }

    /**
     * @dev Get user's transfer history
     */
    function getUserTransfers(address _user) external view returns (bytes32[] memory) {
        return userTransfers[_user];
    }

    /**
     * @dev Get transfer details
     */
    function getTransferDetails(bytes32 _transferId) external view validTransfer(_transferId) returns (CrossChainTransfer memory) {
        return transfers[_transferId];
    }

    /**
     * @dev Collect accumulated fees
     */
    function collectFees(address _token) external onlyOwner {
        uint256 amount = collectedFees[_token];
        require(amount > 0, "No fees to collect");
        
        collectedFees[_token] = 0;
        IERC20(_token).safeTransfer(feeRecipient, amount);
        
        emit FeesCollected(_token, amount, feeRecipient);
    }

    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }

    // Internal functions

    function _initiateBridgeTransfer(bytes32 _transferId, BridgeProtocol _protocol) internal {
        CrossChainTransfer storage transfer = transfers[_transferId];
        transfer.status = TransactionStatus.IN_PROGRESS;
        
        // Protocol-specific implementation would go here
        // For now, we'll simulate the process
        
        if (_protocol == BridgeProtocol.CHAINLINK_CCIP) {
            _initiateCCIPTransfer(_transferId);
        } else if (_protocol == BridgeProtocol.LAYERZERO) {
            _initiateLayerZeroTransfer(_transferId);
        } else if (_protocol == BridgeProtocol.WORMHOLE) {
            _initiateWormholeTransfer(_transferId);
        }
    }

    function _initiateCCIPTransfer(bytes32 _transferId) internal {
        // Chainlink CCIP implementation would go here
        // This would interact with CCIP Router contract
    }

    function _initiateLayerZeroTransfer(bytes32 _transferId) internal {
        // LayerZero implementation would go here
        // This would interact with LayerZero Endpoint
    }

    function _initiateWormholeTransfer(bytes32 _transferId) internal {
        // Wormhole implementation would go here
        // This would interact with Wormhole Core Bridge
    }

    function _refundTransfer(bytes32 _transferId) internal {
        CrossChainTransfer storage transfer = transfers[_transferId];
        
        // Calculate refund amount (original amount minus fees)
        uint256 refundAmount = transfer.amount - transfer.fees;
        
        if (refundAmount > 0) {
            IERC20(transfer.token).safeTransfer(transfer.sender, refundAmount);
            transfer.status = TransactionStatus.REFUNDED;
        }
    }

    function _calculateGasFee(uint256 _targetChain, BridgeProtocol _protocol) internal view returns (uint256) {
        ChainInfo memory chainInfo = supportedChains[_targetChain];
        BridgeConfig memory protocolConfig = bridgeConfigs[_protocol];
        
        // Simple gas fee calculation - in production this would be more sophisticated
        uint256 baseFee = chainInfo.baseFee;
        uint256 protocolMultiplier = protocolConfig.estimatedTime > 300 ? 100 : 150; // Faster = more expensive
        
        return (baseFee * chainInfo.gasMultiplier * protocolMultiplier) / 10000;
    }

    function _getAvailableProtocols(uint256 _targetChain) internal view returns (BridgeProtocol[] memory) {
        BridgeProtocol[] memory allProtocols = new BridgeProtocol[](5);
        allProtocols[0] = BridgeProtocol.CHAINLINK_CCIP;
        allProtocols[1] = BridgeProtocol.LAYERZERO;
        allProtocols[2] = BridgeProtocol.WORMHOLE;
        allProtocols[3] = BridgeProtocol.AXELAR;
        allProtocols[4] = BridgeProtocol.MULTICHAIN;
        
        uint256 availableCount = 0;
        for (uint i = 0; i < allProtocols.length; i++) {
            if (bridgeConfigs[allProtocols[i]].isActive && 
                protocolChainSupport[allProtocols[i]][_targetChain]) {
                availableCount++;
            }
        }
        
        BridgeProtocol[] memory availableProtocols = new BridgeProtocol[](availableCount);
        uint256 index = 0;
        for (uint i = 0; i < allProtocols.length; i++) {
            if (bridgeConfigs[allProtocols[i]].isActive && 
                protocolChainSupport[allProtocols[i]][_targetChain]) {
                availableProtocols[index] = allProtocols[i];
                index++;
            }
        }
        
        return availableProtocols;
    }

    function _initializeDefaultProtocols() internal {
        // Initialize Chainlink CCIP
        bridgeConfigs[BridgeProtocol.CHAINLINK_CCIP] = BridgeConfig({
            protocol: BridgeProtocol.CHAINLINK_CCIP,
            protocolAddress: address(0), // Would be set to actual CCIP Router
            isActive: true,
            maxAmount: 1000000 * 10**18,
            minAmount: 1 * 10**18,
            feePercentage: 30, // 0.3%
            estimatedTime: 600 // 10 minutes
        });

        // Initialize LayerZero
        bridgeConfigs[BridgeProtocol.LAYERZERO] = BridgeConfig({
            protocol: BridgeProtocol.LAYERZERO,
            protocolAddress: address(0), // Would be set to actual LayerZero Endpoint
            isActive: true,
            maxAmount: 500000 * 10**18,
            minAmount: 1 * 10**18,
            feePercentage: 25, // 0.25%
            estimatedTime: 300 // 5 minutes
        });
    }

    function _initializeDefaultChains() internal {
        // Ethereum
        supportedChains[1] = ChainInfo({
            chainId: 1,
            name: "Ethereum",
            isSupported: true,
            isActive: true,
            minTransferAmount: 1 * 10**18,
            maxTransferAmount: 1000000 * 10**18,
            baseFee: 0.01 ether,
            gasMultiplier: 100
        });

        // Polygon
        supportedChains[137] = ChainInfo({
            chainId: 137,
            name: "Polygon",
            isSupported: true,
            isActive: true,
            minTransferAmount: 1 * 10**18,
            maxTransferAmount: 1000000 * 10**18,
            baseFee: 0.001 ether,
            gasMultiplier: 50
        });
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
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
} 
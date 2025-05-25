// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SettlementAssetManager
 * @dev Manages multiple settlement assets as identified in WEF report
 * Supports wCBDCs, stablecoins, deposit tokens, and RBDC with BIS framework compliance
 * Implements optimal settlement asset selection based on transaction characteristics
 */
contract SettlementAssetManager is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SettlementAssetType { 
        WCBDC,          // Wholesale Central Bank Digital Currency - Highest preference
        RBDC,           // Reserve-backed Digital Currency
        DEPOSIT_TOKEN,  // Commercial bank money
        STABLECOIN,     // Fiat-backed stablecoins
        CRYPTO          // Crypto assets (for DeFi integration)
    }

    struct SettlementAsset {
        address tokenAddress;
        SettlementAssetType assetType;
        string jurisdiction;
        string currency;        // USD, EUR, GBP, etc.
        bool isActive;
        bool isPreferred;
        uint256 riskWeight;     // BIS framework compliance (0-100)
        uint256 liquidityScore; // 0-100, higher is better
        uint256 dailyVolumeLimit;
        uint256 dailyVolumeUsed;
        uint256 lastResetTimestamp;
        address issuer;         // Central bank, commercial bank, or stablecoin issuer
    }

    struct SettlementTransaction {
        bytes32 transactionId;
        address fromAsset;
        address toAsset;
        address settlementAsset;
        uint256 amount;
        uint256 settlementAmount;
        uint256 timestamp;
        string jurisdiction;
        bool isCompleted;
    }

    // Settlement asset registry
    mapping(address => SettlementAsset) public settlementAssets;
    mapping(SettlementAssetType => address[]) public assetsByType;
    mapping(string => address[]) public assetsByJurisdiction;
    mapping(string => address[]) public assetsByCurrency;
    
    // Transaction tracking
    mapping(bytes32 => SettlementTransaction) public transactions;
    mapping(address => uint256) public totalSettlementVolume;
    
    // Preferred settlement order based on BIS guidelines
    SettlementAssetType[] public preferenceOrder = [
        SettlementAssetType.WCBDC,      // Central bank money - highest preference
        SettlementAssetType.RBDC,       // Reserve-backed digital currency
        SettlementAssetType.DEPOSIT_TOKEN, // Commercial bank money
        SettlementAssetType.STABLECOIN, // Fiat-backed stablecoins
        SettlementAssetType.CRYPTO      // Crypto assets - lowest preference
    ];

    // Events
    event SettlementAssetAdded(
        address indexed tokenAddress,
        SettlementAssetType assetType,
        string jurisdiction,
        string currency
    );
    
    event SettlementAssetUpdated(address indexed tokenAddress);
    event SettlementAssetDeactivated(address indexed tokenAddress);
    
    event SettlementExecuted(
        bytes32 indexed transactionId,
        address indexed settlementAsset,
        uint256 amount,
        string jurisdiction
    );
    
    event OptimalAssetSelected(
        address indexed selectedAsset,
        SettlementAssetType assetType,
        string reason
    );

    // Modifiers
    modifier validSettlementAsset(address _asset) {
        require(settlementAssets[_asset].tokenAddress != address(0), "Asset not registered");
        require(settlementAssets[_asset].isActive, "Asset not active");
        _;
    }

    constructor() {}

    /**
     * @dev Add a new settlement asset to the registry
     */
    function addSettlementAsset(
        address _tokenAddress,
        SettlementAssetType _assetType,
        string memory _jurisdiction,
        string memory _currency,
        uint256 _riskWeight,
        uint256 _liquidityScore,
        uint256 _dailyVolumeLimit,
        address _issuer
    ) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_riskWeight <= 100, "Risk weight must be <= 100");
        require(_liquidityScore <= 100, "Liquidity score must be <= 100");
        require(settlementAssets[_tokenAddress].tokenAddress == address(0), "Asset already exists");

        bool isPreferred = _assetType == SettlementAssetType.WCBDC;

        settlementAssets[_tokenAddress] = SettlementAsset({
            tokenAddress: _tokenAddress,
            assetType: _assetType,
            jurisdiction: _jurisdiction,
            currency: _currency,
            isActive: true,
            isPreferred: isPreferred,
            riskWeight: _riskWeight,
            liquidityScore: _liquidityScore,
            dailyVolumeLimit: _dailyVolumeLimit,
            dailyVolumeUsed: 0,
            lastResetTimestamp: block.timestamp,
            issuer: _issuer
        });

        assetsByType[_assetType].push(_tokenAddress);
        assetsByJurisdiction[_jurisdiction].push(_tokenAddress);
        assetsByCurrency[_currency].push(_tokenAddress);

        emit SettlementAssetAdded(_tokenAddress, _assetType, _jurisdiction, _currency);
    }

    /**
     * @dev Get optimal settlement asset based on transaction characteristics
     */
    function getOptimalSettlementAsset(
        string memory _jurisdiction,
        string memory _currency,
        uint256 _amount,
        bool _requireInstantSettlement
    ) external view returns (address optimalAsset, string memory reason) {
        // First, try to find wCBDC for the jurisdiction and currency
        address wcbdcAsset = _findAssetByTypeAndCriteria(
            SettlementAssetType.WCBDC,
            _jurisdiction,
            _currency,
            _amount
        );
        
        if (wcbdcAsset != address(0)) {
            return (wcbdcAsset, "wCBDC selected - central bank money");
        }

        // For large institutional transactions, prefer RBDC or deposit tokens
        if (_amount > 1000000 * 10**18) { // > 1M units
            address rbdcAsset = _findAssetByTypeAndCriteria(
                SettlementAssetType.RBDC,
                _jurisdiction,
                _currency,
                _amount
            );
            
            if (rbdcAsset != address(0)) {
                return (rbdcAsset, "RBDC selected - large institutional transaction");
            }

            address depositAsset = _findAssetByTypeAndCriteria(
                SettlementAssetType.DEPOSIT_TOKEN,
                _jurisdiction,
                _currency,
                _amount
            );
            
            if (depositAsset != address(0)) {
                return (depositAsset, "Deposit token selected - institutional grade");
            }
        }

        // For instant settlement requirements, prefer high liquidity assets
        if (_requireInstantSettlement) {
            address bestLiquidityAsset = _findHighestLiquidityAsset(_jurisdiction, _currency, _amount);
            if (bestLiquidityAsset != address(0)) {
                return (bestLiquidityAsset, "High liquidity asset selected - instant settlement");
            }
        }

        // Fallback to stablecoins
        address stablecoinAsset = _findAssetByTypeAndCriteria(
            SettlementAssetType.STABLECOIN,
            _jurisdiction,
            _currency,
            _amount
        );
        
        if (stablecoinAsset != address(0)) {
            return (stablecoinAsset, "Stablecoin selected - fallback option");
        }

        // Last resort - crypto assets
        address cryptoAsset = _findAssetByTypeAndCriteria(
            SettlementAssetType.CRYPTO,
            _jurisdiction,
            _currency,
            _amount
        );
        
        if (cryptoAsset != address(0)) {
            return (cryptoAsset, "Crypto asset selected - last resort");
        }

        return (address(0), "No suitable settlement asset found");
    }

    /**
     * @dev Execute settlement using optimal asset
     */
    function executeSettlement(
        bytes32 _transactionId,
        address _fromAsset,
        address _toAsset,
        uint256 _amount,
        string memory _jurisdiction,
        string memory _currency,
        bool _requireInstantSettlement
    ) external nonReentrant whenNotPaused returns (address settlementAsset) {
        require(_transactionId != bytes32(0), "Invalid transaction ID");
        require(transactions[_transactionId].transactionId == bytes32(0), "Transaction already exists");

        (address optimalAsset, string memory reason) = this.getOptimalSettlementAsset(
            _jurisdiction,
            _currency,
            _amount,
            _requireInstantSettlement
        );

        require(optimalAsset != address(0), "No settlement asset available");

        // Update daily volume tracking
        _updateDailyVolume(optimalAsset, _amount);

        // Record transaction
        transactions[_transactionId] = SettlementTransaction({
            transactionId: _transactionId,
            fromAsset: _fromAsset,
            toAsset: _toAsset,
            settlementAsset: optimalAsset,
            amount: _amount,
            settlementAmount: _amount, // 1:1 for now, could implement exchange rates
            timestamp: block.timestamp,
            jurisdiction: _jurisdiction,
            isCompleted: true
        });

        // Update total volume
        totalSettlementVolume[optimalAsset] += _amount;

        emit OptimalAssetSelected(optimalAsset, settlementAssets[optimalAsset].assetType, reason);
        emit SettlementExecuted(_transactionId, optimalAsset, _amount, _jurisdiction);

        return optimalAsset;
    }

    /**
     * @dev Get settlement statistics for an asset
     */
    function getSettlementStats(address _asset) external view validSettlementAsset(_asset) returns (
        uint256 totalVolume,
        uint256 dailyVolumeUsed,
        uint256 dailyVolumeRemaining,
        uint256 utilizationPercentage
    ) {
        SettlementAsset memory asset = settlementAssets[_asset];
        
        totalVolume = totalSettlementVolume[_asset];
        dailyVolumeUsed = asset.dailyVolumeUsed;
        dailyVolumeRemaining = asset.dailyVolumeLimit > asset.dailyVolumeUsed 
            ? asset.dailyVolumeLimit - asset.dailyVolumeUsed 
            : 0;
        utilizationPercentage = asset.dailyVolumeLimit > 0 
            ? (asset.dailyVolumeUsed * 100) / asset.dailyVolumeLimit 
            : 0;
    }

    /**
     * @dev Get all settlement assets for a jurisdiction
     */
    function getAssetsByJurisdiction(string memory _jurisdiction) external view returns (address[] memory) {
        return assetsByJurisdiction[_jurisdiction];
    }

    /**
     * @dev Get all settlement assets for a currency
     */
    function getAssetsByCurrency(string memory _currency) external view returns (address[] memory) {
        return assetsByCurrency[_currency];
    }

    /**
     * @dev Update settlement asset parameters
     */
    function updateSettlementAsset(
        address _tokenAddress,
        uint256 _riskWeight,
        uint256 _liquidityScore,
        uint256 _dailyVolumeLimit,
        bool _isActive
    ) external onlyOwner validSettlementAsset(_tokenAddress) {
        require(_riskWeight <= 100, "Risk weight must be <= 100");
        require(_liquidityScore <= 100, "Liquidity score must be <= 100");

        SettlementAsset storage asset = settlementAssets[_tokenAddress];
        asset.riskWeight = _riskWeight;
        asset.liquidityScore = _liquidityScore;
        asset.dailyVolumeLimit = _dailyVolumeLimit;
        asset.isActive = _isActive;

        emit SettlementAssetUpdated(_tokenAddress);
    }

    /**
     * @dev Emergency deactivate settlement asset
     */
    function deactivateSettlementAsset(address _tokenAddress) external onlyOwner {
        require(settlementAssets[_tokenAddress].tokenAddress != address(0), "Asset not found");
        
        settlementAssets[_tokenAddress].isActive = false;
        emit SettlementAssetDeactivated(_tokenAddress);
    }

    /**
     * @dev Reset daily volume counters (called daily by automation)
     */
    function resetDailyVolumes() external onlyOwner {
        // This would typically be called by a Chainlink Automation job
        // For now, we'll reset all assets manually
        
        // In a production system, you'd iterate through all registered assets
        // This is a simplified version for demonstration
    }

    // Internal helper functions

    function _findAssetByTypeAndCriteria(
        SettlementAssetType _assetType,
        string memory _jurisdiction,
        string memory _currency,
        uint256 _amount
    ) internal view returns (address) {
        address[] memory typeAssets = assetsByType[_assetType];
        
        for (uint i = 0; i < typeAssets.length; i++) {
            SettlementAsset memory asset = settlementAssets[typeAssets[i]];
            
            if (asset.isActive &&
                keccak256(bytes(asset.jurisdiction)) == keccak256(bytes(_jurisdiction)) &&
                keccak256(bytes(asset.currency)) == keccak256(bytes(_currency)) &&
                _checkDailyVolumeLimit(typeAssets[i], _amount)) {
                return typeAssets[i];
            }
        }
        
        return address(0);
    }

    function _findHighestLiquidityAsset(
        string memory _jurisdiction,
        string memory _currency,
        uint256 _amount
    ) internal view returns (address) {
        address[] memory jurisdictionAssets = assetsByJurisdiction[_jurisdiction];
        address bestAsset = address(0);
        uint256 highestLiquidity = 0;
        
        for (uint i = 0; i < jurisdictionAssets.length; i++) {
            SettlementAsset memory asset = settlementAssets[jurisdictionAssets[i]];
            
            if (asset.isActive &&
                keccak256(bytes(asset.currency)) == keccak256(bytes(_currency)) &&
                asset.liquidityScore > highestLiquidity &&
                _checkDailyVolumeLimit(jurisdictionAssets[i], _amount)) {
                
                bestAsset = jurisdictionAssets[i];
                highestLiquidity = asset.liquidityScore;
            }
        }
        
        return bestAsset;
    }

    function _checkDailyVolumeLimit(address _asset, uint256 _amount) internal view returns (bool) {
        SettlementAsset memory asset = settlementAssets[_asset];
        
        // Reset daily volume if it's a new day
        if (block.timestamp >= asset.lastResetTimestamp + 1 days) {
            return _amount <= asset.dailyVolumeLimit;
        }
        
        return asset.dailyVolumeUsed + _amount <= asset.dailyVolumeLimit;
    }

    function _updateDailyVolume(address _asset, uint256 _amount) internal {
        SettlementAsset storage asset = settlementAssets[_asset];
        
        // Reset daily volume if it's a new day
        if (block.timestamp >= asset.lastResetTimestamp + 1 days) {
            asset.dailyVolumeUsed = _amount;
            asset.lastResetTimestamp = block.timestamp;
        } else {
            asset.dailyVolumeUsed += _amount;
        }
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
} 
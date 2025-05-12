// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IL2Bridge.sol";

/**
 * @title L2BridgeGasOptimizer
 * @dev Gas optimization module for L2Bridge's blob data handling
 * Implements EIP-7691 efficient blob management for cross-chain communications
 */
contract L2BridgeGasOptimizer {
    // Storage for gas price estimates for each chain
    mapping(uint256 => uint256) private _blobGasPriceByChain;
    mapping(uint256 => uint256) private _baseGasPriceByChain;
    
    // Optimization thresholds
    uint256 public blobSizeThreshold = 125000; // 125KB default threshold for using blobs
    uint256 public blobGasEfficiencyFactor = 80; // 80% efficiency factor by default
    
    // Blob compression ratios (approx. based on data type)
    mapping(uint8 => uint8) private _compressionRatios;
    
    // Constants for data types
    uint8 public constant JSON_DATA = 0;
    uint8 public constant BINARY_DATA = 1;
    uint8 public constant MERKLE_PROOF = 2;
    uint8 public constant TRANSACTION_DATA = 3;
    
    // Events
    event BlobGasPriceUpdated(uint256 chainId, uint256 blobGasPrice);
    event BaseGasPriceUpdated(uint256 chainId, uint256 baseGasPrice);
    event ThresholdUpdated(uint256 blobSizeThreshold, uint256 blobGasEfficiencyFactor);
    
    constructor() {
        // Initialize compression ratios
        _compressionRatios[JSON_DATA] = 40; // ~40% compression
        _compressionRatios[BINARY_DATA] = 20; // ~20% compression
        _compressionRatios[MERKLE_PROOF] = 30; // ~30% compression
        _compressionRatios[TRANSACTION_DATA] = 15; // ~15% compression
    }
    
    /**
     * @dev Update blob gas price for a chain
     * @param chainId Chain ID
     * @param blobGasPrice New blob gas price
     */
    function updateBlobGasPrice(uint256 chainId, uint256 blobGasPrice) external {
        _blobGasPriceByChain[chainId] = blobGasPrice;
        emit BlobGasPriceUpdated(chainId, blobGasPrice);
    }
    
    /**
     * @dev Update base gas price for a chain
     * @param chainId Chain ID
     * @param baseGasPrice New base gas price
     */
    function updateBaseGasPrice(uint256 chainId, uint256 baseGasPrice) external {
        _baseGasPriceByChain[chainId] = baseGasPrice;
        emit BaseGasPriceUpdated(chainId, baseGasPrice);
    }
    
    /**
     * @dev Update optimization thresholds
     * @param newBlobSizeThreshold New blob size threshold
     * @param newBlobGasEfficiencyFactor New blob gas efficiency factor
     */
    function updateThresholds(uint256 newBlobSizeThreshold, uint256 newBlobGasEfficiencyFactor) external {
        require(newBlobGasEfficiencyFactor <= 100, "Efficiency factor must be <= 100");
        
        blobSizeThreshold = newBlobSizeThreshold;
        blobGasEfficiencyFactor = newBlobGasEfficiencyFactor;
        
        emit ThresholdUpdated(blobSizeThreshold, blobGasEfficiencyFactor);
    }
    
    /**
     * @dev Calculate optimal data format based on size and chain
     * @param chainId Destination chain ID
     * @param dataSize Size of the data
     * @param dataType Type of data for compression estimation
     * @return useBlob Whether to use blob for data
     * @return estimatedCompressedSize Estimated size after compression
     */
    function calculateOptimalDataFormat(
        uint256 chainId,
        uint256 dataSize,
        uint8 dataType
    ) public view returns (bool useBlob, uint256 estimatedCompressedSize) {
        // If chain doesn't support blobs, don't use them
        if (_blobGasPriceByChain[chainId] == 0) {
            return (false, dataSize);
        }
        
        // Calculate compressed size based on data type
        uint8 compressionRatio = _compressionRatios[dataType];
        estimatedCompressedSize = dataSize * (100 - compressionRatio) / 100;
        
        // Determine if using a blob would be more efficient
        if (estimatedCompressedSize >= blobSizeThreshold) {
            // Calculate gas costs for both methods
            uint256 blobGasCost = _calculateBlobGasCost(chainId, estimatedCompressedSize);
            uint256 callDataGasCost = _calculateCallDataGasCost(chainId, estimatedCompressedSize);
            
            // Use blob if it's more efficient based on the efficiency factor
            useBlob = (blobGasCost * 100 <= callDataGasCost * blobGasEfficiencyFactor);
        } else {
            useBlob = false;
        }
        
        return (useBlob, estimatedCompressedSize);
    }
    
    /**
     * @dev Calculate blob gas cost for a given size
     * @param chainId Chain ID
     * @param dataSize Data size in bytes
     * @return cost Gas cost
     */
    function _calculateBlobGasCost(uint256 chainId, uint256 dataSize) internal view returns (uint256) {
        uint256 blobGasPrice = _blobGasPriceByChain[chainId];
        if (blobGasPrice == 0) {
            blobGasPrice = 1; // Default if not set
        }
        
        // Blob size as per EIP-4844 is 128KB
        uint256 numBlobs = (dataSize + 131071) / 131072; // Ceiling division
        
        // Calculate gas cost: blob_gas_per_blob = 2^17
        uint256 blobGasPerBlob = 131072; // 2^17
        return numBlobs * blobGasPerBlob * blobGasPrice;
    }
    
    /**
     * @dev Calculate calldata gas cost for a given size
     * @param chainId Chain ID
     * @param dataSize Data size in bytes
     * @return cost Gas cost
     */
    function _calculateCallDataGasCost(uint256 chainId, uint256 dataSize) internal view returns (uint256) {
        uint256 baseGasPrice = _baseGasPriceByChain[chainId];
        if (baseGasPrice == 0) {
            baseGasPrice = 1; // Default if not set
        }
        
        // Calldata gas cost: 16 gas per non-zero byte, 4 gas per zero byte
        // Using approximation: average 14 gas per byte assuming ~20% are zero bytes
        uint256 gasPerByte = 14;
        return dataSize * gasPerByte * baseGasPrice;
    }
    
    /**
     * @dev Estimate gas for bridging operation
     * @param chainId Destination chain ID
     * @param dataSize Data size
     * @param dataType Type of data
     * @return useBlob Whether to use blob
     * @return blobGasLimit Blob gas limit
     * @return callDataGasLimit Calldata gas limit
     * @return estimatedCompressedSize Estimated compressed size
     */
    function estimateBridgingGas(
        uint256 chainId,
        uint256 dataSize,
        uint8 dataType
    ) external view returns (
        bool useBlob,
        uint256 blobGasLimit,
        uint256 callDataGasLimit,
        uint256 estimatedCompressedSize
    ) {
        (useBlob, estimatedCompressedSize) = calculateOptimalDataFormat(chainId, dataSize, dataType);
        
        // Calculate gas limits with a 20% buffer
        blobGasLimit = _calculateBlobGasCost(chainId, estimatedCompressedSize) * 120 / 100;
        callDataGasLimit = _calculateCallDataGasCost(chainId, estimatedCompressedSize) * 120 / 100;
        
        return (useBlob, blobGasLimit, callDataGasLimit, estimatedCompressedSize);
    }
    
    /**
     * @dev Compress data based on data type (would be more complex in a real implementation)
     * @param data Raw data
     * @param dataType Type of data
     * @return compressedData Compressed data
     */
    function compressData(bytes memory data, uint8 dataType) public pure returns (bytes memory) {
        // In a real implementation, this would apply actual compression algorithms
        // This is a simple placeholder that just returns the original data
        return data;
    }
    
    /**
     * @dev Decompress data based on data type
     * @param compressedData Compressed data
     * @param dataType Type of data
     * @return data Decompressed data
     */
    function decompressData(bytes memory compressedData, uint8 dataType) public pure returns (bytes memory) {
        // In a real implementation, this would apply actual decompression algorithms
        // This is a simple placeholder that just returns the compressed data
        return compressedData;
    }
} 
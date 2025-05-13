// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IL2Bridge.sol";

/**
 * @title L2BridgeGasOptimizer
 * @dev Gas optimization module for L2Bridge's blob data handling
 * Implements EIP-7691 efficient blob management for cross-chain communications
 */
contract L2BridgeGasOptimizer is AccessControl {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Storage for gas price estimates for each chain
    mapping(uint256 => uint256) private _blobGasPriceByChain;
    mapping(uint256 => uint256) private _baseGasPriceByChain;
    
    // Optimization thresholds
    uint256 public blobSizeThreshold = 125000; // 125KB default threshold for using blobs
    uint256 public blobGasEfficiencyFactor = 80; // 80% efficiency factor by default
    
    // Blob compression parameters
    struct CompressionParams {
        uint8 dictionarySize;      // Size of the compression dictionary (0-255)
        uint8 minMatchLength;      // Minimum match length for compression
        uint8 compressionLevel;    // Compression level (0-10)
        bool enableHuffman;        // Enable Huffman encoding
        uint8 blockSize;           // Block size for processing (in KB)
    }
    
    // Compression parameters by data type
    mapping(uint8 => CompressionParams) private _compressionParams;
    
    // Gas Optimization: Use a struct to store compression statistics to reduce storage operations
    struct CompressionStats {
        uint256 totalOriginalSize;
        uint256 totalCompressedSize;
        uint256 compressionCount;
    }
    
    // Compression statistics by data type
    mapping(uint8 => CompressionStats) private _compressionStats;
    
    // Constants for data types
    uint8 public constant JSON_DATA = 0;
    uint8 public constant BINARY_DATA = 1;
    uint8 public constant MERKLE_PROOF = 2;
    uint8 public constant TRANSACTION_DATA = 3;
    
    // Dictionary entries for common patterns (used for compression)
    // Gas optimization: Use fixed-size arrays rather than dynamic ones
    bytes32[64] private _jsonDictionary;
    bytes32[64] private _binaryDictionary;
    bytes32[64] private _proofDictionary;
    bytes32[64] private _transactionDictionary;
    
    // Events
    event BlobGasPriceUpdated(uint256 chainId, uint256 blobGasPrice);
    event BaseGasPriceUpdated(uint256 chainId, uint256 baseGasPrice);
    event ThresholdUpdated(uint256 blobSizeThreshold, uint256 blobGasEfficiencyFactor);
    event CompressionParamsUpdated(uint8 dataType, CompressionParams params);
    event DataCompressed(uint8 dataType, uint256 originalSize, uint256 compressedSize, uint256 compressionRatio);
    event DictionaryUpdated(uint8 dataType);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        // Initialize compression parameters for different data types
        _compressionParams[JSON_DATA] = CompressionParams({
            dictionarySize: 64,
            minMatchLength: 4,
            compressionLevel: 7,
            enableHuffman: true,
            blockSize: 64
        });
        
        _compressionParams[BINARY_DATA] = CompressionParams({
            dictionarySize: 64,
            minMatchLength: 3,
            compressionLevel: 5,
            enableHuffman: false,
            blockSize: 128
        });
        
        _compressionParams[MERKLE_PROOF] = CompressionParams({
            dictionarySize: 32,
            minMatchLength: 5,
            compressionLevel: 8,
            enableHuffman: true,
            blockSize: 32
        });
        
        _compressionParams[TRANSACTION_DATA] = CompressionParams({
            dictionarySize: 64,
            minMatchLength: 4,
            compressionLevel: 6,
            enableHuffman: true,
            blockSize: 64
        });
        
        // Initialize dictionaries with common patterns
        _initializeJsonDictionary();
        _initializeBinaryDictionary();
        _initializeProofDictionary();
        _initializeTransactionDictionary();
    }
    
    /**
     * @dev Initialize JSON dictionary with common patterns
     */
    function _initializeJsonDictionary() private {
        _jsonDictionary[0] = keccak256(abi.encodePacked('{"type":"'));
        _jsonDictionary[1] = keccak256(abi.encodePacked('","value":'));
        _jsonDictionary[2] = keccak256(abi.encodePacked('{"name":"'));
        _jsonDictionary[3] = keccak256(abi.encodePacked('","data":'));
        _jsonDictionary[4] = keccak256(abi.encodePacked('","timestamp":'));
        _jsonDictionary[5] = keccak256(abi.encodePacked('{"address":"0x'));
        _jsonDictionary[6] = keccak256(abi.encodePacked('","balance":"'));
        _jsonDictionary[7] = keccak256(abi.encodePacked('","nonce":'));
        _jsonDictionary[8] = keccak256(abi.encodePacked('","gasLimit":'));
        _jsonDictionary[9] = keccak256(abi.encodePacked('","gasPrice":'));
        _jsonDictionary[10] = keccak256(abi.encodePacked('","hash":"0x'));
        _jsonDictionary[11] = keccak256(abi.encodePacked('","blockHash":"0x'));
        _jsonDictionary[12] = keccak256(abi.encodePacked('","blockNumber":'));
        _jsonDictionary[13] = keccak256(abi.encodePacked('","transactionIndex":'));
        _jsonDictionary[14] = keccak256(abi.encodePacked('","from":"0x'));
        _jsonDictionary[15] = keccak256(abi.encodePacked('","to":"0x'));
        // Additional entries would be populated in a real implementation
    }
    
    /**
     * @dev Initialize binary dictionary with common patterns
     */
    function _initializeBinaryDictionary() private {
        _binaryDictionary[0] = keccak256(abi.encodePacked(bytes32(0)));
        _binaryDictionary[1] = keccak256(abi.encodePacked(bytes1(0x00), bytes1(0x00), bytes1(0x00), bytes1(0x00)));
        _binaryDictionary[2] = keccak256(abi.encodePacked(bytes1(0xFF), bytes1(0xFF), bytes1(0xFF), bytes1(0xFF)));
        _binaryDictionary[3] = keccak256(abi.encodePacked(bytes4(0xFFFFFFFF)));
        _binaryDictionary[4] = keccak256(abi.encodePacked(bytes4(0x00000000)));
        // Additional entries would be populated in a real implementation
    }
    
    /**
     * @dev Initialize proof dictionary with common patterns
     */
    function _initializeProofDictionary() private {
        // Merkle proof common elements
        _proofDictionary[0] = keccak256(abi.encodePacked('{"proof":'));
        _proofDictionary[1] = keccak256(abi.encodePacked('{"root":"0x'));
        _proofDictionary[2] = keccak256(abi.encodePacked('{"leaf":"0x'));
        _proofDictionary[3] = keccak256(abi.encodePacked('["0x'));
        _proofDictionary[4] = keccak256(abi.encodePacked('","0x'));
        // Additional entries would be populated in a real implementation
    }
    
    /**
     * @dev Initialize transaction dictionary with common patterns
     */
    function _initializeTransactionDictionary() private {
        // Transaction-specific patterns
        _transactionDictionary[0] = keccak256(abi.encodePacked('{"chainId":'));
        _transactionDictionary[1] = keccak256(abi.encodePacked('","value":"0x'));
        _transactionDictionary[2] = keccak256(abi.encodePacked('","data":"0x'));
        _transactionDictionary[3] = keccak256(abi.encodePacked('{"r":"0x'));
        _transactionDictionary[4] = keccak256(abi.encodePacked('","s":"0x'));
        _transactionDictionary[5] = keccak256(abi.encodePacked('","v":'));
        // Additional entries would be populated in a real implementation
    }
    
    /**
     * @dev Update the dictionary for a specific data type
     * @param dataType Data type to update dictionary for
     * @param index Index in the dictionary
     * @param pattern Pattern to store
     */
    function updateDictionaryEntry(uint8 dataType, uint8 index, bytes calldata pattern) external onlyRole(ADMIN_ROLE) {
        require(index < 64, "Index out of bounds");
        
        // Gas optimization: Use if-else chain instead of repetitive pattern
        bytes32 patternHash = keccak256(pattern);
        
        if (dataType == JSON_DATA) {
            _jsonDictionary[index] = patternHash;
        } else if (dataType == BINARY_DATA) {
            _binaryDictionary[index] = patternHash;
        } else if (dataType == MERKLE_PROOF) {
            _proofDictionary[index] = patternHash;
        } else if (dataType == TRANSACTION_DATA) {
            _transactionDictionary[index] = patternHash;
        } else {
            revert("Invalid data type");
        }
        
        emit DictionaryUpdated(dataType);
    }
    
    /**
     * @dev Update compression parameters for a data type
     * @param dataType Data type to update parameters for
     * @param params New compression parameters
     */
    function updateCompressionParams(uint8 dataType, CompressionParams calldata params) external onlyRole(ADMIN_ROLE) {
        require(params.dictionarySize <= 64, "Dictionary size must be <= 64");
        require(params.compressionLevel <= 10, "Compression level must be <= 10");
        
        _compressionParams[dataType] = params;
        
        emit CompressionParamsUpdated(dataType, params);
    }
    
    /**
     * @dev Update blob gas price for a chain
     * @param chainId Chain ID
     * @param blobGasPrice New blob gas price
     */
    function updateBlobGasPrice(uint256 chainId, uint256 blobGasPrice) external onlyRole(OPERATOR_ROLE) {
        _blobGasPriceByChain[chainId] = blobGasPrice;
        emit BlobGasPriceUpdated(chainId, blobGasPrice);
    }
    
    /**
     * @dev Update base gas price for a chain
     * @param chainId Chain ID
     * @param baseGasPrice New base gas price
     */
    function updateBaseGasPrice(uint256 chainId, uint256 baseGasPrice) external onlyRole(OPERATOR_ROLE) {
        _baseGasPriceByChain[chainId] = baseGasPrice;
        emit BaseGasPriceUpdated(chainId, baseGasPrice);
    }
    
    /**
     * @dev Update optimization thresholds
     * @param newBlobSizeThreshold New blob size threshold
     * @param newBlobGasEfficiencyFactor New blob gas efficiency factor
     */
    function updateThresholds(uint256 newBlobSizeThreshold, uint256 newBlobGasEfficiencyFactor) external onlyRole(ADMIN_ROLE) {
        require(newBlobGasEfficiencyFactor <= 100, "Efficiency factor must be <= 100");
        
        blobSizeThreshold = newBlobSizeThreshold;
        blobGasEfficiencyFactor = newBlobGasEfficiencyFactor;
        
        emit ThresholdUpdated(blobSizeThreshold, blobGasEfficiencyFactor);
    }
    
    /**
     * @dev Get compression statistics for a data type
     * @param dataType Data type to get statistics for
     * @return count Number of compression operations
     * @return averageRatio Average compression ratio (0-100)
     */
    function getCompressionStats(uint8 dataType) external view returns (uint256 count, uint256 averageRatio) {
        // Gas optimization: Read from storage once
        CompressionStats storage stats = _compressionStats[dataType];
        count = stats.compressionCount;
        
        if (count == 0 || stats.totalOriginalSize == 0) {
            return (count, 0);
        }
        
        // Calculate average compression ratio as percentage (higher is better)
        averageRatio = 100 - (stats.totalCompressedSize * 100 / stats.totalOriginalSize);
        
        return (count, averageRatio);
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
        
        // Calculate estimated compressed size
        estimatedCompressedSize = _estimateCompressedSize(dataSize, dataType);
        
        // Gas optimization: Avoid unnecessary calculations for small data
        if (estimatedCompressedSize < blobSizeThreshold) {
            return (false, estimatedCompressedSize);
        }
        
        // Calculate gas costs for both methods
        uint256 blobGasCost = _calculateBlobGasCost(chainId, estimatedCompressedSize);
        uint256 callDataGasCost = _calculateCallDataGasCost(chainId, estimatedCompressedSize);
        
        // Use blob if it's more efficient based on the efficiency factor
        useBlob = (blobGasCost * 100 <= callDataGasCost * blobGasEfficiencyFactor);
        
        return (useBlob, estimatedCompressedSize);
    }
    
    /**
     * @dev Estimate compressed size based on data type and original size
     * @param dataSize Original data size
     * @param dataType Data type
     * @return estimatedSize Estimated compressed size
     */
    function _estimateCompressedSize(uint256 dataSize, uint8 dataType) internal view returns (uint256) {
        // Gas optimization: Read from storage once
        CompressionStats storage stats = _compressionStats[dataType];
        
        // If we have statistics, use them for estimation
        if (stats.compressionCount > 0 && stats.totalOriginalSize > 0) {
            return dataSize * stats.totalCompressedSize / stats.totalOriginalSize;
        }
        
        // Otherwise use estimates based on data type
        uint256 estimatedCompressionRatio;
        
        // Gas optimization: Use if-else chain instead of repetitive pattern
        if (dataType == JSON_DATA) {
            estimatedCompressionRatio = 40; // ~40% compression for JSON
        } else if (dataType == BINARY_DATA) {
            estimatedCompressionRatio = 20; // ~20% compression for binary data
        } else if (dataType == MERKLE_PROOF) {
            estimatedCompressionRatio = 30; // ~30% compression for Merkle proofs
        } else if (dataType == TRANSACTION_DATA) {
            estimatedCompressionRatio = 15; // ~15% compression for transaction data
        } else {
            estimatedCompressionRatio = 10; // ~10% compression for unknown data types
        }
        
        return dataSize * (100 - estimatedCompressionRatio) / 100;
    }
    
    /**
     * @dev Calculate blob gas cost for a given size
     * @param chainId Chain ID
     * @param dataSize Data size in bytes
     * @return cost Gas cost
     */
    function _calculateBlobGasCost(uint256 chainId, uint256 dataSize) internal view returns (uint256) {
        // Gas optimization: Use local variable to avoid multiple storage reads
        uint256 blobGasPrice = _blobGasPriceByChain[chainId];
        if (blobGasPrice == 0) {
            blobGasPrice = 1; // Default if not set
        }
        
        // Gas optimization: Use bit shifting for power of 2
        // Blob size as per EIP-4844 is 128KB = 2^17 bytes
        uint256 numBlobs = (dataSize + ((1 << 17) - 1)) >> 17; // Ceiling division by 2^17
        
        // Calculate gas cost: blob_gas_per_blob = 2^17 = 131072
        return numBlobs * (1 << 17) * blobGasPrice;
    }
    
    /**
     * @dev Calculate calldata gas cost for a given size
     * @param chainId Chain ID
     * @param dataSize Data size in bytes
     * @return cost Gas cost
     */
    function _calculateCallDataGasCost(uint256 chainId, uint256 dataSize) internal view returns (uint256) {
        // Gas optimization: Use local variable to avoid multiple storage reads
        uint256 baseGasPrice = _baseGasPriceByChain[chainId];
        if (baseGasPrice == 0) {
            baseGasPrice = 1; // Default if not set
        }
        
        // Gas optimization: Avoid multiplication and division when possible
        // Calldata gas cost: 16 gas per non-zero byte, 4 gas per zero byte
        // Assuming ~20% zero bytes and 80% non-zero bytes
        uint256 nonZeroBytes = dataSize - (dataSize / 5); // 80% = dataSize - dataSize/5
        uint256 zeroBytes = dataSize / 5; // 20%
        
        return ((nonZeroBytes * 16) + (zeroBytes * 4)) * baseGasPrice;
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
     * @dev Compress data using LZ77-inspired algorithm with dictionary optimization
     * @param data Raw data
     * @param dataType Type of data
     * @return compressedData Compressed data
     */
    function compressData(bytes calldata data, uint8 dataType) external returns (bytes memory) {
        uint256 originalSize = data.length;
        
        if (originalSize == 0) {
            return new bytes(0);
        }
        
        // Get compression parameters for this data type
        CompressionParams memory params = _compressionParams[dataType];
        
        // Perform compression
        bytes memory compressedData = _compressWithDictionary(data, dataType, params);
        uint256 compressedSize = compressedData.length;
        
        // Update compression statistics
        CompressionStats storage stats = _compressionStats[dataType];
        stats.totalOriginalSize += originalSize;
        stats.totalCompressedSize += compressedSize;
        stats.compressionCount++;
        
        // Calculate compression ratio as percentage (higher is better)
        uint256 compressionRatio = 100 - (compressedSize * 100 / originalSize);
        
        emit DataCompressed(dataType, originalSize, compressedSize, compressionRatio);
        
        return compressedData;
    }
    
    /**
     * @dev Compress data using dictionary-based compression
     * @param data Raw data to compress
     * @param dataType Type of data
     * @param params Compression parameters
     * @return compressed Compressed data
     */
    function _compressWithDictionary(
        bytes calldata data, 
        uint8 dataType, 
        CompressionParams memory params
    ) internal view returns (bytes memory) {
        // Initialize compression output
        // First byte of output is the data type (for decompression)
        bytes memory output = new bytes(data.length + 1);
        output[0] = bytes1(dataType);
        
        uint256 inputPos = 0;
        uint256 outputPos = 1;
        uint256 inputLength = data.length;
        
        // Get the appropriate dictionary
        bytes32[] memory dictionary = _getDictionaryForType(dataType);
        
        // Dictionary-based compression with match searching
        while (inputPos < inputLength) {
            bool foundMatch = false;
            
            // Check for matches in the dictionary
            for (uint256 i = 0; i < params.dictionarySize; i++) {
                bytes32 pattern = dictionary[i];
                bytes memory patternBytes = _bytes32ToBytes(pattern);
                uint256 patternLength = patternBytes.length;
                
                // Skip if pattern is empty or longer than remaining input
                if (patternLength == 0 || inputPos + patternLength > inputLength) {
                    continue;
                }
                
                // Check if pattern matches at current position
                bool isMatch = true;
                for (uint256 j = 0; j < patternLength; j++) {
                    if (data[inputPos + j] != patternBytes[j]) {
                        isMatch = false;
                        break;
                    }
                }
                
                if (isMatch && patternLength >= params.minMatchLength) {
                    // Write reference to pattern (dictionary index)
                    output[outputPos++] = bytes1(0xFF); // Marker for dictionary reference
                    output[outputPos++] = bytes1(uint8(i)); // Dictionary index
                    
                    // Advance input pointer
                    inputPos += patternLength;
                    foundMatch = true;
                    break;
                }
            }
            
            // If no match found in dictionary, copy literal byte
            if (!foundMatch) {
                output[outputPos++] = data[inputPos++];
            }
        }
        
        // Create final output of exact size
        bytes memory finalOutput = new bytes(outputPos);
        for (uint256 i = 0; i < outputPos; i++) {
            finalOutput[i] = output[i];
        }
        
        return finalOutput;
    }
    
    /**
     * @dev Decompress data previously compressed with compressData
     * @param compressedData Compressed data
     * @return data Decompressed data
     */
    function decompressData(bytes calldata compressedData) external view returns (bytes memory) {
        if (compressedData.length == 0) {
            return new bytes(0);
        }
        
        // First byte contains the data type
        uint8 dataType = uint8(compressedData[0]);
        
        // Get compression parameters and dictionary for this data type
        CompressionParams memory params = _compressionParams[dataType];
        bytes32[] memory dictionary = _getDictionaryForType(dataType);
        
        // Initialize decompression output (worst case: no compression)
        bytes memory output = new bytes(compressedData.length * 4); // Over-allocate to avoid resizing
        
        uint256 inputPos = 1; // Skip data type byte
        uint256 outputPos = 0;
        uint256 inputLength = compressedData.length;
        
        // Dictionary-based decompression
        while (inputPos < inputLength) {
            // Check if current byte is a dictionary reference marker
            if (compressedData[inputPos] == bytes1(0xFF) && inputPos + 1 < inputLength) {
                // Get dictionary index
                uint8 dictIndex = uint8(compressedData[inputPos + 1]);
                
                // Retrieve pattern from dictionary
                bytes memory pattern = _bytes32ToBytes(dictionary[dictIndex]);
                
                // Copy pattern to output
                for (uint256 i = 0; i < pattern.length; i++) {
                    output[outputPos++] = pattern[i];
                }
                
                // Advance input pointer
                inputPos += 2;
            } else {
                // Copy literal byte
                output[outputPos++] = compressedData[inputPos++];
            }
        }
        
        // Create final output of exact size
        bytes memory finalOutput = new bytes(outputPos);
        for (uint256 i = 0; i < outputPos; i++) {
            finalOutput[i] = output[i];
        }
        
        return finalOutput;
    }
    
    /**
     * @dev Get dictionary for a specific data type
     * @param dataType Data type
     * @return dictionary Array of dictionary entries
     */
    function _getDictionaryForType(uint8 dataType) internal view returns (bytes32[] memory) {
        bytes32[] memory dictionary = new bytes32[](64);
        
        if (dataType == JSON_DATA) {
            for (uint256 i = 0; i < 64; i++) {
                dictionary[i] = _jsonDictionary[i];
            }
        } else if (dataType == BINARY_DATA) {
            for (uint256 i = 0; i < 64; i++) {
                dictionary[i] = _binaryDictionary[i];
            }
        } else if (dataType == MERKLE_PROOF) {
            for (uint256 i = 0; i < 64; i++) {
                dictionary[i] = _proofDictionary[i];
            }
        } else if (dataType == TRANSACTION_DATA) {
            for (uint256 i = 0; i < 64; i++) {
                dictionary[i] = _transactionDictionary[i];
            }
        }
        
        return dictionary;
    }
    
    /**
     * @dev Convert bytes32 to bytes
     * @param input Input bytes32
     * @return output Output bytes
     */
    function _bytes32ToBytes(bytes32 input) internal pure returns (bytes memory) {
        // Count non-zero bytes from the end
        uint256 length = 32;
        while (length > 0 && input[length - 1] == 0) {
            length--;
        }
        
        bytes memory output = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            output[i] = input[i];
        }
        
        return output;
    }
} 
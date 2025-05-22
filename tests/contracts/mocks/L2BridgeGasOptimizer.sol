// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title L2BridgeGasOptimizer Mock
 * @dev Mock implementation of the L2BridgeGasOptimizer for testing
 */
contract L2BridgeGasOptimizer {
    uint256 public blobSizeThreshold = 4096;
    
    function optimizeData(bytes memory data, uint8 dataType) external pure returns (bytes memory) {
        // Simple mock implementation that just returns the original data
        return data;
    }
    
    function setBlobSizeThreshold(uint256 threshold) external {
        blobSizeThreshold = threshold;
    }
} 
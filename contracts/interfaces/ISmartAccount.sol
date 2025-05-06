// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISmartAccount
 * @dev Interface for EIP-7702 smart accounts with programmable logic
 */
interface ISmartAccount {
    /**
     * @dev Emitted when account code is set
     * @param account The address of the account
     * @param codeHash The hash of the code
     */
    event AccountCodeSet(address indexed account, bytes32 codeHash);

    /**
     * @dev Emitted when account code is executed
     * @param account The address of the account
     * @param dataHash The hash of the execution data
     * @param resultHash The hash of the execution result
     */
    event AccountExecuted(address indexed account, bytes32 dataHash, bytes32 resultHash);
    
    /**
     * @dev Emitted when account code is updated
     * @param account The address of the account
     * @param oldCodeHash The hash of the old code
     * @param newCodeHash The hash of the new code
     */
    event AccountCodeUpdated(address indexed account, bytes32 oldCodeHash, bytes32 newCodeHash);
    
    /**
     * @dev Emitted when account execution fails
     * @param account The address of the account
     * @param dataHash The hash of the execution data
     * @param reason The reason for the failure
     */
    event AccountExecutionFailed(address indexed account, bytes32 dataHash, string reason);

    /**
     * @dev Set the code for the account
     * @param code The code to set
     * @return Success status
     */
    function setAccountCode(bytes calldata code) external returns (bool);

    /**
     * @dev Get the code for the account
     * @return The account code
     */
    function getAccountCode() external view returns (bytes memory);

    /**
     * @dev Execute the account code with provided data
     * @param data The data to execute
     * @return The result of the execution
     */
    function execute(bytes calldata data) external returns (bytes memory);

    /**
     * @dev Check if the account has code set
     * @return Whether the account has code
     */
    function hasCode() external view returns (bool);

    /**
     * @dev Get the hash of the account code
     * @return The hash of the account code
     */
    function getCodeHash() external view returns (bytes32);
    
    /**
     * @dev Validate an execution would succeed without executing it
     * @param data The data to validate
     * @return Whether the execution would succeed
     */
    function validateExecution(bytes calldata data) external view returns (bool);
} 
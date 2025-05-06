// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITreasuryRegistry.sol";

/**
 * @title ITreasuryToken
 * @dev Interface for the ERC-1400 compatible security token representing a treasury security
 */
interface ITreasuryToken {
    /**
     * @dev Emitted when yield is distributed
     * @param totalAmount The total amount of yield distributed
     * @param distributionDate The date of the distribution
     */
    event YieldDistributed(uint256 totalAmount, uint256 distributionDate);

    /**
     * @dev Emitted when treasury matures
     * @param treasuryId The unique identifier for the treasury
     * @param maturityDate The maturity date of the treasury
     */
    event TreasuryMatured(bytes32 indexed treasuryId, uint256 maturityDate);

    /**
     * @dev Emitted when tokens are redeemed
     * @param holder The address of the token holder
     * @param amount The amount of tokens redeemed
     */
    event TokensRedeemed(address indexed holder, uint256 amount);

    /**
     * @dev Emitted when new tokens are issued
     * @param to The address receiving the issued tokens
     * @param amount The amount of tokens issued
     */
    event TokensIssued(address indexed to, uint256 amount);

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
    event AccountCodeExecuted(address indexed account, bytes32 dataHash, bytes32 resultHash);

    /**
     * @dev Emitted when BLS signature is verified
     * @param signatureHash The hash of the signature
     * @param messageHash The hash of the message
     * @param valid Whether the signature is valid
     */
    event BLSSignatureVerified(bytes32 signatureHash, bytes32 messageHash, bool valid);

    /**
     * @dev ERC-1400 transfer function with compliance checks
     * @param to The address to transfer to
     * @param value The amount to transfer
     * @param data Additional data for compliance checks
     * @return Success status
     */
    function transferWithData(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bool);

    /**
     * @dev Check if transfer is valid
     * @param to The address to transfer to
     * @param value The amount to transfer
     * @param data Additional data for compliance checks
     * @return Whether the transfer is valid, an error code if not, and any additional data
     */
    function canTransfer(
        address to,
        uint256 value,
        bytes calldata data
    ) external view returns (bool, byte, bytes32);

    /**
     * @dev Distribute yield to token holders
     * @return Success status
     */
    function distributeYield() external returns (bool);

    /**
     * @dev Calculate yield amount for token holder
     * @param holder The address of the token holder
     * @return The yield amount for the holder
     */
    function calculateYieldAmount(address holder) external view returns (uint256);

    /**
     * @dev Process maturity
     * @return Success status
     */
    function processMaturity() external returns (bool);

    /**
     * @dev Redeem tokens at maturity
     * @param amount The amount of tokens to redeem
     * @return Success status
     */
    function redeem(uint256 amount) external returns (bool);

    /**
     * @dev Issue new tokens (restricted to issuer)
     * @param to The address to issue tokens to
     * @param amount The amount of tokens to issue
     * @return Success status
     */
    function issue(address to, uint256 amount) external returns (bool);

    /**
     * @dev Set smart account code (EIP-7702)
     * @param code The code to set for the account
     * @return Success status
     */
    function setAccountCode(bytes calldata code) external returns (bool);

    /**
     * @dev Execute smart account logic
     * @param data The data to execute
     * @return The result of the execution
     */
    function executeAccountCode(bytes calldata data) external returns (bytes memory);

    /**
     * @dev Validate BLS signature for institutional operations (EIP-2537)
     * @param signature The BLS signature
     * @param message The message that was signed
     * @param publicKey The public key to validate against
     * @return Whether the signature is valid
     */
    function validateBLSSignature(
        bytes calldata signature,
        bytes calldata message,
        bytes calldata publicKey
    ) external returns (bool);
    
    /**
     * @dev Get the balance of an account
     * @param account The address to query the balance of
     * @return The account balance
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @dev Get the total supply of tokens
     * @return The total token supply
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @dev Get the name of the token
     * @return The name of the token
     */
    function name() external view returns (string memory);
    
    /**
     * @dev Get the symbol of the token
     * @return The symbol of the token
     */
    function symbol() external view returns (string memory);
    
    /**
     * @dev Get the decimals of the token
     * @return The decimals of the token
     */
    function decimals() external view returns (uint8);
    
    /**
     * @dev Get the treasury ID
     * @return The unique identifier for the treasury
     */
    function treasuryId() external view returns (bytes32);
    
    /**
     * @dev Get the treasury type
     * @return The type of treasury
     */
    function treasuryType() external view returns (ITreasuryRegistry.TreasuryType);
    
    /**
     * @dev Get the face value of the treasury
     * @return The face value of the treasury
     */
    function faceValue() external view returns (uint256);
    
    /**
     * @dev Get the yield rate of the treasury
     * @return The yield rate of the treasury
     */
    function yieldRate() external view returns (uint256);
    
    /**
     * @dev Get the issuance date of the treasury
     * @return The issuance date of the treasury
     */
    function issuanceDate() external view returns (uint256);
    
    /**
     * @dev Get the maturity date of the treasury
     * @return The maturity date of the treasury
     */
    function maturityDate() external view returns (uint256);
    
    /**
     * @dev Get the address of the issuer
     * @return The address of the issuer
     */
    function issuer() external view returns (address);
} 
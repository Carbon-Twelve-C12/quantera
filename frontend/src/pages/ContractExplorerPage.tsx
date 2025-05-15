import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Card,
  CardContent,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Stack,
  Link
} from '@mui/material';
import CompatGrid from '../components/common/CompatGrid';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import StorageIcon from '@mui/icons-material/Storage';
import ArticleIcon from '@mui/icons-material/Article';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

// Import for code syntax highlighting
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface Contract {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  version: string;
  audited: boolean;
  deploymentDate: string;
  code: string;
  abiUrl: string;
  etherscanUrl: string;
  functions: Function[];
}

interface Function {
  name: string;
  description: string;
  inputs: FunctionParameter[];
  outputs: FunctionParameter[];
  visibility: string;
  stateMutability: string;
}

interface FunctionParameter {
  name: string;
  type: string;
  description: string;
}

// Mock data for contracts
const mockContracts: Contract[] = [
  {
    id: 'l2bridge',
    name: 'L2Bridge',
    description: 'Facilitates asset bridging between Layer 1 and Layer 2 networks',
    category: 'infrastructure',
    address: '0x1234567890123456789012345678901234567890',
    version: '1.0.0',
    audited: true,
    deploymentDate: '2023-11-15',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract L2Bridge is Ownable {
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    
    // State variables
    mapping(address => mapping(address => uint256)) public deposits;
    
    // External functions
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount);
    }
    
    function withdraw(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender][token] >= amount, "Insufficient balance");
        deposits[msg.sender][token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, token, amount);
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/L2Bridge.json',
    etherscanUrl: 'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
    functions: [
      {
        name: 'deposit',
        description: 'Deposits tokens from L1 to be bridged to L2',
        inputs: [
          { name: 'token', type: 'address', description: 'The token contract address' },
          { name: 'amount', type: 'uint256', description: 'Amount of tokens to deposit' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'withdraw',
        description: 'Withdraws tokens from the bridge back to L1',
        inputs: [
          { name: 'token', type: 'address', description: 'The token contract address' },
          { name: 'amount', type: 'uint256', description: 'Amount of tokens to withdraw' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
  {
    id: 'smartaccount',
    name: 'SmartAccount',
    description: 'Account abstraction implementation for Quantera platform',
    category: 'accounts',
    address: '0x0987654321098765432109876543210987654321',
    version: '2.1.0',
    audited: true,
    deploymentDate: '2023-12-01',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SmartAccount is ReentrancyGuard {
    using ECDSA for bytes32;
    
    address public owner;
    uint256 public nonce;
    
    constructor(address _owner) {
        owner = _owner;
    }
    
    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external nonReentrant returns (bytes memory) {
        // Verify signature
        bytes32 hash = keccak256(abi.encodePacked(target, value, data, nonce));
        address signer = hash.toEthSignedMessageHash().recover(signature);
        require(signer == owner, "Invalid signature");
        
        // Increment nonce
        nonce++;
        
        // Execute transaction
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Transaction failed");
        
        return result;
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/SmartAccount.json',
    etherscanUrl: 'https://etherscan.io/address/0x0987654321098765432109876543210987654321',
    functions: [
      {
        name: 'executeTransaction',
        description: 'Executes a transaction on behalf of the account owner',
        inputs: [
          { name: 'target', type: 'address', description: 'Target contract address' },
          { name: 'value', type: 'uint256', description: 'ETH value to send' },
          { name: 'data', type: 'bytes', description: 'Transaction data' },
          { name: 'signature', type: 'bytes', description: 'Owner signature' }
        ],
        outputs: [
          { name: '', type: 'bytes', description: 'Transaction result data' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
  {
    id: 'assetfactory',
    name: 'AssetFactory',
    description: 'Factory contract for creating new tokenized assets',
    category: 'assets',
    address: '0x5678901234567890123456789012345678901234',
    version: '1.2.0',
    audited: true,
    deploymentDate: '2023-10-10',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract AssetFactory is Ownable {
    // Events
    event AssetCreated(address indexed assetAddress, string assetType, string name, string symbol, uint256 initialSupply);
    event TemplateAdded(address indexed templateAddress, string assetType);
    event TemplateRemoved(address indexed templateAddress, string assetType);
    
    // Mapping of asset type to its implementation template
    mapping(string => address) public assetTemplates;
    // Array to keep track of all supported asset types
    string[] public supportedAssetTypes;
    
    constructor() {
        // Initialize with empty templates
    }
    
    /**
     * @dev Add or update a template for a specific asset type
     * @param assetType The type of asset (e.g., "TREASURY", "CARBON_CREDIT")
     * @param templateAddress The address of the template contract
     */
    function setAssetTemplate(string calldata assetType, address templateAddress) external onlyOwner {
        require(templateAddress != address(0), "Template address cannot be zero");
        
        if (assetTemplates[assetType] == address(0)) {
            // New template
            supportedAssetTypes.push(assetType);
        }
        
        assetTemplates[assetType] = templateAddress;
        emit TemplateAdded(templateAddress, assetType);
    }
    
    /**
     * @dev Remove a template for a specific asset type
     * @param assetType The type of asset to remove
     */
    function removeAssetTemplate(string calldata assetType) external onlyOwner {
        require(assetTemplates[assetType] != address(0), "Template does not exist");
        
        address oldTemplate = assetTemplates[assetType];
        delete assetTemplates[assetType];
        
        // Remove from supportedAssetTypes array
        for (uint i = 0; i < supportedAssetTypes.length; i++) {
            if (keccak256(bytes(supportedAssetTypes[i])) == keccak256(bytes(assetType))) {
                supportedAssetTypes[i] = supportedAssetTypes[supportedAssetTypes.length - 1];
                supportedAssetTypes.pop();
                break;
            }
        }
        
        emit TemplateRemoved(oldTemplate, assetType);
    }
    
    /**
     * @dev Create a new asset from a template
     * @param assetType The type of asset to create
     * @param name The name of the asset
     * @param symbol The symbol of the asset
     * @param initialSupply The initial supply of the asset
     * @param data Additional initialization data specific to the asset type
     * @return The address of the newly created asset
     */
    function createAsset(
        string calldata assetType,
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        bytes calldata data
    ) external returns (address) {
        address template = assetTemplates[assetType];
        require(template != address(0), "Unsupported asset type");
        
        // Clone the template using minimal proxy pattern
        address assetAddress = Clones.clone(template);
        
        // Initialize the asset
        (bool success, ) = assetAddress.call(
            abi.encodeWithSignature(
                "initialize(string,string,uint256,address,bytes)",
                name,
                symbol,
                initialSupply,
                msg.sender,
                data
            )
        );
        require(success, "Asset initialization failed");
        
        emit AssetCreated(assetAddress, assetType, name, symbol, initialSupply);
        return assetAddress;
    }
    
    /**
     * @dev Get all supported asset types
     * @return Array of supported asset types
     */
    function getSupportedAssetTypes() external view returns (string[] memory) {
        return supportedAssetTypes;
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/AssetFactory.json',
    etherscanUrl: 'https://etherscan.io/address/0x5678901234567890123456789012345678901234',
    functions: [
      {
        name: 'setAssetTemplate',
        description: 'Add or update a template for a specific asset type',
        inputs: [
          { name: 'assetType', type: 'string', description: 'The type of asset (e.g., "TREASURY", "CARBON_CREDIT")' },
          { name: 'templateAddress', type: 'address', description: 'The address of the template contract' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'removeAssetTemplate',
        description: 'Remove a template for a specific asset type',
        inputs: [
          { name: 'assetType', type: 'string', description: 'The type of asset to remove' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'createAsset',
        description: 'Create a new asset from a template',
        inputs: [
          { name: 'assetType', type: 'string', description: 'The type of asset to create' },
          { name: 'name', type: 'string', description: 'The name of the asset' },
          { name: 'symbol', type: 'string', description: 'The symbol of the asset' },
          { name: 'initialSupply', type: 'uint256', description: 'The initial supply of the asset' },
          { name: 'data', type: 'bytes', description: 'Additional initialization data specific to the asset type' }
        ],
        outputs: [
          { name: '', type: 'address', description: 'The address of the newly created asset' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'getSupportedAssetTypes',
        description: 'Get all supported asset types',
        inputs: [],
        outputs: [
          { name: '', type: 'string[]', description: 'Array of supported asset types' }
        ],
        visibility: 'external',
        stateMutability: 'view'
      }
    ]
  },
  {
    id: 'treasurymanager',
    name: 'TreasuryManager',
    description: 'Manages treasury asset issuance and redemption',
    category: 'treasury',
    address: '0x4567890123456789012345678901234567890123',
    version: '1.0.0',
    audited: false,
    deploymentDate: '2023-12-15',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TreasuryManager is AccessControl, ReentrancyGuard {
    // Roles
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    
    // Events
    event TreasuryIssued(address indexed token, uint256 amount, address indexed recipient);
    event TreasuryRedeemed(address indexed token, uint256 amount, address indexed redeemer);
    event CollateralDeposited(address indexed token, address indexed collateralToken, uint256 amount);
    event CollateralWithdrawn(address indexed token, address indexed collateralToken, uint256 amount, address indexed recipient);
    
    // State variables
    mapping(address => mapping(address => uint256)) public collateralBalances; // token -> collateralToken -> amount
    mapping(address => address[]) public tokenCollaterals; // token -> array of collateral tokens
    mapping(address => bool) public supportedTreasuryTokens;
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ISSUER_ROLE, msg.sender);
        _setupRole(REDEEMER_ROLE, msg.sender);
    }
    
    /**
     * @dev Add a supported treasury token
     * @param tokenAddress The address of the treasury token
     */
    function addSupportedToken(address tokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        supportedTreasuryTokens[tokenAddress] = true;
    }
    
    /**
     * @dev Remove a supported treasury token
     * @param tokenAddress The address of the treasury token
     */
    function removeSupportedToken(address tokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTreasuryTokens[tokenAddress] = false;
    }
    
    /**
     * @dev Deposit collateral for a treasury token
     * @param tokenAddress The address of the treasury token
     * @param collateralAddress The address of the collateral token
     * @param amount The amount of collateral to deposit
     */
    function depositCollateral(address tokenAddress, address collateralAddress, uint256 amount) external nonReentrant {
        require(supportedTreasuryTokens[tokenAddress], "Unsupported treasury token");
        require(collateralAddress != address(0), "Collateral address cannot be zero");
        require(amount > 0, "Amount must be greater than zero");
        
        // Transfer collateral from sender to this contract
        IERC20(collateralAddress).transferFrom(msg.sender, address(this), amount);
        
        // Update collateral balances
        if (collateralBalances[tokenAddress][collateralAddress] == 0) {
            tokenCollaterals[tokenAddress].push(collateralAddress);
        }
        collateralBalances[tokenAddress][collateralAddress] += amount;
        
        emit CollateralDeposited(tokenAddress, collateralAddress, amount);
    }
    
    /**
     * @dev Issue treasury tokens to a recipient
     * @param tokenAddress The address of the treasury token
     * @param amount The amount of tokens to issue
     * @param recipient The address of the recipient
     */
    function issueTreasury(address tokenAddress, uint256 amount, address recipient) external onlyRole(ISSUER_ROLE) nonReentrant {
        require(supportedTreasuryTokens[tokenAddress], "Unsupported treasury token");
        require(amount > 0, "Amount must be greater than zero");
        require(recipient != address(0), "Recipient cannot be zero address");
        
        // Call mint function on the treasury token
        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature("mint(address,uint256)", recipient, amount)
        );
        require(success, "Treasury issuance failed");
        
        emit TreasuryIssued(tokenAddress, amount, recipient);
    }
    
    /**
     * @dev Redeem treasury tokens
     * @param tokenAddress The address of the treasury token
     * @param amount The amount of tokens to redeem
     */
    function redeemTreasury(address tokenAddress, uint256 amount) external nonReentrant {
        require(supportedTreasuryTokens[tokenAddress], "Unsupported treasury token");
        require(amount > 0, "Amount must be greater than zero");
        
        // Transfer tokens from sender to this contract
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        
        // Call burn function on the treasury token
        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature("burn(uint256)", amount)
        );
        require(success, "Treasury redemption failed");
        
        emit TreasuryRedeemed(tokenAddress, amount, msg.sender);
    }
    
    /**
     * @dev Withdraw collateral to a recipient
     * @param tokenAddress The address of the treasury token
     * @param collateralAddress The address of the collateral token
     * @param amount The amount of collateral to withdraw
     * @param recipient The address of the recipient
     */
    function withdrawCollateral(address tokenAddress, address collateralAddress, uint256 amount, address recipient) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than zero");
        require(recipient != address(0), "Recipient cannot be zero address");
        require(collateralBalances[tokenAddress][collateralAddress] >= amount, "Insufficient collateral balance");
        
        // Update collateral balance
        collateralBalances[tokenAddress][collateralAddress] -= amount;
        
        // Transfer collateral to recipient
        IERC20(collateralAddress).transfer(recipient, amount);
        
        emit CollateralWithdrawn(tokenAddress, collateralAddress, amount, recipient);
    }
    
    /**
     * @dev Get all collateral tokens for a treasury token
     * @param tokenAddress The address of the treasury token
     * @return Array of collateral token addresses
     */
    function getCollateralTokens(address tokenAddress) external view returns (address[] memory) {
        return tokenCollaterals[tokenAddress];
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/TreasuryManager.json',
    etherscanUrl: 'https://etherscan.io/address/0x4567890123456789012345678901234567890123',
    functions: [
      {
        name: 'addSupportedToken',
        description: 'Add a supported treasury token',
        inputs: [
          { name: 'tokenAddress', type: 'address', description: 'The address of the treasury token' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'removeSupportedToken',
        description: 'Remove a supported treasury token',
        inputs: [
          { name: 'tokenAddress', type: 'address', description: 'The address of the treasury token' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'depositCollateral',
        description: 'Deposit collateral for a treasury token',
        inputs: [
          { name: 'tokenAddress', type: 'address', description: 'The address of the treasury token' },
          { name: 'collateralAddress', type: 'address', description: 'The address of the collateral token' },
          { name: 'amount', type: 'uint256', description: 'The amount of collateral to deposit' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'issueTreasury',
        description: 'Issue treasury tokens to a recipient',
        inputs: [
          { name: 'tokenAddress', type: 'address', description: 'The address of the treasury token' },
          { name: 'amount', type: 'uint256', description: 'The amount of tokens to issue' },
          { name: 'recipient', type: 'address', description: 'The address of the recipient' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'redeemTreasury',
        description: 'Redeem treasury tokens',
        inputs: [
          { name: 'tokenAddress', type: 'address', description: 'The address of the treasury token' },
          { name: 'amount', type: 'uint256', description: 'The amount of tokens to redeem' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
  {
    id: 'liquiditypair',
    name: 'ConcentratedLiquidityPair',
    description: 'Implements concentrated liquidity AMM functionality',
    category: 'liquidity',
    address: '0x3456789012345678901234567890123456789012',
    version: '1.1.0',
    audited: true,
    deploymentDate: '2023-09-20',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract ConcentratedLiquidityPair is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Structs
    struct Position {
        uint128 liquidity;
        uint256 lowerTick;
        uint256 upperTick;
        uint256 tokensOwed0;
        uint256 tokensOwed1;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
    }
    
    struct Tick {
        int128 liquidityNet;
        uint128 liquidityGross;
        uint256 feeGrowthOutside0X128;
        uint256 feeGrowthOutside1X128;
        bool initialized;
    }
    
    // Constants
    uint256 public constant TICK_SPACING = 60;
    uint256 public constant MAX_TICK = 887272;
    uint256 public constant MIN_TICK = -887272;
    
    // Events
    event Mint(address indexed owner, uint256 lowerTick, uint256 upperTick, uint128 amount, uint256 amount0, uint256 amount1);
    event Burn(address indexed owner, uint256 lowerTick, uint256 upperTick, uint128 amount, uint256 amount0, uint256 amount1);
    event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to);
    event Collect(address indexed owner, address recipient, uint256 amount0, uint256 amount1);
    
    // State variables
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint24 public immutable fee;
    
    uint160 public sqrtPriceX96;
    uint128 public liquidity;
    int24 public tick;
    
    uint256 public feeGrowthGlobal0X128;
    uint256 public feeGrowthGlobal1X128;
    
    // Tick info
    mapping(int24 => Tick) public ticks;
    // Position info
    mapping(bytes32 => Position) public positions;
    
    constructor(
        address _token0,
        address _token1,
        uint24 _fee,
        uint160 _sqrtPriceX96
    ) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        fee = _fee;
        sqrtPriceX96 = _sqrtPriceX96;
    }
    
    /**
     * @dev Calculates the position key
     * @param owner The owner of the position
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @return The position key
     */
    function getPositionKey(
        address owner,
        int24 lowerTick,
        int24 upperTick
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, lowerTick, upperTick));
    }
    
    /**
     * @dev Provides liquidity to the pool
     * @param recipient The address that will receive the position
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @param amount The amount of liquidity to add
     * @return amount0 The amount of token0 sent to the pool
     * @return amount1 The amount of token1 sent to the pool
     */
    function mint(
        address recipient,
        int24 lowerTick,
        int24 upperTick,
        uint128 amount
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(lowerTick < upperTick, "Invalid tick range");
        require(lowerTick >= MIN_TICK, "Tick too low");
        require(upperTick <= MAX_TICK, "Tick too high");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate token amounts required
        // This is a simplified calculation for demonstration
        amount0 = amount * uint256(upperTick - tick) / uint256(upperTick - lowerTick);
        amount1 = amount * uint256(tick - lowerTick) / uint256(upperTick - lowerTick);
        
        // Transfer tokens from sender to the contract
        if (amount0 > 0) token0.safeTransferFrom(msg.sender, address(this), amount0);
        if (amount1 > 0) token1.safeTransferFrom(msg.sender, address(this), amount1);
        
        // Update position
        bytes32 positionKey = getPositionKey(recipient, lowerTick, upperTick);
        Position storage position = positions[positionKey];
        position.liquidity += amount;
        
        // Update ticks
        Tick storage lower = ticks[lowerTick];
        if (!lower.initialized) {
            lower.initialized = true;
        }
        lower.liquidityGross += amount;
        lower.liquidityNet += int128(amount);
        
        Tick storage upper = ticks[upperTick];
        if (!upper.initialized) {
            upper.initialized = true;
        }
        upper.liquidityGross += amount;
        upper.liquidityNet -= int128(amount);
        
        // Update global liquidity
        if (lowerTick <= tick && tick < upperTick) {
            liquidity += amount;
        }
        
        emit Mint(recipient, uint256(lowerTick), uint256(upperTick), amount, amount0, amount1);
        return (amount0, amount1);
    }
    
    /**
     * @dev Removes liquidity from the pool
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @param amount The amount of liquidity to remove
     * @return amount0 The amount of token0 returned
     * @return amount1 The amount of token1 returned
     */
    function burn(
        int24 lowerTick,
        int24 upperTick,
        uint128 amount
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Get position
        bytes32 positionKey = getPositionKey(msg.sender, lowerTick, upperTick);
        Position storage position = positions[positionKey];
        require(position.liquidity >= amount, "Insufficient liquidity");
        
        // Calculate token amounts to return
        // This is a simplified calculation for demonstration
        amount0 = amount * uint256(upperTick - tick) / uint256(upperTick - lowerTick);
        amount1 = amount * uint256(tick - lowerTick) / uint256(upperTick - lowerTick);
        
        // Update position
        position.liquidity -= amount;
        
        // Update ticks
        Tick storage lower = ticks[lowerTick];
        lower.liquidityGross -= amount;
        lower.liquidityNet -= int128(amount);
        
        Tick storage upper = ticks[upperTick];
        upper.liquidityGross -= amount;
        upper.liquidityNet += int128(amount);
        
        // Update global liquidity
        if (lowerTick <= tick && tick < upperTick) {
            liquidity -= amount;
        }
        
        // Update tokens owed
        position.tokensOwed0 += amount0;
        position.tokensOwed1 += amount1;
        
        emit Burn(msg.sender, uint256(lowerTick), uint256(upperTick), amount, amount0, amount1);
        return (amount0, amount1);
    }
    
    /**
     * @dev Collects tokens owed to a position
     * @param recipient The address that will receive the tokens
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @param amount0Requested The maximum amount of token0 to collect
     * @param amount1Requested The maximum amount of token1 to collect
     * @return amount0 The amount of token0 collected
     * @return amount1 The amount of token1 collected
     */
    function collect(
        address recipient,
        int24 lowerTick,
        int24 upperTick,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external nonReentrant returns (uint128 amount0, uint128 amount1) {
        // Get position
        bytes32 positionKey = getPositionKey(msg.sender, lowerTick, upperTick);
        Position storage position = positions[positionKey];
        
        // Calculate amounts to collect
        amount0 = amount0Requested > position.tokensOwed0 ? uint128(position.tokensOwed0) : amount0Requested;
        amount1 = amount1Requested > position.tokensOwed1 ? uint128(position.tokensOwed1) : amount1Requested;
        
        // Update tokens owed
        if (amount0 > 0) {
            position.tokensOwed0 -= amount0;
            token0.safeTransfer(recipient, amount0);
        }
        
        if (amount1 > 0) {
            position.tokensOwed1 -= amount1;
            token1.safeTransfer(recipient, amount1);
        }
        
        emit Collect(msg.sender, recipient, amount0, amount1);
        return (amount0, amount1);
    }
    
    /**
     * @dev Swaps tokens
     * @param recipient The address that will receive the output tokens
     * @param zeroForOne Whether the input token is token0 or token1
     * @param amountSpecified The amount of input tokens to swap
     * @param sqrtPriceLimitX96 The price limit of the swap
     * @return amount0 The amount of token0 swapped
     * @return amount1 The amount of token1 swapped
     */
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) external nonReentrant returns (int256 amount0, int256 amount1) {
        require(amountSpecified != 0, "Amount cannot be zero");
        
        // Simplified swap implementation for demonstration
        // In a real implementation, this would calculate the exact amounts based on the price curve
        
        if (zeroForOne) {
            // Swapping token0 for token1
            require(amountSpecified > 0, "Amount must be positive for exact input");
            amount0 = amountSpecified;
            amount1 = -int256(uint256(amount0) * uint256(sqrtPriceX96) / 2**96);
            
            token0.safeTransferFrom(msg.sender, address(this), uint256(amount0));
            token1.safeTransfer(recipient, uint256(-amount1));
        } else {
            // Swapping token1 for token0
            require(amountSpecified > 0, "Amount must be positive for exact input");
            amount1 = amountSpecified;
            amount0 = -int256(uint256(amount1) * 2**96 / uint256(sqrtPriceX96));
            
            token1.safeTransferFrom(msg.sender, address(this), uint256(amount1));
            token0.safeTransfer(recipient, uint256(-amount0));
        }
        
        // Update price and tick
        // This is a simplified update for demonstration
        if (zeroForOne) {
            sqrtPriceX96 = sqrtPriceX96 - uint160(uint256(-amount1) * 2**96 / uint256(liquidity));
            tick = int24(Math.log2(uint256(sqrtPriceX96) * uint256(sqrtPriceX96) / 2**192) / 2);
        } else {
            sqrtPriceX96 = sqrtPriceX96 + uint160(uint256(amount1) * 2**96 / uint256(liquidity));
            tick = int24(Math.log2(uint256(sqrtPriceX96) * uint256(sqrtPriceX96) / 2**192) / 2);
        }
        
        emit Swap(msg.sender, amount0 > 0 ? uint256(amount0) : 0, amount1 > 0 ? uint256(amount1) : 0, amount0 < 0 ? uint256(-amount0) : 0, amount1 < 0 ? uint256(-amount1) : 0, recipient);
        return (amount0, amount1);
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/ConcentratedLiquidityPair.json',
    etherscanUrl: 'https://etherscan.io/address/0x3456789012345678901234567890123456789012',
    functions: [
      {
        name: 'mint',
        description: 'Provides liquidity to the pool',
        inputs: [
          { name: 'recipient', type: 'address', description: 'The address that will receive the position' },
          { name: 'lowerTick', type: 'int24', description: 'The lower tick of the position' },
          { name: 'upperTick', type: 'int24', description: 'The upper tick of the position' },
          { name: 'amount', type: 'uint128', description: 'The amount of liquidity to add' }
        ],
        outputs: [
          { name: 'amount0', type: 'uint256', description: 'The amount of token0 sent to the pool' },
          { name: 'amount1', type: 'uint256', description: 'The amount of token1 sent to the pool' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'burn',
        description: 'Removes liquidity from the pool',
        inputs: [
          { name: 'lowerTick', type: 'int24', description: 'The lower tick of the position' },
          { name: 'upperTick', type: 'int24', description: 'The upper tick of the position' },
          { name: 'amount', type: 'uint128', description: 'The amount of liquidity to remove' }
        ],
        outputs: [
          { name: 'amount0', type: 'uint256', description: 'The amount of token0 returned' },
          { name: 'amount1', type: 'uint256', description: 'The amount of token1 returned' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'swap',
        description: 'Swaps tokens',
        inputs: [
          { name: 'recipient', type: 'address', description: 'The address that will receive the output tokens' },
          { name: 'zeroForOne', type: 'bool', description: 'Whether the input token is token0 or token1' },
          { name: 'amountSpecified', type: 'int256', description: 'The amount of input tokens to swap' },
          { name: 'sqrtPriceLimitX96', type: 'uint160', description: 'The price limit of the swap' }
        ],
        outputs: [
          { name: 'amount0', type: 'int256', description: 'The amount of token0 swapped' },
          { name: 'amount1', type: 'int256', description: 'The amount of token1 swapped' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
];

// Categories for grouping contracts
const categories = [
  { id: 'accounts', name: 'Accounts', icon: <AccountBalanceWalletIcon /> },
  { id: 'assets', name: 'Assets', icon: <TokenIcon /> },
  { id: 'treasury', name: 'Treasury', icon: <LocalAtmIcon /> },
  { id: 'liquidity', name: 'Liquidity', icon: <WaterDropIcon /> },
  { id: 'infrastructure', name: 'Infrastructure', icon: <StorageIcon /> },
];

const ContractExplorerPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Filter contracts based on search and category
  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = !searchQuery || 
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || contract.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Select a contract when clicking on it
  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setActiveTab(0); // Reset to first tab
  };

  // Handle tab changes in contract details
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  // Function to copy code to clipboard
  const handleCopyCode = async () => {
    if (selectedContract) {
      try {
        await navigator.clipboard.writeText(selectedContract.code);
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error("Failed to copy code: ", err);
        setCopySuccess("Failed to copy");
      }
    }
  };

  // Function to copy contract address
  const handleCopyAddress = async () => {
    if (selectedContract) {
      try {
        await navigator.clipboard.writeText(selectedContract.address);
        setCopySuccess("Address copied!");
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error("Failed to copy address: ", err);
      }
    }
  };

  // Function to open external URLs in a new tab with validation
  const handleExternalLink = (url: string) => {
    // In a real app, validate URLs before opening
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // For demo purposes, we'll console log
      console.log('External link not available:', url);
      // You could also show a notification to the user
      setCopySuccess("Link not available in demo");
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Contract Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore and understand the smart contracts that power the Quantera platform
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left sidebar - Categories and Contract List */}
        <CompatGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Categories
            </Typography>
            <List disablePadding>
              {categories.map((category) => (
                <ListItem key={category.id} disablePadding>
                  <ListItemButton
                    selected={selectedCategory === category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {category.icon}
                    </ListItemIcon>
                    <ListItemText primary={category.name} />
                    <Chip 
                      size="small" 
                      label={mockContracts.filter(c => c.category === category.id).length} 
                      sx={{ ml: 1 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Contracts {filteredContracts.length > 0 && `(${filteredContracts.length})`}
            </Typography>
            
            {filteredContracts.length > 0 ? (
              <List disablePadding>
                {filteredContracts.map((contract) => (
                  <ListItem
                    key={contract.id}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      selected={selectedContract?.id === contract.id}
                      onClick={() => handleContractSelect(contract)}
                      sx={{ 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemText
                        primary={contract.name}
                        secondary={contract.description.slice(0, 60) + (contract.description.length > 60 ? '...' : '')}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      {contract.audited && (
                        <Tooltip title="Audited">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No contracts found
                </Typography>
              </Box>
            )}
          </Paper>
        </CompatGrid>

        {/* Right main content - Contract details */}
        <CompatGrid item xs={12} md={9}>
          {selectedContract ? (
            <Paper sx={{ p: 3 }}>
              {/* Contract header */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="h2">
                      {selectedContract.name}
                    </Typography>
                    <Chip 
                      label={`v${selectedContract.version}`} 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                    {selectedContract.audited ? (
                      <Chip 
                        icon={<CheckCircleIcon />}
                        label="Audited" 
                        size="small" 
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    ) : (
                      <Chip 
                        icon={<WarningIcon />}
                        label="Unaudited" 
                        size="small" 
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {selectedContract.description}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  startIcon={<LaunchIcon />}
                  href={selectedContract.etherscanUrl}
                  target="_blank"
                >
                  View on Etherscan
                </Button>
              </Box>

              {/* Contract metadata */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <CompatGrid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Contract Address
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedContract.address}
                        </Typography>
                        <IconButton size="small" sx={{ ml: 1 }} onClick={handleCopyAddress}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </CompatGrid>
                <CompatGrid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Category
                      </Typography>
                      <Typography variant="body2">
                        {categories.find(c => c.id === selectedContract.category)?.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </CompatGrid>
                <CompatGrid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Deployment Date
                      </Typography>
                      <Typography variant="body2">
                        {selectedContract.deploymentDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </CompatGrid>
              </Grid>

              {/* Tabs for contract details */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="contract details tabs"
                >
                  <Tab 
                    icon={<CodeIcon />} 
                    iconPosition="start" 
                    label="Source Code" 
                  />
                  <Tab 
                    icon={<DescriptionIcon />} 
                    iconPosition="start" 
                    label="Functions" 
                  />
                  <Tab 
                    icon={<SecurityIcon />} 
                    iconPosition="start" 
                    label="Security" 
                  />
                  <Tab 
                    icon={<ArticleIcon />} 
                    iconPosition="start" 
                    label="Documentation" 
                  />
                </Tabs>
              </Box>

              {/* Tab content */}
              <Box>
                {/* Source Code Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Source Code</Typography>
                      <Button
                        size="small"
                        endIcon={<ContentCopyIcon />}
                        onClick={handleCopyCode}
                      >
                        {copySuccess === "Copied!" ? copySuccess : "Copy Code"}
                      </Button>
                    </Box>
                    <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                      <SyntaxHighlighter
                        language="solidity"
                        style={atomOneDark}
                        showLineNumbers
                        customStyle={{ margin: 0 }}
                      >
                        {selectedContract?.code}
                      </SyntaxHighlighter>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        onClick={() => handleExternalLink(selectedContract?.abiUrl || '')}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Download ABI
                      </Button>
                      <Button
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        onClick={() => handleExternalLink(selectedContract?.etherscanUrl || '')}
                        size="small"
                      >
                        View Full Source
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Functions Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Contract Functions</Typography>
                    {selectedContract.functions.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="medium">
                          <TableHead>
                            <TableRow>
                              <TableCell width="20%">Function Name</TableCell>
                              <TableCell width="40%">Description</TableCell>
                              <TableCell width="20%">Inputs</TableCell>
                              <TableCell width="20%">Outputs</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedContract.functions.map((func, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                    {func.name}
                                  </Typography>
                                  <Chip 
                                    label={func.visibility} 
                                    size="small" 
                                    sx={{ mr: 0.5, mt: 0.5 }}
                                  />
                                  <Chip 
                                    label={func.stateMutability} 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </TableCell>
                                <TableCell>{func.description}</TableCell>
                                <TableCell>
                                  {func.inputs.map((input, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={input.description}
                                      placement="top"
                                    >
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <span style={{ opacity: 0.7 }}>{input.type}</span> {input.name}
                                      </Typography>
                                    </Tooltip>
                                  ))}
                                  {func.inputs.length === 0 && (
                                    <Typography variant="body2" sx={{ opacity: 0.5 }}>None</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {func.outputs.map((output, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={output.description}
                                      placement="top"
                                    >
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <span style={{ opacity: 0.7 }}>{output.type}</span> {output.name}
                                      </Typography>
                                    </Tooltip>
                                  ))}
                                  {func.outputs.length === 0 && (
                                    <Typography variant="body2" sx={{ opacity: 0.5 }}>None</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography color="text.secondary">
                          Function details not available for this contract
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Security Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Security Information</Typography>
                    <Stack spacing={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Audit Status</Typography>
                          {selectedContract.audited ? (
                            <>
                              <Typography variant="body2" paragraph>
                                This contract has been audited by a reputable security firm and has passed all security checks.
                              </Typography>
                              <Button 
                                variant="outlined" 
                                size="small"
                                endIcon={<LaunchIcon />}
                              >
                                View Audit Report
                              </Button>
                            </>
                          ) : (
                            <Typography variant="body2" color="warning.main">
                              This contract has not yet undergone a formal security audit. Use with caution.
                            </Typography>
                          )}
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Security Considerations</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Reentrancy Protection" 
                                secondary="Uses ReentrancyGuard to prevent reentrancy attacks" 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Access Control" 
                                secondary="Properly implemented access control mechanisms" 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Integer Overflow Protection" 
                                secondary="Uses SafeMath or Solidity 0.8+ for arithmetic operations" 
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Bug Bounty Program</Typography>
                          <Typography variant="body2" paragraph>
                            Quantera maintains an active bug bounty program for all smart contracts. Security researchers are encouraged to report vulnerabilities.
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small"
                            endIcon={<LaunchIcon />}
                          >
                            View Bug Bounty Program
                          </Button>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                )}

                {/* Documentation Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Documentation</Typography>
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Overview</Typography>
                      <Typography variant="body2" paragraph>
                        The {selectedContract.name} contract is a core component of the Quantera platform that {selectedContract.description.toLowerCase()}.
                        It follows the ERC-20 standard for fungible tokens with additional functionality specific to the Quantera ecosystem.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        This contract interacts with other Quantera contracts to provide a seamless experience for users.
                      </Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Architecture Diagram</Typography>
                      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          [Contract Architecture Diagram]
                        </Typography>
                      </Box>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Related Documentation</Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Developer Guide: Working with {selectedContract.name}</Link>
                            } 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Integration Example: {selectedContract.name} API</Link>
                            } 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Security Considerations</Link>
                            } 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CodeIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" gutterBottom>
                Select a Contract
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                Choose a contract from the list to view its details, source code, and documentation.
              </Typography>
            </Paper>
          )}
        </CompatGrid>
      </Grid>
    </Container>
  );
};

export default ContractExplorerPage; 
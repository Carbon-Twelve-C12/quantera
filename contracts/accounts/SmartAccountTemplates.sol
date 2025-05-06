// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISmartAccount.sol";
import "../interfaces/ITreasuryToken.sol";
import "../interfaces/ITreasuryRegistry.sol";
import "../interfaces/ITradingModule.sol";

/**
 * @title SmartAccountTemplates
 * @dev Library of template code for EIP-7702 smart accounts
 * Provides ready-to-use templates for different treasury-related operations
 */
contract SmartAccountTemplates {
    // Reference to registry
    ITreasuryRegistry public registry;
    
    // Reference to trading module
    ITradingModule public tradingModule;
    
    /**
     * @dev Template type
     */
    enum TemplateType {
        YIELD_REINVESTMENT,
        AUTOMATED_TRADING,
        PORTFOLIO_REBALANCING,
        CONDITIONAL_TRANSFER,
        DELEGATION_RULES
    }
    
    /**
     * @dev Template information
     */
    struct TemplateInfo {
        string name;
        string description;
        bytes code;
        bytes32 codeHash;
    }
    
    // Mapping of templates by type
    mapping(TemplateType => TemplateInfo) public templates;
    
    // Event emitted when a template is created or updated
    event TemplateUpdated(TemplateType indexed templateType, bytes32 codeHash);
    
    /**
     * @dev Constructor
     * @param _registry The treasury registry address
     * @param _tradingModule The trading module address
     */
    constructor(address _registry, address _tradingModule) {
        registry = ITreasuryRegistry(_registry);
        tradingModule = ITradingModule(_tradingModule);
        
        // Initialize templates
        _initializeTemplates();
    }
    
    /**
     * @dev Initialize all template codes
     */
    function _initializeTemplates() internal {
        // Set up yield reinvestment template
        _setTemplate(
            TemplateType.YIELD_REINVESTMENT,
            "Yield Reinvestment",
            "Automatically reinvests yield from treasury tokens back into the same token",
            _generateYieldReinvestmentCode()
        );
        
        // Set up automated trading template
        _setTemplate(
            TemplateType.AUTOMATED_TRADING,
            "Automated Trading",
            "Executes trades based on predefined conditions like price thresholds",
            _generateAutomatedTradingCode()
        );
        
        // Set up portfolio rebalancing template
        _setTemplate(
            TemplateType.PORTFOLIO_REBALANCING,
            "Portfolio Rebalancing",
            "Automatically rebalances treasury portfolio based on target allocations",
            _generatePortfolioRebalancingCode()
        );
        
        // Set up conditional transfer template
        _setTemplate(
            TemplateType.CONDITIONAL_TRANSFER,
            "Conditional Transfer",
            "Transfers treasury tokens when specific conditions are met",
            _generateConditionalTransferCode()
        );
        
        // Set up delegation rules template
        _setTemplate(
            TemplateType.DELEGATION_RULES,
            "Delegation Rules",
            "Manages delegation permissions with specific rules and limits",
            _generateDelegationRulesCode()
        );
    }
    
    /**
     * @dev Set a template
     * @param templateType The template type
     * @param name The template name
     * @param description The template description
     * @param code The template code
     */
    function _setTemplate(
        TemplateType templateType,
        string memory name,
        string memory description,
        bytes memory code
    ) internal {
        bytes32 codeHash = keccak256(code);
        templates[templateType] = TemplateInfo({
            name: name,
            description: description,
            code: code,
            codeHash: codeHash
        });
        
        emit TemplateUpdated(templateType, codeHash);
    }
    
    /**
     * @dev Get template information by type
     * @param templateType The template type
     * @return The template information
     */
    function getTemplate(TemplateType templateType) external view returns (TemplateInfo memory) {
        return templates[templateType];
    }
    
    /**
     * @dev Get template code by type
     * @param templateType The template type
     * @return The template code
     */
    function getTemplateCode(TemplateType templateType) external view returns (bytes memory) {
        return templates[templateType].code;
    }
    
    /**
     * @dev Set template code for a smart account
     * @param templateType The template type
     * @param account The smart account address
     * @return Success status
     */
    function setAccountTemplate(TemplateType templateType, address account) external returns (bool) {
        ISmartAccount smartAccount = ISmartAccount(account);
        bytes memory code = templates[templateType].code;
        
        // Set the code on the smart account
        return smartAccount.setAccountCode(code);
    }
    
    /**
     * @dev Generate code for yield reinvestment template
     * @return The template code
     */
    function _generateYieldReinvestmentCode() internal pure returns (bytes memory) {
        // This is a placeholder for what would be actual executable code in a real implementation
        // In practice, this would be a compiled bytecode or a script that can be executed by the smart account
        
        /*
         * Pseudo-code for yield reinvestment:
         * 
         * function executeYieldReinvestment(data) {
         *     const params = parseParams(data);
         *     const treasuryId = params.treasuryId;
         *     const treasuryToken = getTreasuryToken(treasuryId);
         *     
         *     // Check if yield is available
         *     const availableYield = treasuryToken.calculateYieldAmount(account);
         *     
         *     if (availableYield > 0) {
         *         // Claim yield
         *         treasuryToken.distributeYield();
         *         
         *         // Reinvest by buying more of the same token
         *         if (params.reinvestmentPercentage <= 100) {
         *             const amountToReinvest = availableYield * params.reinvestmentPercentage / 100;
         *             const currentPrice = treasuryToken.getCurrentPrice();
         *             
         *             // Create buy order
         *             tradingModule.createBuyOrder(
         *                 treasuryId,
         *                 amountToReinvest / currentPrice,
         *                 currentPrice,
         *                 block.timestamp + 1 day,
         *                 false,
         *                 0,
         *                 ""
         *             );
         *         }
         *     }
         *     
         *     return { success: true, reinvestedAmount: amountToReinvest };
         * }
         */
        
        return abi.encodePacked(
            "YieldReinvestmentTemplate",
            // Version
            uint8(1),
            // Placeholder for actual executable code
            bytes("YIELD_REINVESTMENT_TEMPLATE_EXECUTABLE_CODE")
        );
    }
    
    /**
     * @dev Generate code for automated trading template
     * @return The template code
     */
    function _generateAutomatedTradingCode() internal pure returns (bytes memory) {
        // This is a placeholder for what would be actual executable code in a real implementation
        
        /*
         * Pseudo-code for automated trading:
         * 
         * function executeAutomatedTrading(data) {
         *     const params = parseParams(data);
         *     const treasuryId = params.treasuryId;
         *     const treasuryToken = getTreasuryToken(treasuryId);
         *     
         *     // Get current price and user's strategy settings
         *     const currentPrice = treasuryToken.getCurrentPrice();
         *     const buyThreshold = params.buyThreshold;
         *     const sellThreshold = params.sellThreshold;
         *     const tradeAmount = params.tradeAmount;
         *     
         *     // Execute buy if price falls below threshold
         *     if (currentPrice <= buyThreshold) {
         *         // Check if user has enough balance
         *         if (account.balance >= tradeAmount * currentPrice) {
         *             // Create buy order
         *             tradingModule.createBuyOrder(
         *                 treasuryId,
         *                 tradeAmount / currentPrice,
         *                 currentPrice,
         *                 block.timestamp + 1 day,
         *                 false,
         *                 0,
         *                 ""
         *             );
         *             return { success: true, action: "BUY", amount: tradeAmount };
         *         }
         *     }
         *     
         *     // Execute sell if price rises above threshold
         *     if (currentPrice >= sellThreshold) {
         *         // Check if user has enough tokens
         *         const tokenBalance = treasuryToken.balanceOf(account);
         *         if (tokenBalance >= tradeAmount) {
         *             // Create sell order
         *             tradingModule.createSellOrder(
         *                 treasuryId,
         *                 tradeAmount,
         *                 currentPrice,
         *                 block.timestamp + 1 day,
         *                 false,
         *                 0,
         *                 ""
         *             );
         *             return { success: true, action: "SELL", amount: tradeAmount };
         *         }
         *     }
         *     
         *     return { success: true, action: "NONE" };
         * }
         */
        
        return abi.encodePacked(
            "AutomatedTradingTemplate",
            // Version
            uint8(1),
            // Placeholder for actual executable code
            bytes("AUTOMATED_TRADING_TEMPLATE_EXECUTABLE_CODE")
        );
    }
    
    /**
     * @dev Generate code for portfolio rebalancing template
     * @return The template code
     */
    function _generatePortfolioRebalancingCode() internal pure returns (bytes memory) {
        // This is a placeholder for what would be actual executable code in a real implementation
        
        /*
         * Pseudo-code for portfolio rebalancing:
         * 
         * function executePortfolioRebalancing(data) {
         *     const params = parseParams(data);
         *     const targetAllocations = params.targetAllocations; // Map of treasuryId -> target percentage
         *     
         *     // Get all user's treasury token balances
         *     const userTreasuries = getUserTreasuries(account);
         *     const totalPortfolioValue = calculateTotalValue(userTreasuries);
         *     
         *     // Calculate current allocations
         *     const currentAllocations = {};
         *     for (const treasury of userTreasuries) {
         *         currentAllocations[treasury.id] = (treasury.value / totalPortfolioValue) * 100;
         *     }
         *     
         *     // Determine trades needed to rebalance
         *     const tradesToExecute = [];
         *     for (const treasuryId in targetAllocations) {
         *         const target = targetAllocations[treasuryId];
         *         const current = currentAllocations[treasuryId] || 0;
         *         
         *         // If difference exceeds threshold, add to trades
         *         if (Math.abs(target - current) > params.rebalanceThreshold) {
         *             // Calculate amount to buy or sell
         *             const treasuryToken = getTreasuryToken(treasuryId);
         *             const currentPrice = treasuryToken.getCurrentPrice();
         *             const targetValue = (totalPortfolioValue * target) / 100;
         *             const currentValue = (totalPortfolioValue * current) / 100;
         *             const valueDifference = targetValue - currentValue;
         *             
         *             // Add buy or sell trade
         *             if (valueDifference > 0) {
         *                 tradesToExecute.push({
         *                     type: "BUY",
         *                     treasuryId: treasuryId,
         *                     amount: valueDifference / currentPrice
         *                 });
         *             } else {
         *                 tradesToExecute.push({
         *                     type: "SELL",
         *                     treasuryId: treasuryId,
         *                     amount: Math.abs(valueDifference) / currentPrice
         *                 });
         *             }
         *         }
         *     }
         *     
         *     // Execute trades
         *     for (const trade of tradesToExecute) {
         *         if (trade.type === "BUY") {
         *             tradingModule.createBuyOrder(
         *                 trade.treasuryId,
         *                 trade.amount,
         *                 getTreasuryToken(trade.treasuryId).getCurrentPrice(),
         *                 block.timestamp + 1 day,
         *                 false,
         *                 0,
         *                 ""
         *             );
         *         } else {
         *             tradingModule.createSellOrder(
         *                 trade.treasuryId,
         *                 trade.amount,
         *                 getTreasuryToken(trade.treasuryId).getCurrentPrice(),
         *                 block.timestamp + 1 day,
         *                 false,
         *                 0,
         *                 ""
         *             );
         *         }
         *     }
         *     
         *     return { success: true, tradesExecuted: tradesToExecute.length };
         * }
         */
        
        return abi.encodePacked(
            "PortfolioRebalancingTemplate",
            // Version
            uint8(1),
            // Placeholder for actual executable code
            bytes("PORTFOLIO_REBALANCING_TEMPLATE_EXECUTABLE_CODE")
        );
    }
    
    /**
     * @dev Generate code for conditional transfer template
     * @return The template code
     */
    function _generateConditionalTransferCode() internal pure returns (bytes memory) {
        // This is a placeholder for what would be actual executable code in a real implementation
        
        /*
         * Pseudo-code for conditional transfer:
         * 
         * function executeConditionalTransfer(data) {
         *     const params = parseParams(data);
         *     const treasuryId = params.treasuryId;
         *     const recipient = params.recipient;
         *     const amount = params.amount;
         *     const conditions = params.conditions;
         *     
         *     // Check if all conditions are met
         *     let allConditionsMet = true;
         *     
         *     for (const condition of conditions) {
         *         if (condition.type === "TIME") {
         *             // Time-based condition
         *             if (block.timestamp < condition.timestamp) {
         *                 allConditionsMet = false;
         *                 break;
         *             }
         *         } else if (condition.type === "PRICE") {
         *             // Price-based condition
         *             const treasuryToken = getTreasuryToken(treasuryId);
         *             const currentPrice = treasuryToken.getCurrentPrice();
         *             
         *             if (condition.operator === "GREATER_THAN" && currentPrice <= condition.price) {
         *                 allConditionsMet = false;
         *                 break;
         *             } else if (condition.operator === "LESS_THAN" && currentPrice >= condition.price) {
         *                 allConditionsMet = false;
         *                 break;
         *             }
         *         } else if (condition.type === "BALANCE") {
         *             // Balance-based condition
         *             const treasuryToken = getTreasuryToken(treasuryId);
         *             const accountBalance = treasuryToken.balanceOf(account);
         *             
         *             if (accountBalance < condition.minBalance) {
         *                 allConditionsMet = false;
         *                 break;
         *             }
         *         }
         *     }
         *     
         *     // If all conditions are met, execute transfer
         *     if (allConditionsMet) {
         *         const treasuryToken = getTreasuryToken(treasuryId);
         *         treasuryToken.transferWithData(recipient, amount, "");
         *         return { success: true, transferred: true, amount: amount };
         *     }
         *     
         *     return { success: true, transferred: false };
         * }
         */
        
        return abi.encodePacked(
            "ConditionalTransferTemplate",
            // Version
            uint8(1),
            // Placeholder for actual executable code
            bytes("CONDITIONAL_TRANSFER_TEMPLATE_EXECUTABLE_CODE")
        );
    }
    
    /**
     * @dev Generate code for delegation rules template
     * @return The template code
     */
    function _generateDelegationRulesCode() internal pure returns (bytes memory) {
        // This is a placeholder for what would be actual executable code in a real implementation
        
        /*
         * Pseudo-code for delegation rules:
         * 
         * function executeDelegationRules(data) {
         *     const params = parseParams(data);
         *     const delegateAddress = params.delegateAddress;
         *     const action = params.action; // ADD, REMOVE, APPROVE
         *     const rules = params.rules;
         *     
         *     if (action === "ADD") {
         *         // Add a new delegate with rules
         *         storeDelegateRules(delegateAddress, rules);
         *         registry.delegateOperator(delegateAddress, true);
         *         return { success: true, action: "DELEGATE_ADDED" };
         *     } else if (action === "REMOVE") {
         *         // Remove a delegate
         *         removeDelegateRules(delegateAddress);
         *         registry.delegateOperator(delegateAddress, false);
         *         return { success: true, action: "DELEGATE_REMOVED" };
         *     } else if (action === "APPROVE") {
         *         // Approve a specific operation by a delegate
         *         const operation = params.operation;
         *         const storedRules = getDelegateRules(delegateAddress);
         *         
         *         // Check if operation is allowed by rules
         *         if (isOperationAllowed(operation, storedRules)) {
         *             // Execute the operation
         *             registry.executeAsDelegated(account, operation.treasuryId, operation.data);
         *             return { success: true, action: "OPERATION_APPROVED" };
         *         } else {
         *             return { success: false, action: "OPERATION_DENIED" };
         *         }
         *     }
         *     
         *     return { success: false, error: "INVALID_ACTION" };
         * }
         */
        
        return abi.encodePacked(
            "DelegationRulesTemplate",
            // Version
            uint8(1),
            // Placeholder for actual executable code
            bytes("DELEGATION_RULES_TEMPLATE_EXECUTABLE_CODE")
        );
    }
    
    /**
     * @dev Update a template
     * @param templateType The template type
     * @param name The new template name
     * @param description The new template description
     * @param code The new template code
     */
    function updateTemplate(
        TemplateType templateType,
        string calldata name,
        string calldata description,
        bytes calldata code
    ) external {
        // Only the contract owner can update templates
        // In a real implementation, this would have appropriate access control
        _setTemplate(templateType, name, description, code);
    }
    
    /**
     * @dev Get all template types
     * @return Array of all template types
     */
    function getAllTemplateTypes() external pure returns (TemplateType[] memory) {
        TemplateType[] memory types = new TemplateType[](5);
        types[0] = TemplateType.YIELD_REINVESTMENT;
        types[1] = TemplateType.AUTOMATED_TRADING;
        types[2] = TemplateType.PORTFOLIO_REBALANCING;
        types[3] = TemplateType.CONDITIONAL_TRANSFER;
        types[4] = TemplateType.DELEGATION_RULES;
        return types;
    }
} 
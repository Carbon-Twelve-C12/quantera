#!/bin/bash

# Quantera Platform - Automated Security Audit Script
# Week 13 - Security Audits & Performance Optimization
# Version: 1.0

set -e

echo "🔒 Quantera Platform - Automated Security Audit"
echo "================================================"
echo "Week 13 - Security Audits & Performance Optimization"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTRACTS_DIR="contracts"
REPORTS_DIR="reports/security"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORTS_DIR/security_audit_$TIMESTAMP.md"

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}📋 Starting comprehensive security audit...${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Initialize report
cat > "$REPORT_FILE" << EOF
# Quantera Platform Security Audit Report
**Date**: $(date)
**Version**: Week 13 Implementation
**Audit Type**: Automated Security Analysis

## Executive Summary

This report contains the results of automated security analysis performed on the Quantera Platform smart contracts and infrastructure.

---

## Audit Results

EOF

# 1. Smart Contract Static Analysis
print_section "🔍 Smart Contract Static Analysis"

echo -e "${YELLOW}Installing security analysis tools...${NC}"

# Install Slither if not present
if ! command_exists slither; then
    echo "Installing Slither..."
    pip3 install slither-analyzer
fi

# Install Mythril if not present
if ! command_exists myth; then
    echo "Installing Mythril..."
    pip3 install mythril
fi

echo -e "${GREEN}✅ Security tools installed${NC}"
echo ""

# Run Slither analysis
echo -e "${YELLOW}Running Slither static analysis...${NC}"
if [ -d "$CONTRACTS_DIR" ]; then
    echo "### Slither Analysis Results" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Run Slither on all contracts
    slither "$CONTRACTS_DIR" --print human-summary > "$REPORTS_DIR/slither_summary_$TIMESTAMP.txt" 2>&1 || true
    slither "$CONTRACTS_DIR" --detect all > "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" 2>&1 || true
    
    # Extract critical findings
    if [ -f "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" ]; then
        CRITICAL_COUNT=$(grep -c "Impact: High\|Impact: Critical" "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" || echo "0")
        MEDIUM_COUNT=$(grep -c "Impact: Medium" "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" || echo "0")
        LOW_COUNT=$(grep -c "Impact: Low" "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" || echo "0")
        
        echo "- **Critical Issues**: $CRITICAL_COUNT" >> "$REPORT_FILE"
        echo "- **Medium Issues**: $MEDIUM_COUNT" >> "$REPORT_FILE"
        echo "- **Low Issues**: $LOW_COUNT" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo -e "${RED}❌ Found $CRITICAL_COUNT critical issues${NC}"
        else
            echo -e "${GREEN}✅ No critical issues found${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Contracts directory not found${NC}"
fi

# 2. Mythril Analysis for Critical Contracts
print_section "🛡️ Mythril Security Analysis"

echo -e "${YELLOW}Running Mythril analysis on critical contracts...${NC}"

CRITICAL_CONTRACTS=(
    "liquidity/LiquidityPoolOptimizer.sol"
    "liquidity/DynamicFeeStructure.sol"
    "institutional/PrimeBrokerage.sol"
    "institutional/CrossMargining.sol"
)

echo "### Mythril Analysis Results" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for contract in "${CRITICAL_CONTRACTS[@]}"; do
    if [ -f "$CONTRACTS_DIR/$contract" ]; then
        echo -e "${YELLOW}Analyzing $contract...${NC}"
        
        # Run Mythril analysis
        myth analyze "$CONTRACTS_DIR/$contract" --solv 0.8.20 > "$REPORTS_DIR/mythril_$(basename $contract .sol)_$TIMESTAMP.txt" 2>&1 || true
        
        # Check for vulnerabilities
        if [ -f "$REPORTS_DIR/mythril_$(basename $contract .sol)_$TIMESTAMP.txt" ]; then
            VULN_COUNT=$(grep -c "SWC-\|Severity:" "$REPORTS_DIR/mythril_$(basename $contract .sol)_$TIMESTAMP.txt" || echo "0")
            echo "- **$contract**: $VULN_COUNT potential vulnerabilities" >> "$REPORT_FILE"
            
            if [ "$VULN_COUNT" -gt 0 ]; then
                echo -e "${YELLOW}⚠️ Found $VULN_COUNT potential vulnerabilities in $contract${NC}"
            else
                echo -e "${GREEN}✅ No vulnerabilities found in $contract${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Contract not found: $contract${NC}"
        echo "- **$contract**: File not found" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"

# 3. Gas Usage Analysis
print_section "⛽ Gas Usage Analysis"

echo -e "${YELLOW}Analyzing gas usage patterns...${NC}"

# Check if we're in a Hardhat project
if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ]; then
    echo "### Gas Usage Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Install gas reporter if not present
    if ! npm list hardhat-gas-reporter >/dev/null 2>&1; then
        echo "Installing gas reporter..."
        npm install --save-dev hardhat-gas-reporter
    fi
    
    # Run gas analysis
    echo -e "${YELLOW}Running gas usage tests...${NC}"
    npx hardhat test --reporter gas-reporter > "$REPORTS_DIR/gas_analysis_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "$REPORTS_DIR/gas_analysis_$TIMESTAMP.txt" ]; then
        # Extract gas usage summary
        grep -A 20 "Gas usage per method" "$REPORTS_DIR/gas_analysis_$TIMESTAMP.txt" >> "$REPORT_FILE" 2>/dev/null || true
        echo -e "${GREEN}✅ Gas analysis completed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Not a Hardhat project, skipping gas analysis${NC}"
    echo "- **Status**: Skipped (not a Hardhat project)" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 4. Dependency Security Audit
print_section "📦 Dependency Security Audit"

echo -e "${YELLOW}Auditing dependencies for vulnerabilities...${NC}"

echo "### Dependency Security Audit" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Frontend dependencies
if [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}Auditing frontend dependencies...${NC}"
    cd frontend
    npm audit --audit-level=moderate > "../$REPORTS_DIR/npm_audit_frontend_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "../$REPORTS_DIR/npm_audit_frontend_$TIMESTAMP.txt" ]; then
        VULN_COUNT=$(grep -c "vulnerabilities" "../$REPORTS_DIR/npm_audit_frontend_$TIMESTAMP.txt" || echo "0")
        echo "- **Frontend Dependencies**: $VULN_COUNT vulnerabilities found" >> "../$REPORT_FILE"
        
        if [ "$VULN_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠️ Found vulnerabilities in frontend dependencies${NC}"
        else
            echo -e "${GREEN}✅ No vulnerabilities in frontend dependencies${NC}"
        fi
    fi
    cd ..
fi

# Backend dependencies (Rust)
if [ -f "backend/Cargo.toml" ]; then
    echo -e "${YELLOW}Auditing backend dependencies...${NC}"
    cd backend
    
    # Install cargo-audit if not present
    if ! command_exists cargo-audit; then
        cargo install cargo-audit
    fi
    
    cargo audit > "../$REPORTS_DIR/cargo_audit_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "../$REPORTS_DIR/cargo_audit_$TIMESTAMP.txt" ]; then
        VULN_COUNT=$(grep -c "Vulnerability" "../$REPORTS_DIR/cargo_audit_$TIMESTAMP.txt" || echo "0")
        echo "- **Backend Dependencies**: $VULN_COUNT vulnerabilities found" >> "../$REPORT_FILE"
        
        if [ "$VULN_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠️ Found vulnerabilities in backend dependencies${NC}"
        else
            echo -e "${GREEN}✅ No vulnerabilities in backend dependencies${NC}"
        fi
    fi
    cd ..
fi

echo "" >> "$REPORT_FILE"

# 5. Code Quality Analysis
print_section "📊 Code Quality Analysis"

echo -e "${YELLOW}Analyzing code quality metrics...${NC}"

echo "### Code Quality Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Solidity code quality
if command_exists solhint && [ -d "$CONTRACTS_DIR" ]; then
    echo -e "${YELLOW}Running Solidity linting...${NC}"
    solhint "$CONTRACTS_DIR/**/*.sol" > "$REPORTS_DIR/solhint_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "$REPORTS_DIR/solhint_$TIMESTAMP.txt" ]; then
        ERROR_COUNT=$(grep -c "error" "$REPORTS_DIR/solhint_$TIMESTAMP.txt" || echo "0")
        WARNING_COUNT=$(grep -c "warning" "$REPORTS_DIR/solhint_$TIMESTAMP.txt" || echo "0")
        
        echo "- **Solidity Errors**: $ERROR_COUNT" >> "$REPORT_FILE"
        echo "- **Solidity Warnings**: $WARNING_COUNT" >> "$REPORT_FILE"
        
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${RED}❌ Found $ERROR_COUNT Solidity errors${NC}"
        else
            echo -e "${GREEN}✅ No Solidity errors found${NC}"
        fi
    fi
fi

# Rust code quality
if [ -f "backend/Cargo.toml" ]; then
    echo -e "${YELLOW}Running Rust code analysis...${NC}"
    cd backend
    cargo clippy --all-targets --all-features > "../$REPORTS_DIR/clippy_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "../$REPORTS_DIR/clippy_$TIMESTAMP.txt" ]; then
        ERROR_COUNT=$(grep -c "error:" "../$REPORTS_DIR/clippy_$TIMESTAMP.txt" || echo "0")
        WARNING_COUNT=$(grep -c "warning:" "../$REPORTS_DIR/clippy_$TIMESTAMP.txt" || echo "0")
        
        echo "- **Rust Errors**: $ERROR_COUNT" >> "../$REPORT_FILE"
        echo "- **Rust Warnings**: $WARNING_COUNT" >> "../$REPORT_FILE"
        
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${RED}❌ Found $ERROR_COUNT Rust errors${NC}"
        else
            echo -e "${GREEN}✅ No Rust errors found${NC}"
        fi
    fi
    cd ..
fi

echo "" >> "$REPORT_FILE"

# 6. Test Coverage Analysis
print_section "🧪 Test Coverage Analysis"

echo -e "${YELLOW}Analyzing test coverage...${NC}"

echo "### Test Coverage Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Smart contract coverage
if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ]; then
    echo -e "${YELLOW}Running smart contract coverage...${NC}"
    
    # Install coverage tool if not present
    if ! npm list solidity-coverage >/dev/null 2>&1; then
        npm install --save-dev solidity-coverage
    fi
    
    npx hardhat coverage > "$REPORTS_DIR/coverage_contracts_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "$REPORTS_DIR/coverage_contracts_$TIMESTAMP.txt" ]; then
        COVERAGE=$(grep -o "[0-9]*\.[0-9]*%" "$REPORTS_DIR/coverage_contracts_$TIMESTAMP.txt" | tail -1 || echo "0%")
        echo "- **Smart Contract Coverage**: $COVERAGE" >> "$REPORT_FILE"
        
        COVERAGE_NUM=$(echo "$COVERAGE" | sed 's/%//')
        if (( $(echo "$COVERAGE_NUM > 90" | bc -l) )); then
            echo -e "${GREEN}✅ Excellent test coverage: $COVERAGE${NC}"
        elif (( $(echo "$COVERAGE_NUM > 70" | bc -l) )); then
            echo -e "${YELLOW}⚠️ Good test coverage: $COVERAGE${NC}"
        else
            echo -e "${RED}❌ Low test coverage: $COVERAGE${NC}"
        fi
    fi
fi

# Frontend coverage
if [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}Running frontend test coverage...${NC}"
    cd frontend
    npm test -- --coverage --watchAll=false > "../$REPORTS_DIR/coverage_frontend_$TIMESTAMP.txt" 2>&1 || true
    
    if [ -f "../$REPORTS_DIR/coverage_frontend_$TIMESTAMP.txt" ]; then
        COVERAGE=$(grep -o "[0-9]*\.[0-9]*%" "../$REPORTS_DIR/coverage_frontend_$TIMESTAMP.txt" | tail -1 || echo "0%")
        echo "- **Frontend Coverage**: $COVERAGE" >> "../$REPORT_FILE"
        
        COVERAGE_NUM=$(echo "$COVERAGE" | sed 's/%//')
        if (( $(echo "$COVERAGE_NUM > 80" | bc -l) )); then
            echo -e "${GREEN}✅ Good frontend coverage: $COVERAGE${NC}"
        else
            echo -e "${YELLOW}⚠️ Frontend coverage could be improved: $COVERAGE${NC}"
        fi
    fi
    cd ..
fi

echo "" >> "$REPORT_FILE"

# 7. Generate Security Recommendations
print_section "💡 Security Recommendations"

echo -e "${YELLOW}Generating security recommendations...${NC}"

cat >> "$REPORT_FILE" << EOF
### Security Recommendations

Based on the automated analysis, here are the key recommendations:

#### High Priority
- [ ] Review and fix any critical vulnerabilities found by Slither
- [ ] Address high-severity issues identified by Mythril
- [ ] Update dependencies with known vulnerabilities
- [ ] Improve test coverage to >90% for smart contracts

#### Medium Priority
- [ ] Optimize gas usage for functions exceeding 500k gas
- [ ] Address medium-severity static analysis warnings
- [ ] Implement additional security tests for edge cases
- [ ] Set up continuous security monitoring

#### Low Priority
- [ ] Fix code quality warnings from linters
- [ ] Improve documentation for security-critical functions
- [ ] Consider formal verification for critical contracts
- [ ] Implement additional access control tests

---

## Next Steps

1. **Manual Review**: Conduct manual security review of critical findings
2. **Penetration Testing**: Perform targeted penetration testing
3. **Third-Party Audit**: Consider engaging external security auditors
4. **Monitoring Setup**: Implement real-time security monitoring
5. **Documentation**: Update security documentation and procedures

---

**Report Generated**: $(date)
**Audit Duration**: Automated analysis
**Status**: ✅ Completed

EOF

# 8. Summary and Cleanup
print_section "📋 Audit Summary"

echo -e "${GREEN}✅ Security audit completed successfully!${NC}"
echo ""
echo -e "${BLUE}📄 Report generated: $REPORT_FILE${NC}"
echo -e "${BLUE}📁 Detailed logs: $REPORTS_DIR/${NC}"
echo ""

# Display summary
echo -e "${YELLOW}Summary of findings:${NC}"
if [ -f "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" ]; then
    CRITICAL_COUNT=$(grep -c "Impact: High\|Impact: Critical" "$REPORTS_DIR/slither_detailed_$TIMESTAMP.txt" || echo "0")
    echo "- Critical issues: $CRITICAL_COUNT"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the detailed report: $REPORT_FILE"
echo "2. Address critical and high-severity issues"
echo "3. Run manual security review"
echo "4. Proceed with Week 13 performance optimization"
echo ""

echo -e "${GREEN}🔒 Automated security audit completed for Week 13!${NC}" 
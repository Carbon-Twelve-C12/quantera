#!/bin/bash

echo "🧪 Running Quantera Frontend Test Suite"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Run tests with coverage
echo -e "\n${GREEN}Running tests with coverage...${NC}\n"

# Set CI environment to avoid interactive mode
export CI=true

# Run Jest with coverage
npm test -- --coverage --watchAll=false --passWithNoTests

# Check test results
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    
    # Display coverage summary
    echo -e "\n${GREEN}Coverage Summary:${NC}"
    cat coverage/lcov-report/index.html 2>/dev/null | grep -E "statements|branches|functions|lines" | head -4 || echo "Coverage report not found"
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
fi

# Check for untested files
echo -e "\n${YELLOW}Checking for untested components...${NC}"

# Find components without tests
COMPONENTS_WITHOUT_TESTS=$(find src/components -name "*.tsx" -o -name "*.jsx" | grep -v test | while read file; do
    basename_without_ext=$(basename "$file" | sed 's/\.[^.]*$//')
    test_file=$(find src -name "${basename_without_ext}.test.*" 2>/dev/null)
    if [ -z "$test_file" ]; then
        echo "  - $file"
    fi
done)

if [ -n "$COMPONENTS_WITHOUT_TESTS" ]; then
    echo -e "${YELLOW}Components without tests:${NC}"
    echo "$COMPONENTS_WITHOUT_TESTS"
else
    echo -e "${GREEN}All components have tests!${NC}"
fi

# Find pages without tests
PAGES_WITHOUT_TESTS=$(find src/pages -name "*.tsx" -o -name "*.jsx" -o -name "*.js" | grep -v test | while read file; do
    basename_without_ext=$(basename "$file" | sed 's/\.[^.]*$//')
    test_file=$(find src -name "${basename_without_ext}.test.*" 2>/dev/null)
    if [ -z "$test_file" ]; then
        echo "  - $file"
    fi
done)

if [ -n "$PAGES_WITHOUT_TESTS" ]; then
    echo -e "\n${YELLOW}Pages without tests:${NC}"
    echo "$PAGES_WITHOUT_TESTS"
else
    echo -e "${GREEN}All pages have tests!${NC}"
fi

# Generate test report
if [ -d "coverage" ]; then
    echo -e "\n${GREEN}📊 Test coverage report generated at:${NC}"
    echo "  coverage/lcov-report/index.html"
fi

exit $TEST_EXIT_CODE
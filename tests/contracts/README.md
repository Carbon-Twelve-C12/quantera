# Quantera Platform Smart Contract Tests

This directory contains all tests for the Quantera Platform smart contracts, including unit tests, integration tests, and tools for test coverage analysis.

## Testing Structure

The test suite is organized into the following components:

- **Unit Tests**: Located in the `unit/` directory, these tests focus on individual contract functionality, including security features, access control, error handling, and business logic validation.
- **Integration Tests**: Located in the `integration/` directory, these tests validate interactions between multiple contracts, ensuring they work together as expected in real-world scenarios.
- **Mocks**: Located in the `mocks/` directory, these are mock implementations used for testing isolated functionality.

## Test Categories

The test suite focuses on these main categories:

### Security Testing
- Role-based access control
- Input validation
- Error handling with custom errors
- Checks-effects-interactions pattern
- Reentrancy protection
- Delegation security

### Functional Testing
- Core business logic
- Parameter validation
- State transitions
- Event emissions

### Integration Testing
- Cross-contract interactions
- End-to-end workflows
- System-level functionality

## Test Coverage Goals

As part of our path to v1.0.0, we're targeting the following test coverage metrics:

- **Statement Coverage**: 95%+
- **Branch Coverage**: 90%+
- **Function Coverage**: 100%
- **Line Coverage**: 95%+

Critical security features and core business logic should have 100% coverage.

## Running Tests

### All Tests

To run all tests:

```bash
npx hardhat test
```

### Unit Tests Only

To run only unit tests:

```bash
npx hardhat test unit/*.test.js
```

### Integration Tests Only

To run only integration tests:

```bash
npx hardhat test integration/*.js
```

### Specific Test Files

To run specific test files:

```bash
npx hardhat test unit/YieldOptimizer.test.js
```

## Test Coverage

To generate test coverage reports:

```bash
./test-coverage.sh
```

This will run all tests and generate an HTML coverage report in the `coverage/` directory. Open `coverage/index.html` in your browser to view detailed coverage metrics.

## Continuous Integration

Tests are automatically run as part of our CI/CD pipeline. The workflow configuration can be found in `.github/workflows/contract-testing.yml`.

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Place Tests Appropriately**: Unit tests go in `unit/`, integration tests in `integration/`.
2. **Name Tests Descriptively**: Use the format `ContractName.test.js` for unit tests and descriptive names for integration tests.
3. **Use Test Fixtures**: Leverage `loadFixture` to set up test environments efficiently.
4. **Test Edge Cases**: Focus on boundary conditions and edge cases, especially for security-critical functions.
5. **Validate Custom Errors**: Test that functions revert with the expected custom errors under failure conditions.
6. **Check Access Control**: Verify that functions enforce proper role-based access control.
7. **Verify Events**: Confirm that functions emit the expected events with the correct parameters.

## Troubleshooting

### Gas Limits

If tests fail due to gas limits, you may need to adjust the gas configuration in `hardhat.config.js` or optimize your test setup.

### Timeouts

For complex tests that take longer to run, adjust the Mocha timeout in the test file:

```javascript
describe("Complex tests", function() {
  this.timeout(60000); // 60 seconds
  // Tests...
});
```

### Node.js Heap Issues

If you encounter Node.js heap issues when running large test suites, try increasing the Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx hardhat test
``` 
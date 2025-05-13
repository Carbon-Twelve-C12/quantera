/**
 * Mock implementation of auto-generated typechain types
 */

// Mock L2BridgeGasOptimizer factory
export class L2BridgeGasOptimizer__factory {
  static connect(address: string, providerOrSigner: any) {
    return {
      address,
      estimateGas: () => Promise.resolve('100000'),
      calculateFormat: () => Promise.resolve(true)
    };
  }
} 
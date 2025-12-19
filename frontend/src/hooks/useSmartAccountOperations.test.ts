import { renderHook, act, waitFor } from '@testing-library/react';
import { useSmartAccountOperations } from './useSmartAccountOperations';
import api from '../api/api';
import { mockContexts } from '../test-utils';

// Mock API
jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

// Mock WebSocket context using test-utils pattern
jest.mock('../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    ...mockContexts.WebSocketContext,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    events: [
      {
        type: 'SmartAccountOperation',
        payload: {
          operation_id: 'op123',
          account_id: 'acc123',
          operation_type: 'TRANSFER',
          timestamp: 1620000000,
          executor: '0x1234567890123456789012345678901234567890'
        }
      }
    ]
  }),
  SubscriptionTopic: {
    SMART_ACCOUNTS: 'smart_accounts',
    SMART_ACCOUNT: 'smart_account'
  }
}));

describe('useSmartAccountOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: [
        {
          operationId: 'op456',
          accountId: 'acc123',
          operationType: 'DELEGATE_ADD',
          timestamp: 1620100000,
          executedBy: '0x1234567890123456789012345678901234567890',
          status: 'SUCCESS'
        }
      ]
    });
  });

  it('should fetch operations when accountId is provided', async () => {
    const { result } = renderHook(() =>
      useSmartAccountOperations('acc123')
    );

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check operations
    expect(result.current.operations.length).toBe(1);
    expect(result.current.operations[0].operationId).toBe('op456');
    expect(api.get).toHaveBeenCalledWith(
      '/api/users/smart-account/acc123/operations'
    );
  });

  it('should return empty operations when no accountId is provided', async () => {
    const { result } = renderHook(() => useSmartAccountOperations());

    // Should not be loading and return empty operations
    expect(result.current.loading).toBe(false);
    expect(result.current.operations).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() =>
      useSmartAccountOperations('acc123')
    );

    // Wait for API call to reject
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check error state
    expect(result.current.error).toBe('Failed to load smart account operations');
    expect(result.current.operations).toEqual([]);
  });

  it('should get operation details', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: []
    }).mockResolvedValueOnce({
      data: {
        operationId: 'op789',
        accountId: 'acc123',
        operationType: 'EXECUTE',
        timestamp: 1620200000,
        executedBy: '0x1234567890123456789012345678901234567890',
        status: 'SUCCESS',
        gasUsed: '50000',
        transactionHash: '0xabcdef'
      }
    });

    const { result } = renderHook(() =>
      useSmartAccountOperations('acc123')
    );

    // Wait for initial API call to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call getOperationDetails
    let details;
    await act(async () => {
      details = await result.current.getOperationDetails('op789');
    });

    // Check details
    expect(details).toEqual({
      operationId: 'op789',
      accountId: 'acc123',
      operationType: 'EXECUTE',
      timestamp: 1620200000,
      executedBy: '0x1234567890123456789012345678901234567890',
      status: 'SUCCESS',
      gasUsed: '50000',
      transactionHash: '0xabcdef'
    });
    expect(api.get).toHaveBeenCalledWith(
      '/api/users/smart-account/operations/op789'
    );
  });
});

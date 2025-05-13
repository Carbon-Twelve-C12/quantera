import React from 'react';
import { render, screen } from '@testing-library/react';
import SmartAccountPage from './SmartAccountPage';

// Mock the context hooks
jest.mock('../contexts/WalletContext', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    connected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

jest.mock('../hooks/useSmartAccountOperations', () => ({
  useSmartAccountOperations: () => ({
    operations: [],
    loading: false,
    error: null,
    refreshOperations: jest.fn(),
    getOperationDetails: jest.fn(),
  }),
}));

// Mock API
jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('/smart-account/templates')) {
        return Promise.resolve({
          data: [
            {
              id: 'template1',
              name: 'Basic Account',
              description: 'A basic smart account template',
              code: 'contract BasicAccount {}',
              parameters: [
                {
                  name: 'owner',
                  type: 'address',
                  description: 'The account owner',
                  defaultValue: '0x0000000000000000000000000000000000000000'
                }
              ]
            }
          ]
        });
      }
      
      if (url.includes('/smart-account')) {
        return Promise.resolve({
          data: [
            {
              id: 'account1',
              owner: '0x1234567890123456789012345678901234567890',
              name: 'My Smart Account',
              createdAt: Date.now(),
              templateId: 'template1',
              status: 'ACTIVE',
              delegates: [],
              balance: '1.5'
            }
          ]
        });
      }
      
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('SmartAccountPage', () => {
  it('renders the page when user is connected', async () => {
    render(<SmartAccountPage />);
    
    // Check if the component renders main elements
    expect(screen.getByText('Smart Account Management')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create New Account' })).toBeInTheDocument();
  });
  
  it('shows connect wallet message when user is not connected', () => {
    // Override the mock for this specific test
    jest.spyOn(require('../contexts/WalletContext'), 'useWallet').mockReturnValue({
      address: null,
      connected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    
    render(<SmartAccountPage />);
    
    expect(screen.getByText('Please connect your wallet to access Smart Account features')).toBeInTheDocument();
  });
}); 
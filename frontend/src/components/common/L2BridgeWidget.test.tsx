import React from 'react';
import '@testing-library/jest-dom';
import L2BridgeWidget from './L2BridgeWidget';
import {
  render,
  screen,
  mockContexts,
} from '../../test-utils';

// Mock the context hooks using test-utils mock factories
jest.mock('../../contexts/WalletContext', () => mockContexts.WalletContext);
jest.mock('../../contexts/L2BridgeContext', () => mockContexts.L2BridgeContext);

describe('L2BridgeWidget', () => {
  it('renders the bridge widget', async () => {
    render(<L2BridgeWidget />);

    // Check if the component renders main elements
    expect(screen.getByText('Bridge to L2')).toBeInTheDocument();
    expect(screen.getByText('Bridge your assets to Layer 2 networks for faster and cheaper transactions.')).toBeInTheDocument();
    expect(screen.getByLabelText('Treasury ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bridge' })).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });
});

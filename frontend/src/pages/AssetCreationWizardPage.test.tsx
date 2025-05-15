import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssetCreationWizardPage from './AssetCreationWizardPage';

// Mock the API calls used in the component
jest.mock('../api', () => ({
  getTemplatesByClass: jest.fn().mockResolvedValue({ templates: [] }),
  createAsset: jest.fn().mockResolvedValue({ assetId: 'test-asset-id', contractAddress: '0x123' }),
}));

describe('AssetCreationWizardPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders the component with initial step', () => {
    render(
      <MemoryRouter>
        <AssetCreationWizardPage />
      </MemoryRouter>
    );

    // Check for main heading
    expect(screen.getByText('Create New Asset')).toBeInTheDocument();
    
    // Check for initial step content
    expect(screen.getByText('Select Asset Class')).toBeInTheDocument();
    
    // Check for stepper
    expect(screen.getByText('Select Asset Class')).toBeInTheDocument();
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
    expect(screen.getByText('Set Asset Details')).toBeInTheDocument();
    expect(screen.getByText('Configure Tokenomics')).toBeInTheDocument();
    expect(screen.getByText('Compliance & Modules')).toBeInTheDocument();
    expect(screen.getByText('Review & Create')).toBeInTheDocument();
    
    // Check for navigation buttons
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeDisabled();
  });

  test('navigates through the wizard steps', () => {
    render(
      <MemoryRouter>
        <AssetCreationWizardPage />
      </MemoryRouter>
    );
    
    // Initial step
    expect(screen.getByText('Select Asset Class')).toBeInTheDocument();
    
    // Click Next button to go to second step
    fireEvent.click(screen.getByText('Next'));
    
    // Check that template selection warning is shown (since no asset class is selected)
    expect(screen.getByText('Please select an asset class first')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { ThemeContext } from '../contexts/ThemeContext';

// Mock router navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Theme wrapper
const TestWrapper = ({ children, theme = 'light' }) => (
  <BrowserRouter>
    <ThemeContext.Provider value={{ theme, toggleTheme: jest.fn() }}>
      {children}
    </ThemeContext.Provider>
  </BrowserRouter>
);

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders hero section with correct content', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to Quantera')).toBeInTheDocument();
    expect(screen.getByText(/The Future of Asset Tokenization/i)).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Explore Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Create Asset')).toBeInTheDocument();
    expect(screen.getByText('View Documentation')).toBeInTheDocument();
  });

  it('navigates to marketplace when Explore button is clicked', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const exploreButton = screen.getByText('Explore Marketplace');
    fireEvent.click(exploreButton);

    expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
  });

  it('navigates to asset creation when Create button is clicked', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Asset');
    fireEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/asset-factory');
  });

  it('navigates to documentation when View Documentation is clicked', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const docsButton = screen.getByText('View Documentation');
    fireEvent.click(docsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/docs');
  });

  it('renders feature cards', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    // Check for feature titles
    expect(screen.getByText('Multi-Asset Support')).toBeInTheDocument();
    expect(screen.getByText('Institutional Grade')).toBeInTheDocument();
    expect(screen.getByText('Global Liquidity')).toBeInTheDocument();
    expect(screen.getByText('Compliance Built-In')).toBeInTheDocument();
  });

  it('renders all asset type cards', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    // Check for asset types
    expect(screen.getByText('Treasury Securities')).toBeInTheDocument();
    expect(screen.getByText('Environmental Assets')).toBeInTheDocument();
    expect(screen.getByText('Trade Finance')).toBeInTheDocument();
    expect(screen.getByText('Custom Assets')).toBeInTheDocument();
  });

  it('renders stats section with correct values', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('$0')).toBeInTheDocument(); // Total Value Locked
    expect(screen.getByText('0')).toBeInTheDocument(); // Active Assets
    expect(screen.getByText('5+')).toBeInTheDocument(); // Supported Chains
  });

  it('renders CTA section', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    expect(screen.getByText('Ready to Transform Your Assets?')).toBeInTheDocument();
    expect(screen.getByText(/Join the future of tokenization/i)).toBeInTheDocument();
    
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).toBeInTheDocument();
  });

  it('navigates to asset factory when Get Started is clicked', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);

    expect(mockNavigate).toHaveBeenCalledWith('/asset-factory');
  });

  it('has correct hero section styling', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );

    const heroSection = screen.getByText('Welcome to Quantera').closest('section');
    expect(heroSection).toHaveStyle({ backgroundColor: '#1E2885' });
  });

  it('applies correct theme-based styling in light mode', () => {
    render(
      <TestWrapper theme="light">
        <HomePage />
      </TestWrapper>
    );

    const featuresSection = screen.getByText('Why Choose Quantera?').closest('section');
    expect(featuresSection).toHaveClass('features-section');
  });

  it('applies correct theme-based styling in dark mode', () => {
    render(
      <TestWrapper theme="dark">
        <HomePage />
      </TestWrapper>
    );

    const featuresSection = screen.getByText('Why Choose Quantera?').closest('section');
    expect(featuresSection).toHaveClass('features-section');
  });
});
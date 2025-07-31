import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock useMediaQuery hook
jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false));

// Mock theme context
const mockThemeContext = {
  theme: 'light',
  toggleTheme: jest.fn()
};

// Wrapper component with router and theme
const TestWrapper = ({ children, themeValue = mockThemeContext }) => (
  <BrowserRouter>
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  </BrowserRouter>
);

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo and navigation items', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Check logo
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('uantera')).toBeInTheDocument();

    // Check navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    expect(themeToggle).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    const mockToggleTheme = jest.fn();
    const customThemeContext = {
      ...mockThemeContext,
      toggleTheme: mockToggleTheme
    };

    render(
      <TestWrapper themeValue={customThemeContext}>
        <Header />
      </TestWrapper>
    );

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    fireEvent.click(themeToggle);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows correct theme icon based on current theme', () => {
    const { rerender } = render(
      <TestWrapper themeValue={{ ...mockThemeContext, theme: 'light' }}>
        <Header />
      </TestWrapper>
    );

    // Light mode should show dark mode icon
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();

    // Switch to dark mode
    rerender(
      <TestWrapper themeValue={{ ...mockThemeContext, theme: 'dark' }}>
        <Header />
      </TestWrapper>
    );

    // Dark mode should show light mode icon
    expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
  });

  it('renders GitHub link', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const githubLink = screen.getByLabelText(/view on github/i);
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/Carbon-Twelve-C12/quantera');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('opens mobile drawer when menu icon is clicked', async () => {
    // Mock mobile view
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(true);

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Find and click menu button
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Check if drawer opens (navigation items should be visible)
    await waitFor(() => {
      const drawerNav = screen.getAllByText('Home');
      expect(drawerNav.length).toBeGreaterThan(1); // One in AppBar, one in Drawer
    });
  });

  it('closes drawer when close button is clicked', async () => {
    // Mock mobile view
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(true);

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Open drawer
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Close drawer
    const closeButton = screen.getByTestId('CloseIcon');
    fireEvent.click(closeButton);

    await waitFor(() => {
      // After closing, only one "Home" should be visible (in AppBar)
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks).toHaveLength(1);
    });
  });

  it('navigates to correct routes when nav items are clicked', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    // Test each navigation link
    const navItems = [
      { text: 'Home', href: '/' },
      { text: 'Marketplace', href: '/marketplace' },
      { text: 'About', href: '/about' },
      { text: 'Documentation', href: '/docs' }
    ];

    navItems.forEach(item => {
      const link = screen.getByRole('link', { name: item.text });
      expect(link).toHaveAttribute('href', item.href);
    });
  });

  it('applies sticky positioning', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveStyle({ position: 'sticky' });
  });

  it('has correct background color', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveStyle({ backgroundColor: '#2c3e50' });
  });
});
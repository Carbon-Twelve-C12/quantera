import React from 'react';
import '@testing-library/jest-dom';
import Header from './Header';
import { ThemeContext } from '../../contexts/ThemeContext';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  createMockTheme,
} from '../../test-utils';

// Mock useMediaQuery hook
jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false));

// Custom wrapper that includes ThemeContext provider
const renderWithTheme = (ui, themeOverrides = {}) => {
  const mockTheme = createMockTheme(themeOverrides);

  return renderWithProviders(
    <ThemeContext.Provider value={mockTheme}>
      {ui}
    </ThemeContext.Provider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo and navigation items', () => {
    renderWithTheme(<Header />);

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
    renderWithTheme(<Header />);

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    expect(themeToggle).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    const mockToggleTheme = jest.fn();
    renderWithTheme(<Header />, { toggleTheme: mockToggleTheme });

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    fireEvent.click(themeToggle);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows correct theme icon based on current theme', () => {
    const { rerender } = renderWithTheme(<Header />, { theme: 'light' });

    // Light mode should show dark mode icon
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();

    // Switch to dark mode
    const darkMockTheme = createMockTheme({ theme: 'dark' });
    rerender(
      <ThemeContext.Provider value={darkMockTheme}>
        <Header />
      </ThemeContext.Provider>
    );

    // Dark mode should show light mode icon
    expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
  });

  it('renders GitHub link', () => {
    renderWithTheme(<Header />);

    const githubLink = screen.getByLabelText(/view on github/i);
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/Carbon-Twelve-C12/quantera');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('opens mobile drawer when menu icon is clicked', async () => {
    // Mock mobile view
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(true);

    renderWithTheme(<Header />);

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

    renderWithTheme(<Header />);

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
    renderWithTheme(<Header />);

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
    renderWithTheme(<Header />);

    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveStyle({ position: 'sticky' });
  });

  it('has correct background color', () => {
    renderWithTheme(<Header />);

    const appBar = screen.getByTestId('app-bar');
    expect(appBar).toHaveStyle({ backgroundColor: '#2c3e50' });
  });
});

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { loginWithWallet, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Clear any previous errors on mount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);
  
  const handleConnectWallet = async () => {
    try {
      await loginWithWallet();
    } catch (err) {
      // Error is handled by the auth context
    }
  };
  
  if (isAuthenticated) {
    return <div className="loading">Redirecting...</div>;
  }
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Quantera</h2>
        <p className="login-subtitle">Connect your wallet to access the platform</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="wallet-connect-section">
          <p className="connect-info">
            Quantera uses wallet-based authentication for institutional-grade security.
            Connect your MetaMask wallet to continue.
          </p>
          
          <button 
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="primary-button full-width wallet-connect-button"
          >
            {isLoading ? 'Connecting...' : '🦊 Connect Wallet'}
          </button>
          
          <div className="security-note">
            <small>
              You will be asked to sign a message to prove ownership of your wallet.
              This does not cost any gas or fees.
            </small>
          </div>
        </div>
        
        <div className="login-help">
          <p>
            Don't have MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Install MetaMask</a>
          </p>
          <p>
            <small>Institutional clients: Contact us for alternative authentication methods.</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initErrorTracking } from './utils/errorTracking';
import { logger } from './utils/logger';

// Initialize error tracking before rendering
initErrorTracking().then(() => {
  logger.info('Application starting', {
    version: process.env.REACT_APP_VERSION || '0.0.0',
    environment: process.env.NODE_ENV,
  });
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 
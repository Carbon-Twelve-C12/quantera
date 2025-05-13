import React from 'react';
import { WebSocketProvider } from './WebSocketContext';
import WebSocketNotifications from '../components/common/WebSocketNotifications';

export const NotificationProvider = ({ children }) => {
  return (
    <WebSocketProvider>
      {children}
      <WebSocketNotifications />
    </WebSocketProvider>
  );
};

export default NotificationProvider; 
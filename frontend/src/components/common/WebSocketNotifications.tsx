import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Button, 
  Typography, 
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import { 
  useWebSocket, 
  WebSocketEventType,
  WebSocketEvent,
  L2MessageStatusUpdate,
  SmartAccountOperation
} from '../../contexts/WebSocketContext';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';

interface WebSocketNotificationsProps {
  maxDisplayedNotifications?: number;
}

const WebSocketNotifications: React.FC<WebSocketNotificationsProps> = ({ 
  maxDisplayedNotifications = 5
}) => {
  const { isConnected, lastEvent, events } = useWebSocket();
  
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<WebSocketEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Format event for display
  const formatEventMessage = (event: WebSocketEvent): string => {
    switch (event.type) {
      case WebSocketEventType.L2_MESSAGE_STATUS_UPDATE:
        const messageUpdate = event.payload as L2MessageStatusUpdate;
        return `L2 Message ${messageUpdate.message_id.slice(0, 6)}... status updated to ${messageUpdate.status}`;
      
      case WebSocketEventType.SMART_ACCOUNT_OPERATION:
        const operation = event.payload as SmartAccountOperation;
        return `Smart Account operation ${operation.operation_type} executed on account ${operation.account_id.slice(0, 6)}...`;
      
      case WebSocketEventType.SMART_ACCOUNT_DELEGATE_ADDED:
        return 'New delegate added to smart account';
      
      case WebSocketEventType.SMART_ACCOUNT_DELEGATE_REMOVED:
        return 'Delegate removed from smart account';
      
      default:
        return 'New notification received';
    }
  };
  
  // Get severity based on event type
  const getEventSeverity = (event: WebSocketEvent): 'success' | 'info' | 'warning' | 'error' => {
    switch (event.type) {
      case WebSocketEventType.L2_MESSAGE_STATUS_UPDATE:
        const messageUpdate = event.payload as L2MessageStatusUpdate;
        if (messageUpdate.status === 'CONFIRMED') return 'success';
        if (messageUpdate.status === 'FAILED') return 'error';
        if (messageUpdate.status === 'REJECTED') return 'error';
        return 'info';
      
      case WebSocketEventType.SMART_ACCOUNT_OPERATION:
        return 'success';
      
      case WebSocketEventType.SMART_ACCOUNT_DELEGATE_ADDED:
        return 'info';
      
      case WebSocketEventType.SMART_ACCOUNT_DELEGATE_REMOVED:
        return 'warning';
      
      default:
        return 'info';
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  // Effect to show snackbar when new event is received
  useEffect(() => {
    if (lastEvent) {
      setShowSnackbar(true);
      setRecentNotifications(prev => [lastEvent, ...prev].slice(0, maxDisplayedNotifications));
      setUnreadCount(prev => prev + 1);
    }
  }, [lastEvent]);
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };
  
  // Toggle notification drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    if (!drawerOpen) {
      // Mark notifications as read when opening the drawer
      setUnreadCount(0);
    }
  };
  
  return (
    <>
      {/* Notification Icon with Badge */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Badge badgeContent={unreadCount} color="primary">
          <IconButton
            color="primary"
            onClick={toggleDrawer}
            sx={{ 
              backgroundColor: theme => theme.palette.background.paper,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: theme => theme.palette.background.default
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>
        </Badge>
      </Box>
      
      {/* Latest Notification Snackbar */}
      {lastEvent && (
        <Snackbar
          open={showSnackbar}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={getEventSeverity(lastEvent)}
            sx={{ width: '100%' }}
          >
            {formatEventMessage(lastEvent)}
          </Alert>
        </Snackbar>
      )}
      
      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* WebSocket Connection Status */}
          <Box sx={{ mb: 2 }}>
            <Alert severity={isConnected ? 'success' : 'warning'}>
              {isConnected ? 'Connected to WebSocket server' : 'Not connected to WebSocket server'}
            </Alert>
          </Box>
          
          {/* Notification List */}
          {recentNotifications.length > 0 ? (
            <List>
              {recentNotifications.map((event, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={formatEventMessage(event)}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {event.type}
                          </Typography>
                          {' — '}
                          {formatTimestamp(
                            'timestamp' in event.payload 
                              ? event.payload.timestamp 
                              : Math.floor(Date.now() / 1000)
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < recentNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ p: 2 }}>
              No notifications yet
            </Typography>
          )}
          
          {recentNotifications.length > 0 && events.length > recentNotifications.length && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {recentNotifications.length} of {events.length} notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default WebSocketNotifications; 
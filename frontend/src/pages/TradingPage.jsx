import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  FormControl, 
  FormControlLabel, 
  RadioGroup, 
  Radio, 
  Slider,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  History as HistoryIcon,
  AccountBalance,
  Sync
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

// Sample order book data
const SAMPLE_ORDER_BOOK = {
  "bids": [
    { price: 98.75, quantity: 500, total: 49375, orders: 3 },
    { price: 98.70, quantity: 750, total: 74025, orders: 5 },
    { price: 98.65, quantity: 1000, total: 98650, orders: 8 },
    { price: 98.60, quantity: 1500, total: 147900, orders: 12 },
    { price: 98.55, quantity: 2000, total: 197100, orders: 15 },
  ],
  "asks": [
    { price: 98.85, quantity: 450, total: 44482.5, orders: 4 },
    { price: 98.90, quantity: 700, total: 69230, orders: 6 },
    { price: 98.95, quantity: 900, total: 89055, orders: 7 },
    { price: 99.00, quantity: 1200, total: 118800, orders: 10 },
    { price: 99.05, quantity: 1800, total: 178290, orders: 14 },
  ]
};

// Sample user orders
const SAMPLE_USER_ORDERS = [
  { 
    id: '0x123', 
    side: 'buy', 
    price: 98.65, 
    quantity: 100, 
    filled: 0, 
    status: 'open', 
    assetId: '0x1',
    assetName: '3-Month T-Bill',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  { 
    id: '0x456', 
    side: 'sell', 
    price: 99.05, 
    quantity: 50, 
    filled: 0, 
    status: 'open', 
    assetId: '0x1',
    assetName: '3-Month T-Bill',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  { 
    id: '0x789', 
    side: 'buy', 
    price: 98.70, 
    quantity: 200, 
    filled: 200, 
    status: 'filled', 
    assetId: '0x2',
    assetName: '5-Year T-Note',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  { 
    id: '0xabc', 
    side: 'sell', 
    price: 99.00, 
    quantity: 150, 
    filled: 150, 
    status: 'filled', 
    assetId: '0x5f0f0e0d0c0b0a09080706050403020100000005',
    assetName: 'Amazon Rainforest Carbon Credits',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
];

// Sample assets for trading
const SAMPLE_ASSETS = [
  { id: '0x1', name: '3-Month T-Bill', type: 'T-Bill', currentPrice: 98.85 },
  { id: '0x2', name: '5-Year T-Note', type: 'T-Note', currentPrice: 97.32 },
  { id: '0x3', name: '10-Year T-Bond', type: 'T-Bond', currentPrice: 96.15 },
  { id: '0x4', name: '30-Year T-Bond', type: 'T-Bond', currentPrice: 94.78 },
  { id: '0x5f0f0e0d0c0b0a09080706050403020100000005', name: 'Amazon Rainforest Carbon Credits', type: 'Environmental', currentPrice: 24.75 },
  { id: '0x5f0f0e0d0c0b0a09080706050403020100000006', name: 'Blue Carbon Mangrove Credits', type: 'Environmental', currentPrice: 18.50 },
];

const TradingPage = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(SAMPLE_ASSETS[0].id);
  const [orderSide, setOrderSide] = useState('buy');
  const [orderType, setOrderType] = useState('limit');
  const [orderPrice, setOrderPrice] = useState(SAMPLE_ASSETS[0].currentPrice);
  const [orderQuantity, setOrderQuantity] = useState(100);
  const [orderTotal, setOrderTotal] = useState(0);
  const [sliderValue, setSliderValue] = useState([0, 100]);
  const [userOrders, setUserOrders] = useState(SAMPLE_USER_ORDERS);
  const [orderBook, setOrderBook] = useState(SAMPLE_ORDER_BOOK);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  
  // Calculate order total when price or quantity changes
  useEffect(() => {
    setOrderTotal(orderPrice * orderQuantity);
  }, [orderPrice, orderQuantity]);
  
  // Update price when selecting a different asset
  useEffect(() => {
    const asset = SAMPLE_ASSETS.find(asset => asset.id === selectedAsset);
    if (asset) {
      setOrderPrice(asset.currentPrice);
    }
  }, [selectedAsset]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleAssetChange = (event) => {
    setSelectedAsset(event.target.value);
  };
  
  const handleOrderSideChange = (event) => {
    setOrderSide(event.target.value);
  };
  
  const handleOrderTypeChange = (event) => {
    setOrderType(event.target.value);
  };
  
  const handlePriceChange = (event) => {
    setOrderPrice(parseFloat(event.target.value));
  };
  
  const handleQuantityChange = (event) => {
    setOrderQuantity(parseInt(event.target.value));
  };
  
  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
    
    // Calculate quantity based on slider percentage
    const asset = SAMPLE_ASSETS.find(asset => asset.id === selectedAsset);
    if (asset) {
      const maxQty = 1000; // Example maximum quantity
      const newQty = Math.round((newValue[1] / 100) * maxQty);
      setOrderQuantity(newQty);
    }
  };
  
  const handlePlaceOrder = () => {
    // In a real implementation, this would call the API
    const newOrder = {
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      side: orderSide,
      price: orderPrice,
      quantity: orderQuantity,
      filled: 0,
      status: 'open',
      assetId: selectedAsset,
      assetName: SAMPLE_ASSETS.find(asset => asset.id === selectedAsset)?.name,
      createdAt: new Date().toISOString()
    };
    
    setUserOrders([newOrder, ...userOrders]);
    
    // Show notification
    setNotificationMessage(`${orderSide.toUpperCase()} order for ${orderQuantity} ${newOrder.assetName} at $${orderPrice} placed successfully`);
    setNotificationType('success');
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotificationMessage('');
    }, 5000);
  };
  
  const handleCancelOrder = (orderId) => {
    // In a real implementation, this would call the API
    setUserOrders(userOrders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'cancelled' } 
        : order
    ));
    
    // Show notification
    setNotificationMessage('Order cancelled successfully');
    setNotificationType('info');
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotificationMessage('');
    }, 5000);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Trading
      </Typography>
      
      {notificationMessage && (
        <Alert severity={notificationType} sx={{ mb: 3 }}>
          {notificationMessage}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Order Book */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Book
              </Typography>
              <FormControl fullWidth margin="normal">
                <TextField
                  select
                  label="Asset"
                  value={selectedAsset}
                  onChange={handleAssetChange}
                >
                  {SAMPLE_ASSETS.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderBook.asks.slice().reverse().map((ask, index) => (
                      <TableRow key={`ask-${index}`} sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                        <TableCell sx={{ color: 'error.main' }}>{ask.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{ask.quantity}</TableCell>
                        <TableCell align="right">{ask.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Spread */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ borderBottom: 0, py: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Chip 
                            label={`Spread: $${(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)}`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {orderBook.bids.map((bid, index) => (
                      <TableRow key={`bid-${index}`} sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                        <TableCell sx={{ color: 'success.main' }}>{bid.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{bid.quantity}</TableCell>
                        <TableCell align="right">{bid.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Last Update: {new Date().toLocaleTimeString()}
                </Typography>
                <Button 
                  variant="text" 
                  size="small" 
                  startIcon={<Sync />}
                  onClick={() => {
                    // In a real implementation, this would refresh the order book
                    console.log('Refreshing order book...');
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Trading Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab 
                    icon={<TrendingUp color={orderSide === 'buy' ? 'success' : 'inherit'} />} 
                    iconPosition="start" 
                    label="Buy" 
                    onClick={() => setOrderSide('buy')}
                    sx={{ 
                      color: orderSide === 'buy' ? 'success.main' : 'inherit',
                      fontWeight: orderSide === 'buy' ? 'bold' : 'normal'
                    }}
                  />
                  <Tab 
                    icon={<TrendingDown color={orderSide === 'sell' ? 'error' : 'inherit'} />} 
                    iconPosition="start" 
                    label="Sell" 
                    onClick={() => setOrderSide('sell')}
                    sx={{ 
                      color: orderSide === 'sell' ? 'error.main' : 'inherit',
                      fontWeight: orderSide === 'sell' ? 'bold' : 'normal'
                    }}
                  />
                </Tabs>
              </Box>
              
              <FormControl fullWidth margin="normal">
                <TextField
                  select
                  label="Asset"
                  value={selectedAsset}
                  onChange={handleAssetChange}
                >
                  {SAMPLE_ASSETS.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.type})
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
              
              <FormControl component="fieldset" margin="normal">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order Type
                </Typography>
                <RadioGroup row value={orderType} onChange={handleOrderTypeChange}>
                  <FormControlLabel value="limit" control={<Radio />} label="Limit" />
                  <FormControlLabel value="market" control={<Radio />} label="Market" />
                </RadioGroup>
              </FormControl>
              
              {orderType === 'limit' && (
                <FormControl fullWidth margin="normal">
                  <TextField
                    label="Price"
                    type="number"
                    value={orderPrice}
                    onChange={handlePriceChange}
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </FormControl>
              )}
              
              <FormControl fullWidth margin="normal">
                <TextField
                  label="Quantity"
                  type="number"
                  value={orderQuantity}
                  onChange={handleQuantityChange}
                />
              </FormControl>
              
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Amount to {orderSide === 'buy' ? 'Buy' : 'Sell'}
                </Typography>
                <Slider
                  value={sliderValue}
                  onChange={handleSliderChange}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">0%</Typography>
                  <Typography variant="caption" color="text.secondary">25%</Typography>
                  <Typography variant="caption" color="text.secondary">50%</Typography>
                  <Typography variant="caption" color="text.secondary">75%</Typography>
                  <Typography variant="caption" color="text.secondary">100%</Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Order Value:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold" align="right">
                      ${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fees:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      ${(orderTotal * 0.001).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total with Fees:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold" align="right">
                      ${(orderTotal * 1.001).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                color={orderSide === 'buy' ? 'success' : 'error'}
                size="large"
                onClick={handlePlaceOrder}
                disabled={!orderQuantity || (orderType === 'limit' && !orderPrice)}
              >
                {orderSide === 'buy' ? 'Buy' : 'Sell'} {SAMPLE_ASSETS.find(asset => asset.id === selectedAsset)?.name}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Orders */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                <HistoryIcon sx={{ mr: 1 }} />
                Order History
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Side</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userOrders.length > 0 ? (
                      userOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.assetName}
                          </TableCell>
                          <TableCell sx={{ 
                            color: order.side === 'buy' ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}>
                            {order.side.toUpperCase()}
                          </TableCell>
                          <TableCell align="right">${order.price.toFixed(2)}</TableCell>
                          <TableCell align="right">{order.quantity}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={order.status} 
                              size="small" 
                              color={
                                order.status === 'filled' ? 'success' : 
                                order.status === 'cancelled' ? 'error' : 
                                'primary'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {order.status === 'open' && (
                              <Button 
                                size="small" 
                                color="error" 
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TradingPage; 
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Divider, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import Grid from '../../utils/mui-shims';

import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { TradeFinanceAsset, SettlementCurrency } from '../../types/tradeFinance';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Order types
enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP'
}

// Order side
enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

// Order time in force
enum TimeInForce {
  GOOD_TILL_CANCELLED = 'GTC',
  IMMEDIATE_OR_CANCEL = 'IOC',
  FILL_OR_KILL = 'FOK',
  DAY = 'DAY'
}

// Mock order for the demo
interface Order {
  id: string;
  assetId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number | null;
  stopPrice: number | null;
  status: 'OPEN' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED';
  filledQuantity: number;
  createdAt: Date;
  timeInForce: TimeInForce;
  settlementCurrency: SettlementCurrency;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TradeFinanceTradingInterface: React.FC<{ asset?: TradeFinanceAsset }> = ({ asset }) => {
  const { loading, error, getAssetById } = useTradeFinance();
  const { walletAddress: userAddress } = useAuth();
  
  // State for trading interface
  const [tabValue, setTabValue] = useState(0);
  const [orderSide, setOrderSide] = useState<OrderSide>(OrderSide.BUY);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [stopPrice, setStopPrice] = useState<number | ''>('');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>(TimeInForce.GOOD_TILL_CANCELLED);
  const [settlementCurrency, setSettlementCurrency] = useState<SettlementCurrency>(SettlementCurrency.USDC);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Mock orders for the UI
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  
  // Market data (mock)
  const [marketPrice, setMarketPrice] = useState<number>(asset ? parseFloat(asset.currentPrice) : 0);
  const [assetData, setAssetData] = useState<TradeFinanceAsset | undefined>(asset);

  // Get asset data if not provided as prop
  useEffect(() => {
    if (!asset && getAssetById) {
      // This is just a fallback in case asset was not passed as prop
      // In a real implementation, you would likely get it from a route param
      const mockAssetId = 'tf-001';
      const fetchedAsset = getAssetById(mockAssetId);
      if (fetchedAsset) {
        setAssetData(fetchedAsset);
        setMarketPrice(parseFloat(fetchedAsset.currentPrice));
      }
    }
  }, [asset, getAssetById]);

  // Simulate market price movement
  useEffect(() => {
    if (!assetData) return;
    
    const interval = setInterval(() => {
      const initialPrice = parseFloat(assetData.currentPrice);
      const randomChange = (Math.random() - 0.5) * 0.05; // Small random price change
      const newPrice = initialPrice * (1 + randomChange);
      setMarketPrice(parseFloat(newPrice.toFixed(2)));
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [assetData]);

  // Reset form on asset change
  useEffect(() => {
    resetForm();
  }, [asset]);

  const resetForm = () => {
    setOrderSide(OrderSide.BUY);
    setOrderType(OrderType.MARKET);
    setQuantity('');
    setPrice('');
    setStopPrice('');
    setTimeInForce(TimeInForce.GOOD_TILL_CANCELLED);
    setSettlementCurrency(SettlementCurrency.USDC);
    setSuccessMessage(null);
    setErrorMessage(null);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      return;
    }
    
    const number = parseFloat(value);
    if (!isNaN(number) && number >= 0) {
      setQuantity(number);
    }
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPrice('');
      return;
    }
    
    const number = parseFloat(value);
    if (!isNaN(number) && number > 0) {
      setPrice(number);
    }
  };
  
  const handleStopPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setStopPrice('');
      return;
    }
    
    const number = parseFloat(value);
    if (!isNaN(number) && number > 0) {
      setStopPrice(number);
    }
  };
  
  const validateOrder = (): string | null => {
    if (!assetData) {
      return 'Asset data not available';
    }
    
    if (!quantity || quantity <= 0) {
      return 'Please enter a valid quantity';
    }
    
    if (orderType === OrderType.LIMIT && (!price || price <= 0)) {
      return 'Please enter a valid limit price';
    }
    
    if (orderType === OrderType.STOP && (!stopPrice || stopPrice <= 0)) {
      return 'Please enter a valid stop price';
    }
    
    return null;
  };
  
  const handlePlaceOrder = async () => {
    const validationError = validateOrder();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    
    if (!assetData || !userAddress || !quantity) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // In a real implementation, this would call an API or smart contract
      // For demo, we'll simulate a successful order
      setTimeout(() => {
        const newOrder: Order = {
          id: `ord-${Date.now().toString(36)}`,
          assetId: assetData.id,
          side: orderSide,
          type: orderType,
          quantity: quantity as number,
          price: orderType === OrderType.MARKET ? null : (price as number),
          stopPrice: orderType === OrderType.STOP ? (stopPrice as number) : null,
          status: orderType === OrderType.MARKET ? 'FILLED' : 'OPEN',
          filledQuantity: orderType === OrderType.MARKET ? (quantity as number) : 0,
          createdAt: new Date(),
          timeInForce,
          settlementCurrency
        };
        
        if (orderType === OrderType.MARKET) {
          setOrderHistory(prev => [newOrder, ...prev]);
          setSuccessMessage(`Successfully ${orderSide === OrderSide.BUY ? 'bought' : 'sold'} ${quantity} units at market price`);
        } else {
          setOpenOrders(prev => [newOrder, ...prev]);
          setSuccessMessage(`Order placed successfully`);
        }
        
        resetForm();
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      setErrorMessage('An error occurred while placing your order.');
      console.error(err);
      setIsSubmitting(false);
    }
  };
  
  const handleCancelOrder = (orderId: string) => {
    // In a real implementation, this would call an API or smart contract
    // For demo, we'll just update the local state
    const orderToCancel = openOrders.find(o => o.id === orderId);
    if (!orderToCancel) return;
    
    const updatedOrder = { ...orderToCancel, status: 'CANCELLED' as const };
    setOpenOrders(openOrders.filter(o => o.id !== orderId));
    setOrderHistory(prev => [updatedOrder, ...prev]);
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    if (!assetData) return `$${value.toFixed(2)}`;
    return `${assetData.currency} ${value.toFixed(2)}`;
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!assetData) {
    return (
      <Alert severity="error">
        Asset data not available. Please select an asset to trade.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="trading interface tabs"
          >
            <Tab label="Trade" id="trading-tab-0" />
            <Tab label="Open Orders" id="trading-tab-1" />
            <Tab label="Order History" id="trading-tab-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Asset Information */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2 
              }}>
                <Box>
                  <Typography variant="h6">{assetData.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assetData.assetType.replace(/_/g, ' ')}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(marketPrice)}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography 
                      variant="body2" 
                      color={marketPrice > parseFloat(assetData.currentPrice) ? "success.main" : "error.main"}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {marketPrice > parseFloat(assetData.currentPrice) ? 
                        <ArrowUpwardIcon fontSize="small" /> : 
                        <ArrowDownwardIcon fontSize="small" />
                      }
                      {Math.abs(marketPrice - parseFloat(assetData.currentPrice)).toFixed(2)} 
                      ({((Math.abs(marketPrice - parseFloat(assetData.currentPrice)) / parseFloat(assetData.currentPrice)) * 100).toFixed(2)}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            {/* Trade Form */}
            <Grid item xs={12} md={6}>
              <Box mb={3} display="flex">
                <Button 
                  variant={orderSide === OrderSide.BUY ? "contained" : "outlined"} 
                  color="success"
                  onClick={() => setOrderSide(OrderSide.BUY)}
                  fullWidth
                  sx={{ mr: 1 }}
                >
                  Buy
                </Button>
                <Button 
                  variant={orderSide === OrderSide.SELL ? "contained" : "outlined"} 
                  color="error"
                  onClick={() => setOrderSide(OrderSide.SELL)}
                  fullWidth
                >
                  Sell
                </Button>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="order-type-label">Order Type</InputLabel>
                <Select
                  labelId="order-type-label"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  label="Order Type"
                >
                  <MenuItem value={OrderType.MARKET}>Market</MenuItem>
                  <MenuItem value={OrderType.LIMIT}>Limit</MenuItem>
                  <MenuItem value={OrderType.STOP}>Stop</MenuItem>
                </Select>
                <FormHelperText>
                  {orderType === OrderType.MARKET ? 
                    'Execute immediately at market price' : 
                    orderType === OrderType.LIMIT ? 
                    'Set a specific price for execution' :
                    'Execute when price reaches stop level'
                  }
                </FormHelperText>
              </FormControl>
              
              <TextField
                label="Quantity"
                fullWidth
                value={quantity}
                onChange={handleQuantityChange}
                type="number"
                inputProps={{ min: 0, step: 1 }}
                sx={{ mb: 3 }}
                helperText={`Available: ${assetData.fractionalUnits.toLocaleString()} units`}
              />
              
              {orderType === OrderType.LIMIT && (
                <TextField
                  label="Limit Price"
                  fullWidth
                  value={price}
                  onChange={handlePriceChange}
                  type="number"
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ mr: 1 }}>{assetData.currency}</Box>,
                  }}
                  sx={{ mb: 3 }}
                />
              )}
              
              {orderType === OrderType.STOP && (
                <TextField
                  label="Stop Price"
                  fullWidth
                  value={stopPrice}
                  onChange={handleStopPriceChange}
                  type="number"
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ mr: 1 }}>{assetData.currency}</Box>,
                  }}
                  sx={{ mb: 3 }}
                />
              )}
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={isAdvancedMode} 
                    onChange={(e) => setIsAdvancedMode(e.target.checked)} 
                  />
                }
                label="Advanced Options"
                sx={{ mb: 2 }}
              />
              
              {isAdvancedMode && (
                <>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="time-in-force-label">Time in Force</InputLabel>
                    <Select
                      labelId="time-in-force-label"
                      value={timeInForce}
                      onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
                      label="Time in Force"
                    >
                      <MenuItem value={TimeInForce.GOOD_TILL_CANCELLED}>Good Till Cancelled (GTC)</MenuItem>
                      <MenuItem value={TimeInForce.IMMEDIATE_OR_CANCEL}>Immediate or Cancel (IOC)</MenuItem>
                      <MenuItem value={TimeInForce.FILL_OR_KILL}>Fill or Kill (FOK)</MenuItem>
                      <MenuItem value={TimeInForce.DAY}>Day Order</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="settlement-currency-label">Settlement Currency</InputLabel>
                    <Select
                      labelId="settlement-currency-label"
                      value={settlementCurrency}
                      onChange={(e) => setSettlementCurrency(e.target.value as SettlementCurrency)}
                      label="Settlement Currency"
                    >
                      <MenuItem value={SettlementCurrency.USDC}>USDC</MenuItem>
                      <MenuItem value={SettlementCurrency.USDT}>USDT</MenuItem>
                      <MenuItem value={SettlementCurrency.EURC}>EURC</MenuItem>
                      <MenuItem value={SettlementCurrency.USDP}>USDP</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
              
              {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}
              
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
              )}
              
              <Button
                variant="contained"
                color={orderSide === OrderSide.BUY ? "success" : "error"}
                fullWidth
                size="large"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !userAddress}
              >
                {isSubmitting ? 
                  <CircularProgress size={24} /> : 
                  `${orderSide === OrderSide.BUY ? 'Buy' : 'Sell'} ${orderType.toLowerCase()}`
                }
              </Button>
            </Grid>
            
            {/* Order Summary */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Order Type:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">
                        {orderSide} {orderType}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">
                        {quantity || '0'} units
                      </Typography>
                    </Grid>
                    
                    {orderType === OrderType.LIMIT && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Limit Price:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body1">
                            {price ? formatCurrency(price as number) : '-'}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    
                    {orderType === OrderType.STOP && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Stop Price:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body1">
                            {stopPrice ? formatCurrency(stopPrice as number) : '-'}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Current Market Price:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">
                        {formatCurrency(marketPrice)}
                      </Typography>
                    </Grid>
                    
                    {isAdvancedMode && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Time in Force:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body1">
                            {timeInForce}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Settlement Currency:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body1">
                            {settlementCurrency}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(
                        (quantity || 0) * (
                          orderType === OrderType.MARKET 
                            ? marketPrice 
                            : (price || marketPrice) as number
                        )
                      )}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Expected Maturity Value:
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(
                          (quantity || 0) * (assetData.nominalValue / assetData.fractionalUnits)
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      Settlement Currency:
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <CurrencyExchangeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1" fontWeight="medium">
                        {settlementCurrency}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Open Orders</Typography>
          
          {openOrders.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                You have no open orders at this time.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Time in Force</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {openOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell component="th" scope="row">
                        {order.id}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.type} 
                          size="small" 
                          color={
                            order.type === OrderType.MARKET 
                              ? "primary" 
                              : order.type === OrderType.LIMIT 
                                ? "info" 
                                : "warning"
                          } 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.side} 
                          size="small" 
                          color={order.side === OrderSide.BUY ? "success" : "error"} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {order.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {order.price ? formatCurrency(order.price) : 'Market'}
                      </TableCell>
                      <TableCell>{order.timeInForce}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="error"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Order History</Typography>
          
          {orderHistory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                You have no order history yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderHistory.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell component="th" scope="row">
                        {order.id}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.type} 
                          size="small" 
                          color={
                            order.type === OrderType.MARKET 
                              ? "primary" 
                              : order.type === OrderType.LIMIT 
                                ? "info" 
                                : "warning"
                          } 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.side} 
                          size="small" 
                          color={order.side === OrderSide.BUY ? "success" : "error"} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {order.filledQuantity > 0 
                          ? `${order.filledQuantity.toLocaleString()} / ${order.quantity.toLocaleString()}`
                          : order.quantity.toLocaleString()
                        }
                      </TableCell>
                      <TableCell align="right">
                        {order.price ? formatCurrency(order.price) : 'Market'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={
                            order.status === 'FILLED' 
                              ? "success" 
                              : order.status === 'PARTIALLY_FILLED' 
                                ? "warning" 
                                : "default"
                          } 
                        />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TradeFinanceTradingInterface; 
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Tab, Tabs, Alert, Spinner, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { useLiquidityPool, PoolConfig, Position } from '../contexts/LiquidityPoolContext';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import PriceRangeSelector from '../components/common/PriceRangeSelector';
import LiquidityChart from '../components/common/LiquidityChart';
import LiquidityPositionSimulator from '../components/common/LiquidityPositionSimulator';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Helper function to convert price to tick
const priceToTick = (price: number): number => {
  return Math.floor(Math.log(price) / Math.log(1.0001));
};

// Helper function to convert tick to price
const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick);
};

const EnhancedLiquidityPoolPage: React.FC = () => {
  const { 
    pools, poolStates, tokens, userPositions,
    isLoading, error,
    createPool, addLiquidity, removeLiquidity, collectFees,
    refreshPools, refreshUserPositions
  } = useLiquidityPool();
  
  const { address, connected } = useWallet();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<string>('pools');
  
  // Modal states
  const [showCreatePoolModal, setShowCreatePoolModal] = useState<boolean>(false);
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState<boolean>(false);
  const [showRemoveLiquidityModal, setShowRemoveLiquidityModal] = useState<boolean>(false);
  
  // Selected items
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  
  // Form states for create pool
  const [tokenA, setTokenA] = useState<string>('');
  const [tokenB, setTokenB] = useState<string>('');
  const [assetClassA, setAssetClassA] = useState<number>(0);
  const [assetClassB, setAssetClassB] = useState<number>(0);
  const [feeTier, setFeeTier] = useState<number>(30); // Default 0.3%
  const [initialSqrtPrice, setInitialSqrtPrice] = useState<string>('1000000000000000000'); // Default 1.0
  const [tickSpacing, setTickSpacing] = useState<number>(10);
  
  // Price range state for add liquidity
  const [lowerTick, setLowerTick] = useState<number>(0);
  const [upperTick, setUpperTick] = useState<number>(0);
  const [amount0Desired, setAmount0Desired] = useState<string>('0');
  const [amount1Desired, setAmount1Desired] = useState<string>('0');
  
  // Form states for remove liquidity
  const [liquidityAmount, setLiquidityAmount] = useState<string>('0');
  
  // Advanced states for simulator
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  
  // Refresh data on mount and when address changes
  useEffect(() => {
    refreshPools();
    if (connected) {
      refreshUserPositions();
    }
  }, [connected, address, refreshPools, refreshUserPositions]);
  
  // Create chart colors based on theme
  const getChartColors = () => {
    return {
      border: theme === 'dark' ? 'rgb(96, 165, 250)' : 'rgb(53, 162, 235)',
      background: theme === 'dark' ? 'rgba(96, 165, 250, 0.5)' : 'rgba(53, 162, 235, 0.5)',
    };
  };
  
  // Handle pool creation
  const handleCreatePool = async () => {
    try {
      await createPool(
        tokenA,
        tokenB,
        assetClassA,
        assetClassB,
        feeTier,
        initialSqrtPrice,
        tickSpacing
      );
      setShowCreatePoolModal(false);
      refreshPools();
    } catch (err) {
      console.error("Error creating pool:", err);
    }
  };
  
  // Handle adding liquidity
  const handleAddLiquidity = async () => {
    try {
      await addLiquidity(
        selectedPoolId,
        lowerTick,
        upperTick,
        amount0Desired,
        amount1Desired,
        '0', // amount0Min - simplified for demo
        '0'  // amount1Min - simplified for demo
      );
      setShowAddLiquidityModal(false);
      refreshUserPositions();
      refreshPools();
    } catch (err) {
      console.error("Error adding liquidity:", err);
    }
  };
  
  // Handle removing liquidity
  const handleRemoveLiquidity = async () => {
    try {
      await removeLiquidity(
        selectedPositionId,
        liquidityAmount,
        '0', // amount0Min - simplified for demo
        '0'  // amount1Min - simplified for demo
      );
      setShowRemoveLiquidityModal(false);
      refreshUserPositions();
      refreshPools();
    } catch (err) {
      console.error("Error removing liquidity:", err);
    }
  };
  
  // Handle collecting fees
  const handleCollectFees = async (positionId: string) => {
    try {
      await collectFees(positionId);
      refreshUserPositions();
    } catch (err) {
      console.error("Error collecting fees:", err);
    }
  };
  
  // Handle price range change
  const handleRangeChange = (lower: number, upper: number) => {
    setLowerTick(lower);
    setUpperTick(upper);
  };
  
  // Helper function to format token amounts for display
  const formatTokenAmount = (amount: string, tokenAddress: string) => {
    const token = tokens[tokenAddress];
    if (!token) return `${amount} ???`;
    
    try {
      const decimals = token.decimals;
      // Convert amount to a number that can be formatted
      const amountBigInt = BigInt(amount);
      
      // Create divisor based on decimals (avoiding direct BigInt exponentiation)
      let divisor = BigInt(1);
      for (let i = 0; i < decimals; i++) {
        divisor = divisor * BigInt(10);
      }
      
      // Calculate whole and fractional parts
      const whole = amountBigInt / divisor;
      const fractional = amountBigInt % divisor;
      
      // Format fractional part to have leading zeros if needed
      let fractionalStr = fractional.toString().padStart(decimals, '0');
      
      // Trim trailing zeros
      fractionalStr = fractionalStr.replace(/0+$/, '');
      
      // Format the final number
      const formattedNumber = fractionalStr ? `${whole}.${fractionalStr}` : `${whole}`;
      
      return `${formattedNumber} ${token.symbol}`;
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return `${amount} ${token.symbol}`;
    }
  };
  
  // Helper function to get token name
  const getTokenName = (address: string) => {
    return tokens[address]?.name || 'Unknown Token';
  };
  
  // Helper function to get token symbol
  const getTokenSymbol = (address: string) => {
    return tokens[address]?.symbol || '???';
  };
  
  // Helper function to format fee tier
  const formatFeeTier = (feeTier: number) => {
    return `${feeTier / 100}%`;
  };
  
  // Helper function to get pool name
  const getPoolName = (pool: PoolConfig) => {
    return `${getTokenSymbol(pool.tokenA)}/${getTokenSymbol(pool.tokenB)}`;
  };
  
  // Helper function to get pool liquidity
  const getPoolLiquidity = (poolId: string) => {
    const poolState = poolStates[poolId];
    if (!poolState) return '0';
    return poolState.totalLiquidity;
  };
  
  // Helper function to get pool volume
  const getPoolVolume = (poolId: string) => {
    const poolState = poolStates[poolId];
    if (!poolState) return { tokenA: '0', tokenB: '0' };
    return { 
      tokenA: poolState.volumeTokenA,
      tokenB: poolState.volumeTokenB
    };
  };
  
  // Helper function to get asset class name
  const getAssetClassName = (assetClass: number) => {
    switch (assetClass) {
      case 0: return 'Treasury';
      case 1: return 'Real Estate';
      case 2: return 'Commodity';
      case 3: return 'Stablecoin';
      case 4: return 'Environmental';
      default: return 'Unknown';
    }
  };
  
  // Helper to find a position by ID
  const getPositionById = (positionId: string) => {
    return userPositions.find(p => p.positionId === positionId);
  };
  
  // Helper to find a pool by ID
  const getPoolById = (poolId: string) => {
    return pools.find(p => p.poolId === poolId);
  };
  
  // Calculate current price for a pool
  const getCurrentPrice = (poolId: string) => {
    const poolState = poolStates[poolId];
    if (!poolState) return 1.0;
    
    // In real implementation, this would convert the sqrtPriceX96 to actual price
    // For demo purposes, we just use a simplified version
    return parseFloat(poolState.sqrtPriceX96) / 1e18;
  };
  
  // Render the page
  return (
    <Container className="py-4">
      <h1 className="mb-4">Liquidity Pool Management</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {isLoading && (
        <div className="text-center mb-4">
          <Spinner animation="border" />
        </div>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="pools" title="All Pools">
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Available Pools</h3>
              <Button 
                variant="primary" 
                onClick={() => setShowCreatePoolModal(true)}
                disabled={!connected}
              >
                Create New Pool
              </Button>
            </Card.Header>
            <Card.Body>
              {pools.length === 0 ? (
                <p className="text-center">No pools available.</p>
              ) : (
                <div className="table-responsive">
                  <table className={`table table-striped ${theme === 'dark' ? 'table-dark' : ''} table-hover`}>
                    <thead>
                      <tr>
                        <th>Pool</th>
                        <th>Fee</th>
                        <th>Asset Classes</th>
                        <th>Liquidity</th>
                        <th>Volume (24h)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pools.map((pool) => (
                        <tr key={pool.poolId} 
                          className={pool.poolId === selectedPoolId ? 'table-active' : ''}
                          onClick={() => setSelectedPoolId(pool.poolId)}>
                          <td>{getPoolName(pool)}</td>
                          <td>{formatFeeTier(pool.feeTier)}</td>
                          <td>
                            <Badge bg="primary" className="me-1">
                              {getAssetClassName(pool.assetClassA)}
                            </Badge>
                            <Badge bg="secondary">
                              {getAssetClassName(pool.assetClassB)}
                            </Badge>
                          </td>
                          <td>
                            {formatTokenAmount(getPoolLiquidity(pool.poolId), pool.tokenA)}
                          </td>
                          <td>
                            {formatTokenAmount(getPoolVolume(pool.poolId).tokenA, pool.tokenA)}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPoolId(pool.poolId);
                                setShowAddLiquidityModal(true);
                              }}
                              disabled={!connected}
                            >
                              Add Liquidity
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {selectedPoolId && getPoolById(selectedPoolId) && (
            <div>
              <h3 className="mb-3">
                {getPoolName(getPoolById(selectedPoolId)!)} Pool Details
              </h3>
              
              <Row>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h4>Price History</h4>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      {/* Price chart would go here */}
                      <div className="text-center h-100 d-flex align-items-center justify-content-center">
                        <p className="text-muted">Price chart visualization</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h4>Pool Statistics</h4>
                    </Card.Header>
                    <Card.Body>
                      <table className={`table ${theme === 'dark' ? 'table-dark' : ''}`}>
                        <tbody>
                          <tr>
                            <th>Current Price</th>
                            <td>{getCurrentPrice(selectedPoolId).toFixed(6)} {getTokenSymbol(getPoolById(selectedPoolId)!.tokenB)} per {getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)}</td>
                          </tr>
                          <tr>
                            <th>24h Volume</th>
                            <td>{formatTokenAmount(getPoolVolume(selectedPoolId).tokenA, getPoolById(selectedPoolId)!.tokenA)}</td>
                          </tr>
                          <tr>
                            <th>Total Liquidity</th>
                            <td>{formatTokenAmount(getPoolLiquidity(selectedPoolId), getPoolById(selectedPoolId)!.tokenA)}</td>
                          </tr>
                          <tr>
                            <th>Fee Tier</th>
                            <td>{formatFeeTier(getPoolById(selectedPoolId)!.feeTier)}</td>
                          </tr>
                          <tr>
                            <th>Tick Spacing</th>
                            <td>{getPoolById(selectedPoolId)!.tickSpacing}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <LiquidityChart
                poolId={selectedPoolId}
                currentTick={priceToTick(getCurrentPrice(selectedPoolId))}
                lowerTick={lowerTick || priceToTick(getCurrentPrice(selectedPoolId) * 0.5)}
                upperTick={upperTick || priceToTick(getCurrentPrice(selectedPoolId) * 1.5)}
                tickSpacing={getPoolById(selectedPoolId)!.tickSpacing}
                tokenA={getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)}
                tokenB={getTokenSymbol(getPoolById(selectedPoolId)!.tokenB)}
              />
              
              <Button 
                variant="primary" 
                className="mb-4"
                onClick={() => setShowAddLiquidityModal(true)}
                disabled={!connected}
              >
                Add Liquidity to This Pool
              </Button>
            </div>
          )}
        </Tab>
        
        <Tab eventKey="positions" title="My Positions">
          <Card>
            <Card.Header>
              <h3 className="mb-0">Your Liquidity Positions</h3>
            </Card.Header>
            <Card.Body>
              {!connected ? (
                <Alert variant="info">
                  Connect your wallet to view your positions.
                </Alert>
              ) : userPositions.length === 0 ? (
                <p className="text-center">You have no liquidity positions.</p>
              ) : (
                <div className="table-responsive">
                  <table className={`table table-striped ${theme === 'dark' ? 'table-dark' : ''} table-hover`}>
                    <thead>
                      <tr>
                        <th>Pool</th>
                        <th>Position Range</th>
                        <th>Liquidity</th>
                        <th>Uncollected Fees</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPositions.map((position) => {
                        const pool = getPoolById(position.poolId);
                        if (!pool) return null;
                        
                        const currentPrice = getCurrentPrice(position.poolId);
                        const lowerPrice = tickToPrice(position.lowerTick);
                        const upperPrice = tickToPrice(position.upperTick);
                        const inRange = currentPrice >= lowerPrice && currentPrice <= upperPrice;
                        
                        return (
                          <tr key={position.positionId}>
                            <td>{getPoolName(pool)}</td>
                            <td>
                              {lowerPrice.toFixed(6)} - {upperPrice.toFixed(6)} {getTokenSymbol(pool.tokenB)}
                            </td>
                            <td>
                              {formatTokenAmount(position.liquidity, pool.tokenA)}
                            </td>
                            <td>
                              {formatTokenAmount(position.tokensOwedA, pool.tokenA)}
                              <br />
                              {formatTokenAmount(position.tokensOwedB, pool.tokenB)}
                            </td>
                            <td>
                              <Badge 
                                bg={inRange ? 'success' : 'warning'}
                              >
                                {inRange ? 'In Range' : 'Out of Range'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-2">
                                <Button 
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleCollectFees(position.positionId)}
                                  disabled={
                                    BigInt(position.tokensOwedA) === BigInt(0) && 
                                    BigInt(position.tokensOwedB) === BigInt(0)
                                  }
                                >
                                  Collect Fees
                                </Button>
                                <Button 
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPositionId(position.positionId);
                                    setShowRemoveLiquidityModal(true);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Create Pool Modal */}
      <Modal 
        show={showCreatePoolModal} 
        onHide={() => setShowCreatePoolModal(false)} 
        size="lg"
        contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Liquidity Pool</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Token A</Form.Label>
                  <Form.Select 
                    value={tokenA}
                    onChange={(e) => setTokenA(e.target.value)}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  >
                    <option value="">Select Token A</option>
                    {Object.entries(tokens).map(([address, token]) => (
                      <option key={address} value={address}>
                        {token.name} ({token.symbol})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Token B</Form.Label>
                  <Form.Select 
                    value={tokenB}
                    onChange={(e) => setTokenB(e.target.value)}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  >
                    <option value="">Select Token B</option>
                    {Object.entries(tokens).map(([address, token]) => (
                      <option key={address} value={address}>
                        {token.name} ({token.symbol})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset Class A</Form.Label>
                  <Form.Select 
                    value={assetClassA}
                    onChange={(e) => setAssetClassA(parseInt(e.target.value))}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  >
                    <option value="0">Treasury</option>
                    <option value="1">Real Estate</option>
                    <option value="2">Commodity</option>
                    <option value="3">Stablecoin</option>
                    <option value="4">Environmental</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset Class B</Form.Label>
                  <Form.Select 
                    value={assetClassB}
                    onChange={(e) => setAssetClassB(parseInt(e.target.value))}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  >
                    <option value="0">Treasury</option>
                    <option value="1">Real Estate</option>
                    <option value="2">Commodity</option>
                    <option value="3">Stablecoin</option>
                    <option value="4">Environmental</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fee Tier</Form.Label>
                  <Form.Select 
                    value={feeTier}
                    onChange={(e) => setFeeTier(parseInt(e.target.value))}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  >
                    <option value="10">0.1% - Stable pairs</option>
                    <option value="30">0.3% - Standard pairs</option>
                    <option value="50">0.5% - Exotic pairs</option>
                    <option value="100">1.0% - Volatile pairs</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tick Spacing</Form.Label>
                  <Form.Control 
                    type="number"
                    min="1"
                    value={tickSpacing}
                    onChange={(e) => setTickSpacing(parseInt(e.target.value))}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  />
                  <Form.Text className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                    Determines price granularity. Lower values allow more precise positions.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Initial Price</Form.Label>
                  <Form.Control 
                    type="number"
                    min="0.000001"
                    step="0.000001"
                    value={parseFloat(initialSqrtPrice) / 1e18}
                    onChange={(e) => setInitialSqrtPrice((parseFloat(e.target.value) * 1e18).toString())}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  />
                  <Form.Text className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                    {tokenB ? getTokenSymbol(tokenB) : 'Token B'} per {tokenA ? getTokenSymbol(tokenA) : 'Token A'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreatePoolModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreatePool}
            disabled={!tokenA || !tokenB || tokenA === tokenB}
          >
            Create Pool
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Add Liquidity Modal */}
      <Modal 
        show={showAddLiquidityModal} 
        onHide={() => setShowAddLiquidityModal(false)} 
        size="xl"
        contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Add Liquidity to {selectedPoolId && getPoolById(selectedPoolId) 
              ? getPoolName(getPoolById(selectedPoolId)!) 
              : 'Pool'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPoolId && getPoolById(selectedPoolId) && (
            <Row>
              <Col lg={6}>
                <PriceRangeSelector
                  currentPrice={getCurrentPrice(selectedPoolId)}
                  tokenA={getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)}
                  tokenB={getTokenSymbol(getPoolById(selectedPoolId)!.tokenB)}
                  minTick={-887272} // Min possible tick
                  maxTick={887272}  // Max possible tick
                  tickSpacing={getPoolById(selectedPoolId)!.tickSpacing}
                  onRangeChange={handleRangeChange}
                />
              </Col>
              
              <Col lg={6}>
                <Card className={`mb-4 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
                  <Card.Header>
                    <h4>Add Liquidity</h4>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)} Amount
                        </Form.Label>
                        <Form.Control 
                          type="number"
                          min="0"
                          step="0.0000001"
                          value={parseFloat(amount0Desired) / 1e18}
                          onChange={(e) => setAmount0Desired((parseFloat(e.target.value) * 1e18).toString())}
                          className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {getTokenSymbol(getPoolById(selectedPoolId)!.tokenB)} Amount
                        </Form.Label>
                        <Form.Control 
                          type="number"
                          min="0"
                          step="0.0000001"
                          value={parseFloat(amount1Desired) / 1e18}
                          onChange={(e) => setAmount1Desired((parseFloat(e.target.value) * 1e18).toString())}
                          className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                        />
                      </Form.Group>
                      
                      <div className="d-flex justify-content-end">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => setShowSimulator(!showSimulator)}
                        >
                          {showSimulator ? 'Hide Simulator' : 'Show Return Simulator'}
                        </Button>
                        
                        <Button 
                          variant="primary"
                          onClick={handleAddLiquidity}
                          disabled={parseFloat(amount0Desired) === 0 && parseFloat(amount1Desired) === 0}
                        >
                          Add Liquidity
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
                
                {showSimulator && (
                  <LiquidityPositionSimulator
                    tokenA={getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)}
                    tokenB={getTokenSymbol(getPoolById(selectedPoolId)!.tokenB)}
                    feeTier={getPoolById(selectedPoolId)!.feeTier}
                    currentPrice={getCurrentPrice(selectedPoolId)}
                    lowerPrice={tickToPrice(lowerTick)}
                    upperPrice={tickToPrice(upperTick)}
                    amount0={amount0Desired}
                    amount1={amount1Desired}
                  />
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Remove Liquidity Modal */}
      <Modal 
        show={showRemoveLiquidityModal} 
        onHide={() => setShowRemoveLiquidityModal(false)} 
        contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>Remove Liquidity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPositionId && getPositionById(selectedPositionId) && getPoolById(getPositionById(selectedPositionId)!.poolId) && (
            <Form>
              <p>
                Removing liquidity from position in {
                  getPoolName(getPoolById(getPositionById(selectedPositionId)!.poolId)!)
                }
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>Amount of Liquidity to Remove</Form.Label>
                <Form.Control 
                  type="range"
                  min="0"
                  max={getPositionById(selectedPositionId)!.liquidity}
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  className={theme === 'dark' ? 'bg-dark border-secondary' : ''}
                />
                <div className="d-flex justify-content-between">
                  <span>0%</span>
                  <span>
                    {
                      Math.round(
                        (parseInt(liquidityAmount) / 
                        parseInt(getPositionById(selectedPositionId)!.liquidity)) * 100
                      ) || 0
                    }%
                  </span>
                  <span>100%</span>
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Estimated Return</Form.Label>
                <p>
                  {formatTokenAmount(
                    liquidityAmount, 
                    getPoolById(getPositionById(selectedPositionId)!.poolId)!.tokenA
                  )}
                  <br />
                  {formatTokenAmount(
                    liquidityAmount, 
                    getPoolById(getPositionById(selectedPositionId)!.poolId)!.tokenB
                  )}
                </p>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveLiquidityModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveLiquidity}>
            Remove Liquidity
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnhancedLiquidityPoolPage; 
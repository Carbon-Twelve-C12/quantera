import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Tab, Tabs, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import { useLiquidityPool, PoolConfig } from '../contexts/LiquidityPoolContext';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LiquidityPoolPage: React.FC = () => {
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
  
  // Form states for add liquidity
  const [lowerTick, setLowerTick] = useState<number>(0);
  const [upperTick, setUpperTick] = useState<number>(0);
  const [amount0Desired, setAmount0Desired] = useState<string>('0');
  const [amount1Desired, setAmount1Desired] = useState<string>('0');
  
  // Form states for remove liquidity
  const [liquidityAmount, setLiquidityAmount] = useState<string>('0');
  
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
  
  // Mock chart data (in a real app, this would come from historical price data)
  const getChartData = (poolId: string) => {
    const pool = pools.find(p => p.poolId === poolId);
    if (!pool) return null;
    
    const labels = Array.from({ length: 30 }, (_, i) => (30 - i).toString());
    
    // Generate some random price data that trends upward
    const basePrice = 100;
    const data = labels.map((_, i) => {
      return basePrice + (i * 0.5) + (Math.random() * 5 - 2.5);
    }).reverse();
    
    const chartColors = getChartColors();
    
    return {
      labels,
      datasets: [
        {
          label: getPoolName(pool),
          data,
          borderColor: chartColors.border,
          backgroundColor: chartColors.background,
        },
      ],
    };
  };
  
  // Helper to find a position by ID
  const getPositionById = (positionId: string) => {
    return userPositions.find(p => p.positionId === positionId);
  };
  
  // Helper to find a pool by ID
  const getPoolById = (poolId: string) => {
    return pools.find(p => p.poolId === poolId);
  };
  
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
                        <tr key={pool.poolId}>
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
                              onClick={() => {
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
          
          {selectedPoolId && (
            <Card className="mt-4">
              <Card.Header>
                <h3>
                  {getPoolById(selectedPoolId) 
                    ? getPoolName(getPoolById(selectedPoolId)!) 
                    : 'Pool'} Price History
                </h3>
              </Card.Header>
              <Card.Body>
                {getChartData(selectedPoolId) && (
                  <Line data={getChartData(selectedPoolId)!} />
                )}
              </Card.Body>
            </Card>
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPositions.map((position) => {
                        const pool = getPoolById(position.poolId);
                        return pool ? (
                          <tr key={position.positionId}>
                            <td>{getPoolName(pool)}</td>
                            <td>
                              {position.lowerTick} - {position.upperTick}
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
                              <Button 
                                variant="outline-success"
                                size="sm"
                                className="me-2"
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
                            </td>
                          </tr>
                        ) : null;
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
      <Modal show={showCreatePoolModal} onHide={() => setShowCreatePoolModal(false)} contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Liquidity Pool</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Token A</Form.Label>
              <Form.Control 
                as="select"
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
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Token B</Form.Label>
              <Form.Control 
                as="select"
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
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Asset Class A</Form.Label>
              <Form.Control 
                as="select"
                value={assetClassA}
                onChange={(e) => setAssetClassA(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="0">Treasury</option>
                <option value="1">Real Estate</option>
                <option value="2">Commodity</option>
                <option value="3">Stablecoin</option>
                <option value="4">Environmental</option>
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Asset Class B</Form.Label>
              <Form.Control 
                as="select"
                value={assetClassB}
                onChange={(e) => setAssetClassB(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="0">Treasury</option>
                <option value="1">Real Estate</option>
                <option value="2">Commodity</option>
                <option value="3">Stablecoin</option>
                <option value="4">Environmental</option>
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Fee Tier</Form.Label>
              <Form.Control 
                as="select"
                value={feeTier}
                onChange={(e) => setFeeTier(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="10">0.1%</option>
                <option value="30">0.3%</option>
                <option value="50">0.5%</option>
                <option value="100">1.0%</option>
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Initial Price (1 {tokenA ? getTokenSymbol(tokenA) : 'A'} = x {tokenB ? getTokenSymbol(tokenB) : 'B'})</Form.Label>
              <Form.Control 
                type="number"
                value={parseFloat(initialSqrtPrice) / 1e18}
                onChange={(e) => setInitialSqrtPrice((parseFloat(e.target.value) * 1e18).toString())}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tick Spacing</Form.Label>
              <Form.Control 
                type="number"
                value={tickSpacing}
                onChange={(e) => setTickSpacing(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              />
              <Form.Text className={theme === 'dark' ? 'text-light' : 'text-muted'}>
                Determines the granularity of price ranges. Lower values allow for more precise positioning.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreatePoolModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreatePool}>
            Create Pool
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Add Liquidity Modal */}
      <Modal show={showAddLiquidityModal} onHide={() => setShowAddLiquidityModal(false)} contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>
            Add Liquidity to {selectedPoolId && getPoolById(selectedPoolId) 
              ? getPoolName(getPoolById(selectedPoolId)!) 
              : 'Pool'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Price Range - Lower Tick</Form.Label>
              <Form.Control 
                type="number"
                value={lowerTick}
                onChange={(e) => setLowerTick(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Price Range - Upper Tick</Form.Label>
              <Form.Control 
                type="number"
                value={upperTick}
                onChange={(e) => setUpperTick(parseInt(e.target.value))}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              />
            </Form.Group>
            
            {selectedPoolId && getPoolById(selectedPoolId) && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {getTokenSymbol(getPoolById(selectedPoolId)!.tokenA)} Amount
                  </Form.Label>
                  <Form.Control 
                    type="number"
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
                    value={parseFloat(amount1Desired) / 1e18}
                    onChange={(e) => setAmount1Desired((parseFloat(e.target.value) * 1e18).toString())}
                    className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddLiquidityModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddLiquidity}>
            Add Liquidity
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Remove Liquidity Modal */}
      <Modal show={showRemoveLiquidityModal} onHide={() => setShowRemoveLiquidityModal(false)} contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Liquidity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPositionId && getPositionById(selectedPositionId) && (
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

export default LiquidityPoolPage; 
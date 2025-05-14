import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Table, Button } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeContext';

interface PositionSimulatorProps {
  tokenA: string;
  tokenB: string;
  feeTier: number;
  currentPrice: number;
  lowerPrice: number;
  upperPrice: number;
  amount0: string;
  amount1: string;
}

const LiquidityPositionSimulator: React.FC<PositionSimulatorProps> = ({
  tokenA,
  tokenB,
  feeTier,
  currentPrice,
  lowerPrice,
  upperPrice,
  amount0,
  amount1
}) => {
  const { theme } = useTheme();
  const [volumeScenario, setVolumeScenario] = useState<string>("medium");
  const [timeframe, setTimeframe] = useState<string>("day");
  const [volatility, setVolatility] = useState<string>("medium");
  const [priceDirection, setPriceDirection] = useState<string>("neutral");
  
  // Convert string amounts to numbers
  const amount0Num = parseFloat(amount0);
  const amount1Num = parseFloat(amount1);
  
  // Calculate total value in USD (assuming amount1 is in USD or a stablecoin)
  const totalValue = amount0Num * currentPrice + amount1Num;
  
  // Calculate position concentration factor compared to full range
  const fullRange = upperPrice / lowerPrice;
  const concentrationFactor = fullRange / ((upperPrice - lowerPrice) / lowerPrice);
  
  // Simulation results
  const [simulatedFees, setSimulatedFees] = useState<number>(0);
  const [simulatedAPR, setSimulatedAPR] = useState<number>(0);
  const [inRangePercentage, setInRangePercentage] = useState<number>(100);
  const [priceAtEnd, setPriceAtEnd] = useState<number>(currentPrice);
  
  // Volume factors for different volume scenarios
  const volumeFactors = {
    low: 0.05,     // 5% of pool value
    medium: 0.2,   // 20% of pool value
    high: 0.5,     // 50% of pool value
    veryhigh: 1.0  // 100% of pool value
  };
  
  // Volatility factors affect price movement and range time
  const volatilityFactors = {
    low: { movement: 0.01, rangeTime: 0.95 },
    medium: { movement: 0.05, rangeTime: 0.8 },
    high: { movement: 0.1, rangeTime: 0.6 },
    extreme: { movement: 0.2, rangeTime: 0.4 }
  };
  
  // Price direction affects the final price
  const directionFactors = {
    verybearish: -2,
    bearish: -1,
    neutral: 0,
    bullish: 1,
    verybullish: 2
  };
  
  // Run simulation when parameters change
  useEffect(() => {
    // Fee tier as percentage
    const feePercentage = feeTier / 10000;
    
    // Time period factors for different timeframes
    const timeFactors: Record<string, number> = {
      hour: 1 / 24,
      day: 1,
      week: 7,
      month: 30,
      year: 365
    };
    
    // Get timeFactor with a default value to prevent undefined
    const timeFactor = timeFactors[timeframe] || 1; // Default to 1 day if timeframe is invalid
    
    // Volume factors for different volume scenarios
    const volumeFactors = {
      low: 0.05,     // 5% of pool value
      medium: 0.2,   // 20% of pool value
      high: 0.5,     // 50% of pool value
      veryhigh: 1.0  // 100% of pool value
    };
    
    // Volatility factors affect price movement and range time
    const volatilityFactors = {
      low: { movement: 0.01, rangeTime: 0.95 },
      medium: { movement: 0.05, rangeTime: 0.8 },
      high: { movement: 0.1, rangeTime: 0.6 },
      extreme: { movement: 0.2, rangeTime: 0.4 }
    };
    
    // Price direction affects the final price
    const directionFactors = {
      verybearish: -2,
      bearish: -1,
      neutral: 0,
      bullish: 1,
      verybullish: 2
    };
    
    // Calculate expected volume
    const volumeFactor = volumeFactors[volumeScenario as keyof typeof volumeFactors];
    const estimatedVolume = totalValue * volumeFactor * timeFactor;
    
    // Calculate volatility impact
    const volatilityFactor = volatilityFactors[volatility as keyof typeof volatilityFactors];
    
    // Calculate time in range
    const rangeTime = Math.min(1, Math.max(0, volatilityFactor.rangeTime));
    setInRangePercentage(rangeTime * 100);
    
    // Calculate price movement based on volatility and direction
    const directionFactor = directionFactors[priceDirection as keyof typeof directionFactors];
    const movementMagnitude = volatilityFactor.movement * directionFactor;
    const newPrice = currentPrice * (1 + movementMagnitude * Math.sqrt(timeFactor));
    setPriceAtEnd(newPrice);
    
    // Calculate expected fees
    // Fee = volume * fee tier * concentration advantage * time in range
    const expectedFees = estimatedVolume * feePercentage * concentrationFactor * rangeTime;
    setSimulatedFees(expectedFees);
    
    // Calculate APR
    const projectedAnnualFees = expectedFees * (365 / timeFactor);
    const annualizedAPR = (projectedAnnualFees / totalValue) * 100;
    setSimulatedAPR(annualizedAPR);
    
  }, [
    feeTier, 
    currentPrice, 
    lowerPrice, 
    upperPrice, 
    totalValue, 
    concentrationFactor, 
    volumeScenario, 
    timeframe, 
    volatility, 
    priceDirection
  ]);
  
  // Format price with appropriate precision
  const formatPrice = (price: number): string => {
    return price < 0.01 
      ? price.toFixed(6) 
      : price.toFixed(2);
  };
  
  // Format percentage
  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Determine in-range status at the end
  const getEndingRangeStatus = () => {
    if (priceAtEnd < lowerPrice) {
      return { status: "Out of Range (Below)", style: "danger" };
    } else if (priceAtEnd > upperPrice) {
      return { status: "Out of Range (Above)", style: "warning" };
    } else {
      return { status: "In Range", style: "success" };
    }
  };
  
  const rangeStatus = getEndingRangeStatus();
  
  return (
    <Card className={`mb-4 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
      <Card.Header>
        <h4>Position Performance Simulator</h4>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Trading Volume</Form.Label>
              <Form.Select 
                value={volumeScenario}
                onChange={(e) => setVolumeScenario(e.target.value)}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="low">Low (5% daily pool value)</option>
                <option value="medium">Medium (20% daily pool value)</option>
                <option value="high">High (50% daily pool value)</option>
                <option value="veryhigh">Very High (100% daily pool value)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Timeframe</Form.Label>
              <Form.Select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="hour">1 Hour</option>
                <option value="day">1 Day</option>
                <option value="week">1 Week</option>
                <option value="month">1 Month</option>
                <option value="year">1 Year</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Market Volatility</Form.Label>
              <Form.Select 
                value={volatility}
                onChange={(e) => setVolatility(e.target.value)}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="low">Low (1% daily movement)</option>
                <option value="medium">Medium (5% daily movement)</option>
                <option value="high">High (10% daily movement)</option>
                <option value="extreme">Extreme (20% daily movement)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Price Direction</Form.Label>
              <Form.Select 
                value={priceDirection}
                onChange={(e) => setPriceDirection(e.target.value)}
                className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="verybearish">Very Bearish (-2x volatility)</option>
                <option value="bearish">Bearish (-1x volatility)</option>
                <option value="neutral">Neutral (Sideways)</option>
                <option value="bullish">Bullish (+1x volatility)</option>
                <option value="verybullish">Very Bullish (+2x volatility)</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        <Card 
          className={`mb-4 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}
          border={theme === 'dark' ? 'secondary' : 'primary'}
        >
          <Card.Header className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} border-bottom-0`}>
            <h5 className="mb-0">Simulation Results</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive bordered variant={theme === 'dark' ? 'dark' : 'light'}>
              <tbody>
                <tr>
                  <th>Initial Position Value</th>
                  <td>{formatCurrency(totalValue)}</td>
                </tr>
                <tr>
                  <th>Concentration Factor</th>
                  <td>{concentrationFactor.toFixed(2)}x</td>
                </tr>
                <tr>
                  <th>Fee Tier</th>
                  <td>{(feeTier / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <th>Expected Time In Range</th>
                  <td>{formatPercentage(inRangePercentage)}</td>
                </tr>
                <tr>
                  <th>Estimated Price at Period End</th>
                  <td>{formatPrice(priceAtEnd)} {tokenB} per {tokenA}</td>
                </tr>
                <tr>
                  <th>Ending Range Status</th>
                  <td><span className={`badge bg-${rangeStatus.style}`}>{rangeStatus.status}</span></td>
                </tr>
                <tr>
                  <th>Estimated Fees Earned</th>
                  <td>{formatCurrency(simulatedFees)}</td>
                </tr>
                <tr>
                  <th>Projected APR</th>
                  <td className={simulatedAPR > 25 ? 'text-success' : simulatedAPR > 5 ? 'text-primary' : 'text-muted'}>
                    {formatPercentage(simulatedAPR)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        <div className="alert alert-info">
          <h5>How This Works</h5>
          <p>
            This simulator shows the estimated performance of your liquidity position
            based on different market scenarios. Concentrated liquidity positions earn
            higher fees when the price stays within your range, but stop earning fees
            when the price moves outside your range.
          </p>
          <p className="mb-0">
            <strong>Tip:</strong> Wider ranges are less capital efficient but more
            likely to stay in range during volatile markets. Narrower ranges are more
            capital efficient but have higher risk of moving out of range.
          </p>
        </div>
        
        <Row className="mt-4">
          <Col className="d-flex justify-content-end">
            <Button variant="primary">Apply This Position</Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default LiquidityPositionSimulator; 
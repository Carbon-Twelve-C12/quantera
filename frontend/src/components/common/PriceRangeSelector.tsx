import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeContext';

interface PriceRangeSelectorProps {
  currentPrice: number;
  tokenA: string;
  tokenB: string;
  minTick: number;
  maxTick: number;
  tickSpacing: number;
  onRangeChange: (lowerTick: number, upperTick: number) => void;
}

// Helper function to convert tick to price
const tickToPrice = (tick: number): number => {
  // In a real implementation, this would use the Uniswap v3 formula
  // price = 1.0001^tick
  return Math.pow(1.0001, tick);
};

// Helper function to convert price to tick
const priceToTick = (price: number): number => {
  // In a real implementation, this would use the Uniswap v3 formula
  // tick = log(price) / log(1.0001)
  return Math.floor(Math.log(price) / Math.log(1.0001));
};

const PriceRangeSelector: React.FC<PriceRangeSelectorProps> = ({
  currentPrice,
  tokenA,
  tokenB,
  minTick,
  maxTick,
  tickSpacing,
  onRangeChange
}) => {
  const { theme } = useTheme();
  
  // Convert current price to tick
  const currentTick = priceToTick(currentPrice);
  
  // State for the lower and upper ticks
  const [lowerTick, setLowerTick] = useState<number>(Math.floor(currentTick - 50 * tickSpacing));
  const [upperTick, setUpperTick] = useState<number>(Math.floor(currentTick + 50 * tickSpacing));
  
  // State for preset selections
  const [preset, setPreset] = useState<string>("custom");
  
  // Calculate prices from ticks
  const lowerPrice = tickToPrice(lowerTick);
  const upperPrice = tickToPrice(upperTick);
  
  // Format price for display
  const formatPrice = (price: number): string => {
    return price < 0.01 
      ? price.toExponential(2) 
      : price.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };
  
  // Apply preset ranges
  useEffect(() => {
    switch (preset) {
      case "narrow":
        setLowerTick(Math.floor(currentTick - 10 * tickSpacing));
        setUpperTick(Math.floor(currentTick + 10 * tickSpacing));
        break;
      case "medium":
        setLowerTick(Math.floor(currentTick - 50 * tickSpacing));
        setUpperTick(Math.floor(currentTick + 50 * tickSpacing));
        break;
      case "wide":
        setLowerTick(Math.floor(currentTick - 200 * tickSpacing));
        setUpperTick(Math.floor(currentTick + 200 * tickSpacing));
        break;
      case "full":
        setLowerTick(minTick);
        setUpperTick(maxTick);
        break;
      // "custom" doesn't change the range
    }
  }, [preset, currentTick, tickSpacing, minTick, maxTick]);
  
  // Notify parent component when range changes
  useEffect(() => {
    // Ensure ticks are aligned with tick spacing
    const alignedLowerTick = Math.floor(lowerTick / tickSpacing) * tickSpacing;
    const alignedUpperTick = Math.floor(upperTick / tickSpacing) * tickSpacing;
    
    onRangeChange(alignedLowerTick, alignedUpperTick);
  }, [lowerTick, upperTick, tickSpacing, onRangeChange]);
  
  // Handle manual tick input changes
  const handleLowerTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLowerTick = parseInt(e.target.value);
    if (!isNaN(newLowerTick) && newLowerTick < upperTick) {
      setLowerTick(newLowerTick);
      setPreset("custom");
    }
  };
  
  const handleUpperTickChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUpperTick = parseInt(e.target.value);
    if (!isNaN(newUpperTick) && newUpperTick > lowerTick) {
      setUpperTick(newUpperTick);
      setPreset("custom");
    }
  };
  
  // Handle manual price input changes
  const handleLowerPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLowerPrice = parseFloat(e.target.value);
    if (!isNaN(newLowerPrice) && newLowerPrice < tickToPrice(upperTick)) {
      const newLowerTick = priceToTick(newLowerPrice);
      setLowerTick(newLowerTick);
      setPreset("custom");
    }
  };
  
  const handleUpperPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUpperPrice = parseFloat(e.target.value);
    if (!isNaN(newUpperPrice) && newUpperPrice > tickToPrice(lowerTick)) {
      const newUpperTick = priceToTick(newUpperPrice);
      setUpperTick(newUpperTick);
      setPreset("custom");
    }
  };
  
  // Calculate range center and width for slider
  const rangeCenterTick = Math.floor((lowerTick + upperTick) / 2);
  const rangeWidthTicks = upperTick - lowerTick;
  
  // Handle slider changes
  const handleCenterChange = (value: number) => {
    const halfWidth = Math.floor(rangeWidthTicks / 2);
    setLowerTick(value - halfWidth);
    setUpperTick(value + halfWidth);
    setPreset("custom");
  };
  
  const handleWidthChange = (value: number) => {
    const halfWidth = Math.floor(value / 2);
    const center = Math.floor((lowerTick + upperTick) / 2);
    setLowerTick(center - halfWidth);
    setUpperTick(center + halfWidth);
    setPreset("custom");
  };
  
  return (
    <Card className={`mb-4 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
      <Card.Header>
        <h4>Set Price Range</h4>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Range Presets</Form.Label>
            <Form.Select 
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
            >
              <option value="custom">Custom Range</option>
              <option value="narrow">Narrow Range (±10%)</option>
              <option value="medium">Medium Range (±50%)</option>
              <option value="wide">Wide Range (±200%)</option>
              <option value="full">Full Range</option>
            </Form.Select>
          </Form.Group>
          
          <div className="mb-3 p-3 border rounded">
            <p className="text-center">
              Current Price: <strong>{formatPrice(currentPrice)} {tokenB} per {tokenA}</strong>
            </p>
            <div 
              className="position-relative py-4 mb-3" 
              style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}
            >
              <div 
                className="position-absolute" 
                style={{ 
                  left: '50%', 
                  top: 0, 
                  bottom: 0, 
                  width: '2px', 
                  background: '#28a745',
                  transform: 'translateX(-50%)',
                }}
              />
              <div className="d-flex justify-content-between">
                <div className="position-relative">
                  <div 
                    className="position-absolute" 
                    style={{ 
                      left: 0, 
                      top: -20, 
                      bottom: -20, 
                      width: '2px', 
                      background: '#007bff',
                    }}
                  />
                  <span className="badge bg-primary">Min Price</span>
                </div>
                <div className="position-relative">
                  <div 
                    className="position-absolute" 
                    style={{ 
                      right: 0, 
                      top: -20, 
                      bottom: -20, 
                      width: '2px', 
                      background: '#dc3545',
                    }}
                  />
                  <span className="badge bg-danger">Max Price</span>
                </div>
              </div>
            </div>
          </div>
          
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Lower Price Bound ({tokenB} per {tokenA})</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  value={formatPrice(lowerPrice)}
                  onChange={handleLowerPriceChange}
                  className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Upper Price Bound ({tokenB} per {tokenA})</Form.Label>
                <Form.Control
                  type="number"
                  step="0.000001"
                  value={formatPrice(upperPrice)}
                  onChange={handleUpperPriceChange}
                  className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Lower Tick</Form.Label>
                <Form.Control
                  type="number"
                  value={lowerTick}
                  onChange={handleLowerTickChange}
                  className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Upper Tick</Form.Label>
                <Form.Control
                  type="number"
                  value={upperTick}
                  onChange={handleUpperTickChange}
                  className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Range Center Position</Form.Label>
            <Form.Range
              value={rangeCenterTick}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCenterChange(parseInt(e.target.value))}
              min={minTick + Math.floor(rangeWidthTicks / 2)}
              max={maxTick - Math.floor(rangeWidthTicks / 2)}
              step={tickSpacing}
              className={theme === 'dark' ? 'bg-dark' : ''}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Range Width</Form.Label>
            <Form.Range
              value={rangeWidthTicks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWidthChange(parseInt(e.target.value))}
              min={tickSpacing * 2}
              max={(maxTick - minTick) / 2}
              step={tickSpacing * 2}
              className={theme === 'dark' ? 'bg-dark' : ''}
            />
          </Form.Group>
          
          <div className="p-3 border rounded mb-3">
            <h6>Position Information</h6>
            <p>
              You will earn fees on <strong>{tokenA}/{tokenB}</strong> trades when the price is between:<br />
              <strong>{formatPrice(lowerPrice)}</strong> and <strong>{formatPrice(upperPrice)}</strong> {tokenB} per {tokenA}
            </p>
            <p className="small text-muted">
              Your position will be concentrated 
              {
                upperTick - lowerTick < 1000 
                  ? " in a narrow range" 
                  : upperTick - lowerTick < 5000 
                    ? " in a medium range" 
                    : " across a wide range"
              }
              , making it 
              {
                upperTick - lowerTick < 1000 
                  ? " very capital efficient when the price stays in range" 
                  : upperTick - lowerTick < 5000 
                    ? " reasonably capital efficient" 
                    : " less capital efficient but with more range coverage"
              }.
            </p>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PriceRangeSelector; 
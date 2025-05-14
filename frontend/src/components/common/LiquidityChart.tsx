import React, { useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeContext';
import Chart from 'chart.js/auto';

interface LiquidityChartProps {
  poolId: string;
  lowerTick: number;
  upperTick: number;
  currentTick: number;
  tickSpacing: number;
  tokenA: string;
  tokenB: string;
  liquidityData?: number[];
}

const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick);
};

const LiquidityChart: React.FC<LiquidityChartProps> = ({
  poolId,
  lowerTick,
  upperTick,
  currentTick,
  tickSpacing,
  tokenA,
  tokenB,
  liquidityData
}) => {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Generate tick marks for the x-axis
  const generateTickMarks = () => {
    const ticks = [];
    
    // Add the current tick
    ticks.push(currentTick);
    
    // Add the lower and upper ticks
    ticks.push(lowerTick);
    ticks.push(upperTick);
    
    // Add some evenly spaced ticks within the range
    const range = upperTick - lowerTick;
    const numTicks = Math.min(10, Math.floor(range / tickSpacing));
    
    for (let i = 1; i < numTicks; i++) {
      const tick = lowerTick + Math.floor((i * range) / numTicks);
      ticks.push(tick);
    }
    
    // Add some ticks outside the range
    const outsideRange = Math.floor(range * 0.5);
    ticks.push(lowerTick - outsideRange);
    ticks.push(upperTick + outsideRange);
    
    // Sort the ticks and remove duplicates
    const uniqueTicks = Array.from(new Set(ticks));
    return uniqueTicks.sort((a, b) => a - b);
  };
  
  // Generate or use liquidity data
  const getLiquidityData = () => {
    if (liquidityData) return liquidityData;
    
    // Mock liquidity data if real data not available
    const ticks = generateTickMarks();
    
    return ticks.map(tick => {
      // Higher liquidity near current price
      const distanceFromCurrent = Math.abs(tick - currentTick);
      
      // Base liquidity decreases with distance from current tick
      let liquidity = 100 * Math.pow(0.95, distanceFromCurrent / tickSpacing);
      
      // Add a bump of liquidity in user's position range
      if (tick >= lowerTick && tick <= upperTick) {
        // Higher bump in the middle of the range
        const positionCenter = (lowerTick + upperTick) / 2;
        const distanceFromCenter = Math.abs(tick - positionCenter);
        const rangeWidth = upperTick - lowerTick;
        const positionFactor = 1 - (distanceFromCenter / (rangeWidth / 2));
        
        liquidity += 50 * Math.max(0, positionFactor);
      }
      
      return liquidity;
    });
  };
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clean up previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    
    const ticks = generateTickMarks();
    const values = getLiquidityData();
    
    // Format tick labels to show prices
    const tickLabels = ticks.map(tick => {
      const price = tickToPrice(tick);
      return price.toFixed(price < 0.01 ? 6 : 2);
    });
    
    // Set chart colors based on theme
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    
    // Generate background colors based on range
    const backgroundColors = ticks.map(tick => {
      if (tick === currentTick) {
        return 'rgba(40, 167, 69, 0.6)'; // Current tick (green)
      } else if (tick >= lowerTick && tick <= upperTick) {
        return 'rgba(0, 123, 255, 0.6)'; // In range (blue)
      } else {
        return 'rgba(108, 117, 125, 0.3)'; // Out of range (gray)
      }
    });
    
    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: tickLabels,
          datasets: [
            {
              label: 'Liquidity',
              data: values,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.6', '1').replace('0.3', '0.6')),
              borderWidth: 1,
              barPercentage: 0.9,
              categoryPercentage: 0.9,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: (tooltipItems) => {
                  const index = tooltipItems[0].dataIndex;
                  const tick = ticks[index];
                  const price = tickToPrice(tick);
                  return `Price: ${price.toFixed(6)} ${tokenB} per ${tokenA}`;
                },
                label: (tooltipItem) => {
                  const index = tooltipItem.dataIndex;
                  const tick = ticks[index];
                  let label = '';
                  
                  // Add special notation for key points
                  if (tick === currentTick) {
                    label += '📊 Current Price';
                  } else if (tick === lowerTick) {
                    label += '🔽 Your Lower Bound';
                  } else if (tick === upperTick) {
                    label += '🔼 Your Upper Bound';
                  }
                  
                  if (label) label += ' | ';
                  
                  label += `Liquidity: ${tooltipItem.formattedValue}`;
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: `Price (${tokenB} per ${tokenA})`,
                color: textColor
              },
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              title: {
                display: true,
                text: 'Liquidity',
                color: textColor
              },
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor
              },
              beginAtZero: true
            }
          }
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [poolId, lowerTick, upperTick, currentTick, tickSpacing, tokenA, tokenB, theme, liquidityData]);
  
  return (
    <Card className={`mb-4 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
      <Card.Header>
        <h4>Liquidity Distribution</h4>
      </Card.Header>
      <Card.Body>
        <div className="position-relative" style={{ height: '350px' }}>
          <canvas ref={chartRef} />
        </div>
        <div className="d-flex justify-content-around mt-3">
          <div>
            <span className="badge bg-primary me-2">■</span>
            <span>Your Position Range</span>
          </div>
          <div>
            <span className="badge bg-success me-2">■</span>
            <span>Current Price</span>
          </div>
          <div>
            <span className="badge bg-secondary me-2">■</span>
            <span>Out of Range</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default LiquidityChart; 
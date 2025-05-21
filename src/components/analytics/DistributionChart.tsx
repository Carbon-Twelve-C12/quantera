import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Define the AssetClass enum directly since imports are failing
enum AssetClass {
  TREASURY = 'TREASURY',
  REAL_ESTATE = 'REAL_ESTATE',
  CORPORATE_BOND = 'CORPORATE_BOND',
  ENVIRONMENTAL_ASSET = 'ENVIRONMENTAL_ASSET',
  IP_RIGHT = 'IP_RIGHT',
  INVOICE = 'INVOICE',
  COMMODITY = 'COMMODITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  TRADE_FINANCE = 'TRADE_FINANCE',
  CUSTOM = 'CUSTOM'
}

// Asset class colors
const ASSET_COLORS: Record<AssetClass, string> = {
  [AssetClass.TREASURY]: '#3498db', // Blue
  [AssetClass.REAL_ESTATE]: '#e74c3c', // Red
  [AssetClass.ENVIRONMENTAL_ASSET]: '#2ecc71', // Green
  [AssetClass.TRADE_FINANCE]: '#f39c12', // Yellow
  [AssetClass.CUSTOM]: '#9b59b6', // Purple
  [AssetClass.CORPORATE_BOND]: '#1abc9c', // Teal
  [AssetClass.IP_RIGHT]: '#d35400', // Orange
  [AssetClass.INVOICE]: '#8e44ad', // Purple
  [AssetClass.COMMODITY]: '#2c3e50', // Dark Blue
  [AssetClass.INFRASTRUCTURE]: '#16a085', // Green
};

// Human-readable asset class names
const ASSET_LABELS: Record<AssetClass, string> = {
  [AssetClass.TREASURY]: 'Treasury',
  [AssetClass.REAL_ESTATE]: 'Real Estate',
  [AssetClass.ENVIRONMENTAL_ASSET]: 'Environmental Assets',
  [AssetClass.TRADE_FINANCE]: 'Trade Finance',
  [AssetClass.CUSTOM]: 'Custom Assets',
  [AssetClass.CORPORATE_BOND]: 'Corporate Bonds',
  [AssetClass.IP_RIGHT]: 'IP Rights',
  [AssetClass.INVOICE]: 'Invoices',
  [AssetClass.COMMODITY]: 'Commodities',
  [AssetClass.INFRASTRUCTURE]: 'Infrastructure',
};

interface AssetDistribution {
  assetClass: AssetClass;
  totalValue: number;
  count: number;
}

interface DistributionChartProps {
  distribution: AssetDistribution[];
  title?: string;
  height?: number;
  valueType?: 'value' | 'count';
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  title = 'Asset Distribution',
  height = 300,
  valueType = 'value'
}) => {
  const theme = useTheme();

  // Prepare chart data
  const chartData: ChartData<'doughnut'> = {
    labels: distribution.map(item => ASSET_LABELS[item.assetClass] || item.assetClass),
    datasets: [
      {
        data: distribution.map(item => valueType === 'value' ? item.totalValue : item.count),
        backgroundColor: distribution.map(item => ASSET_COLORS[item.assetClass] || '#999'),
        borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
        borderWidth: 2,
        hoverOffset: 15
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            family: theme.typography.fontFamily
          },
          padding: 15,
          boxWidth: 15,
          boxHeight: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw;
            const percentage = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            
            if (valueType === 'value') {
              return `${label}: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value)} (${((value / percentage) * 100).toFixed(1)}%)`;
            } else {
              return `${label}: ${value} assets (${((value / percentage) * 100).toFixed(1)}%)`;
            }
          }
        }
      }
    },
    cutout: '65%'
  };

  // Calculate totals
  const totalValue = distribution.reduce((acc, item) => acc + item.totalValue, 0);
  const totalCount = distribution.reduce((acc, item) => acc + item.count, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ height: height, position: 'relative' }}>
          <Doughnut data={chartData} options={chartOptions as any} />
          
          {/* Center text */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <Typography variant="h5" fontWeight="medium">
              {valueType === 'value' ? formatCurrency(totalValue) : totalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {valueType === 'value' ? 'Total Value' : 'Asset Count'}
            </Typography>
          </Box>
        </Box>

        {/* Legend for small screens where chart legend might be hidden */}
        <Box 
          sx={{ 
            display: { xs: 'flex', md: 'none' },
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
            mt: 2 
          }}
        >
          {distribution.map((item) => (
            <Box 
              key={item.assetClass} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                m: 0.5
              }}
            >
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: ASSET_COLORS[item.assetClass] || '#999', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">
                {ASSET_LABELS[item.assetClass] || item.assetClass}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DistributionChart; 
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface AssetAllocationProps {
  assetAllocation: {
    [key: string]: number;
  };
  title?: string;
  height?: number;
}

// Asset category colors
const ASSET_CATEGORY_COLORS = {
  treasury: '#4CAF50', // green
  real_estate: '#2196F3', // blue
  corporate_bond: '#3F51B5', // indigo
  environmental: '#009688', // teal
  trade_finance: '#FF9800', // orange
  commodity: '#795548', // brown
  custom: '#F44336', // red
  ip_right: '#9C27B0', // purple
  infrastructure: '#607D8B' // blue-grey
};

// Asset category display names
const ASSET_CATEGORY_NAMES = {
  treasury: 'Treasury Securities',
  real_estate: 'Real Estate',
  corporate_bond: 'Corporate Bonds',
  environmental: 'Environmental Assets',
  trade_finance: 'Trade Finance',
  commodity: 'Commodities',
  custom: 'Custom Assets',
  ip_right: 'Intellectual Property',
  infrastructure: 'Infrastructure'
};

const AssetAllocation: React.FC<AssetAllocationProps> = ({
  assetAllocation,
  title = 'Asset Allocation',
  height = 250
}) => {
  const theme = useTheme();

  // Prepare chart data
  const chartData = {
    labels: Object.keys(assetAllocation).map(key => ASSET_CATEGORY_NAMES[key as keyof typeof ASSET_CATEGORY_NAMES] || key),
    datasets: [
      {
        data: Object.values(assetAllocation),
        backgroundColor: Object.keys(assetAllocation).map(key => 
          ASSET_CATEGORY_COLORS[key as keyof typeof ASSET_CATEGORY_COLORS] || '#999999'
        ),
        borderColor: theme.palette.background.paper,
        borderWidth: 2
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
          boxWidth: 15,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    layout: {
      padding: 10
    },
    cutout: '40%'
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: theme.shadows[1]
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        
        <Box sx={{ height: height, position: 'relative' }}>
          <Pie data={chartData} options={chartOptions as any} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssetAllocation; 
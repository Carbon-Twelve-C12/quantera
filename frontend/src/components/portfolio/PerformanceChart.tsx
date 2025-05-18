import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { PerformancePoint } from '../../types/portfolioTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  performanceHistory: PerformancePoint[];
  title?: string;
  showYield?: boolean;
  height?: number;
}

// Time range options
const TIME_RANGES = [
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' }
];

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  performanceHistory,
  title = 'Portfolio Performance',
  showYield = true,
  height = 250
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('1m');

  // Handle time range change
  const handleRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: string | null
  ) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Filter data based on selected time range
  const getFilteredData = () => {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    
    switch (timeRange) {
      case '7d':
        return performanceHistory.filter(p => p.date >= now - (7 * msInDay));
      case '1m':
        return performanceHistory.filter(p => p.date >= now - (30 * msInDay));
      case '3m':
        return performanceHistory.filter(p => p.date >= now - (90 * msInDay));
      case '6m':
        return performanceHistory.filter(p => p.date >= now - (180 * msInDay));
      case '1y':
        return performanceHistory.filter(p => p.date >= now - (365 * msInDay));
      case 'all':
      default:
        return performanceHistory;
    }
  };

  const filteredData = getFilteredData();

  // Prepare chart data
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartData = {
    labels: filteredData.map(point => formatDate(point.date)),
    datasets: [
      {
        label: 'Value',
        data: filteredData.map(point => point.value),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2
      },
      ...(!showYield ? [] : [{
        label: 'Yield',
        data: filteredData.map(point => point.yield || 0),
        borderColor: theme.palette.success.main,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2,
        borderDash: [5, 5]
      }])
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showYield,
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        }
      },
      y: {
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: any) => {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleRangeChange}
            size="small"
            aria-label="time range"
          >
            {TIME_RANGES.map((range) => (
              <ToggleButton 
                key={range.value} 
                value={range.value}
                size="small"
                sx={{ 
                  px: 1, 
                  fontSize: '0.75rem',
                  color: timeRange === range.value 
                    ? 'primary.contrastText' 
                    : 'text.secondary'
                }}
              >
                {range.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ height: height }}>
          <Line data={chartData} options={chartOptions as any} />
        </Box>

        {filteredData.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Starting Value
              </Typography>
              <Typography variant="subtitle1">
                ${filteredData[0].value.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Value
              </Typography>
              <Typography variant="subtitle1">
                ${filteredData[filteredData.length - 1].value.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Change
              </Typography>
              <Typography 
                variant="subtitle1"
                color={
                  filteredData[filteredData.length - 1].value - filteredData[0].value > 0
                    ? 'success.main'
                    : 'error.main'
                }
              >
                {((filteredData[filteredData.length - 1].value / filteredData[0].value - 1) * 100).toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart; 
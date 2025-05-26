import React from 'react';
import { Box, Paper, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { MoreVertical, Download, Maximize2 } from 'lucide-react';

const ChartContainer = styled(Paper)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  },
}));

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px',
});

const ChartTitle = styled(Typography)({
  fontSize: '20px',
  fontWeight: 600,
  color: '#263238',
  marginBottom: '8px',
  fontFamily: 'Inter, sans-serif',
});

const ChartSubtitle = styled(Typography)({
  fontSize: '14px',
  color: '#607d8b',
  fontFamily: 'Inter, sans-serif',
});

const MetricDisplay = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  marginBottom: '16px',
});

const MetricItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const MetricLabel = styled(Typography)({
  fontSize: '12px',
  color: '#607d8b',
  fontWeight: 500,
  marginBottom: '4px',
});

const MetricValue = styled(Typography)({
  fontSize: '18px',
  fontWeight: 700,
  color: '#1a237e',
});

const ChangeIndicator = styled(Typography)<{ positive: boolean }>(({ positive }) => ({
  fontSize: '14px',
  fontWeight: 600,
  color: positive ? '#4caf50' : '#f44336',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

const ActionButton = styled(IconButton)({
  color: '#607d8b',
  padding: '8px',
  
  '&:hover': {
    backgroundColor: 'rgba(26, 35, 126, 0.04)',
    color: '#1a237e',
  },
});

export type ChartType = 'line' | 'area' | 'bar';

interface ProfessionalChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  type?: ChartType;
  currentValue?: string;
  changeValue?: string;
  changePercentage?: number;
  showMetrics?: boolean;
  showActions?: boolean;
  onExport?: () => void;
  onMaximize?: () => void;
}

export const ProfessionalChart: React.FC<ProfessionalChartProps> = ({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  height = 300,
  color = '#1a237e',
  type = 'line',
  currentValue,
  changeValue,
  changePercentage,
  showMetrics = true,
  showActions = true,
  onExport,
  onMaximize,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(26, 35, 126, 0.15)',
            border: '1px solid rgba(26, 35, 126, 0.1)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#263238', fontWeight: 600, mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const commonAxisProps = {
      axisLine: false,
      tickLine: false,
      tick: { fill: '#607d8b', fontSize: 12 },
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(26, 35, 126, 0.1)" 
              horizontal={true}
              vertical={false}
            />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fill={`${color}20`}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(26, 35, 126, 0.1)" 
              horizontal={true}
              vertical={false}
            />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={customTooltip} />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(26, 35, 126, 0.1)" 
              horizontal={true}
              vertical={false}
            />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        );
    }
  };

  return (
    <ChartContainer>
      <ChartHeader>
        <Box>
          <ChartTitle>{title}</ChartTitle>
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </Box>
        
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ActionButton onClick={onMaximize}>
              <Maximize2 size={18} />
            </ActionButton>
            <ActionButton onClick={handleMenuClick}>
              <MoreVertical size={18} />
            </ActionButton>
          </Box>
        )}
      </ChartHeader>

      {showMetrics && (currentValue || changeValue) && (
        <MetricDisplay>
          {currentValue && (
            <MetricItem>
              <MetricLabel>Current Value</MetricLabel>
              <MetricValue>{currentValue}</MetricValue>
            </MetricItem>
          )}
          {changeValue && (
            <MetricItem>
              <MetricLabel>Change</MetricLabel>
              <ChangeIndicator positive={(changePercentage || 0) >= 0}>
                {changeValue}
                {changePercentage !== undefined && ` (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(2)}%)`}
              </ChangeIndicator>
            </MetricItem>
          )}
        </MetricDisplay>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { onExport?.(); handleMenuClose(); }}>
          <Download size={16} style={{ marginRight: 8 }} />
          Export Data
        </MenuItem>
        <MenuItem onClick={() => { onMaximize?.(); handleMenuClose(); }}>
          <Maximize2 size={16} style={{ marginRight: 8 }} />
          Fullscreen
        </MenuItem>
      </Menu>
    </ChartContainer>
  );
}; 
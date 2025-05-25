import React from 'react';
import { Box, Paper, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MoreVert, TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

const ChartContainer = styled(Paper)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
    borderRadius: '16px 16px 0 0',
  },
}));

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px',
});

const ChartTitleSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const ChartTitle = styled(Typography)({
  fontSize: '20px',
  fontWeight: 600,
  color: '#263238',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.3,
});

const ChartSubtitle = styled(Typography)({
  fontSize: '14px',
  color: '#607d8b',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.4,
});

const ChartMetrics = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginTop: '8px',
});

const MetricItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const MetricValue = styled(Typography)({
  fontSize: '16px',
  fontWeight: 700,
  color: '#1a237e',
  fontFamily: 'Inter, sans-serif',
});

const MetricLabel = styled(Typography)({
  fontSize: '12px',
  color: '#607d8b',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const ChartActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ActionButton = styled(IconButton)({
  color: '#607d8b',
  padding: '8px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    color: '#1a237e',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
  },
});

interface ProfessionalChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  type?: 'line' | 'area' | 'bar';
  showGrid?: boolean;
  showTooltip?: boolean;
  metrics?: {
    current?: string | number;
    change?: string | number;
    changeType?: 'positive' | 'negative' | 'neutral';
    period?: string;
  };
  onExport?: () => void;
  onFullscreen?: () => void;
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
  showGrid = true,
  showTooltip = true,
  metrics,
  onExport,
  onFullscreen,
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
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
            minWidth: '120px',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#263238', 
              fontWeight: 600,
              marginBottom: '4px',
              fontSize: '12px',
            }}
          >
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ 
                color: entry.color || color, 
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'negative':
        return <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />;
      default:
        return <Remove sx={{ fontSize: 16, color: '#607d8b' }} />;
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'positive':
        return '#4caf50';
      case 'negative':
        return '#f44336';
      default:
        return '#607d8b';
    }
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const axisProps = {
      axisLine: false,
      tickLine: false,
      tick: { fill: '#607d8b', fontSize: 12, fontFamily: 'Inter, sans-serif' },
    };

    const gridProps = showGrid ? {
      strokeDasharray: "3 3",
      stroke: "rgba(26, 35, 126, 0.1)",
      horizontal: true,
      vertical: false,
    } : {};

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={customTooltip} />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fill={`${color}20`}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color, strokeWidth: 2 }}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={customTooltip} />}
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            {showTooltip && <Tooltip content={customTooltip} />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color, strokeWidth: 2 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitleSection>
          <ChartTitle>{title}</ChartTitle>
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
          
          {metrics && (
            <ChartMetrics>
              {metrics.current && (
                <MetricItem>
                  <Box>
                    <MetricValue>{metrics.current}</MetricValue>
                    <MetricLabel>Current</MetricLabel>
                  </Box>
                </MetricItem>
              )}
              
              {metrics.change && (
                <MetricItem>
                  {getChangeIcon(metrics.changeType)}
                  <Box>
                    <MetricValue sx={{ color: getChangeColor(metrics.changeType) }}>
                      {metrics.change}
                    </MetricValue>
                    <MetricLabel>{metrics.period || 'Change'}</MetricLabel>
                  </Box>
                </MetricItem>
              )}
            </ChartMetrics>
          )}
        </ChartTitleSection>
        
        <ChartActions>
          <ActionButton onClick={handleMenuOpen}>
            <MoreVert />
          </ActionButton>
        </ChartActions>
      </ChartHeader>
      
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
      
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
            border: '1px solid rgba(26, 35, 126, 0.08)',
            minWidth: '160px',
          },
        }}
      >
        {onFullscreen && (
          <MenuItem onClick={() => { onFullscreen(); handleMenuClose(); }}>
            View Fullscreen
          </MenuItem>
        )}
        {onExport && (
          <MenuItem onClick={() => { onExport(); handleMenuClose(); }}>
            Export Data
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          Share Chart
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Download Image
        </MenuItem>
      </Menu>
    </ChartContainer>
  );
}; 
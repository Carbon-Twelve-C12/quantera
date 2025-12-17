import React from 'react';
import { Box, Paper, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { MoreVertical, Download, Maximize2 } from 'lucide-react';

// Swiss Precision Chart Styles
const ChartContainer = styled(Paper)({
  background: 'var(--surface-elevated)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  boxShadow: 'none',
  border: '1px solid var(--surface-subtle)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 150ms',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
  },
});

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
});

const ChartTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
});

const ChartSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--text-tertiary)',
  marginTop: '4px',
});

const MetricDisplay = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '32px',
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid var(--surface-subtle)',
});

const MetricItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const MetricLabel = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const MetricValue = styled(Typography)({
  fontFamily: 'var(--font-mono)',
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
});

const ChangeIndicator = styled(Typography)<{ positive: boolean }>(({ positive }) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '14px',
  fontWeight: 600,
  color: positive ? 'var(--status-success)' : 'var(--status-error)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

const ActionButton = styled(IconButton)({
  color: 'var(--text-tertiary)',
  padding: '8px',
  borderRadius: 'var(--radius-md)',
  transition: 'all 150ms',

  '&:hover': {
    backgroundColor: 'var(--surface-overlay)',
    color: 'var(--text-secondary)',
  },
});

const StyledMenu = styled(Menu)({
  '& .MuiPaper-root': {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--surface-subtle)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '160px',
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-primary)',
  padding: '10px 16px',
  gap: '10px',
  transition: 'background 150ms',

  '&:hover': {
    background: 'var(--surface-overlay)',
  },

  '& svg': {
    color: 'var(--text-tertiary)',
  },
});

// Custom Tooltip Component
const CustomTooltipContainer = styled(Box)({
  background: 'var(--surface-overlay)',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--surface-subtle)',
  boxShadow: 'var(--shadow-md)',
});

const TooltipLabel = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
});

const TooltipValue = styled(Typography)({
  fontFamily: 'var(--font-mono)',
  fontSize: '14px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
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
  color = '#10B981', // Swiss Precision emerald accent
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
        <CustomTooltipContainer>
          <TooltipLabel>{label}</TooltipLabel>
          {payload.map((entry: any, index: number) => (
            <TooltipValue key={index} sx={{ color: entry.color }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  background: entry.color,
                }}
              />
              {`${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </TooltipValue>
          ))}
        </CustomTooltipContainer>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 8, right: 8, left: 0, bottom: 0 },
    };

    const commonAxisProps = {
      axisLine: false,
      tickLine: false,
      tick: {
        fill: '#71717A', // --text-tertiary
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
      },
    };

    // Swiss Precision grid style - minimal, subtle
    const gridStyle = {
      strokeDasharray: '4 4',
      stroke: '#3F3F46', // --surface-subtle
      strokeOpacity: 0.5,
      horizontal: true,
      vertical: false,
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} width={60} />
            <Tooltip content={customTooltip} cursor={{ stroke: '#3F3F46', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: '#18181B',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} width={60} />
            <Tooltip content={customTooltip} cursor={{ fill: '#27272A', fillOpacity: 0.5 }} />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} width={60} />
            <Tooltip content={customTooltip} cursor={{ stroke: '#3F3F46', strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: '#18181B',
                strokeWidth: 2
              }}
            />
          </LineChart>
        );
    }
  };

  return (
    <ChartContainer elevation={0}>
      <ChartHeader>
        <Box>
          <ChartTitle>{title}</ChartTitle>
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </Box>

        {showActions && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onMaximize && (
              <ActionButton onClick={onMaximize} size="small">
                <Maximize2 size={16} />
              </ActionButton>
            )}
            <ActionButton onClick={handleMenuClick} size="small">
              <MoreVertical size={16} />
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

      <StyledMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <StyledMenuItem onClick={() => { onExport?.(); handleMenuClose(); }}>
          <Download size={16} />
          Export Data
        </StyledMenuItem>
        <StyledMenuItem onClick={() => { onMaximize?.(); handleMenuClose(); }}>
          <Maximize2 size={16} />
          Fullscreen
        </StyledMenuItem>
      </StyledMenu>
    </ChartContainer>
  );
};

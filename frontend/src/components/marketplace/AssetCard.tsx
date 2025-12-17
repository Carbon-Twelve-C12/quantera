import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Shield, Globe, Star, BarChart3, ArrowUpRight } from 'lucide-react';

// Swiss Precision Asset Card - Clean, minimal, data-focused
const StyledCard = styled(Card)({
  background: 'var(--surface-elevated)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--surface-subtle)',
  transition: 'border-color 250ms, box-shadow 250ms',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
    boxShadow: 'var(--shadow-glow)',
  },
});

const CardHeader = styled(Box)({
  padding: '20px 20px 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
});

const AssetTypeTag = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  background: 'var(--surface-overlay)',
  borderRadius: 'var(--radius-full)',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
});

const FavoriteButton = styled(Box)<{ active?: boolean }>(({ active }) => ({
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all 150ms',
  color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)',
  background: active ? 'var(--accent-muted)' : 'transparent',

  '&:hover': {
    background: active ? 'var(--accent-muted)' : 'var(--surface-overlay)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
  },
}));

const CardBody = styled(CardContent)({
  padding: '16px 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: '16px',
});

const AssetTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const AssetDescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const MetricsGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
});

const Metric = styled(Box)({
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

const MetricValue = styled(Box)<{ accent?: boolean; positive?: boolean; negative?: boolean }>(
  ({ accent, positive, negative }) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: 600,
    color: positive
      ? 'var(--status-success)'
      : negative
      ? 'var(--status-error)'
      : accent
      ? 'var(--accent-primary)'
      : 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  })
);

const Divider = styled(Box)({
  height: '1px',
  background: 'var(--surface-subtle)',
  margin: '4px 0',
});

const BadgeContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
});

const Badge = styled(Box)<{ variant?: 'success' | 'warning' | 'info' | 'default' }>(
  ({ variant = 'default' }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    letterSpacing: '0.02em',

    ...(variant === 'success' && {
      background: 'var(--status-success-muted)',
      color: 'var(--status-success)',
    }),
    ...(variant === 'warning' && {
      background: 'var(--status-warning-muted)',
      color: 'var(--status-warning)',
    }),
    ...(variant === 'info' && {
      background: 'var(--status-info-muted)',
      color: 'var(--status-info)',
    }),
    ...(variant === 'default' && {
      background: 'var(--surface-overlay)',
      color: 'var(--text-secondary)',
    }),
  })
);

const RiskBadge = styled(Badge)<{ level: 'low' | 'medium' | 'high' }>(({ level }) => ({
  ...(level === 'low' && {
    background: 'var(--status-success-muted)',
    color: 'var(--status-success)',
  }),
  ...(level === 'medium' && {
    background: 'var(--status-warning-muted)',
    color: 'var(--status-warning)',
  }),
  ...(level === 'high' && {
    background: 'var(--status-error-muted)',
    color: 'var(--status-error)',
  }),
}));

const ActionContainer = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: 'auto',
  paddingTop: '4px',
});

const PrimaryButton = styled(Button)({
  flex: 1,
  background: 'var(--accent-primary)',
  color: 'var(--text-inverse)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  transition: 'background 150ms',

  '&:hover': {
    background: 'var(--accent-hover)',
  },
});

const SecondaryButton = styled(Button)({
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 16px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  minWidth: 'auto',
  transition: 'all 150ms',

  '&:hover': {
    background: 'var(--surface-overlay)',
    borderColor: 'var(--surface-hover)',
  },
});

const JurisdictionInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-tertiary)',
});

interface AssetCardProps {
  asset: {
    id: string;
    name: string;
    description: string;
    type: string;
    yield: string;
    minInvestment: string;
    totalValue: string;
    imageUrl?: string;
    isCompliant: boolean;
    isVerified?: boolean;
    isInstitutional?: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    liquidityScore: number;
    jurisdiction?: string;
    maturity?: string;
    rating?: string;
  };
  onInvest: (assetId: string) => void;
  onViewDetails?: (assetId: string) => void;
  onToggleFavorite?: (assetId: string) => void;
  isFavorite?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onInvest,
  onViewDetails,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return value;
  };

  const getLiquidityColor = (score: number) => {
    if (score >= 80) return 'positive';
    if (score >= 50) return undefined;
    return 'negative';
  };

  return (
    <StyledCard elevation={0}>
      <CardHeader>
        <AssetTypeTag>{asset.type}</AssetTypeTag>
        <FavoriteButton
          active={isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(asset.id);
          }}
        >
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </FavoriteButton>
      </CardHeader>

      <CardBody>
        <Box>
          <AssetTitle>{asset.name}</AssetTitle>
          <AssetDescription sx={{ mt: 1 }}>{asset.description}</AssetDescription>
        </Box>

        <MetricsGrid>
          <Metric>
            <MetricLabel>APY</MetricLabel>
            <MetricValue positive>
              {asset.yield}
              <TrendingUp size={14} />
            </MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Min. Investment</MetricLabel>
            <MetricValue>{formatCurrency(asset.minInvestment)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Total Value</MetricLabel>
            <MetricValue>{formatCurrency(asset.totalValue)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Liquidity</MetricLabel>
            <MetricValue {...{ [getLiquidityColor(asset.liquidityScore) || '']: true }}>
              {asset.liquidityScore}%
            </MetricValue>
          </Metric>
        </MetricsGrid>

        {(asset.maturity || asset.rating) && (
          <MetricsGrid sx={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {asset.maturity && (
              <Metric>
                <MetricLabel>Maturity</MetricLabel>
                <MetricValue sx={{ fontSize: '13px' }}>{asset.maturity}</MetricValue>
              </Metric>
            )}
            {asset.rating && (
              <Metric>
                <MetricLabel>Rating</MetricLabel>
                <MetricValue accent sx={{ fontSize: '13px' }}>
                  {asset.rating}
                </MetricValue>
              </Metric>
            )}
          </MetricsGrid>
        )}

        <Divider />

        <BadgeContainer>
          {asset.isCompliant && (
            <Badge variant="success">
              <Shield size={11} />
              Compliant
            </Badge>
          )}
          {asset.isVerified && (
            <Badge variant="info">
              <Globe size={11} />
              Verified
            </Badge>
          )}
          {asset.isInstitutional && (
            <Badge variant="warning">
              <Star size={11} />
              Institutional
            </Badge>
          )}
          <RiskBadge level={asset.riskLevel}>
            <BarChart3 size={11} />
            {asset.riskLevel.charAt(0).toUpperCase() + asset.riskLevel.slice(1)}
          </RiskBadge>
        </BadgeContainer>

        {asset.jurisdiction && (
          <JurisdictionInfo>
            <Globe size={12} />
            {asset.jurisdiction}
          </JurisdictionInfo>
        )}

        <ActionContainer>
          <PrimaryButton onClick={() => onInvest(asset.id)} disableRipple>
            Invest
          </PrimaryButton>
          {onViewDetails && (
            <SecondaryButton onClick={() => onViewDetails(asset.id)} disableRipple>
              <ArrowUpRight size={16} />
            </SecondaryButton>
          )}
        </ActionContainer>
      </CardBody>
    </StyledCard>
  );
};

export default AssetCard;

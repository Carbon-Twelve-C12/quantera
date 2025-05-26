import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Shield, Globe, Star, BarChart3 } from 'lucide-react';

const StyledCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  
  '&:hover': {
    boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-4px)',
  },
  
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

const AssetImage = styled(CardMedia)({
  height: 200,
  position: 'relative',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(63, 81, 181, 0.03) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const AssetType = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  color: '#1a237e',
  fontWeight: 600,
  fontSize: '12px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(26, 35, 126, 0.1)',
}));

const FavoriteButton = styled(Box)({
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '50%',
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(26, 35, 126, 0.1)',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    background: '#1a237e',
    color: '#ffffff',
  },
});

const AssetTitle = styled(Typography)({
  fontSize: '18px',
  fontWeight: 700,
  color: '#263238',
  marginBottom: '8px',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const AssetDescription = styled(Typography)({
  fontSize: '14px',
  color: '#607d8b',
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const MetricContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  marginBottom: '16px',
});

const Metric = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
});

const MetricLabel = styled(Typography)({
  fontSize: '12px',
  color: '#607d8b',
  fontWeight: 500,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const MetricValue = styled(Typography)({
  fontSize: '16px',
  fontWeight: 700,
  color: '#1a237e',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const ComplianceContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  flexWrap: 'wrap',
});

const ComplianceBadge = styled(Box)<{ type: 'compliant' | 'verified' | 'institutional' }>(({ type }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  ...(type === 'compliant' && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  }),
  ...(type === 'verified' && {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  }),
  ...(type === 'institutional' && {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  }),
}));

const RiskIndicator = styled(Box)<{ level: 'low' | 'medium' | 'high' }>(({ level }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  ...(level === 'low' && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  }),
  ...(level === 'medium' && {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  }),
  ...(level === 'high' && {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  }),
}));

const ActionContainer = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: 'auto',
});

const InvestButton = styled(Button)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  flex: 1,
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
    transform: 'translateY(-1px)',
  },
});

const SecondaryButton = styled(Button)({
  background: 'transparent',
  color: '#1a237e',
  border: '2px solid #1a237e',
  borderRadius: '8px',
  padding: '10px 20px',
  fontWeight: 600,
  textTransform: 'none',
  
  '&:hover': {
    backgroundColor: 'rgba(26, 35, 126, 0.04)',
  },
});

const LiquidityScore = styled(Box)<{ score: number }>(({ score }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '14px',
  fontWeight: 600,
  color: score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336',
}));

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
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return value;
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <Shield size={14} />;
      case 'medium': return <BarChart3 size={14} />;
      case 'high': return <TrendingUp size={14} />;
      default: return <Shield size={14} />;
    }
  };

  return (
    <StyledCard>
      <AssetImage image={asset.imageUrl} title={asset.name}>
        <FavoriteButton onClick={() => onToggleFavorite?.(asset.id)}>
          <Star size={18} fill={isFavorite ? '#1a237e' : 'none'} />
        </FavoriteButton>
        <AssetType label={asset.type} />
        {!asset.imageUrl && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#607d8b',
          }}>
            <BarChart3 size={48} />
          </Box>
        )}
      </AssetImage>
      
      <CardContent sx={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <AssetTitle>{asset.name}</AssetTitle>
        <AssetDescription>{asset.description}</AssetDescription>
        
        <MetricContainer>
          <Metric>
            <MetricLabel>APY</MetricLabel>
            <MetricValue>
              {asset.yield}
              <TrendingUp size={16} color="#4caf50" />
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
            <LiquidityScore score={asset.liquidityScore}>
              {asset.liquidityScore}%
              <BarChart3 size={14} />
            </LiquidityScore>
          </Metric>
        </MetricContainer>

        {(asset.maturity || asset.rating) && (
          <MetricContainer sx={{ gridTemplateColumns: 'repeat(2, 1fr)', mb: 2 }}>
            {asset.maturity && (
              <Metric>
                <MetricLabel>Maturity</MetricLabel>
                <MetricValue sx={{ fontSize: '14px' }}>{asset.maturity}</MetricValue>
              </Metric>
            )}
            {asset.rating && (
              <Metric>
                <MetricLabel>Rating</MetricLabel>
                <MetricValue sx={{ fontSize: '14px' }}>{asset.rating}</MetricValue>
              </Metric>
            )}
          </MetricContainer>
        )}
        
        <ComplianceContainer>
          {asset.isCompliant && (
            <ComplianceBadge type="compliant">
              <Shield size={12} />
              Compliant
            </ComplianceBadge>
          )}
          {asset.isVerified && (
            <ComplianceBadge type="verified">
              <Globe size={12} />
              Verified
            </ComplianceBadge>
          )}
          {asset.isInstitutional && (
            <ComplianceBadge type="institutional">
              <Star size={12} />
              Institutional
            </ComplianceBadge>
          )}
          <RiskIndicator level={asset.riskLevel}>
            {getRiskIcon(asset.riskLevel)}
            {asset.riskLevel.charAt(0).toUpperCase() + asset.riskLevel.slice(1)} Risk
          </RiskIndicator>
        </ComplianceContainer>

        {asset.jurisdiction && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#607d8b', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Globe size={12} />
              Jurisdiction: {asset.jurisdiction}
            </Typography>
          </Box>
        )}
        
        <ActionContainer>
          <InvestButton onClick={() => onInvest(asset.id)}>
            Invest Now
          </InvestButton>
          {onViewDetails && (
            <SecondaryButton onClick={() => onViewDetails(asset.id)}>
              Details
            </SecondaryButton>
          )}
        </ActionContainer>
      </CardContent>
    </StyledCard>
  );
}; 
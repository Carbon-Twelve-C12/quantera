import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Shield, Favorite, FavoriteBorder, Share, Info } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  
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
    zIndex: 1,
  },
}));

const AssetImage = styled(CardMedia)({
  height: 200,
  position: 'relative',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(63, 81, 181, 0.03) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%)',
  },
});

const AssetImageOverlay = styled(Box)({
  position: 'absolute',
  top: 16,
  left: 16,
  right: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  zIndex: 2,
});

const AssetType = styled(Chip)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  color: '#1a237e',
  fontWeight: 600,
  fontSize: '12px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const ActionButtons = styled(Box)({
  display: 'flex',
  gap: '8px',
});

const OverlayButton = styled(IconButton)({
  background: 'rgba(255, 255, 255, 0.9)',
  color: '#1a237e',
  width: '36px',
  height: '36px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.1)',
  },
});

const CardContentStyled = styled(CardContent)({
  padding: '24px',
  paddingBottom: '24px !important',
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
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
  marginBottom: '16px',
  padding: '16px',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)',
  borderRadius: '12px',
  border: '1px solid rgba(26, 35, 126, 0.05)',
});

const Metric = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

const MetricLabel = styled(Typography)({
  fontSize: '12px',
  color: '#607d8b',
  fontWeight: 500,
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const MetricValue = styled(Typography)({
  fontSize: '16px',
  fontWeight: 700,
  color: '#1a237e',
  fontFamily: 'Inter, sans-serif',
});

const ComplianceSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  padding: '12px',
  background: 'rgba(76, 175, 80, 0.05)',
  borderRadius: '8px',
  border: '1px solid rgba(76, 175, 80, 0.1)',
});

const ComplianceInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ComplianceText = styled(Typography)({
  fontSize: '14px',
  color: '#4caf50',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
});

const InvestButton = styled(Button)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '14px 24px',
  fontWeight: 600,
  fontSize: '16px',
  textTransform: 'none',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 2px 8px rgba(26, 35, 126, 0.2)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 16px rgba(26, 35, 126, 0.3)',
  },
  
  '&:disabled': {
    background: '#eceff1',
    color: '#607d8b',
    transform: 'none',
    boxShadow: 'none',
  },
});

const RiskIndicator = styled(Box)<{ risk: 'low' | 'medium' | 'high' }>(({ risk }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  ...(risk === 'low' && {
    background: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
  }),
  ...(risk === 'medium' && {
    background: 'rgba(255, 152, 0, 0.1)',
    color: '#ff9800',
  }),
  ...(risk === 'high' && {
    background: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
  }),
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
    riskLevel: 'low' | 'medium' | 'high';
    jurisdiction: string;
    liquidity: string;
    maturity?: string;
    isAvailable: boolean;
  };
  onInvest: (assetId: string) => void;
  onFavorite?: (assetId: string) => void;
  onShare?: (assetId: string) => void;
  onViewDetails?: (assetId: string) => void;
  isFavorited?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  onInvest, 
  onFavorite, 
  onShare, 
  onViewDetails,
  isFavorited = false 
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onViewDetails) {
      onViewDetails(asset.id);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(asset.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(asset.id);
    }
  };

  const handleInvestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInvest(asset.id);
  };

  return (
    <StyledCard onClick={handleCardClick}>
      <AssetImage 
        image={asset.imageUrl} 
        title={asset.name}
        sx={{
          backgroundImage: asset.imageUrl ? `url(${asset.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <AssetImageOverlay>
          <AssetType label={asset.type} />
          <ActionButtons>
            <Tooltip title="Add to favorites">
              <OverlayButton onClick={handleFavoriteClick}>
                {isFavorited ? <Favorite /> : <FavoriteBorder />}
              </OverlayButton>
            </Tooltip>
            <Tooltip title="Share asset">
              <OverlayButton onClick={handleShareClick}>
                <Share />
              </OverlayButton>
            </Tooltip>
          </ActionButtons>
        </AssetImageOverlay>
        
        {!asset.imageUrl && (
          <Box sx={{ 
            fontSize: '48px', 
            color: 'rgba(26, 35, 126, 0.3)',
            fontWeight: 700,
            zIndex: 1,
          }}>
            {asset.name.charAt(0)}
          </Box>
        )}
      </AssetImage>
      
      <CardContentStyled>
        <AssetTitle>{asset.name}</AssetTitle>
        <AssetDescription>{asset.description}</AssetDescription>
        
        <MetricContainer>
          <Metric>
            <MetricLabel>APY</MetricLabel>
            <MetricValue>{asset.yield}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Min. Investment</MetricLabel>
            <MetricValue>{asset.minInvestment}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Total Value</MetricLabel>
            <MetricValue>{asset.totalValue}</MetricValue>
          </Metric>
        </MetricContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <RiskIndicator risk={asset.riskLevel}>
            {asset.riskLevel} Risk
          </RiskIndicator>
          <Typography variant="caption" sx={{ color: '#607d8b', fontWeight: 500 }}>
            Liquidity: {asset.liquidity}
          </Typography>
        </Box>
        
        {asset.isCompliant && (
          <ComplianceSection>
            <ComplianceInfo>
              <Shield sx={{ fontSize: 16, color: '#4caf50' }} />
              <ComplianceText>Regulatory Compliant</ComplianceText>
            </ComplianceInfo>
            <Tooltip title={`Compliant in ${asset.jurisdiction}`}>
              <IconButton size="small" sx={{ color: '#4caf50' }}>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </ComplianceSection>
        )}
        
        <InvestButton 
          onClick={handleInvestClick}
          disabled={!asset.isAvailable}
        >
          {asset.isAvailable ? 'Invest Now' : 'Currently Unavailable'}
        </InvestButton>
        
        {asset.maturity && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              color: '#607d8b', 
              mt: 1,
              fontWeight: 500,
            }}
          >
            Maturity: {asset.maturity}
          </Typography>
        )}
      </CardContentStyled>
    </StyledCard>
  );
}; 
import React, { useState } from 'react';
import { Box, Container, Typography, TextField, MenuItem, Grid, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, TrendingUp, Users, Coins, Clock } from 'lucide-react';
import { Header } from '../components/common/Header';
import { AssetCard } from '../components/marketplace/AssetCard';
import '../styles/quantera-design-system.css';

// Swiss Precision Page Layout
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'var(--surface-base)',
});

const HeroSection = styled(Box)({
  background: 'var(--surface-base)',
  borderBottom: '1px solid var(--surface-subtle)',
  padding: '48px 0',

  '@media (max-width: 768px)': {
    padding: '32px 0',
  },
});

const HeroContent = styled(Container)({
  maxWidth: '1280px',
});

const HeroTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--type-display-size)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  marginBottom: '16px',

  '@media (max-width: 768px)': {
    fontSize: '2rem',
  },
});

const HeroSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--text-secondary)',
  maxWidth: '560px',
  lineHeight: 1.6,
});

const StatsGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '24px',
  marginTop: '48px',

  '@media (max-width: 1024px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },

  '@media (max-width: 480px)': {
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
});

const StatCard = styled(Box)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  transition: 'border-color 250ms, box-shadow 250ms',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
    boxShadow: 'var(--shadow-glow)',
  },
});

const StatIcon = styled(Box)({
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--accent-muted)',
  color: 'var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const StatContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const StatValue = styled(Typography)({
  fontFamily: 'var(--font-mono)',
  fontSize: '24px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.2,
});

const StatLabel = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--text-tertiary)',
});

const ContentSection = styled(Container)({
  maxWidth: '1280px',
  padding: '48px 24px',

  '@media (max-width: 768px)': {
    padding: '32px 16px',
  },
});

const SectionHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: '32px',
  gap: '24px',

  '@media (max-width: 768px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '16px',
  },
});

const SectionTitleGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const SectionTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--type-h2-size)',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
});

const SectionSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-tertiary)',
});

const FiltersContainer = styled(Box)({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',

  '@media (max-width: 768px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});

const SearchInput = styled(TextField)({
  minWidth: '280px',

  '& .MuiOutlinedInput-root': {
    background: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--text-primary)',

    '& fieldset': {
      borderColor: 'var(--surface-subtle)',
      transition: 'border-color 150ms',
    },

    '&:hover fieldset': {
      borderColor: 'var(--surface-hover)',
    },

    '&.Mui-focused fieldset': {
      borderColor: 'var(--accent-primary)',
      borderWidth: '1px',
    },

    '& input': {
      padding: '10px 14px',
      color: 'var(--text-primary)',

      '&::placeholder': {
        color: 'var(--text-tertiary)',
        opacity: 1,
      },
    },
  },

  '@media (max-width: 768px)': {
    minWidth: 'auto',
  },
});

const FilterSelect = styled(TextField)({
  minWidth: '160px',

  '& .MuiOutlinedInput-root': {
    background: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--text-primary)',

    '& fieldset': {
      borderColor: 'var(--surface-subtle)',
      transition: 'border-color 150ms',
    },

    '&:hover fieldset': {
      borderColor: 'var(--surface-hover)',
    },

    '&.Mui-focused fieldset': {
      borderColor: 'var(--accent-primary)',
      borderWidth: '1px',
    },
  },

  '& .MuiSelect-select': {
    padding: '10px 14px',
    color: 'var(--text-primary)',
  },

  '& .MuiSelect-icon': {
    color: 'var(--text-tertiary)',
  },

  '@media (max-width: 768px)': {
    minWidth: 'auto',
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-primary)',
  padding: '10px 16px',

  '&:hover': {
    background: 'var(--surface-overlay)',
  },

  '&.Mui-selected': {
    background: 'var(--accent-muted)',
    color: 'var(--accent-primary)',

    '&:hover': {
      background: 'var(--accent-muted)',
    },
  },
});

const AssetGrid = styled(Grid)({
  marginTop: '8px',
});

const EmptyState = styled(Box)({
  textAlign: 'center',
  padding: '64px 24px',
  background: 'var(--surface-elevated)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--surface-subtle)',
});

const EmptyTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '8px',
});

const EmptyDescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-tertiary)',
});

// Sample data
const marketStats = [
  { value: '$2.4B', label: 'Total Value Locked', icon: Coins },
  { value: '1,247', label: 'Active Assets', icon: TrendingUp },
  { value: '89,432', label: 'Verified Investors', icon: Users },
  { value: '24/7', label: 'Global Trading', icon: Clock },
];

const sampleAssets = [
  {
    id: '1',
    name: 'Manhattan Commercial Real Estate Portfolio',
    description: 'Premium commercial properties in Manhattan financial district with long-term institutional tenants.',
    type: 'Real Estate',
    yield: '8.5%',
    minInvestment: '$10,000',
    totalValue: '$45.2M',
    isCompliant: true,
    isVerified: true,
    isInstitutional: true,
    riskLevel: 'medium' as const,
    liquidityScore: 85,
    jurisdiction: 'US',
    maturity: '5 years',
    rating: 'A+',
  },
  {
    id: '2',
    name: 'Gold Mining Operations Token',
    description: 'Tokenized ownership in sustainable gold mining operations across three continents.',
    type: 'Commodities',
    yield: '12.3%',
    minInvestment: '$5,000',
    totalValue: '$28.7M',
    isCompliant: true,
    isVerified: true,
    riskLevel: 'high' as const,
    liquidityScore: 65,
    jurisdiction: 'AU',
    maturity: '3 years',
    rating: 'B+',
  },
  {
    id: '3',
    name: 'US Treasury Notes 2024',
    description: 'Government-backed treasury notes offering stable returns with full regulatory compliance.',
    type: 'Treasury Notes',
    yield: '4.2%',
    minInvestment: '$1,000',
    totalValue: '$125.8M',
    isCompliant: true,
    isVerified: true,
    isInstitutional: true,
    riskLevel: 'low' as const,
    liquidityScore: 95,
    jurisdiction: 'US',
    maturity: '2 years',
    rating: 'AAA',
  },
  {
    id: '4',
    name: 'European Infrastructure Fund',
    description: 'Diversified infrastructure investments across renewable energy and transportation projects.',
    type: 'Infrastructure',
    yield: '9.1%',
    minInvestment: '$25,000',
    totalValue: '$67.3M',
    isCompliant: true,
    isVerified: true,
    isInstitutional: true,
    riskLevel: 'medium' as const,
    liquidityScore: 70,
    jurisdiction: 'EU',
    maturity: '7 years',
    rating: 'A',
  },
  {
    id: '5',
    name: 'Tech Startup Equity Pool',
    description: 'Curated portfolio of early-stage technology companies with high growth potential.',
    type: 'Private Equity',
    yield: '18.7%',
    minInvestment: '$50,000',
    totalValue: '$34.1M',
    isCompliant: true,
    isVerified: false,
    riskLevel: 'high' as const,
    liquidityScore: 35,
    jurisdiction: 'US',
    maturity: '5-10 years',
    rating: 'B',
  },
  {
    id: '6',
    name: 'Rare Art Collection',
    description: 'Fractionalized ownership of museum-quality contemporary art pieces from renowned artists.',
    type: 'Art & Collectibles',
    yield: '15.2%',
    minInvestment: '$15,000',
    totalValue: '$19.8M',
    isCompliant: true,
    isVerified: true,
    riskLevel: 'high' as const,
    liquidityScore: 45,
    jurisdiction: 'UK',
    maturity: 'Open-ended',
    rating: 'B+',
  },
];

const assetTypes = [
  'All Types',
  'Real Estate',
  'Commodities',
  'Treasury Notes',
  'Infrastructure',
  'Private Equity',
  'Art & Collectibles',
];

const sortOptions = [
  'Newest',
  'Highest Yield',
  'Lowest Risk',
  'Highest Liquidity',
  'Lowest Min. Investment',
];

export const MarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Newest');
  const [favoriteAssets, setFavoriteAssets] = useState<Set<string>>(new Set());

  const handleAssetInvest = (assetId: string) => {
    console.log('Investing in asset:', assetId);
  };

  const handleAssetFavorite = (assetId: string) => {
    setFavoriteAssets((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(assetId)) {
        newFavorites.delete(assetId);
      } else {
        newFavorites.add(assetId);
      }
      return newFavorites;
    });
  };

  const handleAssetDetails = (assetId: string) => {
    console.log('Viewing asset details:', assetId);
  };

  const filteredAssets = sampleAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All Types' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <PageContainer>
      <Header activeRoute="marketplace" />

      <HeroSection>
        <HeroContent>
          <HeroTitle>Tokenization Marketplace</HeroTitle>
          <HeroSubtitle>
            Access institutional-grade tokenized assets with full regulatory compliance.
            Invest in real estate, commodities, and alternative assets.
          </HeroSubtitle>

          <StatsGrid>
            {marketStats.map((stat, index) => (
              <StatCard key={index}>
                <StatIcon>
                  <stat.icon size={20} />
                </StatIcon>
                <StatContent>
                  <StatValue>{stat.value}</StatValue>
                  <StatLabel>{stat.label}</StatLabel>
                </StatContent>
              </StatCard>
            ))}
          </StatsGrid>
        </HeroContent>
      </HeroSection>

      <ContentSection>
        <SectionHeader>
          <SectionTitleGroup>
            <SectionTitle>Featured Assets</SectionTitle>
            <SectionSubtitle>{filteredAssets.length} assets available</SectionSubtitle>
          </SectionTitleGroup>

          <FiltersContainer>
            <SearchInput
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="var(--text-tertiary)" />
                  </InputAdornment>
                ),
              }}
            />

            <FilterSelect
              select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--surface-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    },
                  },
                },
              }}
            >
              {assetTypes.map((type) => (
                <StyledMenuItem key={type} value={type}>
                  {type}
                </StyledMenuItem>
              ))}
            </FilterSelect>

            <FilterSelect
              select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--surface-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    },
                  },
                },
              }}
            >
              {sortOptions.map((option) => (
                <StyledMenuItem key={option} value={option}>
                  {option}
                </StyledMenuItem>
              ))}
            </FilterSelect>
          </FiltersContainer>
        </SectionHeader>

        {filteredAssets.length > 0 ? (
          <AssetGrid container spacing={3}>
            {filteredAssets.map((asset) => (
              <Grid item xs={12} sm={6} lg={4} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onInvest={handleAssetInvest}
                  onToggleFavorite={handleAssetFavorite}
                  onViewDetails={handleAssetDetails}
                  isFavorite={favoriteAssets.has(asset.id)}
                />
              </Grid>
            ))}
          </AssetGrid>
        ) : (
          <EmptyState>
            <EmptyTitle>No assets found</EmptyTitle>
            <EmptyDescription>Try adjusting your search terms or filters</EmptyDescription>
          </EmptyState>
        )}
      </ContentSection>
    </PageContainer>
  );
};

export default MarketplacePage;

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, TextField, MenuItem, Chip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, FilterList, TrendingUp } from '@mui/icons-material';
import { Header } from '../components/common/Header';
import { AssetCard } from '../components/marketplace/AssetCard';
import { ProfessionalChart } from '../components/charts/ProfessionalChart';
import '../styles/quantera-design-system.css';

const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)',
});

const HeroSection = styled(Box)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  padding: '80px 0 60px',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
});

const HeroContent = styled(Container)({
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
});

const HeroTitle = styled(Typography)({
  fontSize: '3.5rem',
  fontWeight: 800,
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '-0.02em',
  
  '@media (max-width: 768px)': {
    fontSize: '2.5rem',
  },
});

const HeroSubtitle = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: 400,
  marginBottom: '32px',
  opacity: 0.9,
  maxWidth: '600px',
  margin: '0 auto 32px',
  lineHeight: 1.6,
});

const StatsContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '32px',
  marginTop: '48px',
});

const StatCard = styled(Box)({
  textAlign: 'center',
  padding: '24px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
});

const StatValue = styled(Typography)({
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: '8px',
  fontFamily: 'Inter, sans-serif',
});

const StatLabel = styled(Typography)({
  fontSize: '14px',
  opacity: 0.8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 500,
});

const ContentSection = styled(Container)({
  padding: '60px 24px',
});

const SectionHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'stretch',
  },
});

const SectionTitle = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 600,
  color: '#263238',
  fontFamily: 'Inter, sans-serif',
});

const FilterContainer = styled(Box)({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});

const SearchField = styled(TextField)({
  minWidth: '300px',
  
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#ffffff',
    
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3f51b5',
    },
    
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1a237e',
    },
  },
  
  '@media (max-width: 768px)': {
    minWidth: 'auto',
  },
});

const FilterSelect = styled(TextField)({
  minWidth: '150px',
  
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#ffffff',
  },
  
  '@media (max-width: 768px)': {
    minWidth: 'auto',
  },
});

const ChartSection = styled(Box)({
  marginBottom: '60px',
});

const AssetGrid = styled(Grid)({
  marginTop: '32px',
});

// Sample data
const marketStats = [
  { value: '$2.4B', label: 'Total Value Locked' },
  { value: '1,247', label: 'Active Assets' },
  { value: '89,432', label: 'Verified Investors' },
  { value: '24/7', label: 'Global Trading' },
];

const chartData = [
  { name: 'Jan', value: 1200 },
  { name: 'Feb', value: 1900 },
  { name: 'Mar', value: 1600 },
  { name: 'Apr', value: 2400 },
  { name: 'May', value: 2100 },
  { name: 'Jun', value: 2800 },
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
    imageUrl: '/images/assets/real-estate/manhattan-commercial.jpg',
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
    imageUrl: '/images/assets/commodities/gold-mining.jpg',
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
    imageUrl: '/images/assets/treasury-notes/us-treasury.jpg',
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
    imageUrl: '/images/assets/infrastructure/european-infrastructure.jpg',
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
    imageUrl: '/images/assets/private-equity/tech-startups.jpg',
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
    imageUrl: '/images/assets/art/contemporary-collection.jpg',
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
    // Implementation for investment flow
  };

  const handleAssetFavorite = (assetId: string) => {
    setFavoriteAssets(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(assetId)) {
        newFavorites.delete(assetId);
      } else {
        newFavorites.add(assetId);
      }
      return newFavorites;
    });
  };

  const handleAssetShare = (assetId: string) => {
    console.log('Sharing asset:', assetId);
    // Implementation for sharing functionality
  };

  const handleAssetDetails = (assetId: string) => {
    console.log('Viewing asset details:', assetId);
    // Implementation for navigation to asset details
  };

  const filteredAssets = sampleAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All Types' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <PageContainer>
      <Header activeRoute="marketplace" />
      
      <HeroSection>
        <HeroContent maxWidth="lg">
          <HeroTitle>
            Global Tokenization Marketplace
          </HeroTitle>
          <HeroSubtitle>
            Access institutional-grade tokenized assets with full regulatory compliance. 
            Invest in real estate, commodities, and alternative assets with unprecedented transparency.
          </HeroSubtitle>
          
          <StatsContainer>
            {marketStats.map((stat, index) => (
              <StatCard key={index}>
                <StatValue>{stat.value}</StatValue>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </StatsContainer>
        </HeroContent>
      </HeroSection>
      
      <ContentSection maxWidth="xl">
        <ChartSection>
          <ProfessionalChart
            title="Market Performance"
            subtitle="Total value locked across all tokenized assets"
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            height={300}
            type="area"
            color="#1a237e"
            currentValue="$2.4B"
            changeValue="+$300M"
            changePercentage={12.5}
            showMetrics={true}
            showActions={true}
          />
        </ChartSection>
        
        <SectionHeader>
          <SectionTitle>Featured Assets</SectionTitle>
          
          <FilterContainer>
            <SearchField
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: '#607d8b', mr: 1 }} />,
              }}
            />
            
            <FilterSelect
              select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Asset Type"
            >
              {assetTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </FilterSelect>
            
            <FilterSelect
              select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              {sortOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </FilterSelect>
          </FilterContainer>
        </SectionHeader>
        
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
        
        {filteredAssets.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#607d8b', mb: 2 }}>
              No assets found matching your criteria
            </Typography>
            <Typography variant="body2" sx={{ color: '#607d8b' }}>
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}
      </ContentSection>
    </PageContainer>
  );
}; 
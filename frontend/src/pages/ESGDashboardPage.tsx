import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import { 
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ESGScoreCard, { ESGScoreData } from '../components/common/ESGScoreCard';
import EnhancedImpactDashboard, {
  ImpactMetric,
  SDGContribution,
  TimeSeriesData,
  GeographyData
} from '../components/common/EnhancedImpactDashboard';
import { SDG_COLORS, SDG_NAMES } from '../components/analytics/EnhancedImpactDashboard';
import {
  EmojiNature as EnvironmentalIcon,
  People as SocialIcon,
  AccountBalance as GovernanceIcon,
  ForestOutlined as ForestIcon,
  WaterOutlined as WaterIcon,
  CloudOutlined as CloudIcon,
  Spa as BiodiversityIcon
} from '@mui/icons-material';

// Mock data for ESG Scores
const mockESGData: ESGScoreData = {
  totalScore: 75,
  environmentalScore: {
    name: 'Environmental',
    score: 82,
    metrics: [
      { name: 'Carbon Footprint', score: 88, description: 'Measures carbon emissions reduction.' },
      { name: 'Renewable Energy', score: 76, description: 'Evaluates use of renewable energy.' },
      { name: 'Resource Efficiency', score: 84, description: 'Evaluates efficient use of resources.' },
      { name: 'Biodiversity', score: 81, description: 'Measures impact on biodiversity.' }
    ]
  },
  socialScore: {
    name: 'Social',
    score: 71,
    metrics: [
      { name: 'Labor Practices', score: 75, description: 'Evaluates fair labor conditions.' },
      { name: 'Human Rights', score: 78, description: 'Measures respect for human rights.' },
      { name: 'Community Impact', score: 67, description: 'Evaluates positive community contributions.' },
      { name: 'Health & Safety', score: 65, description: 'Measures health and safety standards.' }
    ]
  },
  governanceScore: {
    name: 'Governance',
    score: 73,
    metrics: [
      { name: 'Board Structure', score: 70, description: 'Evaluates the board diversity and independence.' },
      { name: 'Ethics & Compliance', score: 77, description: 'Measures ethical business practices.' },
      { name: 'Transparency', score: 75, description: 'Evaluates disclosure and reporting quality.' },
      { name: 'Risk Management', score: 69, description: 'Measures risk management systems.' }
    ]
  },
  lastUpdated: '2023-07-15'
};

// Mock impact metrics data
const mockImpactMetrics: ImpactMetric[] = [
  {
    name: 'Carbon Offset',
    value: 3750,
    unit: 'tons',
    icon: <CloudIcon />,
    color: '#3f7e44',
    description: 'Total carbon dioxide emissions offset by your investments.',
    equivalentValue: 'Equivalent to taking 810 cars off the road for a year',
    change: 15
  },
  {
    name: 'Land Protected',
    value: 420,
    unit: 'hectares',
    icon: <ForestIcon />,
    color: '#56c02b',
    description: 'Total land area protected or restored through your investments.',
    equivalentValue: '588 football fields of habitat preserved',
    change: 8
  },
  {
    name: 'Water Saved',
    value: 2450000,
    unit: 'liters',
    icon: <WaterIcon />,
    color: '#26bde2',
    description: 'Total water resources protected or conserved.',
    equivalentValue: 'Annual water usage for 980 households',
    change: 12
  },
  {
    name: 'Biodiversity Impact',
    value: 78,
    unit: 'score',
    icon: <BiodiversityIcon />,
    color: '#fcc30b',
    description: 'Quantified positive impact on biodiversity preservation.',
    equivalentValue: 'Protection of 45 endangered species habitats',
    change: 5
  }
];

// Mock SDG contribution data
const mockSDGContributions: SDGContribution[] = [
  {
    sdgNumber: 6,
    score: 85,
    contributions: [
      { name: 'Clean Water Access', value: 90 },
      { name: 'Sanitation Improvement', value: 75 },
      { name: 'Water Resource Management', value: 88 },
      { name: 'Water Ecosystem Protection', value: 85 }
    ]
  },
  {
    sdgNumber: 7,
    score: 72,
    contributions: [
      { name: 'Renewable Energy Production', value: 80 },
      { name: 'Energy Efficiency', value: 65 },
      { name: 'Clean Technology', value: 70 },
      { name: 'Energy Infrastructure', value: 73 }
    ]
  },
  {
    sdgNumber: 13,
    score: 92,
    contributions: [
      { name: 'Emissions Reduction', value: 95 },
      { name: 'Climate Resilience', value: 85 },
      { name: 'Climate Education', value: 90 },
      { name: 'Climate Policy Support', value: 95 }
    ]
  },
  {
    sdgNumber: 14,
    score: 65,
    contributions: [
      { name: 'Marine Conservation', value: 70 },
      { name: 'Sustainable Fishing', value: 60 },
      { name: 'Ocean Pollution Prevention', value: 75 },
      { name: 'Coastal Ecosystem Protection', value: 55 }
    ]
  },
  {
    sdgNumber: 15,
    score: 80,
    contributions: [
      { name: 'Deforestation Prevention', value: 85 },
      { name: 'Biodiversity Conservation', value: 75 },
      { name: 'Land Degradation Reversal', value: 80 },
      { name: 'Forest Management', value: 80 }
    ]
  }
];

// Mock time series data
const generateTimeSeriesData = (
  months: number, 
  startValue: number, 
  growth: number, 
  volatility: number
): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  let currentValue = startValue;
  
  const currentDate = new Date();
  currentDate.setDate(1); // Start from the 1st of the current month
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    
    // Add some randomness but with overall growth trend
    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
    const growthFactor = 1 + (growth * (months - i) / months);
    
    currentValue = currentValue * randomFactor * growthFactor;
    
    data.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: Math.round(currentValue)
    });
  }
  
  return data;
};

const mockTimeSeriesData = {
  carbonOffset: generateTimeSeriesData(12, 1200, 0.3, 0.1),
  landProtected: generateTimeSeriesData(12, 150, 0.2, 0.05),
  waterSaved: generateTimeSeriesData(12, 800000, 0.25, 0.08),
  biodiversityScore: generateTimeSeriesData(12, 60, 0.15, 0.03)
};

// Mock geography data
const mockGeographyData: GeographyData[] = [
  {
    region: 'North America',
    carbonOffset: 1250,
    landProtected: 180,
    waterSaved: 750000,
    biodiversityScore: 75
  },
  {
    region: 'South America',
    carbonOffset: 950,
    landProtected: 120,
    waterSaved: 650000,
    biodiversityScore: 82
  },
  {
    region: 'Europe',
    carbonOffset: 850,
    landProtected: 40,
    waterSaved: 450000,
    biodiversityScore: 70
  },
  {
    region: 'Africa',
    carbonOffset: 450,
    landProtected: 60,
    waterSaved: 350000,
    biodiversityScore: 80
  },
  {
    region: 'Asia',
    carbonOffset: 250,
    landProtected: 20,
    waterSaved: 250000,
    biodiversityScore: 65
  }
];

const ESGDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Simulated data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real application, we would fetch data from an API here
        // const response = await api.get('/esg/dashboard', { params: { timeframe } });
        // setDashboardData(response.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading ESG data:', err);
        setError('Failed to load ESG dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [timeframe]);
  
  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeframe(event.target.value as string);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  const handleExportReport = () => {
    // In a real implementation, this would generate and download a PDF report
    alert('Generating ESG report PDF...');
  };
  
  const handleShareReport = () => {
    // In a real implementation, this would open a share dialog
    alert('Opening share dialog...');
  };
  
  const handleRefresh = () => {
    // Reload the dashboard data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading ESG Dashboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ESG & Impact Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              size="small"
            >
              Export Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShareReport}
              size="small"
            >
              Share
            </Button>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track and analyze the Environmental, Social, and Governance (ESG) performance and impact of your investment portfolio.
        </Typography>
      </Box>
      
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="ESG Dashboard Tabs"
        >
          <Tab 
            label="Overview" 
            value="overview" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="ESG Scoring" 
            value="esg" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Impact Metrics" 
            value="impact" 
            sx={{ textTransform: 'none' }}
          />
        </Tabs>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
          <Select
            labelId="timeframe-select-label"
            id="timeframe-select"
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange as any}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
            <MenuItem value="1y">Past Year</MenuItem>
            <MenuItem value="3y">Past 3 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid container spacing={4}>
          {/* ESG Score Summary */}
          <Grid item xs={12} lg={4}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                bgcolor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>ESG Score</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={180}
                      thickness={5}
                      sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={mockESGData.totalScore}
                      size={180}
                      thickness={5}
                      sx={{ 
                        color: theme.palette.primary.main,
                        position: 'absolute',
                        left: 0,
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {mockESGData.totalScore}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        out of 100
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'success.main' + '20',
                      p: 0.5,
                      mr: 1
                    }}>
                      <EnvironmentalIcon color="success" fontSize="small" />
                    </Box>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>Environmental</Typography>
                    <Typography variant="body1" fontWeight="medium" color="success.main">
                      {mockESGData.environmentalScore.score}/100
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'info.main' + '20',
                        p: 0.5,
                        mr: 1
                      }}>
                        <SocialIcon color="info" fontSize="small" />
                      </Box>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>Social</Typography>
                      <Typography variant="body1" fontWeight="medium" color="info.main">
                        {mockESGData.socialScore.score}/100
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'warning.main' + '20',
                        p: 0.5,
                        mr: 1
                      }}>
                        <GovernanceIcon color="warning" fontSize="small" />
                      </Box>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>Governance</Typography>
                      <Typography variant="body1" fontWeight="medium" color="warning.main">
                        {mockESGData.governanceScore.score}/100
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => setActiveTab('esg')}
                  sx={{ mt: 2 }}
                >
                  View Detailed ESG Analysis
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Impact Summary */}
          <Grid item xs={12} lg={8}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                bgcolor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Impact Metrics</Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {mockImpactMetrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: `${metric.color}10`,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: `${metric.color}30`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ 
                            color: metric.color,
                            mr: 1
                          }}>
                            {metric.icon}
                          </Box>
                          <Typography variant="body2">{metric.name}</Typography>
                        </Box>
                        <Typography variant="h5" sx={{ color: metric.color, fontWeight: 'medium', mb: 0.5 }}>
                          {metric.value.toLocaleString()} {metric.unit}
                        </Typography>
                        {metric.change !== undefined && (
                          <Typography 
                            variant="body2" 
                            sx={{ color: metric.change >= 0 ? 'success.main' : 'error.main' }}
                          >
                            {metric.change >= 0 ? '+' : ''}{metric.change}% vs. last period
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => setActiveTab('impact')}
                  sx={{ mt: 3 }}
                >
                  View Detailed Impact Analysis
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top SDG Contributions */}
          <Grid item xs={12}>
            <Card 
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                bgcolor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>SDG Contribution Highlights</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your portfolio makes the most significant contributions to the following Sustainable Development Goals:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {mockSDGContributions
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)
                    .map((sdg) => (
                      <Grid item xs={12} md={4} key={sdg.sdgNumber}>
                        <Box 
                          sx={{ 
                            p: 3, 
                            bgcolor: `${SDG_COLORS[sdg.sdgNumber]}10`,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: `${SDG_COLORS[sdg.sdgNumber]}30`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                          }}
                        >
                          <Box 
                            component="img"
                            src={`/images/sdg/sdg-${sdg.sdgNumber}.png`}
                            alt={`SDG ${sdg.sdgNumber}`}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              mb: 2
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            SDG {sdg.sdgNumber}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            {SDG_NAMES[sdg.sdgNumber]}
                          </Typography>
                          <Typography 
                            variant="h5" 
                            fontWeight="bold" 
                            sx={{ color: SDG_COLORS[sdg.sdgNumber] }}
                          >
                            {sdg.score}/100
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                </Grid>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => setActiveTab('impact')}
                  sx={{ mt: 3 }}
                >
                  View All SDG Contributions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* ESG Scoring Tab */}
      {activeTab === 'esg' && (
        <ESGScoreCard data={mockESGData} />
      )}
      
      {/* Impact Metrics Tab */}
      {activeTab === 'impact' && (
        <EnhancedImpactDashboard 
          impactMetrics={mockImpactMetrics}
          sdgContributions={mockSDGContributions}
          timeSeriesData={mockTimeSeriesData}
          geographyData={mockGeographyData}
        />
      )}
    </Container>
  );
};

export default ESGDashboardPage; 
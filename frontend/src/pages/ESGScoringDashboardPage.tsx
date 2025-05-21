import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  Snackbar,
  useTheme
} from '@mui/material';
import {
  EmojiNature as EnvironmentalIcon,
  People as SocialIcon,
  AccountBalance as GovernanceIcon,
  ForestOutlined as ForestIcon,
  WaterOutlined as WaterIcon,
  CloudOutlined as CloudIcon,
  Spa as BiodiversityIcon,
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import ESGScoreVisualization, {
  ESGScoreData,
  ImpactMetric,
  SDGContribution
} from '../components/analytics/ESGScoreVisualization';
import { useAuth } from '../contexts/AuthContext';

// Mock data for ESG score
const mockESGData: ESGScoreData = {
  totalScore: 75,
  environmentalScore: {
    name: 'Environmental',
    score: 82,
    metrics: [
      { 
        name: 'Carbon Footprint', 
        score: 88, 
        description: 'Measures carbon emissions reduction.',
        trend: [68, 72, 76, 80, 84, 88]
      },
      { 
        name: 'Renewable Energy', 
        score: 76, 
        description: 'Evaluates use of renewable energy sources.',
        trend: [60, 65, 68, 70, 74, 76] 
      },
      { 
        name: 'Resource Efficiency', 
        score: 84, 
        description: 'Evaluates efficient use of natural resources.',
        trend: [72, 75, 78, 80, 82, 84]
      },
      { 
        name: 'Biodiversity', 
        score: 81, 
        description: 'Measures impact on local and global biodiversity.',
        trend: [65, 70, 74, 77, 79, 81]
      }
    ]
  },
  socialScore: {
    name: 'Social',
    score: 71,
    metrics: [
      { 
        name: 'Labor Practices', 
        score: 75, 
        description: 'Evaluates fair labor conditions and worker rights.',
        trend: [65, 68, 70, 72, 74, 75]
      },
      { 
        name: 'Human Rights', 
        score: 78, 
        description: 'Measures respect for human rights throughout supply chain.',
        trend: [68, 70, 72, 74, 76, 78]
      },
      { 
        name: 'Community Impact', 
        score: 67, 
        description: 'Evaluates positive contributions to local communities.',
        trend: [58, 60, 62, 64, 65, 67]
      },
      { 
        name: 'Health & Safety', 
        score: 65, 
        description: 'Measures workplace health and safety standards.',
        trend: [55, 58, 60, 62, 64, 65]
      }
    ]
  },
  governanceScore: {
    name: 'Governance',
    score: 73,
    metrics: [
      { 
        name: 'Board Structure', 
        score: 70, 
        description: 'Evaluates the board diversity, independence and effectiveness.',
        trend: [62, 64, 66, 68, 69, 70]
      },
      { 
        name: 'Ethics & Compliance', 
        score: 77, 
        description: 'Measures ethical business practices and compliance programs.',
        trend: [65, 68, 70, 72, 75, 77]
      },
      { 
        name: 'Transparency', 
        score: 75, 
        description: 'Evaluates disclosure and reporting quality and transparency.',
        trend: [64, 67, 70, 72, 74, 75]
      },
      { 
        name: 'Risk Management', 
        score: 69, 
        description: 'Measures effectiveness of risk management systems.',
        trend: [60, 62, 64, 66, 68, 69]
      }
    ]
  },
  lastUpdated: '2023-07-15',
  historicalScores: [
    { date: '2023-01', total: 68, environmental: 72, social: 65, governance: 68 },
    { date: '2023-02', total: 70, environmental: 74, social: 67, governance: 69 },
    { date: '2023-03', total: 71, environmental: 76, social: 68, governance: 70 },
    { date: '2023-04', total: 73, environmental: 78, social: 69, governance: 71 },
    { date: '2023-05', total: 74, environmental: 80, social: 70, governance: 72 },
    { date: '2023-06', total: 75, environmental: 82, social: 71, governance: 73 }
  ]
};

// Mock impact metrics data
const mockImpactMetrics: ImpactMetric[] = [
  {
    id: 'carbon',
    name: 'Carbon Offset',
    value: 3750,
    unit: 'tons',
    icon: <CloudIcon />,
    color: '#3f7e44',
    description: 'Total carbon dioxide emissions offset by your investments.',
    equivalentValue: 'Equivalent to taking 810 cars off the road for a year',
    change: 15,
    historicalData: [
      { date: '2023-01', value: 3150 },
      { date: '2023-02', value: 3250 },
      { date: '2023-03', value: 3350 },
      { date: '2023-04', value: 3450 },
      { date: '2023-05', value: 3600 },
      { date: '2023-06', value: 3750 }
    ]
  },
  {
    id: 'land',
    name: 'Land Protected',
    value: 420,
    unit: 'hectares',
    icon: <ForestIcon />,
    color: '#56c02b',
    description: 'Total land area protected or restored through your investments.',
    equivalentValue: '588 football fields of habitat preserved',
    change: 8,
    historicalData: [
      { date: '2023-01', value: 380 },
      { date: '2023-02', value: 385 },
      { date: '2023-03', value: 395 },
      { date: '2023-04', value: 405 },
      { date: '2023-05', value: 415 },
      { date: '2023-06', value: 420 }
    ]
  },
  {
    id: 'water',
    name: 'Water Saved',
    value: 2450000,
    unit: 'liters',
    icon: <WaterIcon />,
    color: '#26bde2',
    description: 'Total water resources protected or conserved.',
    equivalentValue: 'Annual water usage for 980 households',
    change: 12,
    historicalData: [
      { date: '2023-01', value: 2100000 },
      { date: '2023-02', value: 2180000 },
      { date: '2023-03', value: 2250000 },
      { date: '2023-04', value: 2320000 },
      { date: '2023-05', value: 2380000 },
      { date: '2023-06', value: 2450000 }
    ]
  },
  {
    id: 'biodiversity',
    name: 'Biodiversity Impact',
    value: 78,
    unit: 'score',
    icon: <BiodiversityIcon />,
    color: '#fcc30b',
    description: 'Quantified positive impact on biodiversity preservation.',
    equivalentValue: 'Protection of 45 endangered species habitats',
    change: 5,
    historicalData: [
      { date: '2023-01', value: 70 },
      { date: '2023-02', value: 72 },
      { date: '2023-03', value: 74 },
      { date: '2023-04', value: 75 },
      { date: '2023-05', value: 77 },
      { date: '2023-06', value: 78 }
    ]
  }
];

// Mock SDG contributions
const mockSDGContributions: SDGContribution[] = [
  {
    id: 6,
    name: 'Clean Water and Sanitation',
    score: 85,
    description: 'Ensure availability and sustainable management of water and sanitation for all',
    logo: '/images/sdg/sdg-6.png',
    projects: ['Water Conservation Initiative', 'Clean Water Access Program']
  },
  {
    id: 7,
    name: 'Affordable and Clean Energy',
    score: 78,
    description: 'Ensure access to affordable, reliable, sustainable and modern energy for all',
    logo: '/images/sdg/sdg-7.png',
    projects: ['Solar Energy Project', 'Wind Farm Development']
  },
  {
    id: 12,
    name: 'Responsible Consumption and Production',
    score: 72,
    description: 'Ensure sustainable consumption and production patterns',
    logo: '/images/sdg/sdg-12.png',
    projects: ['Circular Economy Initiative', 'Sustainable Supply Chain Program']
  },
  {
    id: 13,
    name: 'Climate Action',
    score: 88,
    description: 'Take urgent action to combat climate change and its impacts',
    logo: '/images/sdg/sdg-13.png',
    projects: ['Carbon Capture Project', 'Climate Resilience Program']
  },
  {
    id: 14,
    name: 'Life Below Water',
    score: 65,
    description: 'Conserve and sustainably use the oceans, seas and marine resources',
    logo: '/images/sdg/sdg-14.png',
    projects: ['Ocean Conservation Initiative', 'Plastic Pollution Reduction']
  },
  {
    id: 15,
    name: 'Life on Land',
    score: 82,
    description: 'Protect, restore and promote sustainable use of terrestrial ecosystems',
    logo: '/images/sdg/sdg-15.png',
    projects: ['Reforestation Project', 'Biodiversity Protection Program']
  }
];

const ESGScoringDashboardPage: React.FC = () => {
  const theme = useTheme();
  const auth = useAuth();
  // Simulated fetch status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState('all');
  const [timeframe, setTimeframe] = useState('6m');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleAssetChange = (event: SelectChangeEvent) => {
    setAsset(event.target.value);
  };

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handleRefresh = () => {
    // Simulate data refresh
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSnackbarOpen(true);
    }, 1500);
  };

  const handleDownload = () => {
    // Would handle ESG report download
    console.log('Downloading ESG report...');
    setSnackbarOpen(true);
  };

  const handleShare = () => {
    // Would handle ESG report sharing
    console.log('Sharing ESG report...');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ESG Scoring Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and analyze the environmental, social, and governance performance of your investments.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="asset-select-label">Asset Class</InputLabel>
              <Select
                labelId="asset-select-label"
                id="asset-select"
                value={asset}
                label="Asset Class"
                onChange={handleAssetChange}
              >
                <MenuItem value="all">All Assets</MenuItem>
                <MenuItem value="environmental">Environmental Assets</MenuItem>
                <MenuItem value="treasury">Treasury Assets</MenuItem>
                <MenuItem value="tradefinance">Trade Finance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="1m">1 Month</MenuItem>
                <MenuItem value="3m">3 Months</MenuItem>
                <MenuItem value="6m">6 Months</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            size="small"
          >
            Export
          </Button>
          <Button
            startIcon={<ShareIcon />}
            onClick={handleShare}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ESGScoreVisualization
            data={mockESGData}
            impactMetrics={mockImpactMetrics}
            sdgContributions={mockSDGContributions}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About ESG Scoring
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Environmental, Social, and Governance (ESG) criteria are a set of standards that socially conscious investors use to screen potential investments. Environmental criteria consider how a company safeguards the environment, including corporate policies addressing climate change. Social criteria examine how it manages relationships with employees, suppliers, customers, and the communities where it operates. Governance deals with a company's leadership, executive pay, audits, internal controls, and shareholder rights.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our ESG scoring system uses data from multiple sources, including company disclosures, third-party ratings, and proprietary analysis to provide a comprehensive view of investment sustainability and impact. Scores are updated quarterly and represent a relative performance assessment.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message="Action completed successfully"
      />
    </Container>
  );
};

export default ESGScoringDashboardPage; 
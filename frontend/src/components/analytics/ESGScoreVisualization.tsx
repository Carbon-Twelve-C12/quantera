import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  LinearProgress,
  CircularProgress,
  Divider,
  IconButton,
  Button,
  Tooltip,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  Info as InfoIcon,
  FileDownload as DownloadIcon,
  EmojiNature as EnvironmentalIcon,
  People as SocialIcon,
  AccountBalance as GovernanceIcon,
  ForestOutlined as ForestIcon,
  WaterOutlined as WaterIcon,
  CloudOutlined as CloudIcon,
  Spa as BiodiversityIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Define interfaces for ESG score data
export interface ESGScoreCategory {
  name: string;
  score: number;
  metrics: ESGMetric[];
}

export interface ESGMetric {
  name: string;
  score: number;
  description: string;
  trend?: number[]; // For trend analysis
}

export interface ESGScoreData {
  totalScore: number;
  environmentalScore: ESGScoreCategory;
  socialScore: ESGScoreCategory;
  governanceScore: ESGScoreCategory;
  lastUpdated: string;
  historicalScores?: {
    date: string;
    total: number;
    environmental: number;
    social: number;
    governance: number;
  }[];
}

export interface ImpactMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  equivalentValue?: string;
  change?: number;
  historicalData?: { date: string; value: number }[];
}

export interface SDGContribution {
  id: number;
  name: string;
  score: number;
  description: string;
  logo: string;
  projects: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`esg-tabpanel-${index}`}
      aria-labelledby={`esg-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface ESGScoreVisualizationProps {
  data: ESGScoreData;
  impactMetrics: ImpactMetric[];
  sdgContributions?: SDGContribution[];
  loading?: boolean;
  height?: number | string;
}

const ESGScoreVisualization: React.FC<ESGScoreVisualizationProps> = ({
  data,
  impactMetrics,
  sdgContributions = [],
  loading = false,
  height = 'auto'
}) => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Prepare data for radar chart
  const radarData = [
    ...data.environmentalScore.metrics.map(metric => ({
      subject: metric.name,
      score: metric.score,
      fullMark: 100,
      category: 'environmental'
    })),
    ...data.socialScore.metrics.map(metric => ({
      subject: metric.name,
      score: metric.score,
      fullMark: 100,
      category: 'social'
    })),
    ...data.governanceScore.metrics.map(metric => ({
      subject: metric.name,
      score: metric.score,
      fullMark: 100,
      category: 'governance'
    }))
  ];

  // Prepare data for ESG comparison
  const esgComparisonData = [
    {
      name: 'Environmental',
      score: data.environmentalScore.score,
      fill: '#4caf50'
    },
    {
      name: 'Social',
      score: data.socialScore.score,
      fill: '#2196f3'
    },
    {
      name: 'Governance',
      score: data.governanceScore.score,
      fill: '#ff9800'
    }
  ];

  // Prepare historical data if available
  const historicalData = data.historicalScores || [
    { date: '2023-01', total: 68, environmental: 72, social: 65, governance: 68 },
    { date: '2023-02', total: 70, environmental: 74, social: 67, governance: 69 },
    { date: '2023-03', total: 71, environmental: 76, social: 68, governance: 70 },
    { date: '2023-04', total: 73, environmental: 78, social: 69, governance: 71 },
    { date: '2023-05', total: 74, environmental: 80, social: 70, governance: 72 },
    { date: '2023-06', total: 75, environmental: 82, social: 71, governance: 73 }
  ];

  // Get score color based on score value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Format SDG image URL
  const formatSdgImageUrl = (id: number): string => {
    return `/images/sdg/sdg-${id}.png`;
  };

  if (loading) {
    return (
      <Card sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardHeader
        title="ESG Score & Impact Dashboard"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Button
            startIcon={<DownloadIcon />}
            size="small"
            sx={{ mr: 1 }}
            onClick={() => {
              /* Would handle download of ESG report */
            }}
          >
            Export Report
          </Button>
        }
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="ESG visualization tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<ShowChartIcon />} 
            iconPosition="start" 
            label="Overview" 
          />
          <Tab 
            icon={<EnvironmentalIcon />} 
            iconPosition="start" 
            label="Environmental" 
          />
          <Tab 
            icon={<SocialIcon />} 
            iconPosition="start" 
            label="Social" 
          />
          <Tab 
            icon={<GovernanceIcon />} 
            iconPosition="start" 
            label="Governance" 
          />
          <Tab 
            icon={<ForestIcon />} 
            iconPosition="start" 
            label="Impact Metrics" 
          />
        </Tabs>
      </Box>

      <CardContent>
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={data.totalScore}
                      size={120}
                      thickness={5}
                      sx={{
                        color: getScoreColor(data.totalScore),
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        },
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
                      }}
                    >
                      <Typography variant="h4" component="div" color="text.primary">
                        {data.totalScore}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" color="text.primary" sx={{ mt: 2 }}>
                    Overall ESG Score
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Last updated: {data.lastUpdated}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={esgComparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Score History
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="environmental" name="Environmental" stroke="#4caf50" />
                <Line type="monotone" dataKey="social" name="Social" stroke="#2196f3" />
                <Line type="monotone" dataKey="governance" name="Governance" stroke="#ff9800" />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            ESG Metrics Radar
          </Typography>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        {/* Environmental Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ 
                  bgcolor: 'rgba(76, 175, 80, 0.1)', 
                  color: '#4caf50', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  display: 'flex' 
                }}>
                  <EnvironmentalIcon fontSize="large" />
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" gutterBottom>
                  Environmental Score: {data.environmentalScore.score}/100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.environmentalScore.score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
                      borderRadius: 4,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            {data.environmentalScore.metrics.map((metric, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">{metric.name}</Typography>
                      <Typography variant="h6" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score),
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {metric.description}
                    </Typography>

                    {metric.trend && (
                      <Box sx={{ mt: 2, height: 80 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={metric.trend.map((value, i) => ({ month: i + 1, value }))}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <Area type="monotone" dataKey="value" stroke="#4caf50" fill="#4caf50" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Social Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ 
                  bgcolor: 'rgba(33, 150, 243, 0.1)', 
                  color: '#2196f3', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  display: 'flex' 
                }}>
                  <SocialIcon fontSize="large" />
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" gutterBottom>
                  Social Score: {data.socialScore.score}/100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.socialScore.score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#2196f3',
                      borderRadius: 4,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            {data.socialScore.metrics.map((metric, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">{metric.name}</Typography>
                      <Typography variant="h6" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score),
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {metric.description}
                    </Typography>

                    {metric.trend && (
                      <Box sx={{ mt: 2, height: 80 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={metric.trend.map((value, i) => ({ month: i + 1, value }))}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <Area type="monotone" dataKey="value" stroke="#2196f3" fill="#2196f3" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Governance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ 
                  bgcolor: 'rgba(255, 152, 0, 0.1)', 
                  color: '#ff9800', 
                  borderRadius: '50%', 
                  p: 1.5, 
                  display: 'flex' 
                }}>
                  <GovernanceIcon fontSize="large" />
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" gutterBottom>
                  Governance Score: {data.governanceScore.score}/100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.governanceScore.score}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 152, 0, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ff9800',
                      borderRadius: 4,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            {data.governanceScore.metrics.map((metric, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">{metric.name}</Typography>
                      <Typography variant="h6" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score),
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {metric.description}
                    </Typography>

                    {metric.trend && (
                      <Box sx={{ mt: 2, height: 80 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={metric.trend.map((value, i) => ({ month: i + 1, value }))}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <Area type="monotone" dataKey="value" stroke="#ff9800" fill="#ff9800" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Impact Metrics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            {impactMetrics.map((metric) => (
              <Grid item xs={12} sm={6} md={3} key={metric.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: `${metric.color}20`,
                          color: metric.color,
                          mr: 2,
                        }}
                      >
                        {metric.icon}
                      </Box>
                      <Box>
                        <Typography variant="h5" component="div">
                          {metric.value.toLocaleString()}
                          <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                            {metric.unit}
                          </Typography>
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {metric.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {metric.description}
                    </Typography>

                    {metric.equivalentValue && (
                      <Typography
                        variant="body2"
                        sx={{
                          bgcolor: `${metric.color}10`,
                          color: metric.color,
                          p: 1,
                          borderRadius: 1,
                          fontWeight: 'medium',
                        }}
                      >
                        {metric.equivalentValue}
                      </Typography>
                    )}

                    {metric.historicalData && (
                      <Box sx={{ mt: 2, height: 80 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={metric.historicalData}
                            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                          >
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={metric.color}
                              fill={metric.color}
                              fillOpacity={0.2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {sdgContributions.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Sustainable Development Goals
              </Typography>
              <Grid container spacing={2}>
                {sdgContributions.map((sdg) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={sdg.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box
                          component="img"
                          src={formatSdgImageUrl(sdg.id)}
                          alt={`SDG ${sdg.id}`}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            mb: 1,
                          }}
                        />
                        <Typography variant="subtitle2" gutterBottom>
                          SDG {sdg.id}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={sdg.score}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 1,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {sdg.score}/100
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default ESGScoreVisualization; 
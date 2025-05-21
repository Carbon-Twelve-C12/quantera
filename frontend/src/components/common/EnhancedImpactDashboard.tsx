import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Tabs,
  Tab,
  Divider,
  useTheme,
  Button,
  Chip
} from '@mui/material';
import { 
  Nature as NatureIcon,
  FilterAlt as FilterIcon,
  Public as PublicIcon,
  CloudOutlined as CloudIcon,
  WaterOutlined as WaterIcon,
  ForestOutlined as ForestIcon,
  Spa as BiodiversityIcon,
  Handshake as SocialIcon
} from '@mui/icons-material';
import { Bar, Pie, Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Define the SDG colors lookup
export const SDG_COLORS: Record<number, string> = {
  1: '#e5243b', // No Poverty
  2: '#dda63a', // Zero Hunger
  3: '#4c9f38', // Good Health and Well-being
  4: '#c5192d', // Quality Education
  5: '#ff3a21', // Gender Equality
  6: '#26bde2', // Clean Water and Sanitation
  7: '#fcc30b', // Affordable and Clean Energy
  8: '#a21942', // Decent Work and Economic Growth
  9: '#fd6925', // Industry, Innovation and Infrastructure
  10: '#dd1367', // Reduced Inequalities
  11: '#fd9d24', // Sustainable Cities and Communities
  12: '#bf8b2e', // Responsible Consumption and Production
  13: '#3f7e44', // Climate Action
  14: '#0a97d9', // Life Below Water
  15: '#56c02b', // Life on Land
  16: '#00689d', // Peace, Justice and Strong Institutions
  17: '#19486a'  // Partnerships for the Goals
};

// SDG full names
export const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health and Well-being',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy',
  8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation and Infrastructure',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities',
  12: 'Responsible Consumption and Production',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace, Justice and Strong Institutions',
  17: 'Partnerships for the Goals'
};

// Impact metric types
export interface ImpactMetric {
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  equivalentValue?: string;
  change?: number;
}

// Geography data type
export interface GeographyData {
  region: string;
  carbonOffset: number;
  landProtected: number;
  waterSaved: number;
  biodiversityScore: number;
}

// Time series data type
export interface TimeSeriesData {
  label: string;
  value: number;
}

// SDG contribution data type
export interface SDGContribution {
  sdgNumber: number;
  score: number;
  contributions: {
    name: string;
    value: number;
  }[];
}

// Props interface
export interface EnhancedImpactDashboardProps {
  impactMetrics: ImpactMetric[];
  sdgContributions: SDGContribution[];
  timeSeriesData: {
    carbonOffset: TimeSeriesData[];
    landProtected: TimeSeriesData[];
    waterSaved: TimeSeriesData[];
    biodiversityScore: TimeSeriesData[];
  };
  geographyData: GeographyData[];
}

const EnhancedImpactDashboard: React.FC<EnhancedImpactDashboardProps> = ({
  impactMetrics,
  sdgContributions,
  timeSeriesData,
  geographyData
}) => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedSDG, setSelectedSDG] = useState<number | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  // Handle SDG selection
  const handleSDGSelect = (sdgNumber: number) => {
    setSelectedSDG(selectedSDG === sdgNumber ? null : sdgNumber);
  };

  // Prepare SDG chart data
  const sdgChartData = {
    labels: sdgContributions.map(contribution => `SDG ${contribution.sdgNumber}`),
    datasets: [
      {
        label: 'SDG Contribution',
        data: sdgContributions.map(contribution => contribution.score),
        backgroundColor: sdgContributions.map(contribution => SDG_COLORS[contribution.sdgNumber]),
        borderColor: sdgContributions.map(contribution => SDG_COLORS[contribution.sdgNumber]),
        borderWidth: 1
      }
    ]
  };

  // Prepare SDG radar data for selected SDG
  const getSDGRadarData = (sdgNumber: number) => {
    const selectedSDG = sdgContributions.find(sdg => sdg.sdgNumber === sdgNumber);
    if (!selectedSDG) return null;

    return {
      labels: selectedSDG.contributions.map(contrib => contrib.name),
      datasets: [
        {
          label: 'Contribution Score',
          data: selectedSDG.contributions.map(contrib => contrib.value),
          backgroundColor: `${SDG_COLORS[sdgNumber]}40`,
          borderColor: SDG_COLORS[sdgNumber],
          borderWidth: 2,
          pointBackgroundColor: SDG_COLORS[sdgNumber],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: SDG_COLORS[sdgNumber]
        }
      ]
    };
  };

  // Prepare geography data
  const geographyChartData = {
    labels: geographyData.map(item => item.region),
    datasets: [
      {
        label: 'Carbon Offset (tons)',
        data: geographyData.map(item => item.carbonOffset),
        backgroundColor: '#3f7e44'
      },
      {
        label: 'Land Protected (ha)',
        data: geographyData.map(item => item.landProtected),
        backgroundColor: '#56c02b'
      },
      {
        label: 'Water Saved (kL)',
        data: geographyData.map(item => item.waterSaved / 1000), // Convert to kiloliters
        backgroundColor: '#26bde2'
      }
    ]
  };

  // Prepare time series data for carbon offset over time
  const getTimeSeriesChartData = (metricType: 'carbonOffset' | 'landProtected' | 'waterSaved' | 'biodiversityScore') => {
    const colors = {
      carbonOffset: '#3f7e44',
      landProtected: '#56c02b',
      waterSaved: '#26bde2',
      biodiversityScore: '#fcc30b'
    };

    const labels = {
      carbonOffset: 'Carbon Offset (tons)',
      landProtected: 'Land Protected (ha)',
      waterSaved: 'Water Saved (kL)',
      biodiversityScore: 'Biodiversity Score'
    };

    const data = timeSeriesData[metricType];
    const color = colors[metricType];
    const label = labels[metricType];

    return {
      labels: data.map(point => point.label),
      datasets: [
        {
          label,
          data: data.map(point => point.value),
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme.palette.text.primary
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)'
        },
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'
        },
        pointLabels: {
          color: theme.palette.text.primary,
          font: {
            size: 11
          }
        },
        ticks: {
          backdropColor: 'transparent',
          color: theme.palette.text.secondary
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary
        }
      }
    }
  };

  // Calculate total SDG score
  const totalSDGScore = sdgContributions.reduce((sum, sdg) => sum + sdg.score, 0) / sdgContributions.length;

  return (
    <Box>
      {/* Tab Navigation */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="Impact Dashboard Tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" value="overview" icon={<NatureIcon />} iconPosition="start" />
          <Tab label="SDG Analysis" value="sdg" icon={<PublicIcon />} iconPosition="start" />
          <Tab label="Geographic Impact" value="geographic" icon={<FilterIcon />} iconPosition="start" />
          <Tab label="Trends Over Time" value="trends" icon={<CloudIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {currentTab === 'overview' && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {impactMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <Box 
                    sx={{ 
                      bgcolor: `${metric.color}10`,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box 
                      sx={{ 
                        borderRadius: '50%',
                        bgcolor: `${metric.color}20`,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5
                      }}
                    >
                      <Box sx={{ color: metric.color }}>
                        {metric.icon}
                      </Box>
                    </Box>
                    <Typography variant="h6">{metric.name}</Typography>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="medium" gutterBottom sx={{ color: metric.color }}>
                        {metric.value.toLocaleString()} {metric.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {metric.description}
                      </Typography>
                      {metric.equivalentValue && (
                        <Typography variant="body2" fontStyle="italic">
                          ≈ {metric.equivalentValue}
                        </Typography>
                      )}
                    </Box>
                    {metric.change !== undefined && (
                      <Chip
                        label={`${metric.change >= 0 ? '+' : ''}${metric.change}% vs. last period`}
                        size="small"
                        color={metric.change >= 0 ? 'success' : 'error'}
                        sx={{ alignSelf: 'flex-start', mt: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card 
            sx={{ 
              mb: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>SDG Alignment Overview</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your portfolio contributes to multiple Sustainable Development Goals. The chart below shows the score for each SDG.
              </Typography>
              <Box sx={{ height: 350 }}>
                <Bar data={sdgChartData} options={barOptions as any} />
              </Box>
            </CardContent>
          </Card>

          <Card 
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>Impact Over Time</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track how your environmental impact has grown over time.
              </Typography>
              <Box sx={{ height: 350 }}>
                <Line data={getTimeSeriesChartData('carbonOffset')} options={lineOptions as any} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* SDG Analysis Tab */}
      {currentTab === 'sdg' && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: theme.shadows[1]
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>SDG Contribution</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Click on any SDG to see detailed contribution metrics.
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 2 }}>
                    {sdgContributions.map((sdg) => (
                      <Button
                        key={sdg.sdgNumber}
                        variant={selectedSDG === sdg.sdgNumber ? "contained" : "outlined"}
                        sx={{ 
                          m: 0.5, 
                          bgcolor: selectedSDG === sdg.sdgNumber ? SDG_COLORS[sdg.sdgNumber] : 'transparent',
                          color: selectedSDG === sdg.sdgNumber ? '#fff' : SDG_COLORS[sdg.sdgNumber],
                          borderColor: SDG_COLORS[sdg.sdgNumber],
                          '&:hover': {
                            bgcolor: `${SDG_COLORS[sdg.sdgNumber]}90`,
                            color: '#fff'
                          }
                        }}
                        onClick={() => handleSDGSelect(sdg.sdgNumber)}
                      >
                        SDG {sdg.sdgNumber}
                      </Button>
                    ))}
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
                      Total SDG Score
                    </Typography>
                    <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {totalSDGScore.toFixed(1)}/100
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: theme.shadows[1]
                }}
              >
                <CardContent>
                  {selectedSDG ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box 
                          component="img"
                          src={`/images/sdg/sdg-${selectedSDG}.png`}
                          alt={`SDG ${selectedSDG}`}
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            mr: 2
                          }}
                        />
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            SDG {selectedSDG}: {SDG_NAMES[selectedSDG]}
                          </Typography>
                          <Chip 
                            label={`Score: ${sdgContributions.find(sdg => sdg.sdgNumber === selectedSDG)?.score || 0}/100`}
                            color="primary"
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ height: 400 }}>
                        {getSDGRadarData(selectedSDG) ? (
                          <Radar data={getSDGRadarData(selectedSDG)!} options={radarOptions as any} />
                        ) : (
                          <Typography>No detailed data available for this SDG</Typography>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <PublicIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Select an SDG to view detailed metrics
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Geographic Impact Tab */}
      {currentTab === 'geographic' && (
        <Box>
          <Card 
            sx={{ 
              mb: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>Geographic Distribution</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your impact metrics distributed across different geographic regions.
              </Typography>
              <Box sx={{ height: 400 }}>
                <Bar data={geographyChartData} options={barOptions as any} />
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {geographyData.map((region, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{region.region}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <ForestIcon sx={{ mr: 1, color: '#3f7e44' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>Carbon Offset</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {region.carbonOffset.toLocaleString()} tons
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <NatureIcon sx={{ mr: 1, color: '#56c02b' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>Land Protected</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {region.landProtected.toLocaleString()} ha
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <WaterIcon sx={{ mr: 1, color: '#26bde2' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>Water Saved</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {(region.waterSaved / 1000).toLocaleString()} kL
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BiodiversityIcon sx={{ mr: 1, color: '#fcc30b' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>Biodiversity Score</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {region.biodiversityScore}/100
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Trends Over Time Tab */}
      {currentTab === 'trends' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Carbon Offset Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={getTimeSeriesChartData('carbonOffset')} options={lineOptions as any} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Land Protection Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={getTimeSeriesChartData('landProtected')} options={lineOptions as any} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Water Conservation Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={getTimeSeriesChartData('waterSaved')} options={lineOptions as any} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Biodiversity Score Trend</Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={getTimeSeriesChartData('biodiversityScore')} options={lineOptions as any} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EnhancedImpactDashboard; 
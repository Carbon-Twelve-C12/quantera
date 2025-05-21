import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  LinearProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Info as InfoIcon,
  EmojiNature as EnvironmentalIcon,
  People as SocialIcon,
  AccountBalance as GovernanceIcon
} from '@mui/icons-material';

// Define interfaces for ESG score data
export interface ESGScoreCategory {
  name: string;
  score: number;
  metrics: {
    name: string;
    score: number;
    description: string;
  }[];
}

export interface ESGScoreData {
  totalScore: number;
  environmentalScore: ESGScoreCategory;
  socialScore: ESGScoreCategory;
  governanceScore: ESGScoreCategory;
  lastUpdated: string;
}

interface ESGScoreCardProps {
  data: ESGScoreData;
}

const ESGScoreCard: React.FC<ESGScoreCardProps> = ({ data }) => {
  const theme = useTheme();

  // Helper to get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.success.light;
    if (score >= 40) return theme.palette.warning.main;
    if (score >= 20) return theme.palette.warning.dark;
    return theme.palette.error.main;
  };

  // Helper to get letter grade based on score
  const getLetterGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D+';
    if (score >= 20) return 'D';
    return 'F';
  };

  // Helper to get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'environmental':
        return <EnvironmentalIcon sx={{ color: theme.palette.success.main }} />;
      case 'social':
        return <SocialIcon sx={{ color: theme.palette.info.main }} />;
      case 'governance':
        return <GovernanceIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  return (
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="medium">ESG Score</Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {data.lastUpdated}
          </Typography>
        </Box>

        {/* Overall ESG Score */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column', 
            my: 4 
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={160}
              thickness={4}
              sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                position: 'absolute' 
              }}
            />
            <CircularProgress
              variant="determinate"
              value={data.totalScore}
              size={160}
              thickness={4}
              sx={{ color: getScoreColor(data.totalScore) }}
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
              <Typography variant="h2" fontWeight="bold" sx={{ color: getScoreColor(data.totalScore) }}>
                {getLetterGrade(data.totalScore)}
              </Typography>
              <Typography variant="h5">
                {data.totalScore}/100
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', maxWidth: 300 }}>
            Overall ESG score based on Environmental, Social, and Governance factors across your portfolio
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ESG Category Scores */}
        <Grid container spacing={3}>
          {/* Environmental Score */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getCategoryIcon('environmental')}
              <Typography variant="h6" sx={{ ml: 1 }}>Environmental</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="h6" fontWeight="medium" sx={{ color: getScoreColor(data.environmentalScore.score) }}>
                {data.environmentalScore.score}/100
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={data.environmentalScore.score} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                my: 1,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getScoreColor(data.environmentalScore.score)
                }
              }}
            />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {data.environmentalScore.metrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} key={`env-${index}`}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {metric.name}
                        </Typography>
                        <Tooltip title={metric.description}>
                          <IconButton size="small" sx={{ ml: 0.5, padding: 0 }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.score} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score)
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
          
          {/* Social Score */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getCategoryIcon('social')}
              <Typography variant="h6" sx={{ ml: 1 }}>Social</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="h6" fontWeight="medium" sx={{ color: getScoreColor(data.socialScore.score) }}>
                {data.socialScore.score}/100
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={data.socialScore.score} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                my: 1,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getScoreColor(data.socialScore.score)
                }
              }}
            />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {data.socialScore.metrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} key={`soc-${index}`}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {metric.name}
                        </Typography>
                        <Tooltip title={metric.description}>
                          <IconButton size="small" sx={{ ml: 0.5, padding: 0 }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.score} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score)
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
          
          {/* Governance Score */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getCategoryIcon('governance')}
              <Typography variant="h6" sx={{ ml: 1 }}>Governance</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="h6" fontWeight="medium" sx={{ color: getScoreColor(data.governanceScore.score) }}>
                {data.governanceScore.score}/100
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={data.governanceScore.score} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                my: 1,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getScoreColor(data.governanceScore.score)
                }
              }}
            />
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {data.governanceScore.metrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} key={`gov-${index}`}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {metric.name}
                        </Typography>
                        <Tooltip title={metric.description}>
                          <IconButton size="small" sx={{ ml: 0.5, padding: 0 }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/100
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.score} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(metric.score)
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ESGScoreCard; 
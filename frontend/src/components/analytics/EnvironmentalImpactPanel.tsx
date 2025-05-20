import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  useTheme,
  Chip
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import {
  Park as ParkIcon,
  WaterDrop as WaterIcon,
  AcUnit as ClimateIcon,
  ForestOutlined as EcoIcon,
  Opacity as OpacityIcon,
  Agriculture as AgricultureIcon,
  Terrain as TerrainIcon
} from '@mui/icons-material';
import { EnvironmentalMetric } from '../../types/analyticsTypes';

interface ImpactItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  progress?: number;
}

const ImpactItem: React.FC<ImpactItemProps> = ({ 
  icon, 
  label, 
  value, 
  subtext, 
  color,
  progress 
}) => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute',
          top: -20,
          left: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}20`,
          color: color,
          border: '1px solid',
          borderColor: `${color}50`,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
      >
        {icon}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ fontWeight: 'medium', my: 1 }}
        >
          {value}
        </Typography>
        
        {progress !== undefined && (
          <Box sx={{ width: '100%', mt: 1, mb: 1.5 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: color
                }
              }} 
            />
          </Box>
        )}
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          component="div"
          sx={{ fontStyle: 'italic' }}
        >
          {subtext}
        </Typography>
      </Box>
    </Card>
  );
};

interface SustainableDevelopmentGoalProps {
  number: number;
  name: string;
  color: string;
  contribution: number;
}

const SustainableDevelopmentGoal: React.FC<SustainableDevelopmentGoalProps> = ({
  number,
  name,
  color,
  contribution
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 1.5 
      }}
    >
      <Chip 
        label={`SDG ${number}`} 
        size="small"
        sx={{ 
          bgcolor: color,
          color: '#fff',
          fontWeight: 'bold',
          mr: 1.5,
          minWidth: 70
        }} 
      />
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">{name}</Typography>
          <Typography variant="body2" fontWeight="medium">{contribution}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={contribution} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': {
              bgcolor: color
            }
          }} 
        />
      </Box>
    </Box>
  );
};

interface EnvironmentalImpactPanelProps {
  environmentalMetrics: EnvironmentalMetric;
}

const EnvironmentalImpactPanel: React.FC<EnvironmentalImpactPanelProps> = ({
  environmentalMetrics
}) => {
  const theme = useTheme();

  // Format numbers with appropriate units
  const formatNumber = (value: number, unit: string): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ${unit}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${unit}`;
    } else {
      return `${value.toFixed(1)} ${unit}`;
    }
  };

  // Calculate equivalents for better understanding
  const carEquivalent = Math.round(environmentalMetrics.carbonOffset * 4.6); // Average car emissions per year
  const householdWaterEquivalent = Math.round(environmentalMetrics.waterSaved / 142000); // Average household water usage per year
  const homesEnergy = Math.round(environmentalMetrics.renewableEnergyGenerated * 0.8); // Average home energy usage per year

  return (
    <Box>
      <Card 
        sx={{ 
          p: 3, 
          mb: 4,
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(0, 102, 68, 0.15)' 
            : 'rgba(0, 153, 102, 0.05)'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 2
          }}
        >
          <EcoIcon 
            sx={{ 
              color: '#00a86b', 
              fontSize: 28,
              mr: 1.5
            }} 
          />
          <Typography variant="h6" sx={{ color: '#00a86b' }}>
            Environmental Impact Summary
          </Typography>
        </Box>

        <Typography variant="body2" paragraph sx={{ mb: 3 }}>
          Quantera's environmental assets have generated positive impacts across multiple sustainability dimensions.
          These metrics represent the aggregated environmental benefits from all environmental assets on the platform.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <ImpactItem 
              icon={<ClimateIcon />}
              label="Carbon Offset"
              value={`${environmentalMetrics.carbonOffset.toLocaleString()} tons`}
              subtext={`Equivalent to taking ${carEquivalent.toLocaleString()} cars off the road for a year`}
              color="#0ea5e9"
              progress={Math.min(environmentalMetrics.carbonOffset / 5000 * 100, 100)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <ImpactItem 
              icon={<OpacityIcon />}
              label="Renewable Energy"
              value={`${environmentalMetrics.renewableEnergyGenerated.toLocaleString()} MWh`}
              subtext={`Powers approximately ${homesEnergy.toLocaleString()} homes for a year`}
              color="#22c55e"
              progress={Math.min(environmentalMetrics.renewableEnergyGenerated / 3000 * 100, 100)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <ImpactItem 
              icon={<TerrainIcon />}
              label="Land Protected"
              value={`${environmentalMetrics.landAreaProtected.toLocaleString()} hectares`}
              subtext="Natural habitats and biodiversity preserved"
              color="#f59e0b"
              progress={Math.min(environmentalMetrics.landAreaProtected / 500 * 100, 100)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <ImpactItem 
              icon={<WaterIcon />}
              label="Water Saved"
              value={formatNumber(environmentalMetrics.waterSaved / 1000, "kL")}
              subtext={`Annual water usage for ${householdWaterEquivalent.toLocaleString()} households`}
              color="#3b82f6"
              progress={Math.min(environmentalMetrics.waterSaved / 5000000 * 100, 100)}
            />
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card 
            sx={{ 
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sustainable Development Goals (SDGs) Contribution
              </Typography>
              <Typography variant="body2" paragraph color="text.secondary" sx={{ mb: 3 }}>
                Environmental assets in your portfolio contribute to the following UN Sustainable Development Goals:
              </Typography>

              <Box sx={{ mt: 2 }}>
                <SustainableDevelopmentGoal 
                  number={6} 
                  name="Clean Water and Sanitation" 
                  color="#26bde2" 
                  contribution={85} 
                />
                <SustainableDevelopmentGoal 
                  number={7} 
                  name="Affordable and Clean Energy" 
                  color="#fcc30b" 
                  contribution={72} 
                />
                <SustainableDevelopmentGoal 
                  number={13} 
                  name="Climate Action" 
                  color="#3f7e44" 
                  contribution={92} 
                />
                <SustainableDevelopmentGoal 
                  number={14} 
                  name="Life Below Water" 
                  color="#0a97d9" 
                  contribution={45} 
                />
                <SustainableDevelopmentGoal 
                  number={15} 
                  name="Life on Land" 
                  color="#56c02b" 
                  contribution={65} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card 
            sx={{ 
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Impact Score
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Quantera's proprietary Environmental Impact Score evaluates the effectiveness and sustainability
                of environmental assets.
              </Typography>

              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  my: 3
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      ${theme.palette.success.main} ${environmentalMetrics.impactScore}%, 
                      ${theme.palette.grey[200]} 0%
                    )`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      borderRadius: '50%',
                      width: '70%',
                      height: '70%',
                      background: theme.palette.background.paper
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      textAlign: 'center',
                      zIndex: 1
                    }}
                  >
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.success.main
                      }}
                    >
                      {environmentalMetrics.impactScore}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: -1 
                      }}
                    >
                      out of 100
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Poor</Typography>
                    <Typography variant="body2">Excellent</Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 8, 
                      borderRadius: 4,
                      background: `linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)`,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        top: -2,
                        left: `calc(${environmentalMetrics.impactScore}% - 6px)`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2">0</Typography>
                    <Typography variant="body2">100</Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 2 }}>
                The score is calculated based on verified impact metrics, project effectiveness, permanence, 
                additionality, and contribution to sustainable development goals.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnvironmentalImpactPanel; 
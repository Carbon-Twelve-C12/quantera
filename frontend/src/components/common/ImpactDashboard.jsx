import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Divider, Chip, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/api';

const ImpactDashboard = ({ userAddress }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [impactData, setImpactData] = useState(null);
  const [error, setError] = useState(null);

  // Define SDG colors
  const sdgColors = {
    1: '#e5243b', // No Poverty
    2: '#DDA63A', // Zero Hunger
    3: '#4C9F38', // Good Health
    4: '#C5192D', // Quality Education
    5: '#FF3A21', // Gender Equality
    6: '#26BDE2', // Clean Water
    7: '#FCC30B', // Affordable Energy
    8: '#A21942', // Decent Work
    9: '#FD6925', // Industry, Innovation
    10: '#DD1367', // Reduced Inequalities
    11: '#FD9D24', // Sustainable Cities
    12: '#BF8B2E', // Responsible Consumption
    13: '#3F7E44', // Climate Action
    14: '#0A97D9', // Life Below Water
    15: '#56C02B', // Life on Land
    16: '#00689D', // Peace, Justice
    17: '#19486A', // Partnerships
  };

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        setLoading(true);
        // Fetch portfolio impact data from API
        const response = await api.get(`/environmental/impact/portfolio/${userAddress}`);
        setImpactData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching impact data:', err);
        setError('Failed to load impact data');
        setLoading(false);
        
        // For demo purposes, set mock data if API fails
        setImpactData({
          carbon_offset_tons: 350.0,
          land_area_protected_hectares: 75.0,
          renewable_energy_mwh: 120.0,
          water_protected_liters: 500000.0,
          sdg_alignment: {
            "6": 0.7,  // Clean Water and Sanitation
            "7": 0.8,  // Affordable and Clean Energy
            "13": 0.9, // Climate Action
            "14": 0.6, // Life Below Water
            "15": 0.85 // Life on Land
          },
          verification_date: 1672531200,
          third_party_verifier: "Verra"
        });
      }
    };

    if (userAddress) {
      fetchImpactData();
    }
  }, [userAddress]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!impactData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>No impact data available</Typography>
      </Box>
    );
  }

  // Prepare SDG data for chart
  const sdgData = Object.entries(impactData.sdg_alignment || {}).map(([sdg, value]) => ({
    sdg: `SDG ${sdg}`,
    value: value * 100, // Convert to percentage
    color: sdgColors[sdg] || theme.palette.primary.main
  }));

  // Prepare impact metrics for bar chart
  const impactMetrics = [
    {
      name: 'Carbon Offset',
      value: impactData.carbon_offset_tons,
      unit: 'tons CO₂e',
      color: theme.palette.success.main
    },
    {
      name: 'Land Protected',
      value: impactData.land_area_protected_hectares,
      unit: 'hectares',
      color: theme.palette.info.main
    },
    {
      name: 'Renewable Energy',
      value: impactData.renewable_energy_mwh,
      unit: 'MWh',
      color: theme.palette.warning.main
    },
    {
      name: 'Water Protected',
      value: impactData.water_protected_liters / 1000, // Convert to thousands
      unit: 'kiloliters',
      color: theme.palette.primary.main
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Environmental Impact Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Track the environmental impact of your sustainable investments
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Impact Metrics Cards */}
        {impactMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.name}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderTop: `4px solid ${metric.color}`
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {metric.name}
                </Typography>
                <Typography variant="h3" component="div" color="text.primary">
                  {metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.unit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* SDG Alignment */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SDG Alignment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sdgData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="sdg" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Alignment']}
                    />
                    <Bar dataKey="value" name="Alignment">
                      {sdgData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Impact Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Impact Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={impactMetrics}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {impactMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                        name
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Verification Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="h6">
                Verification Information
              </Typography>
            </Grid>
            <Grid item>
              <Chip 
                label={impactData.third_party_verifier ? "Verified" : "Pending"} 
                color={impactData.third_party_verifier ? "success" : "warning"}
                size="small"
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Verification Date:
              </Typography>
              <Typography variant="body1">
                {impactData.verification_date 
                  ? new Date(impactData.verification_date * 1000).toLocaleDateString() 
                  : 'Not verified'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Verified By:
              </Typography>
              <Typography variant="body1">
                {impactData.third_party_verifier || 'Not verified'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ImpactDashboard; 
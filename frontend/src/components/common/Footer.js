import React from 'react';
import { FaGithub, FaTwitter, FaDiscord } from 'react-icons/fa';
import { Box, Container, Typography, Grid, IconButton, Link as MuiLink } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const Footer = () => {
  const muiTheme = useMuiTheme();

  return (
    <Box 
      component="footer" 
      sx={{
        py: 5,
        mt: 8,
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--footer-text)',
        borderTop: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          {/* Left column - Brand */}
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1, 
                color: 'var(--footer-text)',
                fontWeight: 600,
                fontSize: '1.25rem'
              }}
            >
              <span style={{ color: muiTheme.palette.primary.light }}>Q</span>uantera Platform
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0, 
                color: 'var(--footer-text-muted)', 
                fontSize: '0.875rem',
                letterSpacing: 0.2 
              }}
            >
              Tokenized Financial Products
            </Typography>
          </Grid>
          
          {/* Middle column - Social Icons */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 0 } }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2.5, 
              justifyContent: 'center'
            }}>
              <IconButton 
                component={MuiLink} 
                href="https://github.com/mjohnson518/vault" 
                sx={{ 
                  color: 'var(--footer-text)',
                  '&:hover': {
                    color: muiTheme.palette.primary.light,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
                size="small"
              >
                <FaGithub size={20} />
              </IconButton>
              <IconButton 
                component={MuiLink} 
                href="#" 
                sx={{ 
                  color: 'var(--footer-text)',
                  '&:hover': {
                    color: muiTheme.palette.primary.light,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
                size="small"
              >
                <FaTwitter size={20} />
              </IconButton>
              <IconButton 
                component={MuiLink} 
                href="#" 
                sx={{ 
                  color: 'var(--footer-text)',
                  '&:hover': {
                    color: muiTheme.palette.primary.light,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
                size="small"
              >
                <FaDiscord size={20} />
              </IconButton>
            </Box>
          </Grid>
          
          {/* Right column - Copyright */}
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0, 
                color: 'var(--footer-text-muted)',
                fontSize: '0.875rem',
                letterSpacing: 0.1 
              }}
            >
              &copy; {new Date().getFullYear()} Quantera. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer; 
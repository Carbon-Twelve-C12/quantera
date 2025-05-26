import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Breadcrumbs,
  Link,
  Card,
  Button
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Home,
  ArrowRight,
  Construction
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentationContainer = styled(Container)({
  padding: '40px 0 80px',
  maxWidth: '1200px',
});

const BreadcrumbContainer = styled(Box)(({ theme }) => ({
  padding: '20px 0',
  borderBottom: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(52, 152, 219, 0.1)',
  marginBottom: '40px',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238',
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
}));

const PlaceholderCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 16px rgba(0, 0, 0, 0.3)' 
    : '0 2px 16px rgba(52, 152, 219, 0.08)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(52, 152, 219, 0.08)',
  textAlign: 'center',
  padding: '60px 40px',
}));

const ConstructionIcon = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(52, 152, 219, 0.3)' 
    : 'rgba(52, 152, 219, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  color: '#3498DB',
}));

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title = "Documentation Coming Soon",
  description = "This section of the documentation is currently under development."
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box>
      <DocumentationContainer>
        {/* Breadcrumbs */}
        <BreadcrumbContainer>
          <Breadcrumbs separator={<ArrowRight size={16} />}>
            <Link 
              color="inherit" 
              href="/docs" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
              }}
            >
              <Home size={16} style={{ marginRight: '4px' }} />
              Documentation
            </Link>
            <Typography color="text.primary" sx={{ color: '#3498DB', fontWeight: 600 }}>
              {title}
            </Typography>
          </Breadcrumbs>
        </BreadcrumbContainer>

        {/* Page Header */}
        <PageTitle>{title}</PageTitle>

        {/* Placeholder Content */}
        <PlaceholderCard>
          <ConstructionIcon>
            <Construction size={40} />
          </ConstructionIcon>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            marginBottom: '16px', 
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238' 
          }}>
            Coming Soon
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b', 
            marginBottom: '32px', 
            lineHeight: 1.6 
          }}>
            {description} We're working hard to bring you comprehensive documentation 
            for this section. In the meantime, check out our other available documentation.
          </Typography>
          
          <Button
            variant="contained"
            onClick={() => navigate('/docs')}
            sx={{
              background: 'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)',
              color: '#ffffff',
              fontWeight: 600,
              padding: '12px 24px',
              textTransform: 'none',
            }}
          >
            Back to Documentation
          </Button>
        </PlaceholderCard>
      </DocumentationContainer>
    </Box>
  );
}; 
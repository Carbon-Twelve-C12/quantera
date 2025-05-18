import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActionArea, 
  Chip, 
  Divider, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { AssetClass, AssetTemplate } from '../../types/assetTypes';
import AddIcon from '@mui/icons-material/Add';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CompatGrid from '../common/CompatGrid';

interface TemplateSelectionProps {
  assetClass: AssetClass;
  templates: AssetTemplate[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  assetClass,
  templates,
  selectedTemplateId,
  onSelect,
  isLoading,
  error
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!assetClass) {
    return (
      <Alert severity="warning">
        Please select an asset class first
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  const handleCreateTemplate = () => {
    // This would be implemented in a real system to actually create a template
    console.log('Creating template:', { name: newTemplateName, description: newTemplateDescription, assetClass });
    setShowCreateDialog(false);
    // Reset form
    setNewTemplateName('');
    setNewTemplateDescription('');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom align="center">
        Choose Template
      </Typography>
      <Typography variant="body1" paragraph align="center" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
        Select a template for your {assetClass.replace('_', ' ').toLowerCase()} asset or create a new one. Templates define the basic structure and modules available for your asset.
      </Typography>

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <CompatGrid container spacing={3}>
          {/* Create new template card */}
          <CompatGrid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: 320,
                display: 'flex', 
                flexDirection: 'column',
                border: '1px dashed #aaa',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                },
              }}
            >
              <CardActionArea 
                onClick={() => setShowCreateDialog(true)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}
              >
                <AddIcon fontSize="large" />
                <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                  Create New Template
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1, px: 2, maxWidth: '100%' }}>
                  Design a custom template for your specific needs
                </Typography>
              </CardActionArea>
            </Card>
          </CompatGrid>

          {/* Existing templates */}
          {templates.map((template) => (
            <CompatGrid item xs={12} sm={6} md={4} key={template.templateId}>
              <Card 
                sx={{ 
                  height: 320,
                  display: 'flex', 
                  flexDirection: 'column',
                  border: selectedTemplateId === template.templateId ? '2px solid #3f51b5' : 'none',
                  boxShadow: selectedTemplateId === template.templateId ? '0 4px 20px rgba(63, 81, 181, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => onSelect(template.templateId)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardHeader
                    title={template.name}
                    titleTypographyProps={{ 
                      variant: 'h6', 
                      align: 'center', 
                      noWrap: true,
                      sx: { 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        fontSize: '1.1rem'
                      }
                    }}
                    action={
                      <Chip 
                        icon={template.isPublic ? <PublicIcon /> : <LockIcon />} 
                        label={template.isPublic ? "Public" : "Private"}
                        size="small"
                        color={template.isPublic ? "success" : "default"}
                      />
                    }
                    sx={{
                      pb: 1
                    }}
                  />
                  <Divider />
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    p: 2
                  }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          Created by: {template.creator.slice(0, 6)}...{template.creator.slice(-4)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(template.creationDate * 1000).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" align="center">
                        {template.compatibleModules.length} compatible modules
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </CompatGrid>
          ))}

          {templates.length === 0 && (
            <CompatGrid item xs={12}>
              <Alert severity="info">
                No templates found for {assetClass.replace('_', ' ').toLowerCase()} assets. You can create a new template to get started.
              </Alert>
            </CompatGrid>
          )}
        </CompatGrid>
      </Box>

      {/* Create template dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Create a new template for {assetClass.replace('_', ' ').toLowerCase()} assets. This template will be available for future asset creation.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            variant="outlined"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newTemplateDescription}
            onChange={(e) => setNewTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTemplate} 
            variant="contained" 
            disabled={!newTemplateName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateSelection; 
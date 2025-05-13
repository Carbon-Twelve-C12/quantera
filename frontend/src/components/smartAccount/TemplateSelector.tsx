import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { SmartAccountTemplate } from '../../pages/SmartAccountPage';

interface TemplateSelectorProps {
  templates: SmartAccountTemplate[];
  selectedTemplateId: string | undefined;
  onSelectTemplate: (template: SmartAccountTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate
}) => {
  return (
    <Paper
      sx={{
        width: { xs: '100%', md: '300px' },
        maxHeight: '600px',
        overflow: 'auto'
      }}
      elevation={2}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">Account Templates</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a template to customize your smart account
        </Typography>
      </Box>
      
      <List disablePadding>
        {templates.map((template) => (
          <React.Fragment key={template.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedTemplateId === template.id}
                onClick={() => onSelectTemplate(template)}
              >
                <ListItemText
                  primary={template.name}
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {template.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      
      {templates.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No templates available
          </Typography>
        </Box>
      )}
      
      {/* Explanation of templates */}
      <Box sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          About Smart Account Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Templates provide pre-built functionality for common use cases:
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label="Yield Reinvestment" size="small" />
          <Chip label="Auto Trading" size="small" />
          <Chip label="Portfolio Rebalancing" size="small" />
          <Chip label="Conditional Transfers" size="small" />
          <Chip label="Delegation Rules" size="small" />
        </Box>
      </Box>
    </Paper>
  );
};

export default TemplateSelector; 
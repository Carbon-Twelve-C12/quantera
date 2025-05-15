import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  IconButton,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface ImageUploaderProps {
  imageUrl: string;
  onChange: (imageUrl: string) => void;
  defaultImage?: string;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  onChange,
  defaultImage = '/images/assets/placeholder.jpg',
  label = 'Asset Image'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // In a real application, you would upload the file to a server here
    // For this demo, we'll simulate an upload and use a local URL
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleUrlChange = () => {
    if (urlInput) {
      setIsUploading(true);
      // In a real app, you might want to validate the URL
      setTimeout(() => {
        onChange(urlInput);
        setIsUploading(false);
        setUseUrl(false);
        setUrlInput('');
      }, 500);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ mb: 2 }}>
        {!imageUrl && !useUrl ? (
          <Paper
            sx={{
              width: '100%',
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '2px dashed #ccc',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click to upload an image
            </Typography>
            <VisuallyHiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={(e) => {
                  e.stopPropagation();
                  setUseUrl(true);
                }}
              >
                Enter URL instead
              </Button>
            </Box>
          </Paper>
        ) : useUrl ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              helperText="Enter a URL for your asset image"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={handleUrlChange}
                disabled={!urlInput || isUploading}
              >
                {isUploading ? <CircularProgress size={24} /> : 'Set Image URL'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setUseUrl(false)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={imageUrl || defaultImage}
              alt="Asset Image"
              sx={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = defaultImage;
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 2,
                p: 0.5
              }}
            >
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={handleRemoveImage}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <VisuallyHiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </Box>
            {isUploading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 2
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageUploader; 
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  TextField,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useUrlInput } from '../../hooks/useValidation';

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

// Maximum file size for uploads (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  onChange,
  defaultImage = '/images/assets/placeholder.jpg',
  label = 'Asset Image'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use validated URL input hook - allows both http and https for images
  const urlInput = useUrlInput({
    initialValue: '',
    allowedProtocols: ['https', 'http'],
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setFileError(null);

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File too large. Maximum size is 5MB.');
      return;
    }

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
      reader.onerror = () => {
        setFileError('Failed to read file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleUrlSubmit = () => {
    // Validate URL before submitting
    const result = urlInput.validate();
    if (!result.valid) {
      return;
    }

    setIsUploading(true);
    // Use sanitized URL from validation
    const sanitizedUrl = result.sanitized as string;

    setTimeout(() => {
      onChange(sanitizedUrl);
      setIsUploading(false);
      setUseUrl(false);
      urlInput.reset();
    }, 500);
  };

  const handleCancelUrl = () => {
    setUseUrl(false);
    urlInput.reset();
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

      {/* File upload error alert */}
      {fileError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFileError(null)}>
          {fileError}
        </Alert>
      )}

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
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, GIF, WebP, SVG (max 5MB)
            </Typography>
            <VisuallyHiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
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
              value={urlInput.value}
              onChange={urlInput.onChange}
              onBlur={urlInput.onBlur}
              error={urlInput.isTouched && !!urlInput.error}
              helperText={
                urlInput.isTouched && urlInput.error
                  ? urlInput.error
                  : 'Enter a valid HTTPS or HTTP URL for your asset image'
              }
              placeholder="https://example.com/image.jpg"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleUrlSubmit}
                disabled={!urlInput.value || !urlInput.isValid || isUploading}
              >
                {isUploading ? <CircularProgress size={24} /> : 'Set Image URL'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelUrl}
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
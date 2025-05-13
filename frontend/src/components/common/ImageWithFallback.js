import React, { useState, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';

// Direct mapping of asset IDs to image paths for more reliable image loading
const assetImageMapping = {
  // Treasury assets
  'tbill-3m-2023q4': '/images/treasury-tbill.jpg',
  'tnote-5y-2023q3': '/images/treasury-tnote.jpg', 
  'tbond-30y-2023q3': '/images/treasury-tbond.jpg',
  'moneymarket-prime-2023': '/images/treasury-moneymarket.jpg',
  
  // Environmental assets
  '0x5f0f0e0d0c0b0a09080706050403020100000005': '/images/treasuries/amazon-rainforest.jpg',
  '0x5f0f0e0d0c0b0a09080706050403020100000006': '/images/treasuries/mangrove-restoration.jpg',
  '0x5f0f0e0d0c0b0a09080706050403020100000007': '/images/treasuries/highland-watershed.jpg',
  '0x5f0f0e0d0c0b0a09080706050403020100000008': '/images/treasuries/morocco-solar.jpg',
};

const ImageWithFallback = ({ src, alt, assetId, height = '180', style = {}, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [fallbacksAttempted, setFallbacksAttempted] = useState(0);
  
  useEffect(() => {
    // Determine the best image source in this order:
    // 1. Direct asset ID mapping (most reliable)
    // 2. Provided src prop
    // 3. Generic fallbacks
    if (assetId && assetImageMapping[assetId]) {
      setImageSrc(assetImageMapping[assetId]);
    } else {
      setImageSrc(src);
    }
    setImageError(false);
    setFallbacksAttempted(0);
  }, [src, assetId]);

  const handleError = () => {
    // Track fallback attempts to prevent infinite loops
    setFallbacksAttempted(prev => prev + 1);
    
    // Only try fallbacks if we haven't tried too many times
    if (fallbacksAttempted < 3) {
      // Try to derive a fallback based on the current path
      if (imageSrc.includes('treasury-')) {
        const assetType = imageSrc.split('treasury-')[1]?.split('.')[0];
        if (assetType) {
          // Try generic asset type image
          setImageSrc(`/images/treasury-${assetType}.jpg`);
          return;
        }
      } 
      
      // For treasury asset images
      if (imageSrc.includes('treasury-') && !imageSrc.includes('asset-placeholder')) {
        setImageSrc('/images/asset-placeholder.jpg');
        return;
      }
      
      // For environmental asset images
      if (imageSrc.includes('treasuries/') && !imageSrc.includes('asset-placeholder')) {
        setImageSrc('/images/asset-placeholder.jpg');
        return;
      }
      
      // Last resort fallback
      if (imageSrc !== '/images/asset-placeholder.jpg') {
        setImageSrc('/images/asset-placeholder.jpg');
        return;
      }
    }
    
    // If all fallbacks fail or we've tried too many, show error state
    setImageError(true);
  };

  if (imageError) {
    return (
      <div 
        className={`placeholder-img ${className}`}
        style={{ 
          ...style, 
          height: style.height || `${height}px`,
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <FaImage size={40} opacity={0.6} />
      </div>
    );
  }

  // Don't render until we have imageSrc determined
  if (!imageSrc) return null;

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleError}
      style={{ objectFit: 'cover', ...style }}
      className={className}
    />
  );
};

export default ImageWithFallback; 
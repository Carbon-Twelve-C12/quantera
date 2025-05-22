import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  assetId?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  assetId,
  className = '', 
  style = {} 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);

  const onError = () => {
    if (!fallbackUsed) {
      // First try asset type specific fallback
      if (assetId && assetId.includes('oil')) {
        setImgSrc('/images/assets/oil-barrel.jpg');
      } else if (assetId && assetId.includes('commodity')) {
        setImgSrc('/images/assets/commodity.jpg');
      } else if (assetId && assetId.includes('tbill')) {
        setImgSrc('/images/assets/treasury-bill.jpg');
      } else if (assetId && assetId.includes('tnote')) {
        setImgSrc('/images/assets/treasury-note.jpg');
      } else if (assetId && assetId.includes('tbond')) {
        setImgSrc('/images/assets/treasury-bond.jpg');
      } else {
        // Default fallback
        setImgSrc('/images/asset-placeholder.jpg');
      }
      setFallbackUsed(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={onError}
    />
  );
};

export default ImageWithFallback; 
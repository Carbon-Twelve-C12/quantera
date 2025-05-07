import React, { useState } from 'react';
import { FaImage } from 'react-icons/fa';

const ImageWithFallback = ({ src, alt, height = '180', style = {}, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div 
        className={`placeholder-img ${className}`}
        style={{ ...style, height: `${height}px` }}
      >
        <FaImage size={40} opacity={0.6} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      height={height}
      style={{ objectFit: 'cover', ...style }}
      className={className}
    />
  );
};

export default ImageWithFallback; 
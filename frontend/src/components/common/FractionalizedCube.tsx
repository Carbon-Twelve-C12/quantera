import React from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

// Keyframe animations - using transforms that don't conflict with positioning
const float = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(var(--cube-scale, 1));
  }
  50% {
    transform: translateY(-12px) scale(var(--cube-scale, 1));
  }
`;

const rotate = keyframes`
  0% {
    transform: rotateX(-20deg) rotateY(0deg);
  }
  100% {
    transform: rotateX(-20deg) rotateY(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0%, 100% {
    opacity: 0.4;
    filter: brightness(1);
  }
  50% {
    opacity: 0.7;
    filter: brightness(1.2);
  }
`;

const drift = keyframes`
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(3px, -4px);
  }
  50% {
    transform: translate(-2px, 3px);
  }
  75% {
    transform: translate(4px, 2px);
  }
`;

// Container for the entire cube scene
const CubeContainer = styled(Box)({
  width: '100%',
  maxWidth: '480px',
  height: '480px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  perspective: '1200px',
  perspectiveOrigin: '50% 50%',
});

// Scene wrapper that handles the overall rotation
const CubeScene = styled(Box)({
  width: '280px',
  height: '280px',
  position: 'relative',
  transformStyle: 'preserve-3d',
  animation: `${rotate} 25s linear infinite`,
});

// Position wrapper - handles 3D positioning without being affected by animation
interface CubePositionProps {
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
}

const CubePosition = styled(Box, {
  shouldForwardProp: (prop) => !['offsetX', 'offsetY', 'offsetZ'].includes(prop as string),
})<CubePositionProps>(({ offsetX = 0, offsetY = 0, offsetZ = 0 }) => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  marginLeft: '-24px',
  marginTop: '-24px',
  transformStyle: 'preserve-3d',
  transform: `translate3d(${offsetX}px, ${offsetY}px, ${offsetZ}px)`,
}));

// Individual small cube (token) - handles animation only
interface SmallCubeProps {
  delay?: number;
  scale?: number;
  brightness?: number;
}

const SmallCube = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'scale', 'brightness'].includes(prop as string),
})<SmallCubeProps>(({ delay = 0, scale = 1, brightness = 1 }) => ({
  '--cube-scale': scale,
  position: 'relative',
  width: '48px',
  height: '48px',
  transformStyle: 'preserve-3d',
  transform: `scale(${scale})`,
  animation: `${float} ${4 + (delay % 7) * 0.4}s ease-in-out infinite`,
  animationDelay: `${(delay % 10) * 0.15}s`,

  '& .face': {
    position: 'absolute',
    width: '48px',
    height: '48px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(4px)',
    transition: 'box-shadow 0.3s ease',
  },

  '& .front': {
    background: `linear-gradient(135deg,
      rgba(16, 185, 129, ${0.18 * brightness}) 0%,
      rgba(5, 150, 105, ${0.28 * brightness}) 100%)`,
    transform: 'translateZ(24px)',
    boxShadow: `0 0 24px rgba(16, 185, 129, ${0.35 * brightness}), inset 0 0 20px rgba(255, 255, 255, ${0.05 * brightness})`,
  },

  '& .back': {
    background: `linear-gradient(135deg,
      rgba(4, 120, 87, ${0.12 * brightness}) 0%,
      rgba(16, 185, 129, ${0.18 * brightness}) 100%)`,
    transform: 'translateZ(-24px) rotateY(180deg)',
  },

  '& .left': {
    background: `linear-gradient(135deg,
      rgba(16, 185, 129, ${0.14 * brightness}) 0%,
      rgba(6, 95, 70, ${0.2 * brightness}) 100%)`,
    transform: 'translateX(-24px) rotateY(-90deg)',
  },

  '& .right': {
    background: `linear-gradient(135deg,
      rgba(52, 211, 153, ${0.22 * brightness}) 0%,
      rgba(16, 185, 129, ${0.28 * brightness}) 100%)`,
    transform: 'translateX(24px) rotateY(90deg)',
    boxShadow: `inset 0 0 30px rgba(255, 255, 255, ${0.12 * brightness})`,
  },

  '& .top': {
    background: `linear-gradient(135deg,
      rgba(110, 231, 183, ${0.28 * brightness}) 0%,
      rgba(52, 211, 153, ${0.35 * brightness}) 100%)`,
    transform: 'translateY(-24px) rotateX(90deg)',
    boxShadow: `inset 0 0 30px rgba(255, 255, 255, ${0.18 * brightness})`,
  },

  '& .bottom': {
    background: `linear-gradient(135deg,
      rgba(6, 95, 70, ${0.1 * brightness}) 0%,
      rgba(4, 120, 87, ${0.15 * brightness}) 100%)`,
    transform: 'translateY(24px) rotateX(-90deg)',
  },
}));

// Floating particle effect
const Particle = styled(Box, {
  shouldForwardProp: (prop) => !['size', 'delay', 'x', 'y'].includes(prop as string),
})<{ size?: number; delay?: number; x?: number; y?: number }>(
  ({ size = 4, delay = 0, x = 0, y = 0 }) => ({
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.7)',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.9), 0 0 24px rgba(16, 185, 129, 0.4)',
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    animation: `${pulse} ${2.5 + delay * 0.3}s ease-in-out infinite, ${drift} ${5 + delay * 0.5}s ease-in-out infinite`,
    animationDelay: `${delay * 0.25}s`,
  })
);

// Connection lines between cubes
const ConnectionLine = styled(Box, {
  shouldForwardProp: (prop) => !['rotation', 'length', 'delay'].includes(prop as string),
})<{ rotation?: number; length?: number; delay?: number }>(
  ({ rotation = 0, length = 100, delay = 0 }) => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${length}px`,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
    transformOrigin: 'left center',
    transform: `rotate(${rotation}deg)`,
    animation: `${shimmer} ${3 + delay * 0.5}s ease-in-out infinite`,
    animationDelay: `${delay * 0.2}s`,
  })
);

// Glow effect behind the cube
const GlowEffect = styled(Box)({
  position: 'absolute',
  width: '380px',
  height: '380px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.06) 45%, transparent 70%)',
  filter: 'blur(50px)',
  animation: `${pulse} 5s ease-in-out infinite`,
});

// Secondary glow for depth
const InnerGlow = styled(Box)({
  position: 'absolute',
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 60%)',
  filter: 'blur(30px)',
  animation: `${pulse} 3s ease-in-out infinite`,
  animationDelay: '1s',
});

// Grid lines for futuristic effect
const GridOverlay = styled(Box)({
  position: 'absolute',
  width: '420px',
  height: '420px',
  opacity: 0.08,
  background: `
    linear-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 185, 129, 0.4) 1px, transparent 1px)
  `,
  backgroundSize: '35px 35px',
  transform: 'perspective(500px) rotateX(60deg) translateY(-60px)',
  maskImage: 'radial-gradient(circle, black 25%, transparent 65%)',
  WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 65%)',
});

const FractionalizedCube: React.FC = () => {
  // Define cube positions for 3x3x3 grid with some cubes "breaking away"
  const cubePositions = [
    // Core cube (center) - the anchor
    { x: 0, y: 0, z: 0, scale: 1, brightness: 1, delay: 0 },

    // Inner ring - tightly connected
    { x: -54, y: 0, z: 0, scale: 0.92, brightness: 0.95, delay: 1 },
    { x: 54, y: 0, z: 0, scale: 0.92, brightness: 0.98, delay: 2 },
    { x: 0, y: -54, z: 0, scale: 0.92, brightness: 1, delay: 3 },
    { x: 0, y: 54, z: 0, scale: 0.92, brightness: 0.9, delay: 4 },
    { x: 0, y: 0, z: -54, scale: 0.92, brightness: 0.85, delay: 5 },
    { x: 0, y: 0, z: 54, scale: 0.92, brightness: 0.93, delay: 6 },

    // Corners - "breaking away" effect
    { x: -62, y: -62, z: -62, scale: 0.78, brightness: 0.75, delay: 7 },
    { x: 62, y: -62, z: -62, scale: 0.74, brightness: 0.7, delay: 8 },
    { x: -62, y: 62, z: -62, scale: 0.72, brightness: 0.65, delay: 9 },
    { x: 62, y: 62, z: -62, scale: 0.7, brightness: 0.68, delay: 10 },
    { x: -62, y: -62, z: 62, scale: 0.76, brightness: 0.72, delay: 11 },
    { x: 62, y: -62, z: 62, scale: 0.73, brightness: 0.74, delay: 12 },
    { x: -62, y: 62, z: 62, scale: 0.71, brightness: 0.62, delay: 13 },
    { x: 62, y: 62, z: 62, scale: 0.8, brightness: 0.78, delay: 14 },

    // Edge fragments - drifting further out
    { x: -95, y: 0, z: 35, scale: 0.48, brightness: 0.52, delay: 15 },
    { x: 95, y: 25, z: -35, scale: 0.44, brightness: 0.48, delay: 16 },
    { x: 35, y: -95, z: 25, scale: 0.46, brightness: 0.5, delay: 17 },
    { x: -25, y: 100, z: -30, scale: 0.4, brightness: 0.44, delay: 18 },
    { x: 45, y: 35, z: 105, scale: 0.5, brightness: 0.54, delay: 19 },
    { x: -40, y: -45, z: -100, scale: 0.44, brightness: 0.46, delay: 20 },
  ];

  // Particle positions for ambient effect
  const particles = [
    { x: -130, y: -90, size: 3, delay: 0 },
    { x: 140, y: -70, size: 4, delay: 1 },
    { x: -110, y: 100, size: 3, delay: 2 },
    { x: 120, y: 110, size: 5, delay: 3 },
    { x: -150, y: 25, size: 2, delay: 4 },
    { x: 160, y: -25, size: 3, delay: 5 },
    { x: 5, y: -140, size: 4, delay: 6 },
    { x: 25, y: 150, size: 3, delay: 7 },
    { x: -80, y: -140, size: 2, delay: 8 },
    { x: 90, y: 130, size: 3, delay: 9 },
  ];

  // Connection lines for network effect
  const connectionLines = [
    { rotation: 0, length: 110, delay: 0 },
    { rotation: 45, length: 95, delay: 1 },
    { rotation: 90, length: 110, delay: 2 },
    { rotation: 135, length: 95, delay: 3 },
    { rotation: 180, length: 110, delay: 4 },
    { rotation: 225, length: 95, delay: 5 },
    { rotation: 270, length: 110, delay: 6 },
    { rotation: 315, length: 95, delay: 7 },
  ];

  return (
    <CubeContainer>
      <GridOverlay />
      <GlowEffect />
      <InnerGlow />

      {connectionLines.map((line, index) => (
        <ConnectionLine
          key={`line-${index}`}
          rotation={line.rotation}
          length={line.length}
          delay={line.delay}
        />
      ))}

      {particles.map((particle, index) => (
        <Particle
          key={`particle-${index}`}
          size={particle.size}
          delay={particle.delay}
          x={particle.x}
          y={particle.y}
        />
      ))}

      <CubeScene>
        {cubePositions.map((pos, index) => (
          <CubePosition
            key={`pos-${index}`}
            offsetX={pos.x}
            offsetY={pos.y}
            offsetZ={pos.z}
          >
            <SmallCube
              scale={pos.scale}
              brightness={pos.brightness}
              delay={pos.delay}
            >
              <div className="face front" />
              <div className="face back" />
              <div className="face left" />
              <div className="face right" />
              <div className="face top" />
              <div className="face bottom" />
            </SmallCube>
          </CubePosition>
        ))}
      </CubeScene>
    </CubeContainer>
  );
};

export default FractionalizedCube;

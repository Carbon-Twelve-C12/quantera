import React from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

// Keyframe animations
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
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

const drift = keyframes`
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(2px, -3px) scale(1.02);
  }
  50% {
    transform: translate(-1px, 2px) scale(0.98);
  }
  75% {
    transform: translate(3px, 1px) scale(1.01);
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
  animation: `${rotate} 20s linear infinite`,
});

// Individual small cube (token)
interface SmallCubeProps {
  delay?: number;
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
  scale?: number;
  brightness?: number;
}

const SmallCube = styled(Box, {
  shouldForwardProp: (prop) =>
    !['delay', 'offsetX', 'offsetY', 'offsetZ', 'scale', 'brightness'].includes(prop as string),
})<SmallCubeProps>(({ delay = 0, offsetX = 0, offsetY = 0, offsetZ = 0, scale = 1, brightness = 1 }) => ({
  position: 'absolute',
  width: '48px',
  height: '48px',
  transformStyle: 'preserve-3d',
  transform: `translate3d(${offsetX}px, ${offsetY}px, ${offsetZ}px) scale(${scale})`,
  animation: `${float} ${3 + delay * 0.5}s ease-in-out infinite`,
  animationDelay: `${delay * 0.2}s`,

  '& .face': {
    position: 'absolute',
    width: '48px',
    height: '48px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(2px)',
  },

  '& .front': {
    background: `linear-gradient(135deg,
      rgba(99, 102, 241, ${0.15 * brightness}) 0%,
      rgba(139, 92, 246, ${0.25 * brightness}) 100%)`,
    transform: 'translateZ(24px)',
    boxShadow: `0 0 20px rgba(99, 102, 241, ${0.3 * brightness})`,
  },

  '& .back': {
    background: `linear-gradient(135deg,
      rgba(79, 70, 229, ${0.1 * brightness}) 0%,
      rgba(99, 102, 241, ${0.15 * brightness}) 100%)`,
    transform: 'translateZ(-24px) rotateY(180deg)',
  },

  '& .left': {
    background: `linear-gradient(135deg,
      rgba(99, 102, 241, ${0.12 * brightness}) 0%,
      rgba(67, 56, 202, ${0.18 * brightness}) 100%)`,
    transform: 'translateX(-24px) rotateY(-90deg)',
  },

  '& .right': {
    background: `linear-gradient(135deg,
      rgba(129, 140, 248, ${0.2 * brightness}) 0%,
      rgba(99, 102, 241, ${0.25 * brightness}) 100%)`,
    transform: 'translateX(24px) rotateY(90deg)',
    boxShadow: `inset 0 0 30px rgba(255, 255, 255, ${0.1 * brightness})`,
  },

  '& .top': {
    background: `linear-gradient(135deg,
      rgba(165, 180, 252, ${0.25 * brightness}) 0%,
      rgba(129, 140, 248, ${0.3 * brightness}) 100%)`,
    transform: 'translateY(-24px) rotateX(90deg)',
    boxShadow: `inset 0 0 30px rgba(255, 255, 255, ${0.15 * brightness})`,
  },

  '& .bottom': {
    background: `linear-gradient(135deg,
      rgba(67, 56, 202, ${0.1 * brightness}) 0%,
      rgba(55, 48, 163, ${0.15 * brightness}) 100%)`,
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
    background: 'rgba(99, 102, 241, 0.6)',
    boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)',
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    animation: `${pulse} ${2 + delay}s ease-in-out infinite, ${drift} ${4 + delay}s ease-in-out infinite`,
    animationDelay: `${delay * 0.3}s`,
  })
);

// Glow effect behind the cube
const GlowEffect = styled(Box)({
  position: 'absolute',
  width: '350px',
  height: '350px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 70%)',
  filter: 'blur(40px)',
  animation: `${pulse} 4s ease-in-out infinite`,
});

// Grid lines for futuristic effect
const GridOverlay = styled(Box)({
  position: 'absolute',
  width: '400px',
  height: '400px',
  opacity: 0.1,
  background: `
    linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
  transform: 'perspective(500px) rotateX(60deg) translateY(-50px)',
  maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
  WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
});

const FractionalizedCube: React.FC = () => {
  // Define cube positions for 3x3x3 grid with some cubes "breaking away"
  const cubePositions = [
    // Core cubes (center)
    { x: 0, y: 0, z: 0, scale: 1, brightness: 1, delay: 0 },

    // Inner ring
    { x: -52, y: 0, z: 0, scale: 0.95, brightness: 0.9, delay: 1 },
    { x: 52, y: 0, z: 0, scale: 0.95, brightness: 0.95, delay: 2 },
    { x: 0, y: -52, z: 0, scale: 0.95, brightness: 1, delay: 3 },
    { x: 0, y: 52, z: 0, scale: 0.95, brightness: 0.85, delay: 4 },
    { x: 0, y: 0, z: -52, scale: 0.95, brightness: 0.8, delay: 5 },
    { x: 0, y: 0, z: 52, scale: 0.95, brightness: 0.9, delay: 6 },

    // Corners - "breaking away"
    { x: -60, y: -60, z: -60, scale: 0.8, brightness: 0.7, delay: 7 },
    { x: 60, y: -60, z: -60, scale: 0.75, brightness: 0.65, delay: 8 },
    { x: -60, y: 60, z: -60, scale: 0.7, brightness: 0.6, delay: 9 },
    { x: 60, y: 60, z: -60, scale: 0.72, brightness: 0.62, delay: 10 },
    { x: -60, y: -60, z: 60, scale: 0.78, brightness: 0.68, delay: 11 },
    { x: 60, y: -60, z: 60, scale: 0.76, brightness: 0.7, delay: 12 },
    { x: -60, y: 60, z: 60, scale: 0.73, brightness: 0.58, delay: 13 },
    { x: 60, y: 60, z: 60, scale: 0.82, brightness: 0.75, delay: 14 },

    // Edge fragments - further out
    { x: -90, y: 0, z: 30, scale: 0.5, brightness: 0.5, delay: 15 },
    { x: 90, y: 20, z: -30, scale: 0.45, brightness: 0.45, delay: 16 },
    { x: 30, y: -90, z: 20, scale: 0.48, brightness: 0.48, delay: 17 },
    { x: -20, y: 95, z: -25, scale: 0.42, brightness: 0.42, delay: 18 },
    { x: 40, y: 30, z: 100, scale: 0.52, brightness: 0.52, delay: 19 },
    { x: -35, y: -40, z: -95, scale: 0.46, brightness: 0.46, delay: 20 },
  ];

  // Particle positions for ambient effect
  const particles = [
    { x: -120, y: -80, size: 3, delay: 0 },
    { x: 130, y: -60, size: 4, delay: 1 },
    { x: -100, y: 90, size: 3, delay: 2 },
    { x: 110, y: 100, size: 5, delay: 3 },
    { x: -140, y: 20, size: 2, delay: 4 },
    { x: 150, y: -20, size: 3, delay: 5 },
    { x: 0, y: -130, size: 4, delay: 6 },
    { x: 20, y: 140, size: 3, delay: 7 },
  ];

  return (
    <CubeContainer>
      <GridOverlay />
      <GlowEffect />

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
          <SmallCube
            key={index}
            offsetX={pos.x}
            offsetY={pos.y}
            offsetZ={pos.z}
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
        ))}
      </CubeScene>
    </CubeContainer>
  );
};

export default FractionalizedCube;

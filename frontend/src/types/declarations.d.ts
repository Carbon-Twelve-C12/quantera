/**
 * Declaration file for modules without TypeScript definitions
 */

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Add declaration for certain libraries that might not have types
declare module 'react-awesome-library' {
  // Types for specific libraries if needed
  export const ExampleComponent: React.FC<{
    prop1: string;
    prop2?: number;
  }>;
  
  export function exampleFunction(arg: string): number;
}

// Global variables
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, listener: (...args: any[]) => void) => void;
    removeListener: (event: string, listener: (...args: any[]) => void) => void;
    selectedAddress?: string;
    networkVersion?: string;
  };
  web3?: any;
} 
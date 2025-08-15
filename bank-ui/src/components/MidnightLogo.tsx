import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface MidnightLogoProps {
  width?: number;
  height?: number;
  sx?: any;
}

export const MidnightLogo: React.FC<MidnightLogoProps> = ({ 
  width = 69, 
  height = 69, 
  sx = {} 
}) => {
  const { mode } = useTheme();
  
  // Use light logo on dark theme (white logo on dark background)
  // Use dark logo on light theme (dark logo on light background)
  const isDarkTheme = mode === 'dark';
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 69 69" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={sx}
    >
      <g>
        <path 
          d={isDarkTheme ? 
            "M34.086 0C15.2615 0 0 15.2599 0 34.086C0 52.9121 15.2599 68.172 34.086 68.172C52.9121 68.172 68.172 52.9105 68.172 34.086C68.172 15.2615 52.9105 0 34.086 0ZM34.086 61.8866C18.7565 61.8866 6.28536 49.4155 6.28536 34.086C6.28536 18.7565 18.7565 6.28536 34.086 6.28536C49.4155 6.28536 61.8867 18.7565 61.8867 34.086C61.8867 49.4155 49.4155 61.8866 34.086 61.8866Z" :
            "M34.5782 0C15.7537 0 0.492188 15.2599 0.492188 34.086C0.492188 52.9121 15.7521 68.172 34.5782 68.172C53.4043 68.172 68.6642 52.9105 68.6642 34.086C68.6642 15.2615 53.4027 0 34.5782 0ZM34.5782 61.8866C19.2487 61.8866 6.77755 49.4155 6.77755 34.086C6.77755 18.7565 19.2487 6.28536 34.5782 6.28536C49.9076 6.28536 62.3788 18.7565 62.3788 34.086C62.3788 49.4155 49.9076 61.8866 34.5782 61.8866Z"
          } 
          fill={isDarkTheme ? "white" : "#0A0A0A"}
        />
        <path 
          d={isDarkTheme ? 
            "M37.2856 30.8867H30.8865V37.2858H37.2856V30.8867Z" :
            "M37.7778 30.8867H31.3787V37.2858H37.7778V30.8867Z"
          } 
          fill={isDarkTheme ? "white" : "#0A0A0A"}
        />
        <path 
          d={isDarkTheme ? 
            "M37.2856 20.7832H30.8865V27.1823H37.2856V20.7832Z" :
            "M37.7778 20.7832H31.3787V27.1823H37.7778V20.7832Z"
          } 
          fill={isDarkTheme ? "white" : "#0A0A0A"}
        />
        <path 
          d={isDarkTheme ? 
            "M37.2856 10.6836H30.8865V17.0827H37.2856V10.6836Z" :
            "M37.7778 10.6836H31.3787V17.0827H37.7778V10.6836Z"
          } 
          fill={isDarkTheme ? "white" : "#0A0A0A"}
        />
      </g>
    </svg>
  );
};

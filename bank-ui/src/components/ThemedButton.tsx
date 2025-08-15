import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useTheme, createButtonStyles } from '../theme';

interface ThemedButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outlined';
  themeVariant?: 'primary' | 'secondary' | 'outlined';
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  themeVariant,
  sx,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  
  // Use themeVariant if provided, otherwise use variant
  const buttonVariant = themeVariant || variant;
  const buttonStyles = createButtonStyles(theme, buttonVariant);
  
  // Map our theme variants to MUI variants
  const muiVariant = buttonVariant === 'outlined' ? 'outlined' : 'contained';
  
  return (
    <Button
      variant={muiVariant}
      sx={[
        buttonStyles,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Button>
  );
};

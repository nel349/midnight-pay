import React from 'react';
import { Card, CardProps, CardContent, CardContentProps } from '@mui/material';
import { useTheme, createCardStyles } from '../theme';

interface ThemedCardProps extends Omit<CardProps, 'elevation'> {
  elevation?: 'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl';
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  elevation = 'default',
  sx,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const cardStyles = createCardStyles(theme);
  
  return (
    <Card
      sx={[
        cardStyles,
        {
          boxShadow: theme.shadows[elevation] as any,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Card>
  );
};

interface ThemedCardContentProps extends CardContentProps {}

export const ThemedCardContent: React.FC<ThemedCardContentProps> = ({
  sx,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <CardContent
      sx={{
        padding: theme.spacing[6],
        '&:last-child': {
          paddingBottom: theme.spacing[6],
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </CardContent>
  );
};

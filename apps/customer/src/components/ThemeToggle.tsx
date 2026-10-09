import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/joy';
import { useColorScheme } from '@mui/joy/styles';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'plain' | 'solid' | 'soft';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'sm', variant = 'outlined' }) => {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IconButton size={size} variant={variant} sx={{ width: 36, height: 36, opacity: 0 }} />;
  }

  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="bottom">
      <IconButton
        size={size}
        variant={variant}
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        aria-label="Toggle light / dark mode"
        sx={{
          borderRadius: '12px',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          color: isDark ? '#fbbf24' : '#d97706',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            transform: 'scale(1.05)'
          }
        }}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </IconButton>
    </Tooltip>
  );
};

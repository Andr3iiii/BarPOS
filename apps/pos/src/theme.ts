import { extendTheme } from '@mui/joy/styles';

export const posTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#e05624',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          solidBg: '#e05624',
          solidHoverBg: '#c8461b',
          solidActiveBg: '#b13b15',
          softBg: 'rgba(224, 86, 36, 0.12)',
          softColor: '#ea580c',
          softHoverBg: 'rgba(224, 86, 36, 0.2)',
          outlinedBorder: 'rgba(224, 86, 36, 0.35)',
          outlinedColor: '#ea580c'
        },
        background: {
          body: '#f8fafc',
          surface: '#ffffff',
          level1: '#f1f5f9',
          level2: '#e2e8f0',
          level3: '#cbd5e1'
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#94a3b8'
        },
        divider: 'rgba(15, 23, 42, 0.08)'
      }
    },
    dark: {
      palette: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#e05624',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          solidBg: '#e05624',
          solidHoverBg: '#c8461b',
          solidActiveBg: '#b13b15',
          softBg: 'rgba(224, 86, 36, 0.15)',
          softColor: '#ff7a45',
          softHoverBg: 'rgba(224, 86, 36, 0.25)',
          outlinedBorder: 'rgba(224, 86, 36, 0.35)',
          outlinedColor: '#ff7a45'
        },
        background: {
          body: '#0a0b12',
          surface: '#121420',
          level1: '#181b2a',
          level2: '#202438',
          level3: '#2a304a'
        },
        text: {
          primary: '#f4f4f5',
          secondary: '#94a3b8',
          tertiary: '#64748b'
        },
        divider: 'rgba(255, 255, 255, 0.08)'
      }
    }
  },
  fontFamily: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
});

// VoiceLoopHR Unified Design System
// Modern thin lines and thin text theme

export interface DesignTokens {
  // Colors
  colors: {
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    info: string
    
    // Backgrounds
    background: {
      primary: string
      secondary: string
      tertiary: string
      glass: string
      glassDark: string
      modal: string
      modalDark: string
      card: string
      cardDark: string
    }
    
    // Text
    text: {
      primary: string
      secondary: string
      tertiary: string
      muted: string
      inverse: string
      accent: string
    }
    
    // Borders
    border: {
      primary: string
      secondary: string
      tertiary: string
      glass: string
      glassDark: string
      modal: string
      modalDark: string
      thin: string
      thinDark: string
    }
    
    // Shadows
    shadow: {
      sm: string
      md: string
      lg: string
      xl: string
      modal: string
      modalDark: string
    }
  }
  
  // Typography
  typography: {
    fontFamily: {
      primary: string
      secondary: string
      mono: string
    }
    
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
    }
    
    fontWeight: {
      thin: number
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
      extrabold: number
    }
    
    lineHeight: {
      tight: string
      normal: string
      relaxed: string
      loose: string
    }
    
    letterSpacing: {
      tight: string
      normal: string
      wide: string
      wider: string
    }
  }
  
  // Spacing
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  
  // Border Radius
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    full: string
  }
  
  // Transitions
  transition: {
    fast: string
    normal: string
    slow: string
    ease: string
    easeIn: string
    easeOut: string
    easeInOut: string
  }
  
  // Z-Index
  zIndex: {
    base: number
    dropdown: number
    sticky: number
    modal: number
    overlay: number
    tooltip: number
    toast: number
  }
}

// Light Theme Design Tokens
export const lightTheme: DesignTokens = {
  colors: {
    primary: '#0f172a',
    secondary: '#64748b',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      glass: 'rgba(255, 255, 255, 0.8)',
      glassDark: 'rgba(255, 255, 255, 0.6)',
      modal: 'rgba(255, 255, 255, 0.95)',
      modalDark: 'rgba(255, 255, 255, 0.9)',
      card: 'rgba(255, 255, 255, 0.9)',
      cardDark: 'rgba(255, 255, 255, 0.7)',
    },
    
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      muted: '#94a3b8',
      inverse: '#ffffff',
      accent: '#3b82f6',
    },
    
    border: {
      primary: 'rgba(15, 23, 42, 0.08)',
      secondary: 'rgba(15, 23, 42, 0.06)',
      tertiary: 'rgba(15, 23, 42, 0.04)',
      glass: 'rgba(15, 23, 42, 0.12)',
      glassDark: 'rgba(15, 23, 42, 0.08)',
      modal: 'rgba(15, 23, 42, 0.1)',
      modalDark: 'rgba(15, 23, 42, 0.08)',
      thin: '1px solid rgba(15, 23, 42, 0.06)',
      thinDark: '1px solid rgba(15, 23, 42, 0.04)',
    },
    
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      modal: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      modalDark: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '0.9375rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.25rem',
      '3xl': '1.5rem',
      '4xl': '1.875rem',
    },
    
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  transition: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,
    overlay: 1040,
    tooltip: 1070,
    toast: 1080,
  },
}

// Dark Theme Design Tokens
export const darkTheme: DesignTokens = {
  colors: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    accent: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#22d3ee',
    
    background: {
      primary: '#000000',
      secondary: '#0a0a0a',
      tertiary: '#1a1a1a',
      glass: 'rgba(255, 255, 255, 0.08)',
      glassDark: 'rgba(255, 255, 255, 0.06)',
      modal: 'rgba(0, 0, 0, 0.95)',
      modalDark: 'rgba(0, 0, 0, 0.9)',
      card: 'rgba(255, 255, 255, 0.05)',
      cardDark: 'rgba(255, 255, 255, 0.03)',
    },
    
    text: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#000000',
      accent: '#60a5fa',
    },
    
    border: {
      primary: 'rgba(255, 255, 255, 0.12)',
      secondary: 'rgba(255, 255, 255, 0.08)',
      tertiary: 'rgba(255, 255, 255, 0.06)',
      glass: 'rgba(255, 255, 255, 0.2)',
      glassDark: 'rgba(255, 255, 255, 0.15)',
      modal: 'rgba(255, 255, 255, 0.15)',
      modalDark: 'rgba(255, 255, 255, 0.12)',
      thin: '1px solid rgba(255, 255, 255, 0.08)',
      thinDark: '1px solid rgba(255, 255, 255, 0.06)',
    },
    
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
      modal: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      modalDark: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    },
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '0.9375rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.25rem',
      '3xl': '1.5rem',
      '4xl': '1.875rem',
    },
    
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  transition: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,
    overlay: 1040,
    tooltip: 1070,
    toast: 1080,
  },
}

// Utility function to get theme
export function getTheme(isDarkMode: boolean): DesignTokens {
  return isDarkMode ? darkTheme : lightTheme
}

// Common component styles
export const componentStyles = {
  // Modal styles
  modal: {
    overlay: (isDarkMode: boolean) => ({
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    
    container: (isDarkMode: boolean) => ({
      background: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.08)',
      boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative' as const,
    }),
    
    header: (isDarkMode: boolean) => ({
      padding: '20px 24px',
      borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
    
    content: {
      padding: '24px',
    },
    
    closeButton: (isDarkMode: boolean) => ({
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    }),
  },
  
  // Card styles
  card: {
    container: (isDarkMode: boolean) => ({
      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '12px',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
      padding: '20px',
      backdropFilter: 'blur(10px)',
    }),
  },
  
  // Button styles
  button: {
    primary: (isDarkMode: boolean) => ({
      background: isDarkMode ? '#60a5fa' : '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '0.9375rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    
    secondary: (isDarkMode: boolean) => ({
      background: 'transparent',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '0.9375rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    
    ghost: (isDarkMode: boolean) => ({
      background: 'transparent',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '0.9375rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  
  // Input styles
  input: {
    container: (isDarkMode: boolean) => ({
      background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '0.9375rem',
      color: isDarkMode ? '#ffffff' : '#0f172a',
      outline: 'none',
      transition: 'all 0.2s ease',
    }),
  },
  
  // Typography styles
  typography: {
    h1: (isDarkMode: boolean) => ({
      fontSize: '1.875rem',
      fontWeight: 600,
      color: isDarkMode ? '#ffffff' : '#0f172a',
      letterSpacing: '-0.025em',
      lineHeight: '1.25',
      margin: '0 0 16px 0',
    }),
    
    h2: (isDarkMode: boolean) => ({
      fontSize: '1.5rem',
      fontWeight: 600,
      color: isDarkMode ? '#ffffff' : '#0f172a',
      letterSpacing: '-0.025em',
      lineHeight: '1.25',
      margin: '0 0 12px 0',
    }),
    
    h3: (isDarkMode: boolean) => ({
      fontSize: '1.25rem',
      fontWeight: 500,
      color: isDarkMode ? '#ffffff' : '#0f172a',
      letterSpacing: '-0.025em',
      lineHeight: '1.25',
      margin: '0 0 8px 0',
    }),
    
    body: (isDarkMode: boolean) => ({
      fontSize: '0.9375rem',
      fontWeight: 400,
      color: isDarkMode ? '#e2e8f0' : '#475569',
      lineHeight: '1.5',
      margin: '0 0 8px 0',
    }),
    
    caption: (isDarkMode: boolean) => ({
      fontSize: '0.875rem',
      fontWeight: 400,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      lineHeight: '1.4',
      margin: '0 0 4px 0',
    }),
  },
}

export type ThemeMode = 'light' | 'dark';

export interface CustomerTheme {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBackground: string;
  accent: string;
  accentContrast: string;
  warning: string;
  success: string;
  danger: string;
  dangerBackground: string;
  dangerBorder: string;
  modalOverlay: string;
}

export const themeStorageKey = 'customer_theme_mode';

export const customerThemes: Record<ThemeMode, CustomerTheme> = {
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    border: '#E5E7EB',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    inputBackground: '#F3F4F6',
    accent: '#EA580C',
    accentContrast: '#FFFFFF',
    warning: '#F59E0B',
    success: '#16A34A',
    danger: '#EF4444',
    dangerBackground: '#FEF2F2',
    dangerBorder: '#FECACA',
    modalOverlay: 'rgba(0,0,0,0.5)'
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#111827',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    inputBackground: '#334155',
    accent: '#F97316',
    accentContrast: '#FFFFFF',
    warning: '#FDBA74',
    success: '#4ADE80',
    danger: '#F87171',
    dangerBackground: '#7F1D1D',
    dangerBorder: '#B91C1C',
    modalOverlay: 'rgba(2,6,23,0.8)'
  }
};

// src/branding/applyTheme.js
export function applyTheme(theme) {
  const root = document.documentElement;

  root.style.setProperty("--phs-bg", theme.colors.bg);
  root.style.setProperty("--phs-surface", theme.colors.surface);
  root.style.setProperty("--phs-border", theme.colors.border);
  root.style.setProperty("--phs-text", theme.colors.text);
  root.style.setProperty("--phs-muted", theme.colors.muted);
  root.style.setProperty("--phs-primary", theme.colors.primary);
  root.style.setProperty("--phs-primary-soft", theme.colors.primarySoft);

  root.style.setProperty("--phs-font", theme.typography.fontFamily);

  root.style.setProperty("--phs-radius-lg", theme.radii.lg);
  root.style.setProperty("--phs-radius-xl", theme.radii.xl);
  root.style.setProperty("--phs-radius-pill", theme.radii.pill);

  root.style.setProperty("--phs-shadow-soft", theme.shadows.soft);
}

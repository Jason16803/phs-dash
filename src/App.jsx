import { Route } from 'react-router-dom';
import { DashboardApp, SettingsPage, PriceBookPage } from '@sfg/dashboard-core';
import { serviceConfig } from '@sfg/umbrella-service-web';

// Pages — all come from umbrella-service-web
import {
  DashboardPage,
  CustomersPage,
  CustomerNewPage,
  CustomerDetailPage,
  JobsPage,
  JobNewPage,
  JobDetailPage,
  // PriceBookPage,
  CalendarPage,
  LeadsPage,
  InvoicesPage,
} from '@sfg/umbrella-service-web';

// PHS brand overrides
const phsConfig = {
  ...serviceConfig,
  apiBaseUrl: import.meta.env.VITE_CORE_BASE_URL
    ? `${import.meta.env.VITE_CORE_BASE_URL}/api/v1`
    : '/api/v1',
  labels: {
    appName:       'Preferred Home Solutions Dashboard',
    loginTitle:    'Preferred Home Solutions LLC',
    loginSubtitle: 'Dashboard Login',
  },
  theme: {
    cssVariables: {
      '--color-primary':        '#15416b',
      '--color-primary-hover':  '#0f2a45',
      '--color-primary-light':  '#d0e4f5',
      '--color-background':     '#ffffff',
      '--color-surface':        '#f9fafb',
      '--color-border':         '#e5e7eb',
      '--color-text-primary':   '#111827',
      '--color-text-secondary': '#6b7280',
      '--color-error':          '#dc2626',
      '--color-success':        '#0f766e',
      '--topbar-height':        '64px',
      '--font-family':          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--radius-sm':            '4px',
      '--radius-md':            '6px',
      '--radius-lg':            '12px',
      '--shadow-sm':            '0 1px 2px rgba(15, 23, 42, 0.05)',
      '--shadow-md':            '0 4px 10px rgba(15, 23, 42, 0.08)',
      '--shadow-lg':            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
  },
  navigation: [
    ...serviceConfig.navigation,
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
    },
  ],
};

export default function App() {
  const routes = (
    <>
      <Route path="dashboard"      element={<DashboardPage />} />
      <Route path="jobs"           element={<JobsPage />} />
      <Route path="jobs/new"       element={<JobNewPage />} />
      <Route path="jobs/:id"       element={<JobDetailPage />} />
      <Route path="calendar"       element={<CalendarPage />} />
      <Route path="leads"          element={<LeadsPage />} />
      <Route path="invoices"       element={<InvoicesPage />} />
      <Route path="settings"       element={<SettingsPage />} />
      <Route path="price-book"     element={<PriceBookPage />} />
      <Route path="customers"      element={<CustomersPage />} />
      <Route path="customers/new"  element={<CustomerNewPage />} />
      <Route path="customers/:id"  element={<CustomerDetailPage />} />
    </>
  );

  return <DashboardApp config={phsConfig} routes={routes} />;
}
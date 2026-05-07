import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/components/shared/AppProviders';
import { Dashboard } from '@/pages/dashboard';
import './index.css';

/**
 * Microfrontend entry point — exposed as `remote_app/Page`.
 * Uses MemoryRouter for full routing isolation from the host app.
 * The host app does NOT need to provide a router context.
 */
export default function Page() {
  return (
    <MemoryRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add generated routes here */}
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

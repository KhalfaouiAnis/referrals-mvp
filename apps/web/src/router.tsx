import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('./features/auth/LoginPage');
      return { Component: LoginPage };
    },
  },

  // Protected routes
  {
    path: '/',
    Component: AppShell,
    errorElement: <RouteError />,
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import('./features/dashboard/DashboardPage');
          return { Component: DashboardPage };
        },
      },
      {
        path: 'referrals',
        lazy: async () => {
          try {
            const { ReferralsListPage } = await import('./features/referrals-list/ReferralsListPage');
            return { Component: ReferralsListPage };
          } catch (e) {
            console.error('Lazy load failed:', e);
            throw e;
          }
        },
      },
      {
        path: 'referrals/new',
        lazy: async () => {
          try {
            const { CreateReferralWizard } = await import('./features/create-referral/CreateReferralWizard');
            return { Component: CreateReferralWizard };
          } catch (e) {
            console.error('Lazy load failed:', e);
            throw e;
          }
        },
      },
      {
        path: 'referrals/:id',
        lazy: async () => {
          const { ReferralProfilePage } = await import('./features/referral-profile/ReferralProfilePage');
          return { Component: ReferralProfilePage };
        },
      },
    ],
  },

  // 404 fallback
  {
    path: '*',
    lazy: async () => {
      const { NotFoundPage } = await import('./features/NotFoundPage');
      return { Component: NotFoundPage };
    },
  },
]);

/** Error UI shown when a lazy route chunk fails to load */
function RouteError() {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h2 style={{ color: '#D32F2F' }}>Page failed to load</h2>
      <p style={{ color: '#666' }}>
        A component crashed or could not be imported.
      </p>
      <button
        onClick={() => window.location.replace('/')}
        style={{
          marginTop: 16,
          padding: '8px 24px',
          background: '#1976D2',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Go home
      </button>
    </div>
  );
}

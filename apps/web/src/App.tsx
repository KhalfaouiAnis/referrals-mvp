import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, SnackbarCloseReason, Snackbar, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { queryClient } from './api/queryClient';
import { router } from './router';
import { theme } from './lib/theme';
import { connectWebSocket } from './lib/websocket';
import { useAuthStore } from './store/auth.store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useUiStore } from './store/ui.store';

export default function App() {
  const isAuthenticated = useAuthStore(store => store.isAuthenticated);
  const toast = useUiStore((state) => state.toast);
  const closeToast = useUiStore((state) => state.closeToast);

  useEffect(() => {
    if (!isAuthenticated) return;
    const disconnect = connectWebSocket();
    return disconnect;
  }, [isAuthenticated]);

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === "clickaway") return;
    closeToast();
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            <RouterProvider router={router} />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
      <Snackbar
        open={toast.open}
        onClose={handleClose}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          onClose={handleClose}
          sx={{ width: "100%" }}
          severity={toast.severity}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ErrorBoundary>
  );
}

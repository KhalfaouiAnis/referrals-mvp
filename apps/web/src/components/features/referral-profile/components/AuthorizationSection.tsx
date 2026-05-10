import { Alert, Box, Chip, Divider, Stack, Typography } from '@mui/material';

interface AuthRequest {
  id: string;
  status: string;
  authNumber: string | null;
  denialReason: string | null;
  modifications: string | null;
  validFrom: string | null;
  validTo: string | null;
  submittedAt: string | null;
  resolvedAt: string | null;
}

const AUTH_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  NOT_REQUIRED: 'default',
  PENDING: 'warning',
  APPROVED: 'success',
  APPROVED_WITH_MODIFICATIONS: 'info',
  DENIED: 'error',
  APPEALING: 'warning',
};

export function AuthorizationSection({ authRequests }: { authRequests: AuthRequest[] }) {
  if (!authRequests?.length) {
    return (
      <Box>
        <Typography variant="subtitle2" mb={1}>Authorization</Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          No authorization requests submitted yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" mb={1}>Authorization</Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={1.5}>
        {authRequests.map((auth) => (
          <Box key={auth.id} p={2} border="1px solid" borderColor="divider" borderRadius={2}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <Chip
                label={auth.status.replace(/_/g, ' ')}
                color={AUTH_COLOR[auth.status] ?? 'default'}
                size="small"
              />
              {auth.authNumber && (
                <Typography variant="caption" color="text.secondary">
                  Auth #{auth.authNumber}
                </Typography>
              )}
            </Stack>

            {auth.denialReason && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="caption">{auth.denialReason}</Typography>
              </Alert>
            )}

            {auth.modifications && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="caption">Modifications: {auth.modifications}</Typography>
              </Alert>
            )}

            {(auth.validFrom || auth.validTo) && (
              <Typography variant="caption" color="text.secondary">
                Valid: {auth.validFrom ?? '?'} → {auth.validTo ?? '?'}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

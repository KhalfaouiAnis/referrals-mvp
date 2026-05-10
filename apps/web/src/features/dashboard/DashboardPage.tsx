import { Box, Stack, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SummaryCards } from './components/SummaryCards';
import {
  ReferralsByStatusPie,
  ReferralsBySpecialtyBar,
  TimeToScheduleLine,
  AuthApprovalRateCard,
} from './components/Charts';
import { useAnalytics } from '../../api/hooks/useAnalytics';

export function DashboardPage() {
  const { data, isFetching, refetch } = useAnalytics();
  const dashboard = (data as { data?: typeof data })?.data ?? data;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of referral operations
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          disabled={isFetching}
          onClick={() => refetch()}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Stack>

      <Stack spacing={3}>
        {/* KPI cards */}
        <SummaryCards stats={dashboard?.stats} loading={isFetching} />

        {/* Row 1 — status pie + specialty bar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <ReferralsByStatusPie data={dashboard?.byStatus} loading={isFetching} />
          <ReferralsBySpecialtyBar data={dashboard?.bySpecialty} loading={isFetching} />
        </Stack>

        {/* Row 2 — time trend + auth rate */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TimeToScheduleLine data={dashboard?.timeToSchedule} loading={isFetching} />
          <AuthApprovalRateCard data={dashboard?.authApprovalRate} loading={isFetching} />
        </Stack>
      </Stack>
    </Box>
  );
}

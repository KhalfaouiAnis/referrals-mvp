import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PendingIcon from '@mui/icons-material/Pending';
import { DashboardStats } from '../../../api/services/analytics.service';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 180 }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} />
            ) : (
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ stats, loading }: { stats?: DashboardStats; loading: boolean }) {
  return (
    <Stack
      spacing={2}
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 2 }}
    >
      <StatCard label="Total referrals" value={stats?.totalReferrals ?? 0} icon={<AssignmentIcon />} color="#1976D2" loading={loading} />
      <StatCard label="Completion rate" value={`${stats?.completionRate ?? 0}%`} icon={<CheckCircleIcon />} color="#2E7D32" loading={loading} />
      <StatCard label="Avg days to close" value={stats?.avgDaysToCompletion?.toFixed(1) ?? '—'} icon={<ScheduleIcon />} color="#ED6C02" loading={loading} />
      <StatCard label="Pending auth" value={stats?.pendingAuthorizations ?? 0} icon={<PendingIcon />} color="#D32F2F" loading={loading} />
    </Stack>
  );
}

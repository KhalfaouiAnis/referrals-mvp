import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';
import { Paper, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ReferralStatus } from '@referrals/shared';
import { AuthApprovalRate, ReferralsBySpecialty, ReferralsByStatus, TimeToSchedulePoint } from '../../../api/services/analytics.service';
import { useUiStore } from '../../../store/ui.store';

const STATUS_COLORS: Record<string, string> = {
  INTAKE: '#90CAF9', CLINICAL_PREP: '#64B5F6', AUTHORIZATION: '#FFA726',
  READY_TO_SUBMIT: '#AB47BC', SUBMITTED: '#42A5F5', SCHEDULING: '#26A69A',
  CLOSED: '#66BB6A', CANCELLED: '#BDBDBD', AUTH_DENIED: '#EF5350',
};

function ChartCard({ title, children, loading }: {
  title: string; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, flex: 1, minWidth: 280 }}>
      <Typography variant="subtitle2" mb={2}>{title}</Typography>
      {loading ? <Skeleton variant="rectangular" height={220} /> : children}
    </Paper>
  );
}

export function ReferralsByStatusPie({
  data, loading,
}: { data?: ReferralsByStatus[]; loading: boolean }) {
  const navigate = useNavigate();
  const setReferralFilters = useUiStore(s => s.setReferralFilters);

  const handleClick = (entry: { status: string }) => {
    setReferralFilters({ status: [entry.status as ReferralStatus] });
    navigate('/referrals');
  };

  return (
    <ChartCard title="Referrals by status" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data ?? []}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={80}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {(data ?? []).map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? '#90A4AE'}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [v, String(name).replace(/_/g, ' ')]} />
          <Legend formatter={(v) => String(v).replace(/_/g, ' ')} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ReferralsBySpecialtyBar({
  data, loading,
}: { data?: ReferralsBySpecialty[]; loading: boolean }) {
  const navigate = useNavigate();
  const setReferralFilters = useUiStore(s => s.setReferralFilters);

  return (
    <ChartCard title="Referrals by specialty" loading={loading}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data ?? []} margin={{ left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="specialty"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(0, 5)}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip formatter={(v) => [v, 'Referrals']} labelFormatter={(l: string) => l.replace(/_/g, ' ')} />
          <Bar
            dataKey="count"
            fill="#1976D2"
            radius={[4, 4, 0, 0]}
            onClick={(d: { specialty: string }) => {
              setReferralFilters({ specialtyType: [d.specialty as never] });
              navigate('/referrals');
            }}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TimeToScheduleLine({
  data, loading,
}: { data?: TimeToSchedulePoint[]; loading: boolean }) {
  return (
    <ChartCard title="Avg days to scheduling (12 weeks)" loading={loading}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data ?? []} margin={{ left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} unit="d" />
          <Tooltip formatter={(v) => [`${v} days`, 'Avg time']} />
          <Line
            type="monotone"
            dataKey="avgDays"
            stroke="#1976D2"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AuthApprovalRateCard({
  data, loading,
}: { data?: AuthApprovalRate; loading: boolean }) {
  const chartData = data
    ? [
      { name: 'Approved', value: data.approved, fill: '#2E7D32' },
      { name: 'Approved w/ mods', value: data.approvedWithMods, fill: '#66BB6A' },
      { name: 'Pending', value: data.pending, fill: '#FFA726' },
      { name: 'Denied', value: data.denied, fill: '#D32F2F' },
    ]
    : [];

  return (
    <ChartCard title="Authorization outcomes" loading={loading}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

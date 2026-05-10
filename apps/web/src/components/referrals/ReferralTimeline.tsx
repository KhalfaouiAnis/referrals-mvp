import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
import { Typography, Chip, Box } from '@mui/material';
import { format } from 'date-fns';

interface AuditEntry {
  id: string;
  action: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string | null;
  actor: { fullName: string; role: string };
  createdAt: string;
}

const ACTION_COLOR: Record<
  string,
  'primary' | 'success' | 'error' | 'warning' | 'grey'
> = {
  STATUS_CHANGED: 'primary',
  NOTE_ADDED: 'grey',
  DOCUMENT_UPLOADED: 'success',
  PRIORITY_UPDATED: 'warning',
  SPECIALIST_ASSIGNED: 'primary',
};

const ACTION_LABEL: Record<string, string> = {
  STATUS_CHANGED: 'Status changed',
  NOTE_ADDED: 'Note added',
  DOCUMENT_UPLOADED: 'Document uploaded',
  PRIORITY_UPDATED: 'Priority updated',
  SPECIALIST_ASSIGNED: 'Specialist assigned',
  REFERRAL_CREATED: 'Referral created',
  REFERRAL_UPDATED: 'Referral updated',
  DOCUMENT_DELETED: 'Document deleted',
};

interface Props {
  logs: AuditEntry[];
}

export function ReferralTimeline({ logs }: Props) {

  if (logs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No activity recorded yet.
      </Typography>
    );
  }

  return (
    <Timeline position="right" sx={{ px: 0, mx: 0 }}>
      {logs.map((log, idx) => (
        <TimelineItem key={log.id}>
          <TimelineOppositeContent
            sx={{ flex: 0.3, pr: 2 }}
            variant="caption"
            color="text.secondary"
          >
            {format(new Date(log.createdAt), 'MMM d, h:mm a')}
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot
              color={ACTION_COLOR[log.action] ?? 'grey'}
              variant="outlined"
            />
            {idx < logs.length - 1 && <TimelineConnector />}
          </TimelineSeparator>

          <TimelineContent sx={{ pb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                size="small"
                variant="outlined"
                color={ACTION_COLOR[log.action] ?? 'default'}
                label={ACTION_LABEL[log.action] ?? log.action}
              />
              {log.action === 'STATUS_CHANGED' &&
                log.beforeState?.status &&
                log.afterState?.status && (
                  <Typography variant="caption" color="text.secondary">
                    {String(log.beforeState.status).replace(/_/g, ' ')} →{' '}
                    {String(log.afterState.status).replace(/_/g, ' ')}
                  </Typography>
                )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={0.5}
            >
              by {log.actor.fullName}
            </Typography>
            {log.reason && (
              <Typography
                variant="body2"
                mt={0.5}
                color="text.secondary"
                fontStyle="italic"
              >
                &ldquo;{log.reason}&rdquo;
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

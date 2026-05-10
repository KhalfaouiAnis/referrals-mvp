import Chip, { ChipProps } from '@mui/material/Chip';
import { ReferralStatus, STATUS_LABELS } from '@referrals/shared';

const STATUS_COLOR: Record<
  ReferralStatus,
  ChipProps['color']
> = {
  [ReferralStatus.INTAKE]: 'default',
  [ReferralStatus.CLINICAL_PREP]: 'info',
  [ReferralStatus.AUTHORIZATION]: 'warning',
  [ReferralStatus.READY_TO_SUBMIT]: 'secondary',
  [ReferralStatus.SUBMITTED]: 'primary',
  [ReferralStatus.SCHEDULING]: 'primary',
  [ReferralStatus.CLOSED]: 'success',
  [ReferralStatus.CANCELLED]: 'default',
  [ReferralStatus.AUTH_DENIED]: 'error',
};

interface StatusBadgeProps {
  status: ReferralStatus;
  size?: ChipProps['size'];
}

export function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  return (
    <Chip
      size={size}
      variant="filled"
      label={STATUS_LABELS[status] ?? status}
      color={STATUS_COLOR[status] ?? 'default'}
    />
  );
}

import Chip, { ChipProps } from '@mui/material/Chip';
import { ReferralPriority } from '@referrals/shared';

const PRIORITY_COLOR: Record<ReferralPriority, ChipProps['color']> = {
  [ReferralPriority.ROUTINE]: 'default',
  [ReferralPriority.URGENT]: 'warning',
  [ReferralPriority.STAT]: 'error',
};

const PRIORITY_LABEL: Record<ReferralPriority, string> = {
  [ReferralPriority.ROUTINE]: 'Routine',
  [ReferralPriority.URGENT]: 'Urgent',
  [ReferralPriority.STAT]: 'STAT',
};

interface PriorityChipProps {
  priority: ReferralPriority;
  size?: ChipProps['size'];
}

export function PriorityChip({ priority, size = 'small' }: PriorityChipProps) {
  return (
    <Chip
      size={size}
      variant="outlined"
      label={PRIORITY_LABEL[priority]}
      color={PRIORITY_COLOR[priority]}
    />
  );
}

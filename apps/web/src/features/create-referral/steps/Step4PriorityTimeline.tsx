import { Stack } from '@mui/material';
import { Control } from 'react-hook-form';
import { ReferralPriority } from '@referrals/shared';
import { CreateReferralFormValues } from '../schema/create-referral.schema';
import { FormSelect } from '../../../components/ui/FormSelect';
import { FormField } from '../../../components/ui/FormField';

const PRIORITY_OPTIONS = [
  { label: 'Routine', value: ReferralPriority.ROUTINE },
  { label: 'Urgent', value: ReferralPriority.URGENT },
  { label: 'STAT', value: ReferralPriority.STAT },
];

const TIMEFRAME_OPTIONS = [
  { label: 'Within 1 week', value: '1_WEEK' },
  { label: 'Within 2 weeks', value: '2_WEEKS' },
  { label: 'Within 30 days', value: '30_DAYS' },
  { label: 'Within 90 days', value: '90_DAYS' },
  { label: 'Flexible', value: 'FLEXIBLE' },
];

interface Props {
  control: Control<CreateReferralFormValues>;
}

export function Step4PriorityTimeline({ control }: Props) {
  return (
    <Stack spacing={3}>
      <FormSelect
        control={control}
        name="priority"
        options={PRIORITY_OPTIONS}
        label="Urgency / priority *"
        helperText="STAT referrals trigger immediate specialist notification"
      />

      <FormSelect
        control={control}
        name="requestedTimeframe"
        options={TIMEFRAME_OPTIONS}
        label="Requested appointment timeframe"
        helperText="When should the patient ideally be seen?"
      />

      <FormField
        control={control}
        name="specialistId"
        label="Preferred specialist ID (optional)"
        placeholder="Leave blank for auto-assignment"
        helperText="If blank, the system routes to the best-matched specialist"
      />
    </Stack>
  );
}

import { Stack, Typography } from '@mui/material';
import { Control } from 'react-hook-form';
import { CreateReferralFormValues } from '../schema/create-referral.schema';
import { FormField } from '../../../components/ui/FormField';

interface Props {
  control: Control<CreateReferralFormValues>;
}

export function Step2ClinicalInfo({ control }: Props) {
  return (
    <Stack spacing={3}>
      <FormField
        rows={5}
        multiline
        control={control}
        name="clinicalReason"
        label="Clinical reason for referral *"
        placeholder="Describe the clinical indication for this referral…"
      />

      <Stack spacing={0.5}>
        <FormField
          control={control}
          name="icd10Codes"
          label="ICD-10 codes *"
          placeholder="e.g. I10, Z00.00, M54.5"
          helperText="Separate multiple codes with commas"
        />
        <Typography variant="caption" color="text.secondary" pl={1}>
          Enter the primary and any secondary diagnosis codes.
        </Typography>
      </Stack>
    </Stack>
  );
}

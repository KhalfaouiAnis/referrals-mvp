import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

interface ReferralDetail {
  specialtyType: string;
  clinicalReason: string;
  icd10Codes: string;
  priority: string;
  requestedTimeframe: string | null;
  referringProvider?: { fullName: string };
  specialist?: { fullName: string } | null;
  createdAt: string;
  submittedAt: string | null;
  appointmentDate: string | null;
  appointmentLocation: string | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box mb={1.5}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Box mt={0.25}>{children}</Box>
    </Box>
  );
}

export function ClinicalDetailsSection({ referral }: { referral: ReferralDetail }) {
  const icd10List =
    referral.icd10Codes
      ?.split(',')
      .map((c) => c.trim())
      .filter(Boolean) ?? [];

  return (
    <Box>
      <Typography variant="subtitle2" mb={1}>
        Clinical details
      </Typography>
      <Divider sx={{ mb: 1.5 }} />

      <Field label="Specialty">
        <Typography variant="body2">
          {referral.specialtyType.replace(/_/g, ' ')}
        </Typography>
      </Field>

      <Field label="Referring provider">
        <Typography variant="body2">
          {referral.referringProvider?.fullName ?? '—'}
        </Typography>
      </Field>

      <Field label="Specialist">
        <Typography variant="body2">
          {referral.specialist?.fullName ?? 'Not yet assigned'}
        </Typography>
      </Field>

      <Field label="ICD-10 codes">
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {icd10List.map((code) => (
            <Chip key={code} label={code} size="small" variant="outlined" />
          ))}
        </Stack>
      </Field>

      <Field label="Clinical reason">
        <Typography variant="body2" whiteSpace="pre-wrap">
          {referral.clinicalReason}
        </Typography>
      </Field>

      {referral.requestedTimeframe && (
        <Field label="Requested timeframe">
          <Typography variant="body2">
            {referral.requestedTimeframe.replace(/_/g, ' ')}
          </Typography>
        </Field>
      )}

      {referral.appointmentDate && (
        <Field label="Appointment">
          <Typography variant="body2">
            {new Date(referral.appointmentDate).toLocaleDateString()}
            {referral.appointmentLocation ? ` · ${referral.appointmentLocation}` : ''}
          </Typography>
        </Field>
      )}

      <Field label="Created">
        <Typography variant="body2">
          {new Date(referral.createdAt).toLocaleDateString()}
        </Typography>
      </Field>
    </Box>
  );
}

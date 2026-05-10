import { Box, Divider, Stack, Typography } from '@mui/material';

interface Patient {
  fullName: string;
  mrn: string;
  dateOfBirth: string;
  insurancePlan: string | null;
  insuranceMemberId: string | null;
  phone: string | null;
  email: string | null;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack direction="row" justifyContent="space-between" py={0.75}>
      <Typography variant="caption" color="text.secondary" minWidth={140}>{label}</Typography>
      <Typography variant="body2" textAlign="right">{value || '—'}</Typography>
    </Stack>
  );
}

export function PatientInfoSection({ patient }: { patient?: Patient }) {
  if (!patient) return null;
  return (
    <Box>
      <Typography variant="subtitle2" mb={1}>Patient information</Typography>
      <Divider sx={{ mb: 1 }} />
      <Row label="Full name" value={patient.fullName} />
      <Row label="MRN" value={patient.mrn} />
      <Row label="Date of birth" value={patient.dateOfBirth} />
      <Row label="Insurance plan" value={patient.insurancePlan} />
      <Row label="Member ID" value={patient.insuranceMemberId} />
      <Row label="Phone" value={patient.phone} />
      <Row label="Email" value={patient.email} />
    </Box>
  );
}

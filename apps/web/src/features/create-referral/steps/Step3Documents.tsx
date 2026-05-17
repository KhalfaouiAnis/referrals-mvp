import { Alert, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Step 3 has no form fields — document uploads happen after the referral
 * is created (the referral ID is needed for the upload endpoint).
 * The FileDropzone is shown on the Referral Profile page once created.
 */
export function Step3Documents() {
  return (
    <Stack spacing={2}>
      <Alert
        icon={<InfoOutlinedIcon />}
        severity="info"
        variant="outlined"
      >
        Clinical documents can be attached after the referral is created.
        You will be taken to the referral profile where you can upload labs,
        imaging reports, clinical notes, and medication lists.
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Accepted formats: PDF, JPG, JPEG, PNG — max 25 MB per file.
      </Typography>
    </Stack>
  );
}

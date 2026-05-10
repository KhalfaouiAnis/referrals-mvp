import {
  Alert, Box, Button, CircularProgress, Divider,
  Grid, Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VALID_TRANSITIONS, ReferralStatus, STATUS_LABELS } from '@referrals/shared';
import { PatientInfoSection } from './components/PatientInfoSection';
import { ClinicalDetailsSection } from './components/ClinicalDetailsSection';
import { AuthorizationSection } from './components/AuthorizationSection';
import { NotesSection } from './components/NotesSection';
import { useAddNote, useAdvanceStatus, useDeleteDocument, useReferral, useUploadDocument } from '../../api/hooks/useReferral';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityChip } from '../../components/ui/PriorityChip';
import { ReferralStatusStepper } from '../../components/referrals/ReferralStatusStepper';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { ReferralTimeline } from '../../components/referrals/ReferralTimeline';

export function ReferralProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const { data: raw, isLoading, isError } = useReferral(id!);
  // Unwrap the { data: ... } envelope from the TransformInterceptor
  const referral = (raw as { data?: typeof raw })?.data ?? raw;

  const { mutate: advance, isPending: advancing } = useAdvanceStatus(id!);
  const { mutate: addNote, isPending: addingNote } = useAddNote(id!);
  const { mutateAsync: uploadDoc } = useUploadDocument(id!);
  const { mutate: deleteDoc } = useDeleteDocument(id!);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" pt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !referral) {
    return <Alert severity="error">Referral not found.</Alert>;
  }

  const allowedNext = VALID_TRANSITIONS[referral.status] ?? [];
  const canAdvance = allowedNext.filter((s) => s !== ReferralStatus.CANCELLED);

  const handleAdvance = (targetStatus: ReferralStatus) => {
    setAdvanceError(null);
    advance(
      { targetStatus },
      {
        onError: (err: unknown) => {
          const msg = (
            err as { response?: { data?: { message?: string } } }
          )?.response?.data?.message;
          setAdvanceError(
            typeof msg === 'string' ? msg : 'Failed to advance status.',
          );
        },
      },
    );
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        mb={3}
        sx={{ flexWrap: 'wrap', gap: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/referrals')}
            size="small"
          >
            Referrals
          </Button>
          <Typography variant="body2" color="text.disabled">/</Typography>
          <Typography variant="body2" color="text.secondary" noWrap maxWidth={300}>
            {referral.patient?.fullName}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <StatusBadge status={referral.status} />
          <PriorityChip priority={referral.priority} />
        </Stack>
      </Stack>

      {/* Status stepper */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <ReferralStatusStepper
          currentStatus={referral.status}
          steps={referral.steps ?? []}
        />
      </Paper>

      {/* Advance actions */}
      {canAdvance.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            <Typography variant="body2" fontWeight={500}>
              Advance to:
            </Typography>
            {canAdvance.map((status) => (
              <Button
                key={status}
                variant="contained"
                size="small"
                disabled={advancing}
                onClick={() => handleAdvance(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={advancing}
              onClick={() => handleAdvance(ReferralStatus.CANCELLED)}
            >
              Cancel referral
            </Button>
          </Stack>
          {advanceError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {advanceError}
            </Alert>
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Paper variant="outlined">
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label="Documents" />
          <Tab label="Notes" />
          <Tab label="Timeline" />
        </Tabs>

        <Box p={3}>
          {/* Overview */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <PatientInfoSection patient={referral.patient} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ClinicalDetailsSection referral={referral} />
              </Grid>
              <Grid size={12}>
                <AuthorizationSection
                  authRequests={referral.authorizationRequests ?? []}
                />
              </Grid>
            </Grid>
          )}

          {/* Documents */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              <FileDropzone
                onUpload={(file, label, onProgress) =>
                  uploadDoc({ file, label, onProgress })
                }
              />
              <Divider />
              {(referral.documents ?? []).length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No documents attached yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {referral.documents.map(
                    (doc: {
                      id: string;
                      fileName: string;
                      label: string | null;
                      sizeBytes: number;
                      uploadedBy: { fullName: string };
                    }) => (
                      <Paper key={doc.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {doc.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doc.label ? `${doc.label} · ` : ''}
                              {(doc.sizeBytes / 1024).toFixed(0)} KB · Uploaded
                              by {doc.uploadedBy?.fullName}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              onClick={() => {
                                window.open(
                                  `/api/v1/referrals/${id}/documents/${doc.id}/download`,
                                );
                              }}
                            >
                              Download
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => deleteDoc(doc.id)}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ),
                  )}
                </Stack>
              )}
            </Stack>
          )}

          {/* Notes */}
          {activeTab === 2 && (
            <NotesSection
              notes={referral.notes ?? []}
              onAddNote={(body) => addNote({ body })}
              loading={addingNote}
            />
          )}

          {/* Timeline */}
          {activeTab === 3 && (
            <ReferralTimeline logs={referral.auditLogs ?? []} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}

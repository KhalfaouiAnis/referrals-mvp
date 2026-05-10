import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useCreateReferral } from "../../api/hooks/usePatients";
import { CreateReferralFormValues, createReferralSchema, STEP_SCHEMAS } from "./schema/create-referral.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReferralPriority } from "@referrals/shared";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { Step1PatientSelect } from "./steps/Step1PatientSelect";
import { Step2ClinicalInfo } from "./steps/Step2ClinicalInfo";
import { Step3Documents } from "./steps/Step3Documents";
import { Step4PriorityTimeline } from "./steps/Step4PriorityTimeline";

const STEP_LABELS = [
    'Patient & specialty',
    'Clinical information',
    'Documents',
    'Priority & timeline',
];

export function CreateReferralWizard() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { mutateAsync: createReferral, isPending } = useCreateReferral();

    const {
        control,
        trigger,
        handleSubmit
    } = useForm<CreateReferralFormValues>({
        resolver: zodResolver(createReferralSchema),
        defaultValues: {
            patientId: '',
            specialtyType: undefined,
            clinicalReason: '',
            icd10Codes: '',
            priority: ReferralPriority.ROUTINE,
            requestedTimeframe: '',
            specialistId: '',
        },
        mode: 'onTouched',
    })

    // Validate only the fields belonging to the current step before advancing.
    const handleNext = async () => {
        const currentSchema = STEP_SCHEMAS[activeStep];
        const fields = Object.keys(currentSchema.shape) as Array<
            keyof CreateReferralFormValues
        >;
        const valid = await trigger(fields);
        if (valid) setActiveStep((s) => s + 1);
    };

    const onSubmit = handleSubmit(async (values) => {
        setSubmitError(null);
        try {
            const referral = await createReferral({
                patientId: values.patientId,
                specialtyType: values.specialtyType,
                clinicalReason: values.clinicalReason,
                icd10Codes: values.icd10Codes,
                priority: values.priority,
                requestedTimeframe: values.requestedTimeframe || undefined,
                specialistId: values.specialistId || undefined,
            });
            const id =
                (referral as { data?: { id: string } })?.data?.id ??
                (referral as { id: string }).id;
            navigate(`/referrals/${id}`);
        } catch (err) {
            const msg = (
                err as { response?: { data?: { message?: string | string[] } } }
            )?.response?.data?.message;
            setSubmitError(
                Array.isArray(msg)
                    ? msg.join(', ')
                    : (msg ?? 'Failed to create referral. Please try again.'),
            );
        }
    });

    const isLastStep = activeStep === STEP_LABELS.length - 1;

    return (
        <Box>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {STEP_LABELS.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Paper variant="outlined" sx={{ p: 4, maxWidth: 680, mx: 'auto' }}>
                <Box mb={3}>
                    <Typography variant="h6">{STEP_LABELS[activeStep]}</Typography>
                </Box>

                {/* Step content */}
                {activeStep === 0 && <Step1PatientSelect control={control} />}
                {activeStep === 1 && <Step2ClinicalInfo control={control} />}
                {activeStep === 2 && <Step3Documents />}
                {activeStep === 3 && <Step4PriorityTimeline control={control} />}

                {submitError && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        {submitError}
                    </Alert>
                )}

                <Stack direction="row" justifyContent="space-between" mt={4}>
                    <Button
                        variant="outlined"
                        disabled={activeStep === 0 || isPending}
                        onClick={() => setActiveStep((s) => s - 1)}
                    >
                        Back
                    </Button>

                    {isLastStep ? (
                        <Button
                            onClick={onSubmit}
                            variant="contained"
                            disabled={isPending}
                            startIcon={isPending ? <CircularProgress size={16} /> : undefined}
                        >
                            {isPending ? 'Creating…' : 'Create referral'}
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}
import {
    Box,
    Step,
    Stepper,
    StepLabel,
    StepConnector,
    stepConnectorClasses,
    styled,
    Tooltip,
    Typography,
} from '@mui/material';
import { ReferralStatus, WORKFLOW_STEPS, STATUS_LABELS } from '@referrals/shared';

interface StepInfo {
    stepNumber: number;
    label: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
    completedAt: string | null;
    completedBy: { fullName: string } | null;
}

interface Props {
    steps: StepInfo[];
    currentStatus: ReferralStatus;
}

const Connector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10 },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.primary.main,
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.success.main,
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.divider,
        borderTopWidth: 2,
    },
}));

const BRANCH_STATUSES: ReferralStatus[] = [
    ReferralStatus.AUTH_DENIED,
    ReferralStatus.CANCELLED,
];

export function ReferralStatusStepper({ currentStatus, steps }: Props) {
    const isBranched = BRANCH_STATUSES.includes(currentStatus);

    const activeIndex = isBranched
        ? -1
        : WORKFLOW_STEPS.indexOf(currentStatus);

    return (
        <Box>
            <Stepper
                alternativeLabel
                activeStep={activeIndex}
                connector={<Connector />}
            >
                {WORKFLOW_STEPS.map((status, idx) => {
                    const stepInfo = steps.find((s) => s.stepNumber === idx + 1);
                    const isComplete = stepInfo?.status === 'COMPLETE';
                    const isActive = idx === activeIndex;

                    return (
                        <Step key={status} completed={isComplete}>
                            <Tooltip
                                title={
                                    stepInfo?.completedAt
                                        ? `Completed ${new Date(stepInfo.completedAt).toLocaleDateString()} by ${stepInfo.completedBy?.fullName ?? 'System'}`
                                        : ''
                                }
                                arrow
                            >
                                <StepLabel
                                    slotProps={{
                                        stepIcon: {
                                            sx: isComplete
                                                ? { color: 'success.main !important' }
                                                : isActive
                                                    ? { color: 'primary.main !important' }
                                                    : undefined,
                                        }
                                    }}
                                >
                                    <Typography variant="caption">
                                        {STATUS_LABELS[status]}
                                    </Typography>
                                </StepLabel>
                            </Tooltip>
                        </Step>
                    );
                })}
            </Stepper>

            {isBranched && (
                <Box mt={1} textAlign="center">
                    <Typography
                        variant="body2"
                        fontWeight={500}
                        color={
                            currentStatus === ReferralStatus.CANCELLED
                                ? 'text.disabled'
                                : 'error.main'
                        }
                    >
                        {STATUS_LABELS[currentStatus]}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

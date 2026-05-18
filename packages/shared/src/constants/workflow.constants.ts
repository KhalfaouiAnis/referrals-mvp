import { ReferralStatus } from '../enums/referral-status.enum';

/**
 * Valid forward transitions for the referral state machine.
 * CANCELLED is reachable from any non-terminal state (handled separately in the service).
 * AUTH_DENIED is a branch reachable only from AUTHORIZATION.
 */
export const VALID_TRANSITIONS: Readonly<Record<ReferralStatus, ReferralStatus[]>> = {
  [ReferralStatus.INTAKE]: [ReferralStatus.CLINICAL_PREP, ReferralStatus.CANCELLED],
  [ReferralStatus.CLINICAL_PREP]: [ReferralStatus.AUTHORIZATION, ReferralStatus.INTAKE, ReferralStatus.CANCELLED],
  [ReferralStatus.AUTHORIZATION]: [
    ReferralStatus.READY_TO_SUBMIT,
    ReferralStatus.AUTH_DENIED,
    ReferralStatus.CANCELLED,
  ],
  [ReferralStatus.READY_TO_SUBMIT]: [ReferralStatus.SUBMITTED, ReferralStatus.AUTHORIZATION, ReferralStatus.CANCELLED],
  [ReferralStatus.SUBMITTED]: [ReferralStatus.SCHEDULING, ReferralStatus.CANCELLED],
  [ReferralStatus.SCHEDULING]: [ReferralStatus.CLOSED, ReferralStatus.CANCELLED],
  [ReferralStatus.CLOSED]: [],
  [ReferralStatus.CANCELLED]: [],
  [ReferralStatus.AUTH_DENIED]: [ReferralStatus.AUTHORIZATION, ReferralStatus.CANCELLED],
};

/** Terminal states where no further transitions are allowed. */
export const TERMINAL_STATUSES: ReadonlySet<ReferralStatus> = new Set([
  ReferralStatus.CLOSED,
  ReferralStatus.CANCELLED,
]);

/**
 * Fields required to be non-null/non-empty before advancing FROM a given status.
 * The workflow service validates these before allowing the transition.
 */
export const ADVANCE_GUARDS: Readonly<
  Partial<Record<ReferralStatus, string[]>>
> = {
  [ReferralStatus.INTAKE]: [
    'patientId',
    'referringProviderId',
    'specialtyType',
    'clinicalReason',
    'icd10Codes',
    'priority',
  ],
  [ReferralStatus.CLINICAL_PREP]: ['specialistId'],
  [ReferralStatus.AUTHORIZATION]: [],
  [ReferralStatus.READY_TO_SUBMIT]: [],
  [ReferralStatus.SUBMITTED]: [],
  [ReferralStatus.SCHEDULING]: [],
};

/** Human-readable label for each status. */
export const STATUS_LABELS: Readonly<Record<ReferralStatus, string>> = {
  [ReferralStatus.INTAKE]: 'Intake',
  [ReferralStatus.CLINICAL_PREP]: 'Clinical prep',
  [ReferralStatus.AUTHORIZATION]: 'Authorization',
  [ReferralStatus.READY_TO_SUBMIT]: 'Ready to submit',
  [ReferralStatus.SUBMITTED]: 'Submitted',
  [ReferralStatus.SCHEDULING]: 'Scheduling',
  [ReferralStatus.CLOSED]: 'Closed',
  [ReferralStatus.CANCELLED]: 'Cancelled',
  [ReferralStatus.AUTH_DENIED]: 'Auth denied',
};

/** Ordered list of the main workflow steps (excludes branch/terminal states). */
export const WORKFLOW_STEPS: ReferralStatus[] = [
  ReferralStatus.INTAKE,
  ReferralStatus.CLINICAL_PREP,
  ReferralStatus.AUTHORIZATION,
  ReferralStatus.READY_TO_SUBMIT,
  ReferralStatus.SUBMITTED,
  ReferralStatus.SCHEDULING,
  ReferralStatus.CLOSED,
];

/** Days before triggering an automated follow-up if no appointment is scheduled. */
export const FOLLOWUP_TRIGGER_DAYS = 5;

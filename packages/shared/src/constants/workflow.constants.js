"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLLOWUP_TRIGGER_DAYS = exports.WORKFLOW_STEPS = exports.STATUS_LABELS = exports.ADVANCE_GUARDS = exports.TERMINAL_STATUSES = exports.VALID_TRANSITIONS = void 0;
const referral_status_enum_1 = require("../enums/referral-status.enum");
/**
 * Valid forward transitions for the referral state machine.
 * CANCELLED is reachable from any non-terminal state (handled separately in the service).
 * AUTH_DENIED is a branch reachable only from AUTHORIZATION.
 */
exports.VALID_TRANSITIONS = {
    [referral_status_enum_1.ReferralStatus.INTAKE]: [referral_status_enum_1.ReferralStatus.CLINICAL_PREP, referral_status_enum_1.ReferralStatus.CANCELLED],
    [referral_status_enum_1.ReferralStatus.CLINICAL_PREP]: [referral_status_enum_1.ReferralStatus.AUTHORIZATION, referral_status_enum_1.ReferralStatus.INTAKE, referral_status_enum_1.ReferralStatus.CANCELLED],
    [referral_status_enum_1.ReferralStatus.AUTHORIZATION]: [
        referral_status_enum_1.ReferralStatus.READY_TO_SUBMIT,
        referral_status_enum_1.ReferralStatus.AUTH_DENIED,
        referral_status_enum_1.ReferralStatus.CANCELLED,
    ],
    [referral_status_enum_1.ReferralStatus.READY_TO_SUBMIT]: [referral_status_enum_1.ReferralStatus.SUBMITTED, referral_status_enum_1.ReferralStatus.AUTHORIZATION, referral_status_enum_1.ReferralStatus.CANCELLED],
    [referral_status_enum_1.ReferralStatus.SUBMITTED]: [referral_status_enum_1.ReferralStatus.SCHEDULING, referral_status_enum_1.ReferralStatus.CANCELLED],
    [referral_status_enum_1.ReferralStatus.SCHEDULING]: [referral_status_enum_1.ReferralStatus.CLOSED, referral_status_enum_1.ReferralStatus.CANCELLED],
    [referral_status_enum_1.ReferralStatus.CLOSED]: [],
    [referral_status_enum_1.ReferralStatus.CANCELLED]: [],
    [referral_status_enum_1.ReferralStatus.AUTH_DENIED]: [referral_status_enum_1.ReferralStatus.AUTHORIZATION, referral_status_enum_1.ReferralStatus.CANCELLED],
};
/** Terminal states where no further transitions are allowed. */
exports.TERMINAL_STATUSES = new Set([
    referral_status_enum_1.ReferralStatus.CLOSED,
    referral_status_enum_1.ReferralStatus.CANCELLED,
]);
/**
 * Fields required to be non-null/non-empty before advancing FROM a given status.
 * The workflow service validates these before allowing the transition.
 */
exports.ADVANCE_GUARDS = {
    [referral_status_enum_1.ReferralStatus.INTAKE]: [
        'patientId',
        'referringProviderId',
        'specialtyType',
        'clinicalReason',
        'icd10Codes',
        'priority',
    ],
    [referral_status_enum_1.ReferralStatus.CLINICAL_PREP]: ['specialistId'],
    [referral_status_enum_1.ReferralStatus.AUTHORIZATION]: [],
    [referral_status_enum_1.ReferralStatus.READY_TO_SUBMIT]: [],
    [referral_status_enum_1.ReferralStatus.SUBMITTED]: [],
    [referral_status_enum_1.ReferralStatus.SCHEDULING]: [],
};
/** Human-readable label for each status (used on the frontend stepper). */
exports.STATUS_LABELS = {
    [referral_status_enum_1.ReferralStatus.INTAKE]: 'Intake',
    [referral_status_enum_1.ReferralStatus.CLINICAL_PREP]: 'Clinical prep',
    [referral_status_enum_1.ReferralStatus.AUTHORIZATION]: 'Authorization',
    [referral_status_enum_1.ReferralStatus.READY_TO_SUBMIT]: 'Ready to submit',
    [referral_status_enum_1.ReferralStatus.SUBMITTED]: 'Submitted',
    [referral_status_enum_1.ReferralStatus.SCHEDULING]: 'Scheduling',
    [referral_status_enum_1.ReferralStatus.CLOSED]: 'Closed',
    [referral_status_enum_1.ReferralStatus.CANCELLED]: 'Cancelled',
    [referral_status_enum_1.ReferralStatus.AUTH_DENIED]: 'Auth denied',
};
/** Ordered list of the main workflow steps (excludes branch/terminal states). */
exports.WORKFLOW_STEPS = [
    referral_status_enum_1.ReferralStatus.INTAKE,
    referral_status_enum_1.ReferralStatus.CLINICAL_PREP,
    referral_status_enum_1.ReferralStatus.AUTHORIZATION,
    referral_status_enum_1.ReferralStatus.READY_TO_SUBMIT,
    referral_status_enum_1.ReferralStatus.SUBMITTED,
    referral_status_enum_1.ReferralStatus.SCHEDULING,
    referral_status_enum_1.ReferralStatus.CLOSED,
];
/** Days before triggering an automated follow-up if no appointment is scheduled. */
exports.FOLLOWUP_TRIGGER_DAYS = 5;
//# sourceMappingURL=workflow.constants.js.map
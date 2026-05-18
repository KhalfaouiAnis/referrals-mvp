import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ReferralStatus, WORKFLOW_STEPS } from "@referrals/shared";
import { Referral } from "./entities/referral.entity";
import { ReferralStep, StepStatus } from "./entities/referral-step.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { StepTransitionValidator } from "./validators/step-transition.validator";
import { NotificationProducer } from "../queues/producers/notification.producer";
import { FollowupProducer } from "../queues/producers/followup.producer";
import { User } from "../users/entities/user.entity";

export interface AdvanceStepOptions {
  targetStatus: ReferralStatus;
  actor: User;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Enforces the referral state machine.
 *
 * All status changes MUST go through `advanceStatus()`.
 * Direct writes to `referral.status` are never allowed outside this service.
 */
@Injectable()
export class ReferralWorkflowService {
  private readonly logger = new Logger(ReferralWorkflowService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,

    @InjectRepository(ReferralStep)
    private readonly stepRepo: Repository<ReferralStep>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    private readonly dataSource: DataSource,
    private readonly validator: StepTransitionValidator,
    private readonly notificationProducer: NotificationProducer,
    private readonly followupProducer: FollowupProducer,
  ) {}

  // Public API

  /**
   * Advances a referral to the given `targetStatus`.
   *
   * Runs inside a single transaction:
   *   1. Validates the transition (field guards + valid-transitions map)
   *   2. Updates `referral.status` (and any status-specific timestamps)
   *   3. Marks the departing step as COMPLETE
   *   4. Writes an immutable audit log entry
   *   5. Enqueues async side-effects (notifications, follow-up timers)
   */
  async advanceStatus(
    referralId: string,
    options: AdvanceStepOptions,
  ): Promise<Referral> {
    const referral = await this.loadReferral(referralId);
    const { targetStatus, actor, reason, metadata } = options;

    this.validator.validate(referral, targetStatus);

    const previousStatus = referral.status;

    const updatedReferral = await this.dataSource.transaction(
      async (manager) => {
        // 1. Apply status-specific side-effects on the entity
        this.applyStatusEffects(referral, targetStatus);
        referral.status = targetStatus;
        const saved = await manager.save(Referral, referral);

        // 2. Mark current step COMPLETE, set next step IN_PROGRESS
        await this.progressSteps(
          manager,
          referralId,
          previousStatus,
          targetStatus,
          actor,
        );

        // 3. Write audit log
        const log = manager.create(AuditLog, {
          referralId,
          actorId: actor.id,
          action: "STATUS_CHANGED",
          beforeState: { status: previousStatus },
          afterState: { status: targetStatus, ...metadata },
          reason: reason ?? null,
        });
        await manager.save(AuditLog, log);

        return saved;
      },
    );

    // 4. Async side-effects (outside transaction — non-critical)
    await this.triggerSideEffects(updatedReferral);

    this.logger.log(
      `Referral ${referralId}: ${previousStatus} → ${targetStatus} by user ${actor.id}`,
    );

    return updatedReferral;
  }

  /**
   * Creates the initial set of ReferralStep rows when a referral is first created.
   * Called by ReferralsService.create().
   */
  async initializeSteps(referralId: string): Promise<void> {
    const stepDefinitions = this.getStepDefinitions();
    const steps = stepDefinitions.map((def) =>
      this.stepRepo.create({
        referralId,
        stepNumber: def.stepNumber,
        stepCode: def.stepCode,
        label: def.label,
        status:
          def.stepNumber === 1 ? StepStatus.IN_PROGRESS : StepStatus.PENDING,
      }),
    );
    await this.stepRepo.save(steps);
  }

  // helpers

  private async loadReferral(referralId: string): Promise<Referral> {
    const referral = await this.referralRepo.findOne({
      where: { id: referralId },
      relations: ["patient", "referringProvider", "specialist"],
    });
    if (!referral) {
      throw new NotFoundException(`Referral ${referralId} not found.`);
    }
    return referral;
  }

  /**
   * Applies entity-level side-effects that accompany certain status transitions.
   * (e.g. stamping `submittedAt` when entering SUBMITTED)
   */
  private applyStatusEffects(
    referral: Referral,
    targetStatus: ReferralStatus,
  ): void {
    const now = new Date();
    if (targetStatus === ReferralStatus.SUBMITTED) {
      referral.submittedAt = now;
    }
    if (
      targetStatus === ReferralStatus.CLOSED ||
      targetStatus === ReferralStatus.CANCELLED
    ) {
      referral.closedAt = now;
    }
  }

  /**
   * Marks the step associated with `previousStatus` as COMPLETE
   * and the step for `targetStatus` as IN_PROGRESS.
   */
  private async progressSteps(
    manager: typeof this.dataSource.manager,
    referralId: string,
    previousStatus: ReferralStatus,
    targetStatus: ReferralStatus,
    actor: User,
  ): Promise<void> {
    const prevStepNumber = this.statusToStepNumber(previousStatus);
    const nextStepNumber = this.statusToStepNumber(targetStatus);

    if (prevStepNumber !== null) {
      await manager.update(
        ReferralStep,
        { referralId, stepNumber: prevStepNumber },
        {
          status: StepStatus.COMPLETE,
          completedById: actor.id,
          completedAt: new Date(),
        },
      );
    }

    if (nextStepNumber !== null) {
      await manager.update(
        ReferralStep,
        { referralId, stepNumber: nextStepNumber },
        { status: StepStatus.IN_PROGRESS },
      );
    }
  }

  /** Maps a ReferralStatus to its step number (1-based). Returns null for branch states. */
  private statusToStepNumber(status: ReferralStatus): number | null {
    const index = WORKFLOW_STEPS.indexOf(status);
    return index >= 0 ? index + 1 : null;
  }

  /**
   * Enqueues async notifications and scheduled jobs based on the new status.
   * Failures here must NOT roll back the status change.
   */
  private async triggerSideEffects(
    referral: Referral,

  ): Promise<void> {
    try {
      switch (referral.status) {
        case ReferralStatus.SUBMITTED:
          // Notify patient that referral was sent to specialist
          await this.notificationProducer.enqueueReferralSubmitted(referral);
          // Schedule automated follow-up if specialist doesn't respond
          await this.followupProducer.scheduleSpecialistFollowup(referral);
          break;

        case ReferralStatus.SCHEDULING:
          // Referral reached scheduling — cancel the pending follow-up timer
          await this.followupProducer.cancelSpecialistFollowup(referral.id);
          break;

        case ReferralStatus.CLOSED:
          // Notify referring provider that specialist report is ready
          await this.notificationProducer.enqueueReferralClosed(referral);
          break;

        case ReferralStatus.AUTH_DENIED:
          // Notify admin staff so they can initiate appeal
          await this.notificationProducer.enqueueAuthDenied(referral);
          break;

        default:
          break;
      }
    } catch (err) {
      this.logger.error(
        `Side-effect failed for referral ${referral.id} → ${referral.status}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  /** Returns the canonical step definitions in workflow order. */
  private getStepDefinitions(): Array<{
    stepNumber: number;
    stepCode: string;
    label: string;
  }> {
    return [
      { stepNumber: 1, stepCode: "1a", label: "Intake" },
      { stepNumber: 2, stepCode: "2a", label: "Clinical prep" },
      { stepNumber: 3, stepCode: "3a", label: "Authorization" },
      { stepNumber: 4, stepCode: "4a", label: "Ready to submit" },
      { stepNumber: 5, stepCode: "5a", label: "Submitted" },
      { stepNumber: 6, stepCode: "6a", label: "Scheduling" },
      { stepNumber: 7, stepCode: "7a", label: "Closed / complete" },
    ];
  }
}

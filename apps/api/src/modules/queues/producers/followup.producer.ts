import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUE_FOLLOWUP, JOB_SPECIALIST_FOLLOWUP } from "../queue.constants";
import { Referral } from "../../referrals/entities/referral.entity";
import { FOLLOWUP_TRIGGER_DAYS } from "@referrals/shared";

@Injectable()
export class FollowupProducer {
  private readonly logger = new Logger(FollowupProducer.name);

  constructor(
    @InjectQueue(QUEUE_FOLLOWUP)
    private readonly followupQueue: Queue,
  ) {}

  /**
   * Schedules a delayed job that fires after FOLLOWUP_TRIGGER_DAYS
   * if the specialist has not yet scheduled an appointment.
   *
   * Uses referralId as the job ID so we can cancel it later with
   * `cancelSpecialistFollowup`.
   */
  async scheduleSpecialistFollowup(referral: Referral): Promise<void> {
    const delayMs = FOLLOWUP_TRIGGER_DAYS * 24 * 60 * 60 * 1000;

    await this.followupQueue.add(
      JOB_SPECIALIST_FOLLOWUP,
      {
        referralId: referral.id,
        patientId: referral.patientId,
        specialistId: referral.specialistId,
        referringProviderId: referral.referringProviderId,
      },
      {
        jobId: `followup:${referral.id}`, // Deterministic ID for easy cancellation
        delay: delayMs,
        attempts: 2,
        backoff: { type: "fixed", delay: 60_000 },
      },
    );

    this.logger.log(
      `Scheduled specialist follow-up for referral ${referral.id} in ${FOLLOWUP_TRIGGER_DAYS} days`,
    );
  }

  /**
   * Removes the pending follow-up job for a referral.
   * Called when the referral moves to SCHEDULING (appointment confirmed).
   */
  async cancelSpecialistFollowup(referralId: string): Promise<void> {
    const jobId = `followup:${referralId}`;
    const job = await this.followupQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(
        `Cancelled specialist follow-up job for referral ${referralId}`,
      );
    }
  }
}

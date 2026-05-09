import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";
import { QUEUE_FOLLOWUP, JOB_SPECIALIST_FOLLOWUP } from "../queue.constants";
import { Referral } from "../../referrals/entities/referral.entity";
import { ReferralStatus } from "@referrals/shared";

@Processor(QUEUE_FOLLOWUP)
export class FollowupConsumer extends WorkerHost {
  private readonly logger = new Logger(FollowupConsumer.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== JOB_SPECIALIST_FOLLOWUP) return;

    const { referralId, specialistId, referringProviderId } = job.data as {
      referralId: string;
      specialistId: string | null;
      referringProviderId: string;
    };

    // Guard: if referral has already progressed past SUBMITTED, skip.
    const referral = await this.referralRepo.findOne({
      where: { id: referralId },
      select: ["id", "status"],
    });

    if (!referral) {
      this.logger.warn(
        `Follow-up job: referral ${referralId} not found — skipping.`,
      );
      return;
    }

    if (referral.status !== ReferralStatus.SUBMITTED) {
      this.logger.log(
        `Follow-up job: referral ${referralId} is now ${referral.status} — no follow-up needed.`,
      );
      return;
    }

    // Referral is still in SUBMITTED — alert staff to chase the specialist.
    this.logger.warn(
      `[FOLLOW-UP] Referral ${referralId} has been submitted for ${5} days ` +
        `with no appointment. Alerting provider ${referringProviderId} ` +
        `and specialist ${specialistId ?? "unassigned"}.`,
    );

    // Here i send actual email/SMS alerts.
  }
}

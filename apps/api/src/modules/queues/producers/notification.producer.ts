import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  QUEUE_NOTIFICATION,
  JOB_REFERRAL_SUBMITTED,
  JOB_REFERRAL_CLOSED,
  JOB_AUTH_DENIED,
} from "../queue.constants";
import { Referral } from "../../referrals/entities/referral.entity";

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    @InjectQueue(QUEUE_NOTIFICATION)
    private readonly notificationQueue: Queue,
  ) {}

  async enqueueReferralSubmitted(referral: Referral): Promise<void> {
    await this.notificationQueue.add(
      JOB_REFERRAL_SUBMITTED,
      {
        referralId: referral.id,
        patientId: referral.patientId,
        specialtyType: referral.specialtyType,
        referringProviderId: referral.referringProviderId,
      },
      { attempts: 2, backoff: { type: "exponential", delay: 5000 } },
    );
    this.logger.debug(
      `Enqueued ${JOB_REFERRAL_SUBMITTED} for referral ${referral.id}`,
    );
  }

  async enqueueReferralClosed(referral: Referral): Promise<void> {
    await this.notificationQueue.add(
      JOB_REFERRAL_CLOSED,
      {
        referralId: referral.id,
        referringProviderId: referral.referringProviderId,
        patientId: referral.patientId,
      },
      { attempts: 2, backoff: { type: "exponential", delay: 5000 } },
    );
    this.logger.debug(
      `Enqueued ${JOB_REFERRAL_CLOSED} for referral ${referral.id}`,
    );
  }

  async enqueueAuthDenied(referral: Referral): Promise<void> {
    await this.notificationQueue.add(
      JOB_AUTH_DENIED,
      {
        referralId: referral.id,
        referringProviderId: referral.referringProviderId,
      },
      { attempts: 2, backoff: { type: "exponential", delay: 5000 } },
    );
    this.logger.debug(
      `Enqueued ${JOB_AUTH_DENIED} for referral ${referral.id}`,
    );
  }
}

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import {
  QUEUE_NOTIFICATION,
  JOB_REFERRAL_SUBMITTED,
  JOB_REFERRAL_CLOSED,
  JOB_AUTH_DENIED,
} from "../queue.constants";

@Processor(QUEUE_NOTIFICATION)
export class NotificationConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationConsumer.name);

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing job ${job.name} [${job.id}]`);

    switch (job.name) {
      case JOB_REFERRAL_SUBMITTED:
        await this.handleReferralSubmitted(job.data);
        break;
      case JOB_REFERRAL_CLOSED:
        await this.handleReferralClosed(job.data);
        break;
      case JOB_AUTH_DENIED:
        await this.handleAuthDenied(job.data);
        break;
      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
    }
  }

  private async handleReferralSubmitted(data: {
    referralId: string;
    patientId: string;
    specialtyType: string;
    referringProviderId: string;
  }): Promise<void> {
    // Inject EmailChannel / SmsChannel and send real messages.
    this.logger.log(
      `[NOTIFY] Patient ${data.patientId}: your referral (${data.specialtyType}) has been submitted.`,
    );
    this.logger.log(
      `[NOTIFY] Provider ${data.referringProviderId}: referral ${data.referralId} sent to specialist.`,
    );
  }

  private async handleReferralClosed(data: {
    referralId: string;
    referringProviderId: string;
    patientId: string;
  }): Promise<void> {
    this.logger.log(
      `[NOTIFY] Provider ${data.referringProviderId}: specialist report available for referral ${data.referralId}.`,
    );
  }

  private async handleAuthDenied(data: {
    referralId: string;
    referringProviderId: string;
  }): Promise<void> {
    this.logger.log(
      `[NOTIFY] Provider ${data.referringProviderId}: authorization denied for referral ${data.referralId}. Review required.`,
    );
  }
}

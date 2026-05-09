import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Referral } from "./entities/referral.entity";
import { ReferralStep } from "./entities/referral-step.entity";
import { ReferralDocument } from "./entities/referral-document.entity";
import { ReferralNote } from "./entities/referral-note.entity";
import { AuthorizationRequest } from "./entities/authorization-request.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { ReferralsService } from "./referrals.service";
import { ReferralsController } from "./referrals.controller";
import { ReferralWorkflowService } from "./referral-workflow.service";
import { StepTransitionValidator } from "./validators/step-transition.validator";
import { QueuesModule } from "../queues/queues.module";
import { DocumentsModule } from "../documents/documents.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Referral,
      ReferralStep,
      ReferralDocument,
      ReferralNote,
      AuthorizationRequest,
      AuditLog,
    ]),
    QueuesModule,
    DocumentsModule,
    AuditModule,
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    ReferralWorkflowService,
    StepTransitionValidator,
  ],
  exports: [ReferralsService, ReferralWorkflowService],
})
export class ReferralsModule {}

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
import { SpecialistMatchingService } from "./specialist-matching.service";
import { SpecialistProfile } from "../users/entities/specialist-profile.entity";
import { Patient } from "../patients/entities/patient.entity";
import { GatewayModule } from "../gateway/gateway.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Referral,
      Patient,
      ReferralStep,
      ReferralDocument,
      ReferralNote,
      AuthorizationRequest,
      SpecialistProfile,
      AuditLog,
    ]),
    QueuesModule,
    DocumentsModule,
    AuditModule,
    GatewayModule,
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    ReferralWorkflowService,
    StepTransitionValidator,
    SpecialistMatchingService,
  ],
  exports: [
    ReferralsService,
    ReferralWorkflowService,
    SpecialistMatchingService,
  ],
})
export class ReferralsModule {}

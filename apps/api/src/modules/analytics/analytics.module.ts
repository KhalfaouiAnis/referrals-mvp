import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Referral } from "../referrals/entities/referral.entity";
import { AuthorizationRequest } from "../referrals/entities/authorization-request.entity";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Referral, AuthorizationRequest])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

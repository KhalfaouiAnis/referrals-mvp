import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import databaseConfig from "./config/database.config";
import redisConfig from "./config/redis.config";
import storageConfig from "./config/storage.config";
import jwtConfig from "./config/jwt.config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AuditModule } from "./modules/audit/audit.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { GatewayModule } from "./modules/gateway/gateway.module";
import { HealthController } from "./health.controller";
// import clamavConfig from "./config/clamav.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        storageConfig,
        // clamavConfig,
        jwtConfig,
      ],
      envFilePath: [".env"],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get("database")!,
    }),
    AuthModule,
    UsersModule,
    PatientsModule,
    ReferralsModule,
    DocumentsModule,
    AuditModule,
    QueuesModule,
    AnalyticsModule,
    GatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

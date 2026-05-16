import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReferralDocument } from "../referrals/entities/referral-document.entity";
import { Referral } from "../referrals/entities/referral.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { DocumentsService } from "./documents.service";
import { MinioStorageProvider } from "./storage/minio-storage.provider";
import { STORAGE_PROVIDER } from "./storage/storage.interface";
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { ClamScanModule } from "nestjs-clamscan";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralDocument, Referral, AuditLog]),
    // ClamScanModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (config: ConfigService) => ({
    //     clamdscan: {
    //       host: config.get<string>("clamav.host", "localhost"),
    //       port: config.get<number>("clamav.port", 3310),
    //       timeout: 60_000,
    //       active: true,
    //     },
    //     preference: "clamdscan",
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  providers: [
    DocumentsService,
    { provide: STORAGE_PROVIDER, useClass: MinioStorageProvider },
  ],
  exports: [DocumentsService, STORAGE_PROVIDER],
})
export class DocumentsModule {}

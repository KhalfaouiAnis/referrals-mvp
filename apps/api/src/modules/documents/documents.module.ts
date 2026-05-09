import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReferralDocument } from "../referrals/entities/referral-document.entity";
import { Referral } from "../referrals/entities/referral.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { DocumentsService } from "./documents.service";
import { MinioStorageProvider } from "./storage/minio-storage.provider";
import { STORAGE_PROVIDER } from "./storage/storage.interface";

@Module({
  imports: [TypeOrmModule.forFeature([ReferralDocument, Referral, AuditLog])],
  providers: [
    DocumentsService,
    { provide: STORAGE_PROVIDER, useClass: MinioStorageProvider },
  ],
  exports: [DocumentsService, STORAGE_PROVIDER],
})
export class DocumentsModule {}

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
// import { ClamScanService } from 'nestjs-clamscan';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuid } from "uuid";
import { ReferralDocument } from "../referrals/entities/referral-document.entity";
import { Referral } from "../referrals/entities/referral.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { User } from "../users/entities/user.entity";
import { STORAGE_PROVIDER, StorageProvider } from "./storage/storage.interface";
// import { InfectedFileException } from "./exceptions/infected-file.exception";
// import { Readable } from "stream";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(ReferralDocument)
    private readonly docRepo: Repository<ReferralDocument>,

    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,

    // private readonly clamScan: ClamScanService,
  ) {}

  async upload(
    referralId: string,
    file: Express.Multer.File,
    label: string | undefined,
    actor: User,
  ): Promise<ReferralDocument> {
    // Validate referral exists
    const referral = await this.referralRepo.findOne({
      where: { id: referralId },
    });
    if (!referral)
      throw new NotFoundException(`Referral ${referralId} not found.`);

    // Validate file
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. Accepted: PDF, JPEG, PNG, WEBP.`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException("File exceeds the 25 MB size limit.");
    }

    // Virus scan — throws InfectedFileException before touching MinIO
    // await this.scanOrThrow(file);

    // Build an object key: referralId/uuid-filename
    const ext = file.originalname.split(".").pop() ?? "bin";
    const key = `referrals/${referralId}/${uuid()}.${ext}`;

    // Upload to MinIO
    await this.storage.upload(file.buffer, key, file.mimetype);

    // Persist document record
    const doc = this.docRepo.create({
      referralId,
      uploadedById: actor.id,
      fileName: file.originalname,
      fileKey: key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      label: label ?? null,
    });
    await this.docRepo.save(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        referralId,
        actorId: actor.id,
        action: "DOCUMENT_UPLOADED",
        afterState: { documentId: doc.id, fileName: file.originalname },
        reason: null,
      }),
    );

    return doc;
  }

  /**
   * Returns a short-lived signed URL for the given document.
   * Anyone with the link can download within the TTL (1 hour).
   */
  async getSignedDownloadUrl(
    referralId: string,
    documentId: string,
  ): Promise<{ url: string }> {
    const doc = await this.docRepo.findOne({
      where: { id: documentId, referralId },
    });
    if (!doc) throw new NotFoundException("Document not found.");

    const url = await this.storage.getSignedUrl(doc.fileKey, 3600);
    return { url };
  }

  async delete(
    referralId: string,
    documentId: string,
    actor: User,
  ): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: documentId, referralId },
    });
    if (!doc) throw new NotFoundException("Document not found.");

    // Only uploader or admin can delete
    const isUploader = doc.uploadedById === actor.id;
    const isAdmin = ["ADMIN_STAFF", "SUPER_ADMIN"].includes(actor.role);
    if (!isUploader && !isAdmin) {
      throw new ForbiddenException(
        "Only the uploader or an admin can delete this document.",
      );
    }

    await this.storage.delete(doc.fileKey);
    await this.docRepo.remove(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        referralId,
        actorId: actor.id,
        action: "DOCUMENT_DELETED",
        afterState: { documentId, fileName: doc.fileName },
        reason: null,
      }),
    );
  }

  // private async scanOrThrow(file: Express.Multer.File): Promise<void> {
  //   const stream = Readable.from(file.buffer);
  //   const { isInfected, viruses } = await this.clamScan.scanStream(stream);
  //   if (isInfected) {
  //     throw new InfectedFileException(file.originalname, viruses ?? []);
  //   }
  // }
}

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider, UploadResult } from "./storage.interface";

@Injectable()
export class MinioStorageProvider implements StorageProvider, OnModuleInit {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>("storage.endpoint")!;
    const accessKeyId = config.get<string>("storage.accessKey")!;
    const secretAccessKey = config.get<string>("storage.secretKey")!;
    this.bucket = config.get<string>("storage.bucket")!;

    this.client = new S3Client({
      endpoint,
      region: config.get<string>("storage.region") ?? "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
      // Required for MinIO: path-style addressing (not virtual hosted)
      forcePathStyle: true,
    });
  }

  /** Ensure bucket exists on startup */
  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket '${this.bucket}' exists ✓`);
    } catch {
      try {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`MinIO bucket '${this.bucket}' created ✓`);
      } catch (err) {
        this.logger.error(`Failed to create bucket '${this.bucket}'`, err);
      }
    }
  }

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Never expose raw objects; always use signed URLs
        ACL: "private",
      }),
    );

    const url = await this.getSignedUrl(key);

    return {
      key,
      url,
      sizeBytes: buffer.byteLength,
      mimeType,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

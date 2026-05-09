import { registerAs } from "@nestjs/config";

export default registerAs("storage", () => ({
  endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
  accessKey: process.env.MINIO_ACCESS_KEY ?? "referrals_minio",
  secretKey: process.env.MINIO_SECRET_KEY ?? "referrals_secret",
  bucket: process.env.MINIO_BUCKET ?? "referrals-documents",
  region: process.env.MINIO_REGION ?? "us-east-1",
  useSSL: process.env.MINIO_USE_SSL === "true",
}));

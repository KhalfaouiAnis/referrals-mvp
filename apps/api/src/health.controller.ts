import { InjectDataSource } from "@nestjs/typeorm";
import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    const testDb = this.dataSource.isInitialized;

    return {
      status: testDb ? "ok" : "degraded",
      db: testDb ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
}

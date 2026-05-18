import { InjectDataSource } from "@nestjs/typeorm";
import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Public } from "src/common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @Public()
  async check() {
    const testDb = this.dataSource.isInitialized;

    return {
      status: testDb ? "ok" : "degraded",
      db: testDb ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
}

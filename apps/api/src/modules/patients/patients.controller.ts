import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PatientsService } from "./patients.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("patients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("patients")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  search(
    @Query("search") search: string = "",
    @Query("limit") limit: number = 10,
  ) {
    return this.patientsService.search(search, Number(limit));
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.patientsService.findOne(id);
  }
}

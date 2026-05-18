import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { SpecialtyType, UserRole } from "@referrals/shared";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query("role") role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get("specialists")
  findSpecialists(@Query("specialtyType") specialtyType?: SpecialtyType) {
    return this.usersService.findSpecialists(specialtyType);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }
}

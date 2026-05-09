import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '@referrals/shared';
import { ReferralsService } from './referrals.service';
import { DocumentsService } from '../documents/documents.service';
import { ReferralWorkflowService } from './referral-workflow.service';
import {
  AddNoteDto,
  AdvanceStepDto,
  BulkActionDto,
  CreateReferralDto,
  ReferralFilterDto,
  UpdateReferralDto,
} from './dto/referral.dto';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly documentsService: DocumentsService,
    private readonly workflowService: ReferralWorkflowService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE_PRACTITIONER, UserRole.ADMIN_STAFF)
  create(@Body() dto: CreateReferralDto, @CurrentUser() user: User) {
    return this.referralsService.create(dto, user);
  }

  @Get()
  findAll(@Query() filters: ReferralFilterDto) {
    return this.referralsService.findAll(filters);
  }

  @Get('export')
  async exportCsv(
    @Query() filters: ReferralFilterDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.referralsService.exportCsv(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="referrals-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN_STAFF, UserRole.SUPER_ADMIN)
  bulkAction(@Body() dto: BulkActionDto, @CurrentUser() user: User) {
    return this.referralsService.bulkAction(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReferralDto,
    @CurrentUser() user: User,
  ) {
    return this.referralsService.update(id, dto, user);
  }

  // ── Workflow ──────────────────────────────────────────────────────────────

  @Patch(':id/advance')
  advance(
    @Param('id') id: string,
    @Body() dto: AdvanceStepDto,
    @CurrentUser() user: User,
  ) {
    return this.workflowService.advanceStatus(id, {
      targetStatus: dto.targetStatus,
      actor: user,
      reason: dto.reason,
      metadata: dto.metadata,
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.referralsService.addNote(id, dto, user);
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage() }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.upload(id, file, label, user);
  }

  @Get(':id/documents/:docId/download')
  getDownloadUrl(
    @Param('id') referralId: string,
    @Param('docId') docId: string,
  ) {
    return this.documentsService.getSignedDownloadUrl(referralId, docId);
  }

  @Delete(':id/documents/:docId')
  deleteDocument(
    @Param('id') referralId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.delete(referralId, docId, user);
  }
}

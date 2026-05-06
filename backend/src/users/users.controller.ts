import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin', 'operations_staff', 'super_admin')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.usersService.findAll(user.companyId, query, user.role);
  }

  @Get('staff')
  @Roles('admin', 'operations_staff', 'field_technician', 'finance_manager')
  getStaff(@CurrentUser() user: any) {
    return this.usersService.getStaff(user.companyId);
  }

  @Patch('me/password')
  @Roles('admin', 'operations_staff', 'field_technician', 'finance_manager', 'super_admin')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Post(':id/approve')
  @Roles('admin', 'super_admin')
  approveUser(@Param('id') id: string, @CurrentUser() user: any) {
    const companyId = user.role === 'super_admin' ? null : user.companyId;
    return this.usersService.approveUser(id, companyId, user.id);
  }

  @Get(':id')
  @Roles('admin', 'operations_staff')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.companyId);
  }

  @Post()
  @Roles('admin', 'super_admin')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(dto, user.companyId, user.id);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const ip = req.ip || '';
    return this.usersService.update(id, dto, user.companyId, user.id, ip);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.companyId, user.id);
  }
}

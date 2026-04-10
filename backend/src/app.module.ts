import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { FinanceModule } from './finance/finance.module';
import { VendorsModule } from './vendors/vendors.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { MasterModule } from './master/master.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      exclude: ['/api/v1/(.*)'],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LeadsModule,
    ApplicantsModule,
    FinanceModule,
    VendorsModule,
    ReportsModule,
    NotificationsModule,
    StorageModule,
    AuditModule,
    MasterModule,
  ],
})
export class AppModule {}

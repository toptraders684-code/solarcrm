import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { DocumentMasterModule } from './document-master/document-master.module';
import { CompaniesModule } from './companies/companies.module';
import { MasterDataModule } from './master-data/master-data.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { ActivityLogInterceptor } from './activity-log/activity-log.interceptor';
import { DiscomMasterModule } from './discom-master/discom-master.module';
import { CommissionStructuresModule } from './commission-structures/commission-structures.module';
import { VendorCommissionModule } from './vendor-commission/vendor-commission.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env.example',
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      exclude: ['/api/v1/*path'],
      serveStaticOptions: { fallthrough: true },
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
    DocumentMasterModule,
    CompaniesModule,
    MasterDataModule,
    ActivityLogModule,
    DiscomMasterModule,
    CommissionStructuresModule,
    VendorCommissionModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule {}

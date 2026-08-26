import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { InvimaComplianceService } from './services/invima-compliance.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, InvimaComplianceService],
  exports: [ReportsService, InvimaComplianceService],
})
export class ReportsModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { GeneralConfigModule } from './config/general.config';
import { IndexModule } from './modules/index.module';
import { LoggingModule } from './common/logging/logging.module';
import { PaginationModule } from './common/pagination/pagination.module';

@Module({
  imports: [GeneralConfigModule, DatabaseModule, LoggingModule, PaginationModule, IndexModule],
})
export class AppModule {}

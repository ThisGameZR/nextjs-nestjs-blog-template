import { SetMetadata } from '@nestjs/common';

export const LOG_ACTION_KEY = 'log_action';

export interface LogActionOptions {
  action: string;
  includeBody?: boolean;
  includeParams?: boolean;
  includeQuery?: boolean;
}

export const LogAction = (options: LogActionOptions) => SetMetadata(LOG_ACTION_KEY, options);

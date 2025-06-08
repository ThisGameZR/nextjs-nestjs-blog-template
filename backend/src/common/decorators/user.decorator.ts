import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  username: string;
  email: string;
}

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext): any => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  
  // If a specific field is requested, return just that field
  if (data && user) {
    return user[data];
  }
  
  // Otherwise return the entire user object
  return user;
});

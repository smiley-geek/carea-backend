import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AUTH_SERVICE } from './service';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, Observable, tap } from 'rxjs';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticationError } from 'apollo-server-express';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private authClient: ClientProxy) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authentication = this.getAuthentication(context);

    return this.authClient
      .send('validate_user', {
        Authentication: authentication,
      })
      .pipe(
        tap((res) => {
          if (res.role === 'BUYER') {
            throw new AuthenticationError(
              'Account not authorized to access this resource'
            );
          }
          this.addUser(res, context);
        }),
        catchError((e) => {
          if (e instanceof AuthenticationError) {
            throw new AuthenticationError(e.message);
          }
          throw new AuthenticationError('Authentication required');
        })
      );
  }

  private getAuthentication(context: ExecutionContext) {
    let authentication: string;
    if (context.getType() === 'rpc') {
      authentication = context.switchToRpc().getData().Authentication;
    } else if (context.getType() === 'http') {
      //TODO: return the appropriate headers
      authentication = context.switchToHttp().getRequest();
    } else if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      authentication = ctx.getContext().req.headers.authorization;
    }
    if (!authentication) {
      throw new AuthenticationError('Authentication required');
    }
    return authentication;
  }

  private addUser(user: any, context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      context.switchToRpc().getData().user = user;
    } else if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      ctx.getContext().user = user;
    }
  }
}
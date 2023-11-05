import { AuthGuard } from '@nestjs/passport';
import { jwtConstants } from '../constants';

export class JwtGuard extends AuthGuard(jwtConstants.jwt) {
  constructor() {
    super();
  }
}

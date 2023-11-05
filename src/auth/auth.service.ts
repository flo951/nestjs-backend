import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { authConstants } from './constants';
const saltRounds = 10;

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const jwtToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get(authConstants.JWT_SECRET),
    });
    return { access_token: jwtToken };
  }

  async register(dto: AuthDto) {
    try {
      const salt = bcrypt.genSaltSync(saltRounds);
      const passwordHash = bcrypt.hashSync(dto.password, salt);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('Credentials already taken');
      }
      throw error;
    }
  }

  async login(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });
      if (!user) {
        this.incorrectCredentials();
      }
      const passwordMatch = bcrypt.compareSync(dto.password, user.password);
      if (!passwordMatch) {
        this.incorrectCredentials();
      }
      return this.signToken(user.id, user.email);
    } catch (error) {
      throw error;
    }
  }

  incorrectCredentials = () => {
    throw new ForbiddenException('Incorrect credentials');
  };
}

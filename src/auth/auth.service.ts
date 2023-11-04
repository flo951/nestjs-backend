import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
const saltRounds = 10;

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
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
      return user;
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
      return user;
    } catch (error) {
      throw error;
    }
  }

  incorrectCredentials = () => {
    throw new ForbiddenException('Incorrect credentials');
  };
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';
import { isNotEmptyObject } from 'class-validator';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async editUser(userId: number, dto: EditUserDto) {
    if (!isNotEmptyObject(dto)) {
      throw new BadRequestException('No data to update provided');
    }
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });

    delete user.password;

    return user;
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    delete user.password;

    return user;
  }
}

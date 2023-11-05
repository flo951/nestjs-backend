import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';

describe('App e2e test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
    pactum.request.setBaseUrl('http://localhost:3333');

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    describe('Register', () => {
      const dto: AuthDto = {
        email: 'testuser@test.at',
        password: '123456',
      };
      it('should register', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(201);
      });
      it('should throw error if body is empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({})
          .expectStatus(400);
      });
      it('should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
    });
    describe('Login', () => {
      it('should login', () => {
        const dto: AuthDto = {
          email: 'testuser@test.at',
          password: '123456',
        };

        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('accessToken', 'access_token');
      });
      it('should throw error if body is empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({})
          .expectStatus(400);
      });
      it('should not login with invalid mail', () => {
        const dto: AuthDto = {
          email: 'invalidmail@test.at',
          password: '123456',
        };

        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(403);
      });
      it('should not login with invalid password', () => {
        const dto: AuthDto = {
          email: 'testuser@test.at',
          password: '1234567',
        };

        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(403);
      });
    });
  });
  describe('User', () => {
    describe('get user info', () => {
      it('should return user info', () => {
        return pactum
          .spec()
          .withBearerToken(`$S{accessToken}`)
          .get('/users/user-info')
          .expectStatus(200);
      });
    });
    describe('User-Info', () => {
      it('should return user info', () => {
        return pactum
          .spec()
          .withBearerToken(`$S{accessToken}`)
          .get('/users/user-info')
          .expectStatus(200);
      });
    });
    describe('Edit-User', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Floriano',
          lastName: 'FloLastName',
        };
        return pactum
          .spec()
          .withBearerToken(`$S{accessToken}`)
          .withBody(dto)
          .patch('/users/edit')
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
      it('should throw error if no body', () => {
        return pactum
          .spec()
          .withBearerToken(`$S{accessToken}`)
          .withBody({})
          .patch('/users/edit')
          .expectStatus(400)
          .inspect();
      });
    });
    describe('delete user', () => {
      it('should delete user', () => {
        return pactum
          .spec()
          .withBearerToken(`$S{accessToken}`)
          .delete('/users/delete')
          .expectStatus(200);
      });
    });
  });
});

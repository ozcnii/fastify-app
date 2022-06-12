import { compare, hash } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import {
  AuthorizationSchema,
  LoginDto,
  LoginResponseSchema,
  LoginSchema,
  LogoutResponseSchema,
  RefreshDto,
  RefreshResponseSchema,
  RefreshSchema,
  RegisterDto,
  RegisterResponseSchema,
  RegisterSchema,
} from "../../../../schemas/auth";

import { User } from ".prisma/client";
import { signRefreshToken, verifyRefreshToken } from "../../../../helpers/jwt";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: RegisterDto }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          200: RegisterResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { body: dto } = request;
      const hashPassword = await hash(dto.password, +process.env.SALT!);

      try {
        const newUser = await prisma.user.create({
          data: {
            ...dto,
            password: hashPassword,
          },
        });

        return reply.status(201).send(newUser);
      } catch (error) {
        return reply.status(403).send({
          statusCode: 403,
          message:
            "Пользователь с такой почтой или номером телефона уже сущетсвует",
        });
      }
    }
  );

  fastify.post<{ Body: LoginDto }>(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { body: dto } = request;

      if (!dto.login.includes("@")) {
        const user = await prisma.user.findFirst({
          where: {
            phone: dto.login,
          },
        });

        try {
          const data = await loginUser(
            user,
            dto,
            "Неверный номер телефона или пароль"
          );
          return reply.send(data);
        } catch (error) {
          if (error instanceof Error) {
            return reply.status(403).send({
              statusCode: 403,
              message: error.message,
            });
          }
        }
      }

      const user = await prisma.user.findFirst({
        where: {
          email: dto.login,
        },
      });

      try {
        const data = await loginUser(user, dto, "Неверная почта или пароль");
        return reply.send(data);
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(403).send({
            statusCode: 403,
            message: error.message,
          });
        }
      }
    }
  );

  const loginUser = async (
    user: User | null,
    dto: LoginDto,
    errorMessage: string
  ) => {
    if (user && (await compare(dto.password, user.password))) {
      const refreshToken = await signRefreshToken({ id: user.id });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
        },
      });

      return {
        ...user,
        accessToken: fastify.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken,
      };
    }
    throw new Error(errorMessage);
  };

  fastify.post<{ Body: RefreshDto }>(
    "/refresh",
    {
      schema: {
        body: RefreshSchema,
        response: {
          200: RefreshResponseSchema,
        },
      },
    },
    async function (request, reply) {
      try {
        await verifyRefreshToken(request.body.refreshToken);
      } catch (error) {
        return reply.status(400).send({
          statusCode: 400,
          message: "Некорректный рефреш токен",
        });
      }

      const oldToken = await prisma.refreshToken.findFirst({
        where: {
          token: request.body.refreshToken,
        },
      });

      if (!oldToken) {
        return reply.status(400).send({
          statusCode: 400,
          message: "Некорректный рефреш токен",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: oldToken?.userId,
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      const newRefreshToken = await signRefreshToken({ id: user.id });

      await prisma.refreshToken.delete({
        where: {
          id: oldToken.id,
        },
      });

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
        },
      });

      return {
        ...user,
        accessToken: fastify.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken: newRefreshToken,
      };
    }
  );

  // // TODO if access-token invalid, jwt-plugin return 500 status-code
  fastify.delete(
    "/logout",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: AuthorizationSchema,
        response: {
          200: LogoutResponseSchema,
        },
      },
    },
    async function (request) {
      const { id } = request.user;

      await prisma.refreshToken.deleteMany({
        where: {
          userId: id,
        },
      });

      return {
        success: true,
      };
    }
  );
};
export default auth;

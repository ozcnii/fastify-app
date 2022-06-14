import { compare, hash } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import {
  AuthorizationSchema,
  GetCodeDto,
  GetCodeSchema,
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
  RestorePasswordDto,
  RestorePasswordSchema,
  VerifyCodeDto,
  VerifyCodeSchema,
} from "../../../../schemas/auth";

import { User } from ".prisma/client";
import { signRefreshToken, verifyRefreshToken } from "../../../../helpers/jwt";
import { errorResponseSchema, okResponseSchema } from "../../../../schemas";
import { MailService } from "../../../../services/mail";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: RegisterDto }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          200: RegisterResponseSchema,
          403: errorResponseSchema,
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
          403: errorResponseSchema,
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
          400: errorResponseSchema,
          404: errorResponseSchema,
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

  fastify.delete(
    "/logout",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: AuthorizationSchema,
        response: {
          200: LogoutResponseSchema,
          401: errorResponseSchema,
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
        message: "Пользователь успешно вышел со всех устройств",
      };
    }
  );

  fastify.post<{ Body: GetCodeDto }>(
    "/get-code",
    {
      schema: {
        body: GetCodeSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { email } = request.body;
      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      const restorePasswordCode = "RESTORE_CODE";

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isRestorePassword: false,
          restorePasswordCode,
        },
      });

      try {
        await MailService.restorePassword(user.email, restorePasswordCode);
        reply.status(200).send({
          message: "Сообщение успешно отправлено",
        });
      } catch (error) {
        return reply.status(500).send({
          statusCode: 500,
          message: "Произошла ошибка при отправке письма",
        });
      }
    }
  );

  fastify.post<{ Body: VerifyCodeDto }>(
    "/verify-code",
    {
      schema: {
        body: VerifyCodeSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { code, email } = request.body;
      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      if (user.restorePasswordCode === code) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isRestorePassword: true,
            restorePasswordCode: null,
          },
        });
        return reply.status(200).send({
          message: "Код корректен",
        });
      }

      return reply.status(400).send({
        statusCode: 400,
        message: "Некорректный код",
      });
    }
  );

  fastify.post<{ Body: RestorePasswordDto }>(
    "/restore-password",
    {
      schema: {
        body: RestorePasswordSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { email, newPassword } = request.body;

      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      if (!user.isRestorePassword) {
        return reply.status(400).send({
          statusCode: 400,
          message: "Пользователь не восстанавливал пароль",
        });
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isRestorePassword: false,
          restorePasswordCode: null,
          password: newPassword,
        },
      });

      return reply.send({
        message: "Пароль успешно обновлен",
      });
    }
  );
};
export default auth;

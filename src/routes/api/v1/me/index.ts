import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import { errorResponseSchema, okResponseSchema } from "../../../../schemas";
import { AuthorizationSchema } from "../../../../schemas/auth";
import {
  GetMeResponseSchema,
  RestorePasswordDto,
  RestorePasswordSchema,
} from "../../../../schemas/me";
import { MailService } from "../../../../services/mail";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: AuthorizationSchema,
        response: {
          200: GetMeResponseSchema,
        },
      },
    },
    async function (request) {
      const { id } = request.user;
      return await prisma.user.findFirst({ where: { id } });
    }
  );

  fastify.get(
    "restore-password",
    {
      preHandler: fastify.authenticate,
      schema: {
        response: {
          200: okResponseSchema,
          500: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { id } = request.user;
      const user = await prisma.user.findFirst({ where: { id } });
      if (!user)
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });

      const restorePasswordCode = "RESTORE_CODE";

      await prisma.user.update({
        where: { id },
        data: {
          isRestorePassword: true,
          restorePasswordCode,
        },
      });

      try {
        await MailService.restorePassword(user.email, restorePasswordCode);
        reply.status(200).send({
          message: "Сообщение успешно отправлено",
        });
      } catch {
        return reply.status(500).send({
          statusCode: 500,
          message: "Произошла ошибка при отправке письма",
        });
      }
    }
  );

  fastify.post<{ Body: RestorePasswordDto }>(
    "restore-password",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: RestorePasswordSchema,
        response: {
          200: okResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { id } = request.user;
      const { code, password } = request.body;
      const user = await prisma.user.findFirst({ where: { id } });

      if (user?.isRestorePassword && user?.restorePasswordCode === code) {
        await prisma.user.update({
          where: {
            id,
          },
          data: {
            isRestorePassword: false,
            restorePasswordCode: null,
            password,
          },
        });

        return reply.status(200).send({
          message: "Пароль успешно обновлён",
        });
      }

      return reply.status(400).send({
        statusCode: 400,
        message: "Неверный код",
      });
    }
  );
};

export default auth;

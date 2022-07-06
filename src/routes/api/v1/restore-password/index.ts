import { hash } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { ErrorResponseSchema, OkResponseSchema } from "../../../../schemas";
import {
  RestorePasswordDto,
  RestorePasswordSchema,
} from "../../../../schemas/auth";

const restorePassword: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: RestorePasswordDto }>(
    "/restore-password",
    {
      schema: {
        body: RestorePasswordSchema,
        response: {
          200: OkResponseSchema,
          404: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, newPassword } = request.body;
      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return reply.notFound("Пользователь не найден");
      }

      if (!user.isRestorePassword) {
        return reply.badRequest("Пользователь не восстанавливал пароль");
      }

      const hashNewPassword = await hash(newPassword, +process.env.SALT!);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isRestorePassword: false,
          restorePasswordCode: null,
          password: hashNewPassword,
        },
      });

      return reply.send({
        message: "Пароль успешно обновлен",
      });
    }
  );
};

export default restorePassword;

import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { ErrorResponseSchema, OkResponseSchema } from "../../../../schemas";
import { GetCodeDto, GetCodeSchema } from "../../../../schemas/auth";
import { mailService } from "../../../../common/services/mail.service";

const getCode: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: GetCodeDto }>(
    "/get-code",
    {
      schema: {
        tags: ["auth"],
        body: GetCodeSchema,
        response: {
          200: OkResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
        await mailService.restorePassword(user.email, restorePasswordCode);
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
};

export default getCode;

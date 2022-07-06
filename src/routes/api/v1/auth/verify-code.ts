import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { ErrorResponseSchema, OkResponseSchema } from "../../../../schemas";
import { VerifyCodeDto, VerifyCodeSchema } from "../../../../schemas/auth";

const verifyCode: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: VerifyCodeDto }>(
    "/verify-code",
    {
      schema: {
        tags: ["auth"],
        body: VerifyCodeSchema,
        response: {
          200: OkResponseSchema,
          404: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { code, email } = request.body;
      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return reply.notFound("Пользователь не найден");
      }

      if (user.restorePasswordCode === code) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isRestorePassword: true,
            restorePasswordCode: null,
          },
        });
        return reply.send({
          message: "Код корректен",
        });
      }

      return reply.badRequest("Некорректный код");
    }
  );
};

export default verifyCode;

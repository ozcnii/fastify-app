import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { ErrorResponseSchema } from "../../../../schemas";
import {
  AuthorizationSchema,
  LogoutResponseSchema,
} from "../../../../schemas/auth";

const register: FastifyPluginAsync = async (fastify) => {
  fastify.delete(
    "/logout",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["auth"],
        headers: AuthorizationSchema,
        response: {
          200: LogoutResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
};

export default register;

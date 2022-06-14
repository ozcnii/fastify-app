import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import { AuthorizationSchema } from "../../../../schemas/auth";
import { GetMeResponseSchema } from "../../../../schemas/me";

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
};

export default auth;

import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import { $meRef } from "../../../../schemas/me";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: $meRef("getMeSchema"),
        response: {
          200: $meRef("getMeResponseSchema"),
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

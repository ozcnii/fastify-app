import { FastifyPluginAsync } from "fastify";
import { meController } from "../../../../controllers/me/me.controller";
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
    meController.getMe
  );
};

export default auth;

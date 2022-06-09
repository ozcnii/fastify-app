import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";
import { authorizationHeaderSchema, userCore } from "../auth";

const getMeResponseSchema = z.object({
  ...userCore,
});

const { schemas, $ref: $meRef } = buildJsonSchemas(
  {
    getMeSchema: authorizationHeaderSchema,
    getMeResponseSchema,
  },
  { $id: "me" }
);

export { $meRef };

const meSchemas: FastifyPluginAsync = async (fastify): Promise<void> => {
  for (const schema of schemas) {
    fastify.addSchema(schema);
  }
};

export default fp(meSchemas, { name: "meSchemas" });

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

const userCore = {
  id: z.number(),
  email: z.string().email(),
  phone: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  categoryId: z.number(),
};

const registerSchema = z.object({
  email: z.string().email().max(256),
  phone: z.string().min(11).max(12),
  firstName: z.string().min(2).max(256),
  lastName: z.string().min(2).max(256),
  password: z.string().min(6).max(256),
});

const registerResponseSchema = z.object({
  ...userCore,
});

const loginSchema = z.object({
  login: z.string().max(256),
  password: z.string().min(6).max(256),
});

const loginResponseSchema = z.object({
  ...userCore,
  accessToken: z.string(),
  refreshToken: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const refreshResponseSchema = loginResponseSchema;

const { schemas, $ref } = buildJsonSchemas(
  {
    registerSchema,
    registerResponseSchema,
    loginSchema,
    loginResponseSchema,
    refreshSchema,
    refreshResponseSchema,
  },
  { $id: "auth" }
);

export { $ref };
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;

const authSchemas: FastifyPluginAsync = async (fastify): Promise<void> => {
  for (const schema of schemas) {
    fastify.addSchema(schema);
  }
};

export default fp(authSchemas, { name: "authSchemas" });

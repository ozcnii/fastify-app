import { FastifyPluginAsync } from "fastify";
import {
  AuthorizationSchema,
  GetCodeSchema,
  LoginDto,
  LoginResponseSchema,
  LoginSchema,
  LogoutResponseSchema,
  RefreshDto,
  RefreshResponseSchema,
  RefreshSchema,
  RegisterResponseSchema,
  RegisterSchema,
  RestorePasswordSchema,
  VerifyCodeSchema,
} from "../../../../schemas/auth";
import { errorResponseSchema, okResponseSchema } from "../../../../schemas";
import { authController } from "../../../../controllers/auth/auth.controller";
import { restorePasswordController } from "../../../../controllers/auth/restore-password.controller";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          200: RegisterResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    authController.register
  );

  fastify.post<{ Body: LoginDto }>(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: LoginResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    (request, reply) => authController.login(request, reply, fastify.jwt)
  );

  fastify.post<{ Body: RefreshDto }>(
    "/refresh",
    {
      schema: {
        body: RefreshSchema,
        response: {
          200: RefreshResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    (request, reply) => authController.refresh(request, reply, fastify.jwt)
  );

  fastify.delete(
    "/logout",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: AuthorizationSchema,
        response: {
          200: LogoutResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    authController.logout
  );

  fastify.post(
    "/get-code",
    {
      schema: {
        body: GetCodeSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    restorePasswordController.getCode
  );

  fastify.post(
    "/verify-code",
    {
      schema: {
        body: VerifyCodeSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    restorePasswordController.verifyCode
  );

  fastify.post(
    "/restore-password",
    {
      schema: {
        body: RestorePasswordSchema,
        response: {
          200: okResponseSchema,
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    restorePasswordController.restorePassword
  );
};
export default auth;

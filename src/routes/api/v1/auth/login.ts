import { compare } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { jwtService } from "../../../../common/services/jwt.service";
import { ErrorResponseSchema } from "../../../../schemas";
import {
  LoginDto,
  LoginResponseSchema,
  LoginSchema,
} from "../../../../schemas/auth";

const login: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: LoginDto }>(
    "/login",
    {
      schema: {
        tags: ["auth"],
        body: LoginSchema,
        response: {
          200: LoginResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { body: dto } = request;
      const { jwt } = fastify;
      const loginType = dto.login.includes("@") ? "email" : "phone";

      const user = await prisma.user.findFirst({
        where: {
          [loginType]: dto.login,
        },
      });

      if (user && (await compare(dto.password, user.password))) {
        const refreshToken = await jwtService.signRefreshToken({ id: user.id });

        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
          },
        });

        return {
          ...user,
          accessToken: jwt.sign(
            { id: user.id },
            { expiresIn: process.env.ACCESS_TOKEN_TIME! }
          ),
          refreshToken,
        };
      }

      return reply.forbidden("Неверный логин или пароль");
    }
  );
};

export default login;

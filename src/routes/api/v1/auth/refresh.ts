import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { jwtService } from "../../../../common/services/jwt.service";
import { ErrorResponseSchema } from "../../../../schemas";
import {
  RefreshDto,
  RefreshResponseSchema,
  RefreshSchema,
} from "../../../../schemas/auth";

const refresh: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: RefreshDto }>(
    "/refresh",
    {
      schema: {
        tags: ["auth"],
        body: RefreshSchema,
        response: {
          200: RefreshResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { jwt } = fastify;
      try {
        await jwtService.verifyRefreshToken(request.body.refreshToken);
      } catch (error) {
        return reply.status(400).send({
          statusCode: 400,
          message: "Некорректный рефреш токен",
        });
      }

      const oldToken = await prisma.refreshToken.findFirst({
        where: {
          token: request.body.refreshToken,
        },
      });

      if (!oldToken) {
        return reply.status(400).send({
          statusCode: 400,
          message: "Некорректный рефреш токен",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: oldToken?.userId,
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      const newRefreshToken = await jwtService.signRefreshToken({
        id: user.id,
      });

      await prisma.refreshToken.delete({
        where: {
          id: oldToken.id,
        },
      });

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
        },
      });

      return {
        ...user,
        accessToken: jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken: newRefreshToken,
      };
    }
  );
};

export default refresh;

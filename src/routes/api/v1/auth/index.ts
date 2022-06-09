import { compare, hash } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../db";
import {
  AuthorizationSchema,
  LoginDto,
  LoginResponseSchema,
  LoginSchema,
  LogoutResponseSchema,
  RefreshDto,
  RefreshResponseSchema,
  RefreshSchema,
  RegisterDto,
  RegisterResponseSchema,
  RegisterSchema,
} from "../../../../schemas/auth";
import { v4 as uuid } from "uuid";
import { User } from ".prisma/client";

const auth: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: RegisterDto }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          200: RegisterResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { body: dto } = request;
      const hashPassword = await hash(dto.password, +process.env.SALT!);

      try {
        const newUser = await prisma.user.create({
          data: {
            ...dto,
            password: hashPassword,
          },
        });

        return reply.status(201).send(newUser);
      } catch (error) {
        return reply.status(403).send({
          statusCode: 403,
          message: "a user with such a phone number or email exists",
        });
      }
    }
  );

  fastify.post<{ Body: LoginDto }>(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { body: dto } = request;

      if (dto.login[0] === "+" || Number.isInteger(+dto.login[0])) {
        const user = await prisma.user.findFirst({
          where: {
            phone: dto.login,
          },
        });

        try {
          const data = await loginUser(
            user,
            dto,
            "Invalid phone number or password"
          );
          return reply.send(data);
        } catch (error) {
          if (error instanceof Error) {
            return reply.status(403).send({
              statusCode: 403,
              message: error.message,
            });
          }
        }
      }

      const user = await prisma.user.findFirst({
        where: {
          email: dto.login,
        },
      });

      try {
        const data = await loginUser(user, dto, "Invalid email or password");
        return reply.send(data);
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(403).send({
            statusCode: 403,
            message: error.message,
          });
        }
      }
    }
  );

  const loginUser = async (
    user: User | null,
    dto: LoginDto,
    errorMessage: string
  ) => {
    if (user && (await compare(dto.password, user.password))) {
      const refreshToken = uuid();

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
        },
      });

      return {
        ...user,
        accessToken: fastify.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken,
      };
    }
    throw new Error(errorMessage);
  };

  fastify.post<{ Body: RefreshDto }>(
    "/refresh",
    {
      schema: {
        body: RefreshSchema,
        response: {
          200: RefreshResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const oldToken = await prisma.refreshToken.findFirst({
        where: {
          token: request.body.refreshToken,
        },
      });

      if (!oldToken)
        return reply.status(400).send({
          statusCode: 400,
          message: "Invalid refersh token",
        });

      const user = await prisma.user.findFirst({
        where: {
          id: oldToken?.userId,
        },
      });

      if (!user)
        return reply.status(404).send({
          statusCode: 404,
          message: "User not found",
        });

      const newRefreshToken = uuid();

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
        accessToken: fastify.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken: newRefreshToken,
      };
    }
  );

  // // TODO if access-token invalid, jwt-plugin return 500 status-code
  fastify.delete(
    "/logout",
    {
      preHandler: fastify.authenticate,
      schema: {
        headers: AuthorizationSchema,
        response: {
          200: LogoutResponseSchema,
        },
      },
    },
    async function (request) {
      const { id } = request.user;

      await prisma.refreshToken.deleteMany({
        where: {
          userId: id,
        },
      });

      return {
        success: true,
      };
    }
  );
};
export default auth;

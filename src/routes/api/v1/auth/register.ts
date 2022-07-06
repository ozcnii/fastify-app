import { hash } from "bcryptjs";
import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../../../common/db";
import { ErrorResponseSchema } from "../../../../schemas";
import {
  RegisterDto,
  RegisterResponseSchema,
  RegisterSchema,
} from "../../../../schemas/auth";

const register: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: RegisterDto }>(
    "/register",
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: RegisterResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { body: dto } = request;
      const hashPassword = await hash(dto.password, +process.env.SALT!);

      try {
        const newUser = await prisma.user.create({
          data: { ...dto, password: hashPassword },
        });

        return reply.status(201).send(newUser);
      } catch (error) {
        return reply.forbidden(
          "Пользователь с такой почтой или номером телефона уже сущетсвует"
        );
      }
    }
  );
};

export default register;

import { FastifyRequest, FastifyReply } from "fastify";
import { hash } from "bcryptjs";
import { LoginDto, RefreshDto, RegisterDto } from "../../schemas/auth";
import { prisma } from "../../db";
import { authService } from "../../services/auth/auth.service";
import { JWT } from "@fastify/jwt";
import { signRefreshToken, verifyRefreshToken } from "../../helpers/jwt";

class AuthController {
  async register(
    request: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply
  ) {
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
      return reply.notFound(
        "Пользователь с такой почтой или номером телефона уже сущетсвует"
      );
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginDto }>,
    reply: FastifyReply,
    jwt: JWT
  ) {
    const { body: dto } = request;

    if (!dto.login.includes("@")) {
      const user = await prisma.user.findFirst({
        where: {
          phone: dto.login,
        },
      });

      try {
        const data = await authService.login(
          user,
          dto,
          "Неверный номер телефона или пароль",
          jwt
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
      const data = await authService.login(
        user,
        dto,
        "Неверная почта или пароль",
        jwt
      );
      return reply.send(data);
    } catch (error) {
      if (error instanceof Error) {
        return reply.forbidden(error.message);
      }
    }
  }

  async refresh(
    request: FastifyRequest<{ Body: RefreshDto }>,
    reply: FastifyReply,
    jwt: JWT
  ) {
    try {
      await verifyRefreshToken(request.body.refreshToken);
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

    const newRefreshToken = await signRefreshToken({ id: user.id });

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

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.user;

    await prisma.refreshToken.deleteMany({
      where: {
        userId: id,
      },
    });

    return {
      message: "Пользователь успешно вышел со всех устройств",
    };
  }
}

export const authController = new AuthController();

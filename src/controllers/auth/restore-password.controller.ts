import { hash } from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../db";
import {
  GetCodeDto,
  RestorePasswordDto,
  VerifyCodeDto,
} from "../../schemas/auth";
import { mailService } from "../../services/mail/mail.service";

class RestorePasswordController {
  async getCode(
    request: FastifyRequest<{ Body: GetCodeDto }>,
    reply: FastifyReply
  ) {
    const { email } = request.body;
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return reply.status(404).send({
        statusCode: 404,
        message: "Пользователь не найден",
      });
    }

    const restorePasswordCode = "RESTORE_CODE";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isRestorePassword: false,
        restorePasswordCode,
      },
    });

    try {
      await mailService.restorePassword(user.email, restorePasswordCode);
      reply.status(200).send({
        message: "Сообщение успешно отправлено",
      });
    } catch (error) {
      return reply.status(500).send({
        statusCode: 500,
        message: "Произошла ошибка при отправке письма",
      });
    }
  }

  async verifyCode(
    request: FastifyRequest<{ Body: VerifyCodeDto }>,
    reply: FastifyReply
  ) {
    const { code, email } = request.body;
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return reply.notFound("Пользователь не найден");
    }

    if (user.restorePasswordCode === code) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isRestorePassword: true,
          restorePasswordCode: null,
        },
      });
      return reply.send({
        message: "Код корректен",
      });
    }

    return reply.badRequest("Некорректный код");
  }

  async restorePassword(
    request: FastifyRequest<{ Body: RestorePasswordDto }>,
    reply: FastifyReply
  ) {
    const { email, newPassword } = request.body;

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return reply.notFound("Пользователь не найден");
    }

    if (!user.isRestorePassword) {
      return reply.badRequest("Пользователь не восстанавливал пароль");
    }
    const hashNewPassword = await hash(newPassword, +process.env.SALT!);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isRestorePassword: false,
        restorePasswordCode: null,
        password: hashNewPassword,
      },
    });

    return reply.send({
      message: "Пароль успешно обновлен",
    });
  }
}

export const restorePasswordController = new RestorePasswordController();

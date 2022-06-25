import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../db";

class MeController {
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.user;
    return await prisma.user.findFirst({ where: { id } });
  }
}

export const meController = new MeController();

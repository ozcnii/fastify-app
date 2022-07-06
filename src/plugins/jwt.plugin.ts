import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "@fastify/jwt";
import fp from "fastify-plugin";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(jwt, { secret: process.env.JWT_SECRET! });
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (e) {
        return reply.unauthorized("Не авторизован");
      }
    }
  );
};

export default fp(jwtPlugin, { name: "jwt" });

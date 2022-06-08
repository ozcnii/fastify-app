import { FastifyPluginAsync } from "fastify";
import { withRefResolver } from "fastify-zod";
import swagger from "@fastify/swagger";
import fp from "fastify-plugin";

const swaggerPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.register(
    swagger,
    withRefResolver({
      routePrefix: "/docs",
      exposeRoute: true,
      staticCSP: true,
      openapi: {
        info: {
          title: "Fastify API",
          description: "API for some products",
          version: "0.0.1",
        },
      },
    })
  );
};

export default fp(swaggerPlugin, { name: "swagger" });

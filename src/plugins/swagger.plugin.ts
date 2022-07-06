import { FastifyPluginAsync } from "fastify";
import swagger from "@fastify/swagger";
import fp from "fastify-plugin";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(swagger, {
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
  });
};

export default fp(swaggerPlugin, { name: "swagger" });

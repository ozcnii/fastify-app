import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    jwt: JWT;
  }

  export interface FastifyInstance {
    authenticate: any;
  }
}

// declare module "@fastify/jwt" {
//   interface FastifyJWT {
//     user: {
//       id: number;
//     };
//   }
// }

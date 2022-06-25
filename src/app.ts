import fastify from "fastify";
import dotenv from "dotenv";
import rareLimit from "@fastify/rate-limit";
import autoLoad from "@fastify/autoload";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { join } from "path";

dotenv.config();

async function init() {
  const app = fastify({ logger: true });
  const PORT = process.env.PORT!;

  app.register(cors);
  app.register(rareLimit, { max: 60, timeWindow: "1 minute" });
  app.register(autoLoad, { dir: join(__dirname, "plugins") });
  app.register(autoLoad, { dir: join(__dirname, "routes") });
  app.register(sensible);

  try {
    await app.listen(PORT, "0.0.0.0");
    console.log(`>> Server start on http://localhost:${PORT}`);
  } catch (e) {
    await prisma.$disconnect();
    console.error(e);
    process.exit(1);
  }
}

init();

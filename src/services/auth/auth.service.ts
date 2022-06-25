import { JWT } from "@fastify/jwt";
import { User } from "@prisma/client";
import { compare } from "bcryptjs";
import { prisma } from "../../db";
import { signRefreshToken } from "../../helpers/jwt";
import { LoginDto } from "../../schemas/auth";

class AuthService {
  async login(
    user: User | null,
    dto: LoginDto,
    errorMessage: string,
    jwt: JWT
  ) {
    if (user && (await compare(dto.password, user.password))) {
      const refreshToken = await signRefreshToken({ id: user.id });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
        },
      });

      return {
        ...user,
        accessToken: jwt.sign(
          { id: user.id },
          { expiresIn: process.env.ACCESS_TOKEN_TIME! }
        ),
        refreshToken,
      };
    }
    throw new Error(errorMessage);
  }
}

export const authService = new AuthService();

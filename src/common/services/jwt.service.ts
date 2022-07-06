import { createSigner, createVerifier } from "fast-jwt";

class JwtService {
  private refreshTokenSecret: string = process.env.JWT_REFRESH_SECRET!;
  private refreshTokenExpiresIn = +process.env.REFRESH_TOKEN_TIME!;

  signRefreshToken = createSigner({
    key: async () => this.refreshTokenSecret,
    expiresIn: this.refreshTokenExpiresIn,
  });

  verifyRefreshToken = createVerifier({
    key: async () => this.refreshTokenSecret,
  });
}

export const jwtService = new JwtService();

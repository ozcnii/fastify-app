import { createSigner, createVerifier } from "fast-jwt";

const secret = process.env.JWT_REFRESH_SECRET!;
const expiresIn = +process.env.REFRESH_TOKEN_TIME!;

export const signRefreshToken = createSigner({
  key: async () => secret,
  expiresIn,
});
export const verifyRefreshToken = createVerifier({ key: async () => secret });

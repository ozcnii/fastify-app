import { Static, Type } from "@sinclair/typebox";
import { okCoreSchema } from "..";

export const AuthorizationSchema = Type.Object({
  authorization: Type.String({
    description: "Bearer {your_token}",
  }),
});

export const userCore = {
  id: Type.Number(),
  email: Type.String({ format: "email" }),
  phone: Type.String({ maxLength: 12, minLength: 11 }),
  firstName: Type.String({ minLength: 2, maxLength: 256 }),
  lastName: Type.String({ minLength: 2, maxLength: 256 }),
  categoryId: Type.Number(),
};

export const RegisterSchema = Type.Object({
  email: Type.String({ format: "email" }),
  phone: Type.String({ maxLength: 12, minLength: 11 }),
  firstName: Type.String({ minLength: 2, maxLength: 256 }),
  lastName: Type.String({ minLength: 2, maxLength: 256 }),
  password: Type.String({ minLength: 6, maxLength: 256 }),
});

export type RegisterDto = Static<typeof RegisterSchema>;

export const LoginSchema = Type.Object({
  login: Type.String({ maxLength: 256 }),
  password: Type.String({ minLength: 6, maxLength: 256 }),
});

export type LoginDto = Static<typeof LoginSchema>;

export const LoginResponseSchema = Type.Object({
  ...userCore,
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

export const RefreshSchema = Type.Object({
  refreshToken: Type.String(),
});

export const RefreshResponseSchema = Type.Object({
  ...userCore,
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

export const LogoutResponseSchema = Type.Object({
  ...okCoreSchema,
});

export const RegisterResponseSchema = Type.Object({
  ...userCore,
});

export const GetCodeSchema = Type.Object({
  email: Type.String({ format: "email" }),
});

export const VerifyCodeSchema = Type.Object({
  email: Type.String({ format: "email" }),
  code: Type.String(),
});

export const RestorePasswordSchema = Type.Object({
  email: Type.String({ format: "email" }),
  newPassword: Type.String(),
});

export type RefreshDto = Static<typeof RefreshSchema>;
export type GetCodeDto = Static<typeof GetCodeSchema>;
export type VerifyCodeDto = Static<typeof VerifyCodeSchema>;
export type RestorePasswordDto = Static<typeof RestorePasswordSchema>;

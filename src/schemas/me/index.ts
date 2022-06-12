import { Static, Type } from "@sinclair/typebox";
import { userCore } from "../auth";

export const GetMeResponseSchema = Type.Object({
  ...userCore,
});

export const RestorePasswordSchema = Type.Object({
  code: Type.String(),
  password: Type.String({ minLength: 6, maxLength: 256 }),
});

export type RestorePasswordDto = Static<typeof RestorePasswordSchema>;

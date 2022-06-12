import { Type } from "@sinclair/typebox";

export const errorCoreSchema = {
  statusCode: Type.Number(),
  message: Type.String(),
};

export const okCoreSchema = { message: Type.String() };

export const errorResponseSchema = Type.Object({
  ...errorCoreSchema,
});

export const okResponseSchema = Type.Object({
  ...okCoreSchema,
});

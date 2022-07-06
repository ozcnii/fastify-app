import { Type } from "@sinclair/typebox";

export const errorCoreSchema = {
  statusCode: Type.Number(),
  message: Type.String(),
};

export const okCoreSchema = { message: Type.String() };

export const ErrorResponseSchema = Type.Object({
  ...errorCoreSchema,
});

export const OkResponseSchema = Type.Object({
  ...okCoreSchema,
});

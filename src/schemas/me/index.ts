import { Type } from "@sinclair/typebox";
import { userCore } from "../auth";

export const GetMeResponseSchema = Type.Object({
  ...userCore,
});

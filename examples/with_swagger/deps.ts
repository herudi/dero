export { Controller, Dero, Get, Inject, Post, Status } from "./../../mod.ts";

import { Metadata } from "./../../mod.ts";

(window as any).Metadata = Metadata;

export {
  ApiBearerAuth,
  ApiDocument,
  ApiOperation,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
  DocumentBuilder,
  swagger,
} from "https://deno.land/x/dero_swagger@0.0.4/mod.ts";

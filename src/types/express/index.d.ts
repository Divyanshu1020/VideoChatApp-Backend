import * as express from "express-serve-static-core";
import { AccessToken } from "../../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: AccessToken;
    }
  }
}

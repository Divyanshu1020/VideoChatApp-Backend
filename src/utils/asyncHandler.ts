import { NextFunction, Request, Response } from "express-serve-static-core"
type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (requestHandler: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export default asyncHandler
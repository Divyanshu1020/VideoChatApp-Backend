import { Request } from "express";
import multer from "multer";

const storage = multer.diskStorage({
    
    destination: function (
        req: Request, 
        file: Express.Multer.File, 
        cb: (error: Error | null, destination: string) => void
    ) {
      cb(null, "./public/temp")
    },

    filename: function (
        req: Request, 
        file: Express.Multer.File, 
        cb: (error: Error | null, filename: string) => void
    ) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})
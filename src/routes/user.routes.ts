import { Router } from "express";
import { getMyProfile, loginUser, logoutUser, registerUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { validateSignIn } from "../middlewares/validateSignIn";
import { validateSignUp } from "../middlewares/validateSignUp";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  validateSignUp,
  registerUser
);

router.route("/login").post(validateSignIn,  loginUser);

//secured routes
router.route("/get-my-Profile").post(verifyJWT, getMyProfile );
router.route("/logout").post(verifyJWT, logoutUser)

export default router;

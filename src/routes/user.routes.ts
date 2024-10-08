import { Router } from "express";
import { acceptRequest, getMyProfile, getNotifications, loginUser, logoutUser, registerUser, searchUser, sendRequest } from "../controllers/user.controller";
import { avatar } from "../middlewares/multer.middleware";
import { validateSignIn } from "../middlewares/validateSignIn";
import { validateSignUp } from "../middlewares/validateSignUp";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();

router.route("/register").post(
  avatar,
  validateSignUp,
  registerUser
);

router.route("/login").post(validateSignIn,  loginUser);

//secured routes
router.route("/search").get(verifyJWT, searchUser); // query name
router.route("/notifications").get(verifyJWT, getNotifications); 
router.route("/request/send").put(verifyJWT, sendRequest); 
router.route("/request/accept").put(verifyJWT, acceptRequest); 
router.route("/get-my-Profile").get(verifyJWT, getMyProfile );
router.route("/logout").get(verifyJWT, logoutUser)

export default router;

import { Router } from "express";
import {
  addMembersInGroup,
  attachment,
  changeAvatarOfGroup,
  createGroup,
  getAllFriends,
  getChatDetails,
  getMessages,
  getMyChats,
  getMyGroups,
  leaveGroup,
  removeMemberInGroup,
  renameGroup,
} from "../controllers/chats.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { validateCreateGroup } from "../middlewares/validateCreateGroup";
import { files } from "../middlewares/multer.middleware";

import { avatar } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(getMyChats);
router.route("/friends").post(getAllFriends);
router.route("/attachment").post(files, attachment);
router.route("/group/my").get(getMyGroups);
router.route("/group/create").post(avatar, validateCreateGroup, createGroup);
router.route("/group/member/add").put(addMembersInGroup);
router.route("/group/rename").put(renameGroup);
router.route("/group/avatar").put(avatar, changeAvatarOfGroup);
router.route("/group/member/remove").patch(removeMemberInGroup);
router.route("/group/member/leave/").patch(leaveGroup);
router.route("/messages/:chatId").get(getMessages); // query page number
router.route("/details/:chatId").get(getChatDetails); // query populate number
// TODO: work on delete message
// router.route("/detail/:chatId").get(getMessages); // query page number


export default router;

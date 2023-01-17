import CustomErrors from "../errors/error-index.js";
const checkPermission = (requestUser, resourceUserId) => {
  //   console.log(requestUser.userId);
  //   console.log(resourceUserId);
  if (requestUser.role !== "admin" && requestUser.userId !== resourceUserId) {
    throw new CustomErrors.AccessForbiddenError("Unauthorized request");
  }
};

export default checkPermission;

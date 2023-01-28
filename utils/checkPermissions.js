import CustomErrors from "../errors/error-index.js";
const checkPermission = (requestUser, resourceUserId) => {
  //   console.log(requestUser.userId);
  //   console.log(resourceUserId);
  if (requestUser.role !== "admin" && requestUser.userId !== resourceUserId) {
    throw new CustomErrors.NotFoundError(
      `No item found with id: ${resourceUserId}`
    );
  }
};

export default checkPermission;

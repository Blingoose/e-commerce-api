import CustomErrors from "../errors/error-index.js";
const checkPermission = (requestUser, resourceUserId, item) => {
  if (requestUser.role !== "admin" && requestUser.userId !== resourceUserId) {
    if (item) {
      throw new CustomErrors.NotFoundError(`No item found with id: ${item}`);
    } else {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${resourceUserId}`
      );
    }
  }
};

export default checkPermission;

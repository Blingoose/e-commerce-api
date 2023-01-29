import CustomErrors from "../errors/error-index.js";
const checkPermission = (requestUser, resourceUserId, itemId) => {
  //   console.log(requestUser.userId);
  //   console.log(resourceUserId);
  if (requestUser.role !== "admin" && requestUser.userId !== resourceUserId) {
    if (itemId) {
      throw new CustomErrors.NotFoundError(`No item found with id: ${itemId}`);
    } else {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${resourceUserId}`
      );
    }
  }
};

export default checkPermission;

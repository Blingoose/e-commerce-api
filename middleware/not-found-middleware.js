import { StatusCodes } from "http-status-codes";

const notFoundRoute = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).send("Route does not exist");
};

export default notFoundRoute;

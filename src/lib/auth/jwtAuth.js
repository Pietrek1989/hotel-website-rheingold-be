export const jwtAuth = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(createHttpError(401, "No bearer token provided. 🐻"));
  } else {
    const accessToken = req.headers.authorization.replace("Bearer ", "");
    try {
      const payload = await verifyAccessToken(accessToken);
      req.user = { _id: payload._id };
      next();
    } catch (error) {
      console.log(error);
      next(createHttpError(401, "Invalid token."));
    }
  }
};

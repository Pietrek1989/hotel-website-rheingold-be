import jwt from "jsonwebtoken";

export const createAccessToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyAccessToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) reject(err);
      else resolve(payload);
    })
  );

export const createRefreshToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyRefreshToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.REFRESH_SECRET, (err, payload) => {
      if (err) reject(err);
      else resolve(payload);
    })
  );

export const createTokens = async (user) => {
  console.log(user);
  const accessToken = await createAccessToken({ _id: user._id });
  const refreshToken = await createRefreshToken({ _id: user._id });

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const verifyAndRefreshTokens = async (currentRefreshToken) => {
  try {
    console.log("bla", currentRefreshToken);
    const { _id } = await verifyRefreshToken(currentRefreshToken);
    console.log(_id);
    const user = await UsersModel.findById(_id);
    console.log(user);
    if (!user) throw new createHttpError(404, `User with id ${_id} not found.`);
    if (user.refreshToken && user.refreshToken === currentRefreshToken) {
      const { accessToken, refreshToken } = await createTokens(user);
      return { accessToken, refreshToken };
    } else {
      throw new createHttpError(401, "Invalid refresh token.");
    }
  } catch (error) {
    throw new createHttpError(401, "Please log in.");
  }
};

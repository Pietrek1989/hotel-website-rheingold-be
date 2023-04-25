import GoogleStrategy from "passport-google-oauth20";
import AuthorsModel from "../../api/users/model.js";
import createHttpError from "http-errors";
import { createAccessToken } from "./tools.js";

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.BE_URL}/users/googlecallback`,
  },
  async (_, __, profile, pnext) => {
    try {
      const { email, given_name, family_name, sub, picture } = profile._json;
      const user = await UsersModel.findOne({ email });
      if (user) {
        const { accessToken, refreshToken } = await createTokens(user);
        pnext(null, { accessToken, refreshToken });
      } else {
        const newUser = await UsersModel({
          name: given_name + " " + family_name,
          email,
          avatar: picture,
          googleId: sub,
        });

        const created = await newUser.save();
        const { accessToken, refreshToken } = await createTokens(created);
        pnext(null, { accessToken, refreshToken });
      }
    } catch (error) {
      pnext(error);
    }
  }
);
export default googleStrategy;

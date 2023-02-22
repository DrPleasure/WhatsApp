import GoogleStrategy from "passport-google-oauth20";
import userModel from "../api/users/model.js";
import { createAccessToken } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_KEY,
    callbackURL: `${process.env.BE_URL}/users/googleRedirect`,
  },
  async (_, __, profile, passportNext) => {
    try {
      const { email, given_userName } = profile._json;

      const user = await userModel.findOne({ email });
      if (user) {
        const accessToken = await createAccessToken({
          _id: user._id,
        });
        passportNext(null, { accessToken });
      } else {
        const newUser = new userModel({
          name: given_userName,
          email,
          googleId: profile.id,
        });
        const createdUser = await newUser.save();

        const accessToken = await createAccessToken({
          _id: createdUser._id,
        });
        passportNext(null, { accessToken });
      }
    } catch (error) {
      console.log(error);
      passportNext(error);
    }
  }
);

export default googleStrategy;

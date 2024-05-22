import passport from "passport";
import Account from "../schemas/accountSchema.js";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import Logbook from "./logger.js";
import {generateRefreshToken, generateToken} from "../utils/tokenGeneration.js";

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function(accessToken, refreshToken, profile, cb) {
        try {
            // Process the profile information
            const account = await Account.findOne({ googleID: profile.id });

            if (account) {
                console.log('User Account already exists');
                return cb(null, account);
            }

            // Create a new user account if it doesn't exist
            const newAccount = await Account.create({
                name: profile.displayName,
                surname: profile.name.familyName,
                email: profile.emails[0].value,
                password: null,
                mobile_number: null,
                googleID: profile.id
            });

            console.log('New User Account created');
            return cb(null, newAccount);
        } catch (error) {
            console.error('Error processing Google authentication:', error);
            return cb(error); // Pass any errors to the cb callback
        }
    }));
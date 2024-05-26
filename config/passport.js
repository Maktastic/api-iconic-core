import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';

import Account from '../schemas/accountSchema.js'
import Logbook from "./logger.js";
import './passport-google.js'

dotenv.config();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCOUNT_SECRET_KEY,
};

passport.use(
    new JwtStrategy(opts, async (payload, done) => {
        try {
            const user = await Account.findById(payload._id);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            Logbook.error(`Error in JWT strategy: ${err.message}`);
            return done(err, false);
        }
    })
);


passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, user)
    })
})

passport.deserializeUser((user, done) => {
    process.nextTick(() => {
        done(null, user)
    })
})

const passportConfig = () => {
    passport.initialize();
};

export default passportConfig;

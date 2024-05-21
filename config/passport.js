import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';

import Account from '../schemas/accountSchema.js'

dotenv.config();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCOUNT_SECRET_KEY,
};

const passportConfig = () => {
    passport.use(
        new JwtStrategy(opts, async (payload, done) => {
            try {
                const user = await Account.findById(payload._id);
                console.log(user)
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        })
    );
}

export default passportConfig;

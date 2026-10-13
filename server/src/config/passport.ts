import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { User } from '../models/User.model';
import { findOrCreateGoogleUser } from '../services/user.service';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
      },
      // This callback only ever runs after Google has verified the user and signed the
      // profile — nothing here originates from the client. We never see or store a
      // Google password, only the profile Google chooses to share.
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Google account has no email on file.'));
          }
          const user = await findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName || email,
            avatar: profile.photos?.[0]?.value,
          });
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user ?? false);
    } catch (err) {
      done(err as Error);
    }
  });
}

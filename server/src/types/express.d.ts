import { IUser } from '../models/User.model';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    // Passport assigns the deserialized user onto req.user typed as Express.User.
    // Extending it here means req.user is our real IUser everywhere, no `as` casts needed.
    interface User extends IUser {}
  }
}

export {};

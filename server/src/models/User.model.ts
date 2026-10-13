import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

// We never store a password or any Google credential — googleId is only ever
// written from the verified profile returned by Passport's Google strategy,
// never from a client-supplied field. See services/user.service.ts.
export const User = model<IUser>('User', userSchema);

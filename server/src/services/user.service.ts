import { User, IUser } from '../models/User.model';
import { Progress } from '../models/Progress.model';
import { CURRICULUM } from '../data/curriculum';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

/**
 * Finds the user for this Google account, or creates one along with a fresh Progress
 * record. `googleId` here always comes from Passport's verified Google strategy callback
 * (config/passport.ts) — this function never trusts an id supplied by the client.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfileInput): Promise<IUser> {
  let user = await User.findOne({ googleId: profile.googleId });

  if (!user) {
    user = await User.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    });
    await createInitialProgress(user._id.toString());
  } else {
    // Keep display info fresh (name/avatar can change on the Google account) without
    // touching anything progress-related.
    user.email = profile.email;
    user.name = profile.name;
    user.avatar = profile.avatar;
    await user.save();
  }

  return user;
}

async function createInitialProgress(userId: string): Promise<void> {
  const firstLevel = [...CURRICULUM].sort((a, b) => a.order - b.order)[0];
  if (!firstLevel) {
    throw new Error('Curriculum is empty — run the seed script before creating users.');
  }
  const firstExerciseId = `${firstLevel.levelId}-ex-1`;

  await Progress.create({
    userId,
    completedExercises: [],
    completedLevels: [],
    xp: 0,
    streak: 0,
    achievements: [],
    currentLevelId: firstLevel.levelId,
    currentExerciseId: firstExerciseId,
    courseStage: 'theory',
    courseTopicIndex: 0,
    allLevelsCompleted: false,
    activeAttempt: null,
    practiceSession: null,
  });
}

export function toPublicUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
}

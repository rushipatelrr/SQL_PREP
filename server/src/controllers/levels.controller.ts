import { Request, Response } from 'express';
import { getOrCreateProgress, listLevelsForUser, getLevelDetailForUser } from '../services/progress.service';

export async function listLevels(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const levels = await listLevelsForUser(progress);
  res.json({ levels });
}

export async function getLevel(req: Request, res: Response): Promise<void> {
  const progress = await getOrCreateProgress(req.user!._id.toString());
  const level = await getLevelDetailForUser(req.params.levelId, progress);
  res.json({ level });
}

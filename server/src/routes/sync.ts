import { Router, Request, Response, NextFunction } from 'express';
import { SyncService } from '../services/syncService';

const router = Router();

/**
 * POST /api/v1/sync/push
 * Headers: X-SHG-ID, X-Device-ID
 * Body: SyncPushRequest
 */
router.post('/push', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shgIdHeader = req.header('X-SHG-ID');
    const deviceIdHeader = req.header('X-Device-ID');
    const result = await SyncService.processPush(req.body, shgIdHeader || undefined);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/sync/pull
 * Headers: X-SHG-ID, X-Device-ID
 * Body: SyncPullRequest
 */
router.post('/pull', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shgIdHeader = req.header('X-SHG-ID');
    const result = await SyncService.processPull(req.body, shgIdHeader || undefined);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

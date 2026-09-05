import { Router, Request, Response, NextFunction } from 'express';
import type { Database } from 'sqlite';

type CurrentUserShape = { id: string; role: string };

interface Deps {
  initDb: () => Promise<Database>;
  sendError: (res: Response, status: number, message: string, code?: string) => Response;
  requireAuth: (req: Request, res: Response, next: NextFunction) => void;
  requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
  mapUser: (row?: any) => any;
}

export function createAdminRouter(deps: Deps) {
  const router = Router();
  const { initDb, sendError, requireAuth, requireRole } = deps;

  router.get('/stats', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const db = await initDb();
      const students = await db.get('SELECT COUNT(*) AS total FROM users WHERE role = ?', 'student');
      const orgs = await db.get('SELECT COUNT(*) AS total FROM users WHERE role = ?', 'organization');
      const admins = await db.get('SELECT COUNT(*) AS total FROM users WHERE role = ?', 'admin');
      const completedTasks = await db.get("SELECT COUNT(*) AS total FROM tasks WHERE status = 'completed'");
      const activeTasks = await db.get("SELECT COUNT(*) AS total FROM tasks WHERE status IN ('open','in_progress','review')");
      const responses = await db.get('SELECT COUNT(*) AS total FROM task_responses');
      const pointsRow = await db.get('SELECT COALESCE(SUM(points),0) AS total FROM users WHERE role = ?', 'student');
      return res.json({
        students: students?.total || 0,
        organizations: orgs?.total || 0,
        admins: admins?.total || 0,
        completedTasks: completedTasks?.total || 0,
        activeTasks: activeTasks?.total || 0,
        responsesProcessed: responses?.total || 0,
        pointsAwarded: pointsRow?.total || 0,
      });
    } catch (e) {
      console.error('Admin stats error:', e);
      return sendError(res, 500, 'Ошибка получения статистики');
    }
  });

  router.get('/users', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const db = await initDb();
      const rows = await db.all('SELECT id, email, role, name, firstName, lastName, university, points, status FROM users ORDER BY created_at DESC');
      return res.json({ users: rows || [] });
    } catch (e) {
      console.error('Admin users error:', e);
      return sendError(res, 500, 'Ошибка получения списка пользователей');
    }
  });

  router.post('/users/:id/block', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const db = await initDb();
      await db.run("UPDATE users SET status = 'blocked' WHERE id = ?", req.params.id);
      return res.json({ ok: true });
    } catch (e) {
      console.error('Admin block error:', e);
      return sendError(res, 500, 'Ошибка блокировки');
    }
  });

  router.post('/users/:id/unblock', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const db = await initDb();
      await db.run("UPDATE users SET status = 'active' WHERE id = ?", req.params.id);
      return res.json({ ok: true });
    } catch (e) {
      console.error('Admin unblock error:', e);
      return sendError(res, 500, 'Ошибка разблокировки');
    }
  });

  return router;
}

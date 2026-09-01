/**
 * Мобильный REST API для Android-клиента «Студенческий подряд».
 *
 * Модуль подключается к существующему Express-монолиту (server.ts) и
 * переиспользует его готовые мапперы (mapTask / mapUser / mapTaskResponse /
 * mapNotification) и вспомогательные функции. Никакой новой бизнес-логики и
 * новых таблиц здесь нет — только точечные выборки из существующей БД вместо
 * тяжёлого монолитного GET /api/bootstrap.
 *
 * Авторизация: JWT в заголовке Authorization: Bearer <token> (см. server.ts).
 */
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Database } from 'sqlite';

type DbRow = Record<string, any>;

type CurrentUserShape = {
  id: string;
  role: 'student' | 'organization' | 'admin';
};

interface MobileApiDeps {
  initDb: () => Promise<Database>;
  sendError: (res: Response, status: number, message: string, code?: string) => Response;
  requireAuth: (req: Request, res: Response, next: NextFunction) => void;
  requireRole: (roles: CurrentUserShape['role'][]) => (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  mapTask: (row: DbRow) => Record<string, any>;
  mapTaskResponse: (row: DbRow, teamMembers?: Record<string, any>[]) => Record<string, any>;
  mapNotification: (row: DbRow) => Record<string, any>;
  getTaskRowById: (taskId: string) => Promise<DbRow | undefined>;
  getTaskResponseMembers: (responseId: string) => Promise<Record<string, any>[]>;
  taskSelectFields: string;
}

const ALLOWED_TASK_STATUSES = new Set(['open', 'in_progress', 'review', 'completed', 'cancelled']);
const ALLOWED_TASK_FORMATS = new Set(['online', 'hybrid', 'offline']);
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

function buildSqlPlaceholders(count: number) {
  return Array.from({ length: count }, () => '?').join(', ');
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function parseIntParam(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function createMobileApiRouter(deps: MobileApiDeps) {
  const router = Router();
  const { initDb, sendError, requireAuth, requireRole, mapTask, mapTaskResponse, mapNotification, getTaskRowById, getTaskResponseMembers, taskSelectFields } = deps;

  /** GET /api/me — профиль текущего пользователя (уже загружен middleware-ом). */
  router.get('/me', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as Request & { currentUser?: Record<string, any> }).currentUser;
    return res.json({ user: currentUser || null });
  });

  /**
   * GET /api/tasks — каталог задач с пагинацией и фильтрами.
   * Параметры: page (>=1), limit (1..50), status, category, format, query.
   * Обзорные проекты (taskKind = 'parent') в каталог не попадают.
   */
  router.get('/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const page = parseIntParam(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
      const limit = parseIntParam(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
      const offset = (page - 1) * limit;

      const where: string[] = ["COALESCE(t.taskKind, 'single') != 'parent'"];
      const params: Array<string | number> = [];

      const status = String(req.query.status || '').trim();
      if (status) {
        if (!ALLOWED_TASK_STATUSES.has(status)) {
          return sendError(res, 400, 'Некорректный статус задачи');
        }
        where.push('t.status = ?');
        params.push(status);
      } else {
        // По умолчанию показываем только открытые задачи.
        where.push("t.status = 'open'");
      }

      const category = String(req.query.category || '').trim();
      if (category) {
        where.push('t.category = ?');
        params.push(category);
      }

      const format = String(req.query.format || '').trim();
      if (format) {
        if (!ALLOWED_TASK_FORMATS.has(format)) {
          return sendError(res, 400, 'Некорректный формат задачи');
        }
        where.push('t.format = ?');
        params.push(format);
      }

      const query = String(req.query.query || '').trim();
      if (query) {
        const like = `%${escapeLike(query)}%`;
        where.push("(t.title LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\' OR t.requirements LIKE ? ESCAPE '\\')");
        params.push(like, like, like);
      }

      const whereSql = `WHERE ${where.join(' AND ')}`;

      const db = await initDb();
      const countRow = await db.get<{ total: number }>(
        `SELECT COUNT(*) AS total FROM tasks t ${whereSql}`,
        ...params,
      );
      const total = Number(countRow?.total || 0);

      const rows = await db.all<DbRow[]>(
        `${taskSelectFields} ${whereSql} ORDER BY datetime(t.created_at) DESC LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
      );

      return res.json({
        tasks: rows.map((row) => mapTask(row)),
        total,
        page,
        limit,
        hasMore: offset + rows.length < total,
      });
    } catch (error) {
      console.error('Mobile GET /tasks error:', error);
      return sendError(res, 500, 'Не удалось загрузить задачи');
    }
  });

  /** GET /api/tasks/:id — карточка задачи. */
  router.get('/tasks/:taskId', requireAuth, async (req: Request, res: Response) => {
    try {
      const row = await getTaskRowById(String(req.params.taskId));
      if (!row) {
        return sendError(res, 404, 'Задача не найдена');
      }
      return res.json({ task: mapTask(row) });
    } catch (error) {
      console.error('Mobile GET /tasks/:id error:', error);
      return sendError(res, 500, 'Не удалось загрузить задачу');
    }
  });

  /**
   * GET /api/my/tasks — отклики текущего студента вместе с задачами.
   * Ответ: { items: [{ task, response }] }, отсортировано по обновлению отклика.
   */
  router.get('/my/tasks', requireRole(['student', 'admin']), async (req: Request, res: Response) => {
    try {
      const currentUser = (req as Request & { currentUser?: CurrentUserShape }).currentUser;
      const db = await initDb();
      const responseRows = await db.all<DbRow[]>(
        `
          SELECT DISTINCT tr.*
          FROM task_responses tr
          INNER JOIN task_response_members trm ON trm.responseId = tr.id
          WHERE trm.studentId = ?
          ORDER BY datetime(COALESCE(tr.updated_at, tr.created_at)) DESC
        `,
        currentUser!.id,
      );

      const taskIds = Array.from(new Set(responseRows.map((row) => String(row.taskId))));
      const taskRows = taskIds.length
        ? await db.all<DbRow[]>(
            `${taskSelectFields} WHERE t.id IN (${buildSqlPlaceholders(taskIds.length)})`,
            ...taskIds,
          )
        : [];
      const taskById = new Map(taskRows.map((row) => [String(row.id), row]));
      const membersMap = new Map<string, Record<string, any>[]>();
      for (const row of responseRows) {
        membersMap.set(String(row.id), await getTaskResponseMembers(String(row.id)));
      }

      const items = responseRows
        .map((row) => {
          const taskRow = taskById.get(String(row.taskId));
          if (!taskRow) {
            return null;
          }
          return {
            task: mapTask(taskRow),
            response: mapTaskResponse(row, membersMap.get(String(row.id)) || []),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return res.json({ items });
    } catch (error) {
      console.error('Mobile GET /my/tasks error:', error);
      return sendError(res, 500, 'Не удалось загрузить мои задачи');
    }
  });

  /**
   * GET /api/my/portfolio — выполненные кейсы студента.
   * Только отклики со статусом 'completed'.
   */
  router.get('/my/portfolio', requireRole(['student', 'admin']), async (req: Request, res: Response) => {
    try {
      const currentUser = (req as Request & { currentUser?: CurrentUserShape }).currentUser;
      const db = await initDb();
      const responseRows = await db.all<DbRow[]>(
        `
          SELECT DISTINCT tr.*
          FROM task_responses tr
          INNER JOIN task_response_members trm ON trm.responseId = tr.id
          WHERE trm.studentId = ? AND tr.status = 'completed'
          ORDER BY datetime(COALESCE(tr.updated_at, tr.created_at)) DESC
        `,
        currentUser!.id,
      );

      const taskIds = Array.from(new Set(responseRows.map((row) => String(row.taskId))));
      const taskRows = taskIds.length
        ? await db.all<DbRow[]>(
            `${taskSelectFields} WHERE t.id IN (${buildSqlPlaceholders(taskIds.length)})`,
            ...taskIds,
          )
        : [];
      const taskById = new Map(taskRows.map((row) => [String(row.id), row]));
      const membersMap = new Map<string, Record<string, any>[]>();
      for (const row of responseRows) {
        membersMap.set(String(row.id), await getTaskResponseMembers(String(row.id)));
      }

      const items = responseRows
        .map((row) => {
          const taskRow = taskById.get(String(row.taskId));
          if (!taskRow) {
            return null;
          }
          return {
            task: mapTask(taskRow),
            response: mapTaskResponse(row, membersMap.get(String(row.id)) || []),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return res.json({ items });
    } catch (error) {
      console.error('Mobile GET /my/portfolio error:', error);
      return sendError(res, 500, 'Не удалось загрузить портфолио');
    }
  });

  /** GET /api/notifications — уведомления текущего пользователя. */
  router.get('/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = (req as Request & { currentUser?: CurrentUserShape }).currentUser;
      const limit = parseIntParam(req.query.limit, 50, 1, 100);
      const db = await initDb();
      const rows = await db.all<DbRow[]>(
        `
          SELECT * FROM notifications
          WHERE userId = ?
          ORDER BY datetime(created_at) DESC
          LIMIT ?
        `,
        currentUser!.id,
        limit,
      );
      const unreadRow = await db.get<{ count: number }>(
        'SELECT COUNT(*) AS count FROM notifications WHERE userId = ? AND read = 0',
        currentUser!.id,
      );

      return res.json({
        items: rows.map((row) => mapNotification(row)),
        unreadCount: Number(unreadRow?.count || 0),
      });
    } catch (error) {
      console.error('Mobile GET /notifications error:', error);
      return sendError(res, 500, 'Не удалось загрузить уведомления');
    }
  });

  /** POST /api/notifications/read-all — отметить все уведомления прочитанными. */
  router.post('/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = (req as Request & { currentUser?: CurrentUserShape }).currentUser;
      const db = await initDb();
      await db.run(
        'UPDATE notifications SET read = 1 WHERE userId = ?',
        currentUser!.id,
      );
      return res.json({ ok: true });
    } catch (error) {
      console.error('Mobile POST /notifications/read-all error:', error);
      return sendError(res, 500, 'Не удалось обновить уведомления');
    }
  });

  return router;
}

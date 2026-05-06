import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activity-log.service';

// Map route patterns to human-readable actions + modules
const ACTION_MAP: Record<string, { action: string; module: string }> = {
  'GET /leads':                  { action: 'VIEW_LEADS',         module: 'leads' },
  'POST /leads':                 { action: 'CREATE_LEAD',        module: 'leads' },
  'PATCH /leads/:id':            { action: 'UPDATE_LEAD',        module: 'leads' },
  'POST /leads/:id/convert':     { action: 'CONVERT_LEAD',       module: 'leads' },
  'POST /leads/:id/close':       { action: 'CLOSE_LEAD',         module: 'leads' },
  'POST /leads/bulk-upload':     { action: 'BULK_IMPORT_LEADS',  module: 'leads' },
  'GET /applicants':             { action: 'VIEW_PROJECTS',      module: 'applicants' },
  'GET /applicants/:id':         { action: 'VIEW_PROJECT',       module: 'applicants' },
  'PATCH /applicants/:id':       { action: 'UPDATE_PROJECT',     module: 'applicants' },
  'POST /applicants/:id/stage':  { action: 'CHANGE_STAGE',       module: 'applicants' },
  'POST /applicants/:id/documents': { action: 'UPLOAD_DOCUMENT', module: 'documents' },
  'GET /finance':                { action: 'VIEW_FINANCE',       module: 'finance' },
  'POST /finance':               { action: 'ADD_TRANSACTION',    module: 'finance' },
  'POST /finance/:id/approve':   { action: 'APPROVE_TRANSACTION',module: 'finance' },
  'POST /finance/:id/reject':    { action: 'REJECT_TRANSACTION', module: 'finance' },
  'GET /vendors':                { action: 'VIEW_VENDORS',       module: 'vendors' },
  'POST /vendors':               { action: 'CREATE_VENDOR',      module: 'vendors' },
  'PATCH /vendors/:id':          { action: 'UPDATE_VENDOR',      module: 'vendors' },
  'DELETE /vendors/:id':         { action: 'DEACTIVATE_VENDOR',  module: 'vendors' },
  'GET /reports/dashboard':      { action: 'VIEW_DASHBOARD',     module: 'reports' },
  'POST /reports/export-pdf':    { action: 'EXPORT_PDF',         module: 'reports' },
  'POST /reports/export-excel':  { action: 'EXPORT_EXCEL',       module: 'reports' },
  'GET /users':                  { action: 'VIEW_USERS',         module: 'settings' },
  'POST /users':                 { action: 'CREATE_USER',        module: 'settings' },
  'PATCH /users/:id':            { action: 'UPDATE_USER',        module: 'settings' },
  'DELETE /users/:id':           { action: 'DELETE_USER',        module: 'settings' },
  'POST /users/:id/approve':     { action: 'APPROVE_USER',       module: 'settings' },
  'POST /companies':             { action: 'CREATE_COMPANY',     module: 'admin' },
  'PATCH /companies/:id/status': { action: 'TOGGLE_COMPANY',     module: 'admin' },
  'POST /master-data/:type':     { action: 'CREATE_MASTER_ITEM', module: 'admin' },
  'PATCH /master-data/:type/:id':{ action: 'UPDATE_MASTER_ITEM', module: 'admin' },
  'DELETE /master-data/:type/:id':{ action: 'DELETE_MASTER_ITEM',module: 'admin' },
  'POST /document-master':       { action: 'CREATE_DOC_MASTER',  module: 'admin' },
  'PATCH /document-master/:id':  { action: 'UPDATE_DOC_MASTER',  module: 'admin' },
  'DELETE /document-master/:id': { action: 'DELETE_DOC_MASTER',  module: 'admin' },
};

function resolveAction(method: string, rawPath: string): { action: string; module: string } {
  // Strip /api/v1 prefix
  const path = rawPath.replace(/^\/api\/v1/, '');

  // Try exact match first
  const exactKey = `${method} ${path}`;
  if (ACTION_MAP[exactKey]) return ACTION_MAP[exactKey];

  // Normalize path: replace UUID-like segments with :id
  const normalized = path.replace(/\/[0-9a-f-]{36}/gi, '/:id').replace(/\/[a-z0-9-]{5,}(?=\/|$)/gi, '/:id');
  const normalizedKey = `${method} ${normalized}`;
  if (ACTION_MAP[normalizedKey]) return ACTION_MAP[normalizedKey];

  // Fallback: derive from method + first path segment
  const segment = path.split('/').filter(Boolean)[0] ?? 'unknown';
  const actions: Record<string, string> = { GET: 'VIEW', POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' };
  return { action: `${actions[method] ?? method}_${segment.toUpperCase()}`, module: segment };
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = req;
    const user = req.user;

    // Skip auth/master/upload read-only routes to reduce noise
    const skipPaths = ['/api/v1/auth/refresh', '/api/v1/master/', '/api/v1/master-data/', '/upload/'];
    const isGet = method === 'GET';
    const shouldSkip = skipPaths.some((p) => url.includes(p)) || (isGet && !url.includes('/reports'));

    if (shouldSkip) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          try {
            const res = context.switchToHttp().getResponse();
            const { action, module } = resolveAction(method, url);
            this.activityLogService.log({
              userId: user?.id ?? undefined,
              companyId: user?.companyId ?? undefined,
              action,
              module,
              ipAddress: (ip ?? '').replace('::ffff:', ''),
              userAgent: headers['user-agent']?.slice(0, 500),
              method,
              path: url.slice(0, 300),
              statusCode: res.statusCode,
            });
          } catch { /* never let logging errors affect responses */ }
        },
        error: (err) => {
          try {
            const { action, module } = resolveAction(method, url);
            this.activityLogService.log({
              userId: user?.id ?? undefined,
              companyId: user?.companyId ?? undefined,
              action: `${action}_FAILED`,
              module,
              ipAddress: (ip ?? '').replace('::ffff:', ''),
              userAgent: headers['user-agent']?.slice(0, 500),
              method,
              path: url.slice(0, 300),
              statusCode: err.status ?? 500,
              description: err.message?.slice(0, 200),
            });
          } catch { /* never let logging errors affect responses */ }
        },
      }),
    );
  }
}

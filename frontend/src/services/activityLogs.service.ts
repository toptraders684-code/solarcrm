import api from './api';

export interface ActivityLogFilter {
  companyId?: string;
  userId?: string;
  action?: string;
  module?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const activityLogsService = {
  getAll(params: ActivityLogFilter = {}) {
    return api.get('/activity-logs', { params }).then((r) => r.data);
  },
};

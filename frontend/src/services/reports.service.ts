import api from './api';

export type ReportType =
  | 'lead_summary'
  | 'conversion_funnel'
  | 'stage_aging'
  | 'project_profitability'
  | 'subsidy_tracker'
  | 'vendor_payment'
  | 'staff_performance'
  | 'discom_wise';

export interface ReportParams {
  reportType: ReportType;
  dateFrom?: string;
  dateTo?: string;
  discom?: string;
  staffId?: string;
  format?: 'json' | 'pdf' | 'excel';
}

export const reportsService = {
  generate: async (params: ReportParams): Promise<{ data: any[]; summary: any }> => {
    const { data } = await api.get('/reports/generate', { params });
    return data;
  },

  download: async (params: ReportParams & { format: 'pdf' | 'excel' }): Promise<Blob> => {
    const { data } = await api.get('/reports/download', {
      params,
      responseType: 'blob',
    });
    return data;
  },
};

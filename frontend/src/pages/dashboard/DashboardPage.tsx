import { useQuery } from '@tanstack/react-query';
import { Users, FileText, DollarSign, Clock, TrendingUp, Zap } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { STAGE_LABELS } from '@/utils/formatters';
import type { DashboardStats } from '@/types';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent = false,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-on-surface mt-2 font-headline">{value}</p>
          {description && <p className="text-xs text-on-surface-variant/60 mt-1">{description}</p>}
        </div>
        <div className="w-12 h-12 signature-gradient rounded-xl flex items-center justify-center shadow-md">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data;
    },
    retry: false,
    placeholderData: {
      totalLeads: 0, activeApplicants: 0, pendingApprovals: 0,
      monthlyRevenue: 0, leadsThisMonth: 0, conversionRate: 0, stageWiseCount: {},
    },
  });

  const stageEntries = Object.entries(STAGE_LABELS).filter(
    ([stageNum]) => (stats?.stageWiseCount?.[stageNum] ?? 0) > 0
  );

  return (
    <PageWrapper
      title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}!`}
      subtitle="Here's what's happening with your projects today."
    >
      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value={stats?.totalLeads ?? 0} icon={FileText} description={`${stats?.leadsThisMonth ?? 0} this month`} />
          <StatCard title="Active Projects" value={stats?.activeApplicants ?? 0} icon={Users} description="In pipeline" />
          <StatCard title="Pending Approvals" value={stats?.pendingApprovals ?? 0} icon={Clock} description="Finance queue" />
          <StatCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue)} icon={DollarSign} description="Received this month" accent />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-container-low">
            <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
              <Zap className="text-primary" size={20} />
              Projects by Stage
            </h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : stageEntries.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 text-center py-8">No active projects</p>
            ) : (
              <div className="space-y-1">
                {stageEntries.map(([stageNum, label]) => {
                  const count = stats?.stageWiseCount?.[stageNum] ?? 0;
                  return (
                    <div key={stageNum} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full signature-gradient text-white text-[10px] flex items-center justify-center font-black">
                          {stageNum}
                        </span>
                        <span className="text-sm font-medium text-on-surface">{label}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-on-surface-variant">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-container-low">
            <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
              <TrendingUp className="text-primary" size={20} />
              Quick Stats
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {[
              { label: 'Conversion Rate', value: `${((stats?.conversionRate ?? 0) * 100).toFixed(1)}%`, highlight: true },
              { label: 'Leads This Month', value: stats?.leadsThisMonth ?? 0 },
              { label: 'Active Projects', value: stats?.activeApplicants ?? 0 },
              { label: 'Finance Pending', value: stats?.pendingApprovals ?? 0 },
            ].map(({ label, value, highlight }, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant/70">{label}</span>
                  <span className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</span>
                </div>
                {i < 3 && <div className="mt-4 h-px bg-surface-container-low" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

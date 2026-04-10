import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { getStageName, STAGE_LABELS } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import type { DashboardStats } from '@/types';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass = 'text-brand-500',
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-headline font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-muted ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    // Provide empty fallback so dashboard renders without API
    placeholderData: {
      totalLeads: 0,
      activeApplicants: 0,
      pendingApprovals: 0,
      monthlyRevenue: 0,
      leadsThisMonth: 0,
      conversionRate: 0,
      stageWiseCount: {},
    },
  });

  return (
    <PageWrapper
      title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}!`}
      subtitle="Here's what's happening with your projects today."
    >
      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats?.totalLeads ?? 0}
            icon={FileText}
            description={`${stats?.leadsThisMonth ?? 0} this month`}
          />
          <StatCard
            title="Active Projects"
            value={stats?.activeApplicants ?? 0}
            icon={Users}
            description="In pipeline"
            colorClass="text-blue-500"
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals ?? 0}
            icon={Clock}
            description="Finance queue"
            colorClass="text-yellow-500"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats?.monthlyRevenue)}
            icon={DollarSign}
            description="Received this month"
            colorClass="text-green-600"
          />
        </div>
      )}

      {/* Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-500" />
              Projects by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(STAGE_LABELS).map(([stageNum, label]) => {
                  const count = stats?.stageWiseCount?.[stageNum] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div key={stageNum} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs flex items-center justify-center font-medium">
                          {stageNum}
                        </span>
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
                {Object.values(stats?.stageWiseCount ?? {}).every((v) => v === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No active projects</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-sm font-semibold text-brand-600">
                  {((stats?.conversionRate ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Leads This Month</span>
                <span className="text-sm font-semibold">{stats?.leadsThisMonth ?? 0}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="text-sm font-semibold">{stats?.activeApplicants ?? 0}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Finance Pending</span>
                <span className="text-sm font-semibold text-yellow-600">{stats?.pendingApprovals ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

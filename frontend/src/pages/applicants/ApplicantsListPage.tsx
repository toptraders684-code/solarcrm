import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName, getDiscomLabel } from '@/utils/formatters';
import { STAGE_LABELS } from '@/utils/formatters';
import type { Applicant } from '@/types';

export default function ApplicantsListPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [discomFilter, setDiscomFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', page, search, stageFilter, discomFilter],
    queryFn: () =>
      applicantsService.getApplicants({
        page,
        limit: 25,
        search: search || undefined,
        stage: stageFilter ? Number(stageFilter) : undefined,
        discom: discomFilter || undefined,
      }),
  });

  const applicants = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper title="Projects" subtitle={`${meta?.total ?? 0} total projects`}>
      {/* Stage Summary Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STAGE_LABELS).map(([num, label]) => (
          <button
            key={num}
            onClick={() => setStageFilter(stageFilter === num ? '' : num)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              stageFilter === num
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}
          >
            {num}. {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, code..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={discomFilter} onValueChange={(v) => { setDiscomFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="DISCOM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All DISCOMs</SelectItem>
            <SelectItem value="tpcodl">TPCODL</SelectItem>
            <SelectItem value="tpnodl">TPNODL</SelectItem>
            <SelectItem value="tpsodl">TPSODL</SelectItem>
            <SelectItem value="tpwodl">TPWODL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DISCOM</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : applicants.map((a: Applicant) => (
                    <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/applicants/${a.id}`} className="font-mono text-brand-600 hover:underline font-medium">
                          {a.applicantCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.customerName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{a.discom.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{a.projectType}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs flex items-center justify-center font-semibold">
                            {a.stage}
                          </span>
                          <span className="text-xs text-muted-foreground">{getStageName(a.stage)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.assignedStaff?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(a.stageUpdatedAt)}</td>
                    </tr>
                  ))}
              {!isLoading && applicants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} results)
            </p>
            <div className="flex gap-2">
              <button
                className="text-sm px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="text-sm px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

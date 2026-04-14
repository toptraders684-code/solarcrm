import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { applicantsService } from '@/services/applicants.service';
import { formatDate, getStageName } from '@/utils/formatters';
import { STAGE_LABELS } from '@/utils/formatters';
import type { Applicant } from '@/types';
import { cn } from '@/lib/utils';

export default function ApplicantsListPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [discomFilter, setDiscomFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', page, search, stageFilter, discomFilter],
    queryFn: () =>
      applicantsService.getApplicants({
        page, limit: 25,
        search: search || undefined,
        stage: stageFilter ? Number(stageFilter) : undefined,
        discom: discomFilter || undefined,
      }),
  });

  const applicants = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper title="Projects" subtitle={`${meta?.total ?? 0} total projects`}>
      {/* Stage Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STAGE_LABELS).map(([num, label]) => (
          <button
            key={num}
            onClick={() => { setStageFilter(stageFilter === num ? '' : num); setPage(1); }}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-bold transition-all',
              stageFilter === num
                ? 'signature-gradient text-white shadow-md'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/20'
            )}
          >
            {num}. {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={16} />
          <Input placeholder="Search name, code..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={discomFilter} onValueChange={(v) => { setDiscomFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="DISCOM" /></SelectTrigger>
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
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                <th className="px-6 py-4">Code</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">DISCOM</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Stage</th>
                <th className="px-4 py-4">Assigned</th>
                <th className="px-6 py-4">Stage Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>
                    ))}</tr>
                  ))
                : applicants.map((a: Applicant) => (
                    <tr key={a.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/applicants/${a.id}`} className="font-mono text-primary font-bold hover:underline text-sm">
                          {a.applicantCode}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-on-surface">{a.customerName}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-fixed-variant rounded text-[10px] font-bold uppercase">
                          {a.discom.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant capitalize">{a.projectType}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full signature-gradient text-white text-[10px] flex items-center justify-center font-black">{a.stage}</span>
                          <span className="text-xs text-on-surface-variant">{getStageName(a.stage)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{a.assignedStaff?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(a.stageUpdatedAt)}</td>
                    </tr>
                  ))}
              {!isLoading && applicants.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-on-surface-variant/50 text-sm">No projects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-low">
            <p className="text-xs text-on-surface-variant/60">Page {meta.page} of {meta.totalPages} &mdash; {meta.total} results</p>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 rounded-lg bg-surface-container font-semibold disabled:opacity-40 hover:bg-surface-container-high transition-colors"
                disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-surface-container font-semibold disabled:opacity-40 hover:bg-surface-container-high transition-colors"
                disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

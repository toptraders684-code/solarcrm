import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Calendar } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { leadsService } from '@/services/leads.service';
import { AddLeadForm } from './components/AddLeadForm';
import { formatDate, getDiscomLabel, toTitleCase } from '@/utils/formatters';
import type { Lead } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function LeadsListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [discomFilter, setDiscomFilter] = useState('');
  const [page, setPage] = useState(1);

  const canAddLead = user && ['admin', 'operations_staff', 'field_technician'].includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter, discomFilter],
    queryFn: () =>
      leadsService.getLeads({
        page, limit: 25,
        search: search || undefined,
        status: statusFilter || undefined,
        discom: discomFilter || undefined,
      }),
  });

  const leads = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Leads"
      subtitle={`${meta?.total ?? 0} total leads`}
      actions={
        canAddLead ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Add Lead
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={16} />
          <Input
            placeholder="Search name, mobile, lead code..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
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
                <th className="px-6 py-4">Lead Code</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">DISCOM</th>
                <th className="px-4 py-4">Source</th>
                <th className="px-4 py-4">Assigned</th>
                <th className="px-4 py-4">Follow Up</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>
                      ))}
                    </tr>
                  ))
                : leads.map((lead: Lead) => (
                    <tr key={lead.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/leads/${lead.id}`} className="font-mono text-primary font-bold hover:underline text-sm">
                          {lead.leadCode}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-on-surface">{lead.customerName}</p>
                        <p className="text-xs text-on-surface-variant/60 flex items-center gap-1 mt-0.5">
                          <Phone size={11} />{lead.mobile}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-fixed-variant rounded text-[10px] font-bold uppercase">
                          {lead.discom.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{toTitleCase(lead.leadSource)}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{lead.assignedStaff?.name ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">
                        {lead.followUpDate ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary" />{formatDate(lead.followUpDate)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                    </tr>
                  ))}
              {!isLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-on-surface-variant/50 text-sm">
                    No leads found. {canAddLead && 'Click "Add Lead" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-low">
            <p className="text-xs text-on-surface-variant/60">
              Page {meta.page} of {meta.totalPages} &mdash; {meta.total} results
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="overflow-y-auto p-8">
          <SheetHeader>
            <SheetTitle>Add New Lead</SheetTitle>
          </SheetHeader>
          <AddLeadForm
            onSuccess={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['leads'] }); }}
            onCancel={() => setAddOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

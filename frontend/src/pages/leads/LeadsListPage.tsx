import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Phone, MapPin, Calendar } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
        page,
        limit: 25,
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
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, mobile, lead code..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lead Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DISCOM</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Follow Up</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : leads.map((lead: Lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-mono text-brand-600 hover:underline font-medium"
                        >
                          {lead.leadCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{lead.customerName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {lead.mobile}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{lead.discom.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {toTitleCase(lead.leadSource)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.assignedStaff?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.followUpDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.followUpDate)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                    </tr>
                  ))}
              {!isLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found. {canAddLead && 'Click "Add Lead" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} results)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Add New Lead</SheetTitle>
          </SheetHeader>
          <AddLeadForm
            onSuccess={() => {
              setAddOpen(false);
              queryClient.invalidateQueries({ queryKey: ['leads'] });
            }}
            onCancel={() => setAddOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </PageWrapper>
  );
}

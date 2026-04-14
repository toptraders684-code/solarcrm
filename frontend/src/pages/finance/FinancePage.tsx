import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, CreditCard, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { financeService } from '@/services/finance.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { Transaction } from '@/types';
import { Link } from 'react-router-dom';

function SummaryCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent?: boolean }) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-on-surface mt-2 font-headline">{value}</p>
        </div>
        <div className="w-11 h-11 signature-gradient rounded-xl flex items-center justify-center shadow-md">
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTxId, setRejectTxId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const canApprove = user && ['admin', 'finance_manager'].includes(user.role);

  const tabToFilter: Record<string, any> = {
    all: {}, pending: { status: 'pending_approval' },
    receipts: { type: 'customer_receipt' }, vendor: { type: 'vendor_payment' }, subsidy: { type: 'subsidy' },
  };

  const { data, isLoading } = useQuery({
    queryKey: ['finance-transactions', tab, dateFrom, dateTo],
    queryFn: () => financeService.getTransactions({ ...tabToFilter[tab], dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, limit: 50 }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeService.getSummary(),
    retry: false,
  });

  const summary = summaryData?.data;
  const transactions = data?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeService.approveTransaction(id),
    onSuccess: () => { toast.success('Transaction approved'); queryClient.invalidateQueries({ queryKey: ['finance-transactions'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => financeService.rejectTransaction(rejectTxId, rejectReason),
    onSuccess: () => {
      toast.success('Transaction rejected');
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      setRejectOpen(false); setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  return (
    <PageWrapper title="Finance" subtitle="Transaction management and approvals">
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Received" value={formatCurrency(summary.totalReceived)} icon={TrendingUp} accent />
          <SummaryCard label="Vendor Payments" value={formatCurrency(summary.totalVendorPayments)} icon={CreditCard} />
          <SummaryCard label="Subsidy Received" value={formatCurrency(summary.totalSubsidy)} icon={CreditCard} />
          <SummaryCard label="Pending Approval" value={summary.pendingCount ?? 0} icon={Clock} />
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl p-4 flex gap-3 items-center">
        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date range</span>
        <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className="text-xs text-on-surface-variant/50">to</span>
        <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button className="text-xs font-bold text-error hover:underline" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="vendor">Vendor</TabsTrigger>
          <TabsTrigger value="subsidy">Subsidy</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                  <th className="px-6 py-4">Date</th><th className="px-4 py-4">Project</th>
                  <th className="px-4 py-4">Type</th><th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Method</th><th className="px-4 py-4">Status</th>
                  {canApprove && <th className="px-6 py-4">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {isLoading ? [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(canApprove ? 7 : 6)].map((_, j) => (
                    <td key={j} className="px-4 py-4"><Skeleton className="h-4" /></td>
                  ))}</tr>
                )) : transactions.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(tx.transactionDate)}</td>
                    <td className="px-4 py-4">
                      {tx.applicant ? (
                        <Link to={`/applicants/${tx.applicant.id}`} className="text-primary font-bold hover:underline text-sm">
                          {tx.applicant.applicantCode}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.type === 'customer_receipt' ? 'bg-primary/10 text-primary' :
                        tx.type === 'subsidy' ? 'bg-secondary-container text-on-secondary-fixed-variant' :
                        'bg-tertiary-container/30 text-on-tertiary-container'
                      }`}>{toTitleCase(tx.type)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-on-surface">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{toTitleCase(tx.paymentMethod)}</td>
                    <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
                    {canApprove && (
                      <td className="px-6 py-4">
                        {tx.status === 'pending_approval' && (
                          <div className="flex gap-1">
                            <button onClick={() => approveMutation.mutate(tx.id)} disabled={approveMutation.isPending}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => { setRejectTxId(tx.id); setRejectOpen(true); }}
                              className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors">
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {!isLoading && transactions.length === 0 && (
                  <tr><td colSpan={canApprove ? 7 : 6} className="px-4 py-16 text-center text-on-surface-variant/50 text-sm">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Transaction</DialogTitle></DialogHeader>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Reason *</label>
            <Textarea className="mt-2" placeholder="Please provide a reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={!rejectReason || rejectMutation.isPending} loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

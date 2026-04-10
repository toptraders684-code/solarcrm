import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { financeService } from '@/services/finance.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { Transaction } from '@/types';
import { Link } from 'react-router-dom';

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
    all: {},
    pending: { status: 'pending_approval' },
    receipts: { type: 'customer_receipt' },
    vendor: { type: 'vendor_payment' },
    subsidy: { type: 'subsidy' },
  };

  const { data, isLoading } = useQuery({
    queryKey: ['finance-transactions', tab, dateFrom, dateTo],
    queryFn: () =>
      financeService.getTransactions({
        ...tabToFilter[tab],
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 50,
      }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeService.getSummary(),
    retry: false,
  });

  const summary = summaryData?.data;

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeService.approveTransaction(id),
    onSuccess: () => {
      toast.success('Transaction approved');
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => financeService.rejectTransaction(rejectTxId, rejectReason),
    onSuccess: () => {
      toast.success('Transaction rejected');
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      setRejectOpen(false);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const transactions = data?.data ?? [];

  return (
    <PageWrapper title="Finance" subtitle="Transaction management and approvals">
      {/* Summary */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Received" value={formatCurrency(summary.totalReceived)} color="text-green-600" />
          <SummaryCard label="Vendor Payments" value={formatCurrency(summary.totalVendorPayments)} color="text-orange-500" />
          <SummaryCard label="Subsidy Received" value={formatCurrency(summary.totalSubsidy)} color="text-blue-600" />
          <SummaryCard label="Pending Approval" value={summary.pendingCount ?? 0} color="text-yellow-600" />
        </div>
      )}

      {/* Date Filters */}
      <div className="flex gap-3 items-center bg-white rounded-xl border p-4">
        <span className="text-sm text-muted-foreground">Date range:</span>
        <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            Clear
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="receipts">Customer Receipts</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Payments</TabsTrigger>
          <TabsTrigger value="subsidy">Subsidy</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  {canApprove && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(canApprove ? 7 : 6)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : transactions.map((tx: Transaction) => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.transactionDate)}</td>
                        <td className="px-4 py-3">
                          {tx.applicant ? (
                            <Link to={`/applicants/${tx.applicant.id}`} className="text-brand-600 hover:underline">
                              {tx.applicant.applicantCode}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              tx.type === 'customer_receipt' ? 'success' :
                              tx.type === 'subsidy' ? 'info' : 'warning'
                            }
                          >
                            {toTitleCase(tx.type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(tx.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{toTitleCase(tx.paymentMethod)}</td>
                        <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                        {canApprove && (
                          <td className="px-4 py-3">
                            {tx.status === 'pending_approval' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => approveMutation.mutate(tx.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => { setRejectTxId(tx.id); setRejectOpen(true); }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                {!isLoading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={canApprove ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Transaction</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for rejection *</Label>
            <Textarea
              placeholder="Please provide a reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

function SummaryCard({ label, value, color = '' }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

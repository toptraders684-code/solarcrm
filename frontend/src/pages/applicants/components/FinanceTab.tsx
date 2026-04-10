import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { applicantsService } from '@/services/applicants.service';
import { financeService } from '@/services/finance.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

interface FinanceTabProps {
  applicantId: string;
}

export function FinanceTab({ applicantId }: FinanceTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState('customer_receipt');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [txDate, setTxDate] = useState('');
  const [description, setDescription] = useState('');
  const [refNumber, setRefNumber] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['applicant-transactions', applicantId],
    queryFn: () => applicantsService.getTransactions(applicantId),
  });

  const transactions = data?.data ?? [];
  const summary = data?.summary;

  const addMutation = useMutation({
    mutationFn: () =>
      financeService.createTransaction({
        applicantId,
        type,
        amount: Number(amount),
        paymentMethod: method,
        transactionDate: txDate,
        description: description || undefined,
        referenceNumber: refNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('Transaction added');
      queryClient.invalidateQueries({ queryKey: ['applicant-transactions', applicantId] });
      setAddOpen(false);
      setAmount('');
      setDescription('');
      setRefNumber('');
      setTxDate('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add transaction');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeService.approveTransaction(id),
    onSuccess: () => {
      toast.success('Transaction approved');
      queryClient.invalidateQueries({ queryKey: ['applicant-transactions', applicantId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const canAddTx = user && ['admin', 'operations_staff', 'finance_manager'].includes(user.role);
  const canApprove = user && ['admin', 'finance_manager'].includes(user.role);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Contract Value" value={formatCurrency(summary.totalContract)} />
          <SummaryCard label="Total Received" value={formatCurrency(summary.totalReceived)} color="text-green-600" />
          <SummaryCard label="Balance Due" value={formatCurrency(summary.balanceDue)} color="text-red-500" />
          <SummaryCard label="Subsidy Received" value={formatCurrency(summary.totalSubsidy)} color="text-blue-600" />
        </div>
      )}

      {/* Add Button */}
      {canAddTx && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Transaction
          </Button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {canApprove && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.transactionDate)}</td>
                <td className="px-4 py-3">
                  <Badge variant={tx.type === 'customer_receipt' ? 'success' : tx.type === 'subsidy' ? 'info' : 'warning'}>
                    {toTitleCase(tx.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(tx.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{toTitleCase(tx.paymentMethod)}</td>
                <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                {canApprove && (
                  <td className="px-4 py-3">
                    {tx.status === 'pending_approval' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => approveMutation.mutate(tx.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={canApprove ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_receipt">Customer Receipt</SelectItem>
                    <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
                    <SelectItem value="subsidy">Subsidy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cash', 'cheque', 'bank_transfer', 'upi', 'other'].map((m) => (
                      <SelectItem key={m} value={m}>{toTitleCase(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference Number</Label>
              <Input placeholder="Cheque no., UTR, etc." value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional notes..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!amount || !txDate || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, color = 'text-gray-900' }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

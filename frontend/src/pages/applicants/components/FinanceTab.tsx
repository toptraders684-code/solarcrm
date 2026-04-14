import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { applicantsService } from '@/services/applicants.service';
import { financeService } from '@/services/finance.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

interface FinanceTabProps { applicantId: string; }

function SummaryCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl p-4 ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black font-headline ${accent ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
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

  const { data } = useQuery({
    queryKey: ['applicant-transactions', applicantId],
    queryFn: () => applicantsService.getTransactions(applicantId),
  });

  const transactions = data?.data ?? [];
  const summary = data?.summary;

  const addMutation = useMutation({
    mutationFn: () => financeService.createTransaction({
      applicantId, type, amount: Number(amount), paymentMethod: method,
      transactionDate: txDate, description: description || undefined, referenceNumber: refNumber || undefined,
    }),
    onSuccess: () => {
      toast.success('Transaction added');
      queryClient.invalidateQueries({ queryKey: ['applicant-transactions', applicantId] });
      setAddOpen(false); setAmount(''); setDescription(''); setRefNumber(''); setTxDate('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add transaction'),
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
          <SummaryCard label="Total Received" value={formatCurrency(summary.totalReceived)} accent />
          <SummaryCard label="Balance Due" value={formatCurrency(summary.balanceDue)} />
          <SummaryCard label="Subsidy Received" value={formatCurrency(summary.totalSubsidy)} />
        </div>
      )}

      {/* Add Button */}
      {canAddTx && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />Add Transaction</Button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Method</th>
              <th className="px-4 py-4">Status</th>
              {canApprove && <th className="px-4 py-4">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-4 py-3 text-sm text-on-surface-variant">{formatDate(tx.transactionDate)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    tx.type === 'customer_receipt' ? 'bg-primary/10 text-primary' :
                    tx.type === 'subsidy' ? 'bg-secondary-container text-on-secondary-fixed-variant' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>{toTitleCase(tx.type)}</span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{formatCurrency(tx.amount)}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{toTitleCase(tx.paymentMethod)}</td>
                <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                {canApprove && (
                  <td className="px-4 py-3">
                    {tx.status === 'pending_approval' && (
                      <button
                        onClick={() => approveMutation.mutate(tx.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        <CheckCircle size={12} />Approve
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={canApprove ? 6 : 5} className="px-4 py-8 text-center text-sm text-on-surface-variant/50">No transactions recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Type *</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_receipt">Customer Receipt</SelectItem>
                    <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
                    <SelectItem value="subsidy">Subsidy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Amount (₹) *</label>
                <Input className="mt-1" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Payment Method *</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cash', 'cheque', 'bank_transfer', 'upi', 'other'].map((m) => (
                      <SelectItem key={m} value={m}>{toTitleCase(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date *</label>
                <Input className="mt-1" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Reference Number</label>
              <Input className="mt-1" placeholder="Cheque no., UTR, etc." value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Description</label>
              <Textarea className="mt-1" placeholder="Optional notes..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={!amount || !txDate} loading={addMutation.isPending} onClick={() => addMutation.mutate()}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

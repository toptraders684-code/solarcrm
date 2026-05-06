import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { applicantsService } from '@/services/applicants.service';
import { financeService } from '@/services/finance.service';
import { vendorsService } from '@/services/vendors.service';
import { formatDate, formatCurrency, toTitleCase } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import type { Vendor } from '@/types';

const VENDOR_TYPE_LABELS: Record<string, string> = {
  channel_partner: 'Channel Partner',
  district_partner: 'District Partner',
  block_partner: 'Block Partner',
  installation_partner: 'Installation Partner',
  transport_partner: 'Transport Partner',
  insurance_partner: 'Insurance Partner',
  netmeter_partner: 'Netmeter Partner',
};

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

  // Add Transaction state
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState('customer_receipt');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [txDate, setTxDate] = useState('');
  const [description, setDescription] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [incomeErrors, setIncomeErrors] = useState<Record<string, string>>({});

  // Add Expense state
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseVendorType, setExpenseVendorType] = useState('');
  const [expenseVendorId, setExpenseVendorId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseMethod, setExpenseMethod] = useState('bank_transfer');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseRef, setExpenseRef] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ['applicant-transactions', applicantId],
    queryFn: () => applicantsService.getTransactions(applicantId),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getVendors({ limit: 200, isActive: true }),
    enabled: expenseOpen,
  });
  const allVendors: Vendor[] = (vendorsData as any)?.data ?? [];
  const vendors = expenseVendorType
    ? allVendors.filter((v) => v.vendorTypes?.includes(expenseVendorType as any))
    : allVendors;

  const transactions = data?.data ?? [];
  const summary = data?.summary;

  const validateIncome = () => {
    const e: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) e.amount = 'Amount must be greater than 0';
    if (!txDate) e.txDate = 'Date is required';
    setIncomeErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateExpense = () => {
    const e: Record<string, string> = {};
    if (!expenseVendorType) e.expenseVendorType = 'Vendor type is required';
    if (expenseVendorType && !expenseVendorId) e.expenseVendorId = 'Vendor is required';
    if (!expenseAmount || Number(expenseAmount) <= 0) e.expenseAmount = 'Amount must be greater than 0';
    if (!expenseDate) e.expenseDate = 'Date is required';
    setExpenseErrors(e);
    return Object.keys(e).length === 0;
  };

  const addMutation = useMutation({
    mutationFn: () => {
      if (!validateIncome()) return Promise.reject(null);
      return financeService.createTransaction({
        applicantId, type, amount: Number(amount), paymentMethod: method,
        transactionDate: txDate, description: description || undefined, referenceNumber: refNumber || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Transaction added');
      queryClient.invalidateQueries({ queryKey: ['applicant-transactions', applicantId] });
      setAddOpen(false); setAmount(''); setDescription(''); setRefNumber(''); setTxDate(''); setIncomeErrors({});
    },
    onError: (err: any) => { if (err !== null) toast.error(err?.response?.data?.message || 'Failed to add transaction'); },
  });

  const expenseMutation = useMutation({
    mutationFn: () => {
      if (!validateExpense()) return Promise.reject(null);
      return financeService.createTransaction({
        applicantId, type: 'expense', amount: Number(expenseAmount), paymentMethod: expenseMethod,
        transactionDate: expenseDate, description: expenseDescription || undefined,
        referenceNumber: expenseRef || undefined, vendorId: expenseVendorId,
      });
    },
    onSuccess: () => {
      toast.success('Expense added');
      queryClient.invalidateQueries({ queryKey: ['applicant-transactions', applicantId] });
      setExpenseOpen(false);
      setExpenseVendorType(''); setExpenseVendorId(''); setExpenseAmount('');
      setExpenseMethod('bank_transfer'); setExpenseDate(''); setExpenseRef(''); setExpenseDescription(''); setExpenseErrors({});
    },
    onError: (err: any) => { if (err !== null) toast.error(err?.response?.data?.message || 'Failed to add expense'); },
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
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Contract Value" value={formatCurrency(summary.totalContract)} />
            <SummaryCard label="Total Received" value={formatCurrency(summary.totalReceived)} accent />
            <SummaryCard label="Balance Due" value={formatCurrency(summary.balanceDue)} />
            <SummaryCard label="Subsidy Received" value={formatCurrency(summary.totalSubsidy)} />
          </div>
          <div className="flex gap-4 bg-surface-container-lowest rounded-xl px-5 py-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Transactions Total</span>
              <span className="text-base font-black text-primary font-headline">{formatCurrency(summary.totalReceived + summary.totalSubsidy + (summary.totalVendorPayments ?? 0))}</span>
            </div>
            <div className="w-px bg-surface-container-low" />
            <div className="flex items-center gap-3 flex-1">
              <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Expenses Total</span>
              <span className="text-base font-black text-error font-headline">{formatCurrency((summary as any).totalExpenses ?? 0)}</span>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      {canAddTx && (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setExpenseOpen(true)}>
            <Receipt size={14} />Add Expense
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} />Add Income
          </Button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Vendor</th>
              <th className="px-4 py-4 text-primary">Income</th>
              <th className="px-4 py-4 text-error">Expenses</th>
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
                    tx.type === 'expense' ? 'bg-error/10 text-error' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>{toTitleCase(tx.type)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">
                  {tx.vendor?.businessName ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-primary">
                  {tx.type !== 'expense' ? formatCurrency(tx.amount) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-error">
                  {tx.type === 'expense' ? formatCurrency(tx.amount) : '—'}
                </td>
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
              <tr><td colSpan={canApprove ? 8 : 7} className="px-4 py-8 text-center text-sm text-on-surface-variant/50">No transactions recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setIncomeErrors({}); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Income</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Type <span className="text-error">*</span></label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_receipt">Customer Receipt</SelectItem>
                    <SelectItem value="subsidy">Subsidy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Amount (?) <span className="text-error">*</span></label>
                <Input className="mt-1" type="number" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value); setIncomeErrors((p) => { const n = {...p}; delete n.amount; return n; }); }} />
                {incomeErrors.amount && <p className="mt-1 text-xs text-error">{incomeErrors.amount}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Payment Method <span className="text-error">*</span></label>
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
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date <span className="text-error">*</span></label>
                <DateSelectPicker className="mt-1" value={txDate} onChange={(v) => { setTxDate(v); setIncomeErrors((p) => { const n = {...p}; delete n.txDate; return n; }); }} placeholder="Select date" />
                {incomeErrors.txDate && <p className="mt-1 text-xs text-error">{incomeErrors.txDate}</p>}
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
            <Button loading={addMutation.isPending} onClick={() => addMutation.mutate()}>Add Income</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={(o) => { setExpenseOpen(o); if (!o) setExpenseErrors({}); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Vendor Types <span className="text-error">*</span></label>
              <Select value={expenseVendorType} onValueChange={(v) => { setExpenseVendorType(v); setExpenseVendorId(''); setExpenseErrors((p) => { const n = {...p}; delete n.expenseVendorType; delete n.expenseVendorId; return n; }); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vendor type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(VENDOR_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {expenseErrors.expenseVendorType && <p className="mt-1 text-xs text-error">{expenseErrors.expenseVendorType}</p>}
            </div>
            {expenseVendorType && (
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Vendor <span className="text-error">*</span></label>
                <Select value={expenseVendorId} onValueChange={(v) => { setExpenseVendorId(v); setExpenseErrors((p) => { const n = {...p}; delete n.expenseVendorId; return n; }); }} disabled={vendors.length === 0}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={vendors.length === 0 ? 'No vendors of this type' : 'Select vendor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.businessName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {expenseErrors.expenseVendorId && <p className="mt-1 text-xs text-error">{expenseErrors.expenseVendorId}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Amount (?) <span className="text-error">*</span></label>
                <Input className="mt-1" type="number" placeholder="0.00" value={expenseAmount} onChange={(e) => { setExpenseAmount(e.target.value); setExpenseErrors((p) => { const n = {...p}; delete n.expenseAmount; return n; }); }} />
                {expenseErrors.expenseAmount && <p className="mt-1 text-xs text-error">{expenseErrors.expenseAmount}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date <span className="text-error">*</span></label>
                <DateSelectPicker className="mt-1" value={expenseDate} onChange={(v) => { setExpenseDate(v); setExpenseErrors((p) => { const n = {...p}; delete n.expenseDate; return n; }); }} placeholder="Select date" />
                {expenseErrors.expenseDate && <p className="mt-1 text-xs text-error">{expenseErrors.expenseDate}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Payment Method <span className="text-error">*</span></label>
                <Select value={expenseMethod} onValueChange={setExpenseMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cash', 'cheque', 'bank_transfer', 'upi', 'other'].map((m) => (
                      <SelectItem key={m} value={m}>{toTitleCase(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Reference Number</label>
              <Input className="mt-1" placeholder="Cheque no., UTR, etc." value={expenseRef} onChange={(e) => setExpenseRef(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Description</label>
              <Textarea className="mt-1" placeholder="What is this expense for?" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setExpenseOpen(false)}>Cancel</Button>
            <Button loading={expenseMutation.isPending} onClick={() => expenseMutation.mutate()}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersService, CreateVendorUserDto } from '@/services/users.service';
import { vendorsService } from '@/services/vendors.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Eye, EyeOff, Phone, Mail, Users, Building2, BadgeDollarSign } from 'lucide-react';
import type { User } from '@/types';

// ── Styles ──────────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<string, string> = {
  H1: 'bg-purple-100 text-purple-700 border border-purple-200',
  H2: 'bg-blue-100 text-blue-700 border border-blue-200',
  H3: 'bg-green-100 text-green-700 border border-green-200',
};

const LEVEL_AVATAR: Record<string, string> = {
  H1: 'bg-purple-500',
  H2: 'bg-blue-500',
  H3: 'bg-green-500',
};

const LEVEL_HEADER: Record<string, string> = {
  H1: 'bg-purple-50 border-purple-200 text-purple-700',
  H2: 'bg-blue-50 border-blue-200 text-blue-700',
  H3: 'bg-green-50 border-green-200 text-green-700',
};

const EMPTY_FORM: CreateVendorUserDto = {
  name: '', mobile: '', email: '', password: '', vendorLevel: 'H3',
};

// ── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ m }: { m: User }) {
  return (
    <div className="bg-white rounded-xl border border-surface-container-high p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${LEVEL_AVATAR[m.vendorLevel ?? ''] ?? 'bg-gray-400'}`}>
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm text-on-surface truncate">{m.name}</p>
            {m.vendorLevel && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${LEVEL_BADGE[m.vendorLevel]}`}>
                {m.vendorLevel}
              </span>
            )}
          </div>
          <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${m.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
            {m.status}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
          <Phone size={11} /><span>{m.mobile}</span>
        </div>
        {m.email && (
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
            <Mail size={11} /><span className="truncate">{m.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tree builder ─────────────────────────────────────────────────────────────

interface TreeNode extends User {
  children: TreeNode[];
}

function buildTree(members: User[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  members.forEach((m) => map.set(m.id, { ...m, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parentVendorUserId && map.has(node.parentVendorUserId)) {
      map.get(node.parentVendorUserId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function TreeBranch({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-8 mt-3' : ''}>
      {depth > 0 && (
        <div className="flex items-center gap-0 mb-1">
          <div className="w-6 border-l-2 border-b-2 border-surface-container-high h-5 rounded-bl-lg mr-1" />
        </div>
      )}
      <MemberCard m={node} />
      {node.children.length > 0 && (
        <div className="border-l-2 border-surface-container-high ml-5 pl-0">
          {node.children.map((child) => (
            <TreeBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VendorTeamPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'operations_staff';

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorUserDto>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Vendor list — only needed for admin
  const { data: vendorData } = useQuery({
    queryKey: ['vendors-dropdown'],
    queryFn: () => vendorsService.getVendors({ limit: 200 }),
    enabled: isAdmin,
  });
  const vendorList = vendorData?.data ?? [];

  const activeVendorId = isAdmin ? selectedVendorId : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-team', activeVendorId],
    queryFn: () => usersService.getVendorTeam(activeVendorId),
    enabled: !isAdmin || !!selectedVendorId,
  });

  const members: User[] = data?.data ?? [];
  const h1Members = members.filter((m) => m.vendorLevel === 'H1');
  const h2Members = members.filter((m) => m.vendorLevel === 'H2');

  const treeRoots = buildTree(members);

  const createMutation = useMutation({
    mutationFn: (dto: CreateVendorUserDto) => usersService.createVendorUser(dto),
    onSuccess: () => {
      toast.success('Team member added');
      qc.invalidateQueries({ queryKey: ['vendor-team', activeVendorId] });
      handleClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to add team member'));
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (isAdmin && !selectedVendorId) e.vendorId = 'Select a vendor first';
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Mobile must be 10 digits';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.vendorLevel === 'H2' && !form.parentVendorUserId) e.parentVendorUserId = 'Select the H1 member this person reports to';
    if (form.vendorLevel === 'H3' && !form.parentVendorUserId) e.parentVendorUserId = 'Select the H2 member this person reports to';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleLevelChange(level: 'H1' | 'H2' | 'H3') {
    setForm({ ...form, vendorLevel: level, parentVendorUserId: undefined });
    setErrors({});
  }

  function handleSubmit() {
    if (!validate()) return;
    createMutation.mutate({
      ...form,
      email: form.email?.trim() || undefined,
      vendorId: isAdmin ? selectedVendorId : undefined,
    });
  }

  function handleClose() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPwd(false);
  }

  const parentOptions = form.vendorLevel === 'H2' ? h1Members : form.vendorLevel === 'H3' ? h2Members : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-headline">{isAdmin ? 'Vendor Team' : 'My Team'}</h1>
          <p className="text-sm text-on-surface-variant/60 mt-0.5">
            {members.length} team member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={() => navigate('/commission')}>
              <BadgeDollarSign size={16} className="mr-2" />
              Commission
            </Button>
          )}
          <Button onClick={() => setOpen(true)} disabled={isAdmin && !selectedVendorId}>
            <UserPlus size={16} className="mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Vendor selector — admin only */}
      {isAdmin && (
        <div className="mb-5 flex items-center gap-3">
          <Building2 size={16} className="text-on-surface-variant/50 flex-shrink-0" />
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a vendor to view their team…" />
            </SelectTrigger>
            <SelectContent>
              {vendorList.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.businessName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tree */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-surface-container-high rounded-xl text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-3">
            <Users size={24} className="text-on-surface-variant/40" />
          </div>
          <p className="font-semibold text-on-surface-variant/60">No team members yet</p>
          <p className="text-xs text-on-surface-variant/40 mt-1">Click "Add Member" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Level legend */}
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            {(['H1', 'H2', 'H3'] as const).map((l) => (
              <span key={l} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${LEVEL_HEADER[l]}`}>
                <span className={`w-2 h-2 rounded-full ${LEVEL_AVATAR[l]}`} />
                {l === 'H1' ? 'H1 — Senior' : l === 'H2' ? 'H2 — Mid' : 'H3 — Field'}
                &nbsp;({members.filter(m => m.vendorLevel === l).length})
              </span>
            ))}
          </div>

          {/* Tree structure */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 space-y-4">
            {treeRoots.length === 0 ? (
              <p className="text-sm text-on-surface-variant/50 text-center py-4">No hierarchy data</p>
            ) : (
              treeRoots.map((root) => (
                <TreeBranch key={root.id} node={root} depth={0} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
            {/* Vendor selector — admin only */}
            {isAdmin && (
              <div className="col-span-2 flex flex-col gap-1">
                <Label>Vendor <span className="text-destructive">*</span></Label>
                <Select value={selectedVendorId} onValueChange={(v) => { setSelectedVendorId(v); setErrors({}); }}>
                  <SelectTrigger><SelectValue placeholder="Select vendor…" /></SelectTrigger>
                  <SelectContent>
                    {vendorList.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.businessName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId}</p>}
              </div>
            )}

            <div className="col-span-2 flex flex-col gap-1">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Mobile <span className="text-destructive">*</span></Label>
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
              />
              {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Level <span className="text-destructive">*</span></Label>
              <Select value={form.vendorLevel} onValueChange={(v) => handleLevelChange(v as 'H1' | 'H2' | 'H3')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="H1">H1 — Senior</SelectItem>
                  <SelectItem value="H2">H2 — Mid</SelectItem>
                  <SelectItem value="H3">H3 — Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parent selector — shown for H2 and H3 */}
            {(form.vendorLevel === 'H2' || form.vendorLevel === 'H3') && (
              <div className="col-span-2 flex flex-col gap-1">
                <Label>
                  Reports to ({form.vendorLevel === 'H2' ? 'H1 member' : 'H2 member'})
                  <span className="text-destructive"> *</span>
                </Label>
                {parentOptions.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    No {form.vendorLevel === 'H2' ? 'H1' : 'H2'} members found. Add one first.
                  </p>
                ) : (
                  <Select
                    value={form.parentVendorUserId ?? ''}
                    onValueChange={(v) => setForm({ ...form, parentVendorUserId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder={`Select ${form.vendorLevel === 'H2' ? 'H1' : 'H2'} member…`} /></SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.mobile})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.parentVendorUserId && <p className="text-xs text-destructive">{errors.parentVendorUserId}</p>}
              </div>
            )}

            <div className="col-span-2 flex flex-col gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || (form.vendorLevel !== 'H1' && parentOptions.length === 0)}
            >
              {createMutation.isPending ? 'Adding…' : 'Add Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

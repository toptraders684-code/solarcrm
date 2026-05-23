import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateSelectPicker } from '@/components/ui/date-select-picker';
import { applicantsService } from '@/services/applicants.service';
import { formatDate } from '@/utils/formatters';
import type { Applicant, OtherMaterial } from '@/types';
import { useAuthStore } from '@/store/authStore';

type SubSection = 'dispatch' | 'panel' | 'inverter' | 'structure' | 'acdb' | 'earthing' | 'wires' | 'postinstallation' | null;

function sv(v: any): string | undefined { return v || undefined; }

function IR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-surface-container-low">
      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{children ?? '—'}</span>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

function SubCard({
  title, isOpen, isEditing, saving, canEdit, editDisabled,
  onToggle, onEdit, onCancel, onSave, children,
}: {
  title: string; isOpen: boolean; isEditing: boolean; saving: boolean; canEdit: boolean; editDisabled: boolean;
  onToggle: () => void; onEdit: () => void; onCancel: () => void; onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-surface-container-low overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-container-low/50 hover:bg-surface-container transition-colors text-left"
      >
        <span className="text-on-surface-variant/40 flex-shrink-0">
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">{title}</span>
        {isOpen && canEdit && (
          <span onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" onClick={onCancel} disabled={saving}><X size={11} />Cancel</Button>
                <Button size="sm" onClick={onSave} loading={saving}><Save size={11} />Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={onEdit} disabled={editDisabled}><Pencil size={11} />Edit</Button>
            )}
          </span>
        )}
      </button>
      {isOpen && <div className="px-4 py-3 bg-surface/30">{children}</div>}
    </div>
  );
}

interface InstallationSectionProps { applicant: Applicant; }

export function InstallationSection({ applicant }: InstallationSectionProps) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canEdit = user ? ['admin', 'operations_staff'].includes(user.role) : false;

  const [editingSub, setEditingSub] = useState<SubSection>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const d = applicant.installationDetails ?? ({} as Record<string, any>);
  const materials = applicant.otherMaterials ?? [];

  const [newMat, setNewMat] = useState({ item: '', size: '', lengthQty: '', make: '' });
  const [addingMat, setAddingMat] = useState(false);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editingMat, setEditingMat] = useState<Partial<OtherMaterial>>({});

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggle = (sub: string) => {
    if (editingSub === sub) return;
    setExpanded((p) => ({ ...p, [sub]: !p[sub] }));
  };

  const startEdit = (sub: SubSection, fields: Record<string, any>) => {
    setForm(fields);
    setExpanded((p) => ({ ...p, [sub as string]: true }));
    setEditingSub(sub);
  };

  const cancelEdit = () => { setEditingSub(null); setForm({}); };

  const saveMutation = useMutation({
    mutationFn: () => applicantsService.upsertInstallation(applicant.id, form),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      cancelEdit();
    },
    onError: () => toast.error('Failed to save'),
  });

  const addMatMutation = useMutation({
    mutationFn: () => applicantsService.addOtherMaterial(applicant.id, newMat),
    onSuccess: () => {
      toast.success('Row added');
      qc.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setNewMat({ item: '', size: '', lengthQty: '', make: '' });
      setAddingMat(false);
    },
    onError: () => toast.error('Failed to add row'),
  });

  const updateMatMutation = useMutation({
    mutationFn: ({ matId, data }: { matId: string; data: Partial<OtherMaterial> }) =>
      applicantsService.updateOtherMaterial(applicant.id, matId, data),
    onSuccess: () => {
      toast.success('Row updated');
      qc.invalidateQueries({ queryKey: ['applicant', applicant.id] });
      setEditingMatId(null);
    },
    onError: () => toast.error('Failed to update row'),
  });

  const deleteMatMutation = useMutation({
    mutationFn: (matId: string) => applicantsService.deleteOtherMaterial(applicant.id, matId),
    onSuccess: () => {
      toast.success('Row deleted');
      qc.invalidateQueries({ queryKey: ['applicant', applicant.id] });
    },
    onError: () => toast.error('Failed to delete row'),
  });

  const saving = saveMutation.isPending;
  const editDisabled = editingSub !== null;

  return (
    <div className="space-y-2">

      {/* A. Material / Dispatch */}
      <SubCard title="A. Material / Dispatch" isOpen={!!expanded['dispatch']} isEditing={editingSub === 'dispatch'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'dispatch'}
        onToggle={() => toggle('dispatch')}
        onEdit={() => startEdit('dispatch', {
          dispatchNo: d.dispatchNo ?? '', dispatchDate: d.dispatchDate ? String(d.dispatchDate).slice(0, 10) : '',
          dispatchCustomerMobileNo: d.dispatchCustomerMobileNo ?? '',
          vehicleNo: d.vehicleNo ?? '', driverMobileNo: d.driverMobileNo ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'dispatch' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="Dispatch No."><Input value={form.dispatchNo ?? ''} onChange={(e) => set('dispatchNo', e.target.value)} placeholder="e.g. NLA/11-001" /></F>
            <F label="Dispatch Date"><DateSelectPicker value={form.dispatchDate ?? ''} onChange={(v) => set('dispatchDate', v)} placeholder="Select date" /></F>
            <F label="Application Code"><Input value={applicant.applicantCode} disabled /></F>
            <F label="Customer Name"><Input value={applicant.customerName} disabled /></F>
            <F label="Customer Mobile No."><Input maxLength={15} value={form.dispatchCustomerMobileNo ?? ''} onChange={(e) => set('dispatchCustomerMobileNo', e.target.value.replace(/\D/g, ''))} placeholder="Mobile number" /></F>
            <F label="Vehicle No."><Input value={form.vehicleNo ?? ''} onChange={(e) => set('vehicleNo', e.target.value)} placeholder="e.g. OD-01AB1234" /></F>
            <F label="Driver Mobile No."><Input maxLength={15} value={form.driverMobileNo ?? ''} onChange={(e) => set('driverMobileNo', e.target.value.replace(/\D/g, ''))} placeholder="Mobile number" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="Dispatch No.">{d.dispatchNo}</IR>
            <IR label="Dispatch Date">{formatDate(d.dispatchDate)}</IR>
            <IR label="Application Code">{applicant.applicantCode}</IR>
            <IR label="Customer Name">{applicant.customerName}</IR>
            <IR label="Customer Mobile No.">{d.dispatchCustomerMobileNo}</IR>
            <IR label="Vehicle No.">{d.vehicleNo}</IR>
            <IR label="Driver Mobile No.">{d.driverMobileNo}</IR>
          </div>
        )}
      </SubCard>

      {/* B. Solar Panel */}
      <SubCard title="B. Solar Panel Details" isOpen={!!expanded['panel']} isEditing={editingSub === 'panel'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'panel'}
        onToggle={() => toggle('panel')}
        onEdit={() => startEdit('panel', {
          panelBrand: d.panelBrand ?? '', panelCellManufacturer: d.panelCellManufacturer ?? '',
          panelTypeOfModule: d.panelTypeOfModule ?? '', panelCapacityPerModule: d.panelCapacityPerModule ?? '',
          panelQty: d.panelQty ?? '', panelTotalCapacityKw: d.panelTotalCapacityKw ?? '',
          panelModelType: d.panelModelType ?? '',
          panelSerial1: d.panelSerial1 ?? '', panelSerial2: d.panelSerial2 ?? '',
          panelSerial3: d.panelSerial3 ?? '', panelSerial4: d.panelSerial4 ?? '',
          panelSerial5: d.panelSerial5 ?? '', panelSerial6: d.panelSerial6 ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'panel' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="Make (Brand)"><Input value={form.panelBrand ?? ''} onChange={(e) => set('panelBrand', e.target.value)} placeholder="e.g. Adani" /></F>
            <F label="Cell Manufacturer"><Input value={form.panelCellManufacturer ?? ''} onChange={(e) => set('panelCellManufacturer', e.target.value)} placeholder="e.g. Goldi Sun Pvt Ltd" /></F>
            <F label="Type of Module"><Input value={form.panelTypeOfModule ?? ''} onChange={(e) => set('panelTypeOfModule', e.target.value)} placeholder="e.g. SPV MODULE" /></F>
            <F label="Capacity / Module"><Input type="number" step="0.001" value={form.panelCapacityPerModule ?? ''} onChange={(e) => set('panelCapacityPerModule', e.target.value)} placeholder="e.g. 620" /></F>
            <F label="Qty"><Input type="number" min={1} value={form.panelQty ?? ''} onChange={(e) => set('panelQty', e.target.value)} placeholder="e.g. 5" /></F>
            <F label="Total Capacity (kW)"><Input type="number" step="0.001" value={form.panelTotalCapacityKw ?? ''} onChange={(e) => set('panelTotalCapacityKw', e.target.value)} placeholder="e.g. 3.100" /></F>
            <F label="Model Type"><Input value={form.panelModelType ?? ''} onChange={(e) => set('panelModelType', e.target.value)} placeholder="e.g. SPV MODULE" /></F>
            <F label="Serial No. 1"><Input value={form.panelSerial1 ?? ''} onChange={(e) => set('panelSerial1', e.target.value)} placeholder="Serial number" /></F>
            <F label="Serial No. 2"><Input value={form.panelSerial2 ?? ''} onChange={(e) => set('panelSerial2', e.target.value)} placeholder="Serial number" /></F>
            <F label="Serial No. 3"><Input value={form.panelSerial3 ?? ''} onChange={(e) => set('panelSerial3', e.target.value)} placeholder="Serial number" /></F>
            <F label="Serial No. 4"><Input value={form.panelSerial4 ?? ''} onChange={(e) => set('panelSerial4', e.target.value)} placeholder="Serial number" /></F>
            <F label="Serial No. 5"><Input value={form.panelSerial5 ?? ''} onChange={(e) => set('panelSerial5', e.target.value)} placeholder="Serial number" /></F>
            <F label="Serial No. 6"><Input value={form.panelSerial6 ?? ''} onChange={(e) => set('panelSerial6', e.target.value)} placeholder="Serial number" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="Make (Brand)">{d.panelBrand}</IR>
            <IR label="Cell Manufacturer">{d.panelCellManufacturer}</IR>
            <IR label="Type of Module">{d.panelTypeOfModule}</IR>
            <IR label="Capacity / Module">{d.panelCapacityPerModule}</IR>
            <IR label="Qty">{d.panelQty}</IR>
            <IR label="Total Capacity (kW)">{d.panelTotalCapacityKw}</IR>
            <IR label="Model Type">{d.panelModelType}</IR>
            {[1,2,3,4,5,6].map((n) => d[`panelSerial${n}`] ? <IR key={n} label={`Serial No. ${n}`}>{d[`panelSerial${n}`]}</IR> : null)}
          </div>
        )}
      </SubCard>

      {/* C. Inverter */}
      <SubCard title="C. Inverter Details" isOpen={!!expanded['inverter']} isEditing={editingSub === 'inverter'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'inverter'}
        onToggle={() => toggle('inverter')}
        onEdit={() => startEdit('inverter', {
          inverterBrand: d.inverterBrand ?? '', inverterCapacityKw: d.inverterCapacityKw ?? '',
          inverterSerialNo: d.inverterSerialNo ?? '', inverterQty: d.inverterQty ?? '',
          inverterModelNo: d.inverterModelNo ?? '', inverterInputVoltage: d.inverterInputVoltage ?? '',
          inverterOutputVoltage: d.inverterOutputVoltage ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'inverter' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="Make (Brand)"><Input value={form.inverterBrand ?? ''} onChange={(e) => set('inverterBrand', e.target.value)} placeholder="e.g. EASTMAN" /></F>
            <F label="Capacity (kW)"><Input type="number" step="0.001" value={form.inverterCapacityKw ?? ''} onChange={(e) => set('inverterCapacityKw', e.target.value)} placeholder="e.g. 3" /></F>
            <F label="Serial No."><Input value={form.inverterSerialNo ?? ''} onChange={(e) => set('inverterSerialNo', e.target.value)} placeholder="Serial number" /></F>
            <F label="Qty"><Input type="number" min={1} value={form.inverterQty ?? ''} onChange={(e) => set('inverterQty', e.target.value)} placeholder="e.g. 1" /></F>
            <F label="Model No."><Input value={form.inverterModelNo ?? ''} onChange={(e) => set('inverterModelNo', e.target.value)} placeholder="e.g. EGT-3K-1P1M" /></F>
            <F label="Input Voltage"><Input value={form.inverterInputVoltage ?? ''} onChange={(e) => set('inverterInputVoltage', e.target.value)} placeholder="e.g. 500" /></F>
            <F label="Output Voltage"><Input value={form.inverterOutputVoltage ?? ''} onChange={(e) => set('inverterOutputVoltage', e.target.value)} placeholder="e.g. 3.3KVA" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="Make (Brand)">{d.inverterBrand}</IR>
            <IR label="Capacity (kW)">{d.inverterCapacityKw}</IR>
            <IR label="Serial No.">{d.inverterSerialNo}</IR>
            <IR label="Qty">{d.inverterQty}</IR>
            <IR label="Model No.">{d.inverterModelNo}</IR>
            <IR label="Input Voltage">{d.inverterInputVoltage}</IR>
            <IR label="Output Voltage">{d.inverterOutputVoltage}</IR>
          </div>
        )}
      </SubCard>

      {/* D. Structure */}
      <SubCard title="D. Structure Details" isOpen={!!expanded['structure']} isEditing={editingSub === 'structure'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'structure'}
        onToggle={() => toggle('structure')}
        onEdit={() => startEdit('structure', {
          structureGiType: d.structureGiType ?? '', structureLegRafter: d.structureLegRafter ?? '',
          structurePerlin: d.structurePerlin ?? '', structureNutBoltClampBox: d.structureNutBoltClampBox ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'structure' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="Hot Dip GI Structure">
              <Select value={sv(form.structureGiType)} onValueChange={(v) => set('structureGiType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2 FT">2 FT</SelectItem>
                  <SelectItem value="3 FT">3 FT</SelectItem>
                  <SelectItem value="4 FT">4 FT</SelectItem>
                  <SelectItem value="5 FT">5 FT</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Leg & Rafter"><Input value={form.structureLegRafter ?? ''} onChange={(e) => set('structureLegRafter', e.target.value)} placeholder="e.g. 8" /></F>
            <F label="Perlin"><Input value={form.structurePerlin ?? ''} onChange={(e) => set('structurePerlin', e.target.value)} placeholder="e.g. 2" /></F>
            <F label="Nut / Bolt / Clamp Box"><Input value={form.structureNutBoltClampBox ?? ''} onChange={(e) => set('structureNutBoltClampBox', e.target.value)} placeholder="e.g. 1" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="Hot Dip GI Structure">{d.structureGiType}</IR>
            <IR label="Leg & Rafter">{d.structureLegRafter}</IR>
            <IR label="Perlin">{d.structurePerlin}</IR>
            <IR label="Nut / Bolt / Clamp Box">{d.structureNutBoltClampBox}</IR>
          </div>
        )}
      </SubCard>

      {/* E. ACDB / DCDB */}
      <SubCard title="E. ACDB / DCDB" isOpen={!!expanded['acdb']} isEditing={editingSub === 'acdb'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'acdb'}
        onToggle={() => toggle('acdb')}
        onEdit={() => startEdit('acdb', {
          acdbModel: d.acdbModel ?? '', acdbSpecs: d.acdbSpecs ?? '', acdbBrand: d.acdbBrand ?? '',
          dcdbModel: d.dcdbModel ?? '', dcdbSpecs: d.dcdbSpecs ?? '', dcdbBrand: d.dcdbBrand ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'acdb' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="ACDB Model"><Input value={form.acdbModel ?? ''} onChange={(e) => set('acdbModel', e.target.value)} placeholder="e.g. SES/HA/AC-517" /></F>
            <F label="ACDB Specs"><Input value={form.acdbSpecs ?? ''} onChange={(e) => set('acdbSpecs', e.target.value)} placeholder="e.g. C32, 40K" /></F>
            <F label="ACDB Brand"><Input value={form.acdbBrand ?? ''} onChange={(e) => set('acdbBrand', e.target.value)} placeholder="e.g. Havells" /></F>
            <F label="DCDB Model"><Input value={form.dcdbModel ?? ''} onChange={(e) => set('dcdbModel', e.target.value)} placeholder="e.g. SES/HA/DC-513" /></F>
            <F label="DCDB Specs"><Input value={form.dcdbSpecs ?? ''} onChange={(e) => set('dcdbSpecs', e.target.value)} placeholder="e.g. 40K" /></F>
            <F label="DCDB Brand"><Input value={form.dcdbBrand ?? ''} onChange={(e) => set('dcdbBrand', e.target.value)} placeholder="e.g. Havells" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="ACDB Model">{d.acdbModel}</IR>
            <IR label="ACDB Specs">{d.acdbSpecs}</IR>
            <IR label="ACDB Brand">{d.acdbBrand}</IR>
            <IR label="DCDB Model">{d.dcdbModel}</IR>
            <IR label="DCDB Specs">{d.dcdbSpecs}</IR>
            <IR label="DCDB Brand">{d.dcdbBrand}</IR>
          </div>
        )}
      </SubCard>

      {/* F. Earthing Kit */}
      <SubCard title="F. Earthing Kit Set" isOpen={!!expanded['earthing']} isEditing={editingSub === 'earthing'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'earthing'}
        onToggle={() => toggle('earthing')}
        onEdit={() => startEdit('earthing', {
          earthingLightningArrestor: d.earthingLightningArrestor ?? '',
          earthingChemicalBag: d.earthingChemicalBag ?? '',
          earthingNutBolt: d.earthingNutBolt ?? '',
          earthingPitCover: d.earthingPitCover ?? '',
          earthingRod: d.earthingRod ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'earthing' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="Lightning Arrestor"><Input value={form.earthingLightningArrestor ?? ''} onChange={(e) => set('earthingLightningArrestor', e.target.value)} placeholder="e.g. 1" /></F>
            <F label="Chemical Bag"><Input value={form.earthingChemicalBag ?? ''} onChange={(e) => set('earthingChemicalBag', e.target.value)} placeholder="e.g. 3" /></F>
            <F label="Nut Bolt & Other"><Input value={form.earthingNutBolt ?? ''} onChange={(e) => set('earthingNutBolt', e.target.value)} placeholder="e.g. 1 Set" /></F>
            <F label="Pit Cover"><Input value={form.earthingPitCover ?? ''} onChange={(e) => set('earthingPitCover', e.target.value)} placeholder="e.g. 3" /></F>
            <F label="Earthing Rod"><Input value={form.earthingRod ?? ''} onChange={(e) => set('earthingRod', e.target.value)} placeholder="e.g. 3" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="Lightning Arrestor">{d.earthingLightningArrestor}</IR>
            <IR label="Chemical Bag">{d.earthingChemicalBag}</IR>
            <IR label="Nut Bolt & Other">{d.earthingNutBolt}</IR>
            <IR label="Pit Cover">{d.earthingPitCover}</IR>
            <IR label="Earthing Rod">{d.earthingRod}</IR>
          </div>
        )}
      </SubCard>

      {/* G. PVC / Connector / Wires */}
      <SubCard title="G. PVC / Connector / Wires" isOpen={!!expanded['wires']} isEditing={editingSub === 'wires'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'wires'}
        onToggle={() => toggle('wires')}
        onEdit={() => startEdit('wires', {
          wireMc4Connector: d.wireMc4Connector ?? '', wireEarthingCable: d.wireEarthingCable ?? '',
          wirePvcCableTray: d.wirePvcCableTray ?? '', wirePvcConduitPipe: d.wirePvcConduitPipe ?? '',
          wirePvcElbow: d.wirePvcElbow ?? '', wireCClip: d.wireCClip ?? '',
          wireT: d.wireT ?? '', wireFlexibleCoil: d.wireFlexibleCoil ?? '',
          wireCableTie: d.wireCableTie ?? '', wireBlackTape: d.wireBlackTape ?? '',
          wire16mmEarthingCable: d.wire16mmEarthingCable ?? '',
          wireDcCable4sqmm: d.wireDcCable4sqmm ?? '',
          wireAcCableCopper: d.wireAcCableCopper ?? '',
        })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'wires' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="MC4 Connector"><Input value={form.wireMc4Connector ?? ''} onChange={(e) => set('wireMc4Connector', e.target.value)} placeholder="e.g. 1 Set" /></F>
            <F label="Earthing Cable"><Input value={form.wireEarthingCable ?? ''} onChange={(e) => set('wireEarthingCable', e.target.value)} placeholder="e.g. 60 Meter" /></F>
            <F label="PVC Cable Tray"><Input value={form.wirePvcCableTray ?? ''} onChange={(e) => set('wirePvcCableTray', e.target.value)} placeholder="e.g. 20 Pc" /></F>
            <F label="25mm PVC Conduit Pipe"><Input value={form.wirePvcConduitPipe ?? ''} onChange={(e) => set('wirePvcConduitPipe', e.target.value)} placeholder="e.g. 12 Pc" /></F>
            <F label="25mm PVC Elbow"><Input value={form.wirePvcElbow ?? ''} onChange={(e) => set('wirePvcElbow', e.target.value)} placeholder="e.g. 1 Set" /></F>
            <F label="25mm C-Clip"><Input value={form.wireCClip ?? ''} onChange={(e) => set('wireCClip', e.target.value)} placeholder="e.g. 1 Set" /></F>
            <F label="25mm T"><Input value={form.wireT ?? ''} onChange={(e) => set('wireT', e.target.value)} placeholder="e.g. 1 Set" /></F>
            <F label="Flexible Coil"><Input value={form.wireFlexibleCoil ?? ''} onChange={(e) => set('wireFlexibleCoil', e.target.value)} placeholder="e.g. 3 Meter" /></F>
            <F label="Cable Tie"><Input value={form.wireCableTie ?? ''} onChange={(e) => set('wireCableTie', e.target.value)} placeholder="e.g. 20 Pc" /></F>
            <F label="Black Tape"><Input value={form.wireBlackTape ?? ''} onChange={(e) => set('wireBlackTape', e.target.value)} placeholder="e.g. 5 Pc" /></F>
            <F label="16mm Earthing Cable"><Input value={form.wire16mmEarthingCable ?? ''} onChange={(e) => set('wire16mmEarthingCable', e.target.value)} placeholder="e.g. 10 Meter" /></F>
            <F label="DC Cable 4 Sq mm"><Input value={form.wireDcCable4sqmm ?? ''} onChange={(e) => set('wireDcCable4sqmm', e.target.value)} placeholder="e.g. 20 Meter" /></F>
            <F label="AC Cable Copper"><Input value={form.wireAcCableCopper ?? ''} onChange={(e) => set('wireAcCableCopper', e.target.value)} placeholder="e.g. 15 Meter" /></F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="MC4 Connector">{d.wireMc4Connector}</IR>
            <IR label="Earthing Cable">{d.wireEarthingCable}</IR>
            <IR label="PVC Cable Tray">{d.wirePvcCableTray}</IR>
            <IR label="25mm PVC Conduit Pipe">{d.wirePvcConduitPipe}</IR>
            <IR label="25mm PVC Elbow">{d.wirePvcElbow}</IR>
            <IR label="25mm C-Clip">{d.wireCClip}</IR>
            <IR label="25mm T">{d.wireT}</IR>
            <IR label="Flexible Coil">{d.wireFlexibleCoil}</IR>
            <IR label="Cable Tie">{d.wireCableTie}</IR>
            <IR label="Black Tape">{d.wireBlackTape}</IR>
            <IR label="16mm Earthing Cable">{d.wire16mmEarthingCable}</IR>
            <IR label="DC Cable 4 Sq mm">{d.wireDcCable4sqmm}</IR>
            <IR label="AC Cable Copper">{d.wireAcCableCopper}</IR>
          </div>
        )}
      </SubCard>

      {/* H. Postinstallation */}
      <SubCard title="H. Postinstallation" isOpen={!!expanded['postinstallation']} isEditing={editingSub === 'postinstallation'}
        saving={saving} canEdit={canEdit} editDisabled={editDisabled && editingSub !== 'postinstallation'}
        onToggle={() => toggle('postinstallation')}
        onEdit={() => startEdit('postinstallation', { dcrCertificateNo: d.dcrCertificateNo ?? '' })}
        onCancel={cancelEdit} onSave={() => saveMutation.mutate()}>
        {editingSub === 'postinstallation' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <F label="DCR Certificate No.">
              <Input value={form.dcrCertificateNo ?? ''} onChange={(e) => set('dcrCertificateNo', e.target.value)} placeholder="DCR certificate number" />
            </F>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <IR label="DCR Certificate No.">{d.dcrCertificateNo}</IR>
          </div>
        )}
      </SubCard>

      {/* I. Other Materials */}
      <div className="rounded-lg border border-surface-container-low overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low/50">
          <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">I. Other Materials</span>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setAddingMat(true)} disabled={addingMat || editingMatId !== null}>
              <Plus size={11} />Add Row
            </Button>
          )}
        </div>
        <div className="bg-surface/30">
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2 border-b border-surface-container-low">
            {['#', 'Item', 'Size', 'Length / Qty', 'Make', ''].map((h, i) => (
              <span key={i} className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">{h}</span>
            ))}
          </div>

          {materials.map((mat) => (
            <div key={mat.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2 border-b border-surface-container-low/50 items-center last:border-0">
              {editingMatId === mat.id ? (
                <>
                  <span className="text-xs text-on-surface-variant/50">{mat.itemNo}</span>
                  <Input className="h-7 text-xs" value={editingMat.item ?? ''} onChange={(e) => setEditingMat((p) => ({ ...p, item: e.target.value }))} />
                  <Input className="h-7 text-xs" value={editingMat.size ?? ''} onChange={(e) => setEditingMat((p) => ({ ...p, size: e.target.value }))} placeholder="Size" />
                  <Input className="h-7 text-xs" value={editingMat.lengthQty ?? ''} onChange={(e) => setEditingMat((p) => ({ ...p, lengthQty: e.target.value }))} placeholder="Qty" />
                  <Input className="h-7 text-xs" value={editingMat.make ?? ''} onChange={(e) => setEditingMat((p) => ({ ...p, make: e.target.value }))} placeholder="Make" />
                  <div className="flex gap-1">
                    <button onClick={() => updateMatMutation.mutate({ matId: mat.id, data: editingMat })} className="w-5 h-5 flex items-center justify-center rounded text-primary hover:bg-primary/10"><Save size={10} /></button>
                    <button onClick={() => setEditingMatId(null)} className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container"><X size={10} /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs text-on-surface-variant/50">{mat.itemNo}</span>
                  <span className="text-xs font-semibold text-on-surface">{mat.item}</span>
                  <span className="text-xs text-on-surface-variant/70">{mat.size ?? '—'}</span>
                  <span className="text-xs text-on-surface-variant/70">{mat.lengthQty ?? '—'}</span>
                  <span className="text-xs text-on-surface-variant/70">{mat.make ?? '—'}</span>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMatId(mat.id); setEditingMat({ item: mat.item, size: mat.size ?? '', lengthQty: mat.lengthQty ?? '', make: mat.make ?? '' }); }} className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/40 hover:bg-surface-container hover:text-primary" disabled={editingMatId !== null}><Pencil size={9} /></button>
                      <button onClick={() => deleteMatMutation.mutate(mat.id)} className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/40 hover:bg-error/10 hover:text-error" disabled={deleteMatMutation.isPending}><Trash2 size={9} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {addingMat && (
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2 border-t border-surface-container-low items-center bg-primary/[0.02]">
              <span className="text-xs text-on-surface-variant/30">+</span>
              <Input className="h-7 text-xs" value={newMat.item} onChange={(e) => setNewMat((p) => ({ ...p, item: e.target.value }))} placeholder="Item *" />
              <Input className="h-7 text-xs" value={newMat.size} onChange={(e) => setNewMat((p) => ({ ...p, size: e.target.value }))} placeholder="Size" />
              <Input className="h-7 text-xs" value={newMat.lengthQty} onChange={(e) => setNewMat((p) => ({ ...p, lengthQty: e.target.value }))} placeholder="Qty" />
              <Input className="h-7 text-xs" value={newMat.make} onChange={(e) => setNewMat((p) => ({ ...p, make: e.target.value }))} placeholder="Make" />
              <div className="flex gap-1">
                <button onClick={() => { if (!newMat.item.trim()) { toast.error('Item name required'); return; } addMatMutation.mutate(); }} className="w-5 h-5 flex items-center justify-center rounded text-primary hover:bg-primary/10"><Save size={10} /></button>
                <button onClick={() => { setAddingMat(false); setNewMat({ item: '', size: '', lengthQty: '', make: '' }); }} className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/50 hover:bg-surface-container"><X size={10} /></button>
              </div>
            </div>
          )}

          {materials.length === 0 && !addingMat && (
            <div className="px-4 py-6 text-center text-xs text-on-surface-variant/40">No other materials added yet</div>
          )}
        </div>
      </div>

    </div>
  );
}

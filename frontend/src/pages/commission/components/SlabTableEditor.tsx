import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Slab { from: number; to: number; rate: number; }

interface Props {
  value: Slab[];
  onChange: (v: Slab[]) => void;
}

export function SlabTableEditor({ value, onChange }: Props) {
  const update = (idx: number, key: keyof Slab, raw: string) => {
    const slabs = [...value];
    slabs[idx] = { ...slabs[idx], [key]: parseFloat(raw) || 0 };
    onChange(slabs);
  };
  const add = () => {
    const last = value[value.length - 1];
    onChange([...value, { from: last ? last.to : 0, to: (last ? last.to : 0) + 10, rate: 0 }]);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="mt-1 space-y-2">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest px-1">
        <span>From (kW)</span><span>To (kW)</span><span>Rate (₹/kW)</span><span />
      </div>
      {value.map((slab, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
          <Input type="number" min={0} step="0.01" className="h-8 text-xs" value={slab.from} onChange={(e) => update(idx, 'from', e.target.value)} />
          <Input type="number" min={0} step="0.01" className="h-8 text-xs" value={slab.to} onChange={(e) => update(idx, 'to', e.target.value)} />
          <Input type="number" min={0} step="0.01" className="h-8 text-xs" value={slab.rate} onChange={(e) => update(idx, 'rate', e.target.value)} />
          <button onClick={() => remove(idx)} className="text-error/50 hover:text-error transition-colors"><Trash2 size={13} /></button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={add} className="w-full"><Plus size={13} />Add Slab</Button>
    </div>
  );
}

export function SlabTableViewer({ value }: { value: string }) {
  let slabs: Slab[] = [];
  try { slabs = JSON.parse(value); } catch { return null; }
  if (!slabs.length) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant/10 mt-1">
      <table className="w-full text-xs">
        <thead><tr className="bg-surface-container">
          <th className="text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">From (kW)</th>
          <th className="text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">To (kW)</th>
          <th className="text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Rate (₹/kW)</th>
        </tr></thead>
        <tbody>{slabs.map((s, i) => (
          <tr key={i} className="border-t border-outline-variant/5">
            <td className="px-3 py-1.5">{s.from}</td>
            <td className="px-3 py-1.5">{s.to}</td>
            <td className="px-3 py-1.5 font-bold">₹{s.rate}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

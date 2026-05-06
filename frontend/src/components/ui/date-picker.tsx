import * as React from 'react';
import { format, parse, isValid, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;            // ISO date string YYYY-MM-DD or ''
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i); // last 100 years

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className, disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const validSelected = selected && isValid(selected) ? selected : undefined;

  // Month/Year navigation state (what the calendar header shows)
  const [navDate, setNavDate] = React.useState<Date>(validSelected ?? new Date());

  React.useEffect(() => {
    if (validSelected) setNavDate(validSelected);
  }, [value]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) { onChange(''); setOpen(false); return; }
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNavDate((d) => setMonth(d, Number(e.target.value)));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNavDate((d) => setYear(d, Number(e.target.value)));
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm shadow-sm transition-colors hover:bg-surface-container/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
            !validSelected && 'text-on-surface-variant/50',
            className,
          )}
        >
          {validSelected ? format(validSelected, 'dd MMM yyyy') : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 flex-shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        {/* Year + Month selectors at the top */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <select
            value={getMonth(navDate)}
            onChange={handleMonthChange}
            className="flex-1 rounded-md border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={getYear(navDate)}
            onChange={handleYearChange}
            className="w-24 rounded-md border border-outline-variant/30 bg-surface-container-lowest px-2 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <Calendar
          mode="single"
          selected={validSelected}
          onSelect={handleDaySelect}
          month={navDate}
          onMonthChange={setNavDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

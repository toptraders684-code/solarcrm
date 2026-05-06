import * as React from 'react';
import { parse, format, isValid, startOfMonth, getDay, getDaysInMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface DateSelectPickerProps {
  value?: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CURRENT_YEAR = new Date().getFullYear();

const DECADES: number[] = [];
for (let d = Math.floor(CURRENT_YEAR / 10) * 10; d >= 1920; d -= 10) DECADES.push(d);

function parseISO(v?: string) {
  const p = v ? parse(v, 'yyyy-MM-dd', new Date()) : null;
  return p && isValid(p) ? p : null;
}

type View = 'calendar' | 'decades' | 'years';

function autoFormatInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function tryParseInput(text: string): Date | null {
  const p = parse(text, 'dd/MM/yyyy', new Date());
  return isValid(p) ? p : null;
}

export function DateSelectPicker({ value, onChange, className, disabled, placeholder = 'Select date' }: DateSelectPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const [inputError, setInputError] = React.useState(false);

  const parsed = parseISO(value);

  // Viewing month/year (for calendar navigation)
  const [viewDate, setViewDate] = React.useState<Date>(parsed ?? new Date());
  // Which panel is shown
  const [view, setView] = React.useState<View>('calendar');
  const [activeDecade, setActiveDecade] = React.useState<number | null>(null);

  // When popover opens: navigate calendar to selected date, seed the text input, reset panels.
  // No separate effect for `value` — that would cause an extra render on every selection.
  React.useEffect(() => {
    if (open) {
      const p = parseISO(value);
      if (p) setViewDate(p);
      setInputText(p ? format(p, 'dd/MM/yyyy') : '');
      setInputError(false);
      setView('calendar');
      setActiveDecade(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDay = parsed?.getDate() ?? null;
  const selectedMonth = parsed?.getMonth() ?? null;
  const selectedYear = parsed?.getFullYear() ?? null;

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // Calendar grid data
  const firstDayOfMonth = getDay(startOfMonth(viewDate)); // 0=Sun
  const daysInMonth = getDaysInMonth(viewDate);

  // Total cells: leading blanks + days
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (isValid(date)) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  const yearsInDecade = (dec: number) =>
    Array.from({ length: Math.min(dec + 9, CURRENT_YEAR) - dec + 1 }, (_, i) => dec + i).reverse();

  const handleInputChange = (raw: string) => {
    const formatted = autoFormatInput(raw);
    setInputText(formatted);
    setInputError(false);
    if (formatted.length === 10) {
      const d = tryParseInput(formatted);
      if (d) {
        onChange(format(d, 'yyyy-MM-dd'));
        setViewDate(d);
        setInputError(false);
      } else {
        setInputError(true);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const d = tryParseInput(inputText);
      if (d) {
        onChange(format(d, 'yyyy-MM-dd'));
        setViewDate(d);
        setOpen(false);
      } else if (inputText.length > 0) {
        setInputError(true);
      }
    }
  };

  const displayValue = parsed ? format(parsed, 'dd MMM yyyy') : '';

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 h-9 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 shadow-sm',
            'text-sm text-left transition-colors hover:bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            !displayValue && 'text-on-surface-variant/50',
            className,
          )}
        >
          <CalendarDays size={14} className="text-on-surface-variant/40 shrink-0" />
          <span className="flex-1">{displayValue || placeholder}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-3 select-none">
        {view === 'calendar' && (
          <>
            {/* Manual text input */}
            <div className="mb-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className={cn(
                  'w-full h-8 rounded-md border px-3 text-sm bg-surface-container-lowest text-on-surface',
                  'focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40',
                  inputError ? 'border-error text-error' : 'border-outline-variant/30',
                )}
              />
              {inputError && <p className="mt-0.5 text-[10px] text-error font-semibold">Invalid date — use DD/MM/YYYY</p>}
            </div>

            {/* Header: prev month / Month+Year / next month */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="p-1 rounded hover:bg-primary/10 text-on-surface-variant/60 hover:text-primary transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setView('decades')}
                className="flex items-center gap-1 text-sm font-bold text-on-surface hover:text-primary transition-colors"
              >
                {MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}
                <ChevronRight size={12} className="rotate-90 text-on-surface-variant/40" />
              </button>

              <button
                type="button"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="p-1 rounded hover:bg-primary/10 text-on-surface-variant/60 hover:text-primary transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-[10px] font-black uppercase text-on-surface-variant/40 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      'aspect-square w-full flex items-center justify-center rounded text-xs font-semibold transition-colors',
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === 'decades' && activeDecade === null && (
          <>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary mb-3 hover:opacity-70 transition-opacity"
            >
              <ChevronLeft size={12} />Back
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3">Select decade</p>
            <div className="grid grid-cols-3 gap-1">
              {DECADES.map((dec) => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => setActiveDecade(dec)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-bold transition-colors',
                    selectedYear != null && selectedYear >= dec && selectedYear <= dec + 9
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  {dec}s
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'decades' && activeDecade !== null && (
          <>
            <button
              type="button"
              onClick={() => setActiveDecade(null)}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary mb-3 hover:opacity-70 transition-opacity"
            >
              <ChevronLeft size={12} />{activeDecade}s
            </button>
            <div className="grid grid-cols-4 gap-1">
              {yearsInDecade(activeDecade).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewDate(new Date(y, viewMonth, 1));
                    setView('calendar');
                    setActiveDecade(null);
                  }}
                  className={cn(
                    'py-2 rounded-lg text-xs font-bold transition-colors',
                    selectedYear === y
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

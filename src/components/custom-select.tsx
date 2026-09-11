"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = { label: string; value: string; disabled?: boolean };

export function CustomSelect({ label, name, value, options, onChange, className = "", hideSelectedOption = false }: { label: string; name?: string; value: string; options: Option[]; onChange: (value: string) => void; className?: string; hideSelectedOption?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const selected = options.find((option) => option.value === value);
  return <div className={`custom-select-field ${className}`} ref={root}>
    <span>{label}</span>
    {name && <input type="hidden" name={name} value={value} />}
    <button className="custom-select-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span>{selected?.label ?? "Choose an option"}</span><ChevronDown aria-hidden="true" /></button>
    {open && <div className="custom-select-menu" role="listbox" aria-label={label}>
      {options.filter((option) => !hideSelectedOption || option.value !== value).map((option) => <button className={option.value === value ? "selected" : ""} type="button" role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined} disabled={option.disabled} key={option.value} onClick={() => { if (option.disabled) return; onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <Check aria-hidden="true" />}</button>)}
    </div>}
  </div>;
}

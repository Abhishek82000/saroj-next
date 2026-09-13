"use client";
import Icon from "@/components/ui/Icon";
import { crafts, materials } from "@/lib/crafts";
import type { FilterState } from "./useShopFilters";

export interface FilterProps {
  state: FilterState;
  counts: (key: keyof FilterState, value: string) => number;
  onToggle: (key: "craft" | "material" | "avail" | "deal", value: string) => void;
  onPrice: (key: "min" | "max", value: string) => void;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="st-fg" open>
      <summary className="st-fg__h" style={{ listStyle: "none" }}>
        {title}<Icon name="down" size={13} strokeWidth={2.2} />
      </summary>
      <div className="st-fg__b">{children}</div>
    </details>
  );
}

function Check({ checked, label, count, onChange }: {
  checked: boolean; label: string; count: number; onChange: () => void;
}) {
  const dead = count === 0 && !checked;
  return (
    <label className={`st-chk${dead ? " off" : ""}`}>
      <input type="checkbox" checked={checked} disabled={dead} onChange={onChange} />
      <i aria-hidden="true" /><span>{label}</span><small>{count}</small>
    </label>
  );
}

/** Rendered twice — in the desktop rail and inside the mobile drawer. */
export default function Filters({ state, counts, onToggle, onPrice }: FilterProps) {
  return (
    <>
      <Group title="Craft">
        {crafts.map((c) => (
          <Check key={c.key} label={c.name} count={counts("craft", c.key)}
            checked={state.craft.includes(c.key)} onChange={() => onToggle("craft", c.key)} />
        ))}
      </Group>

      <Group title="Material">
        {materials
          .filter((m) => counts("material", m) > 0 || state.material.includes(m))
          .map((m) => (
            <Check key={m} label={m} count={counts("material", m)}
              checked={state.material.includes(m)} onChange={() => onToggle("material", m)} />
          ))}
      </Group>

      <Group title="Price">
        <div className="st-range">
          <input type="number" inputMode="numeric" placeholder="Min ₹" aria-label="Lowest price"
            value={state.min ?? ""} onChange={(e) => onPrice("min", e.target.value)} />
          <span>to</span>
          <input type="number" inputMode="numeric" placeholder="Max ₹" aria-label="Highest price"
            value={state.max ?? ""} onChange={(e) => onPrice("max", e.target.value)} />
        </div>
      </Group>

      <Group title="Availability">
        <Check label="In stock" count={counts("avail", "in")}
          checked={state.avail.includes("in")} onChange={() => onToggle("avail", "in")} />
        <Check label="Last few" count={counts("avail", "low")}
          checked={state.avail.includes("low")} onChange={() => onToggle("avail", "low")} />
      </Group>

      <Group title="Offer">
        <Check label="Reduced" count={counts("deal", "sale")}
          checked={state.deal.includes("sale")} onChange={() => onToggle("deal", "sale")} />
      </Group>
    </>
  );
}

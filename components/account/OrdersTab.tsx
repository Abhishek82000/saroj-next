"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/ui/Icon";
import { getOrder, getOrders, type Order } from "@/lib/orders";

/* ---------- formatting ---------- */

/** "Mon 13 Jul 2026, 04:34 PM" — or the raw string if it isn't a date. */
function fmtDate(v?: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(/^\d{4}-\d\d-\d\d \d/.test(v) ? v.replace(" ", "T") : v);
  if (Number.isNaN(d.getTime())) return v;
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).replace(/,/g, "");
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day}, ${time}`;
}

/** "₹230.00" from 230 / "230" / "230.5"; anything already formatted passes through. */
function fmtMoney(v?: string): string | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(/[,\s₹]/g, ""));
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : v;
}

const label = (s: string) => s.replace(/[_-]+/g, " ").trim();

/** Pill colour by what the status means, not its exact wording. */
function tone(status?: string): "bad" | "good" | "info" {
  const s = (status ?? "").toLowerCase();
  if (/cancel|fail|reject|return|rto|refund|not picked|undeliver/.test(s)) return "bad";
  if (/deliver|ship|ready|confirm|dispatch|transit|complete|paid|pick/.test(s)) return "good";
  return "info";
}

function Pill({ status }: { status?: string }) {
  if (!status) return null;
  return <span className={`st-pill st-pill--${tone(status)}`}>{label(status)}</span>;
}

/* ---------- the list ---------- */

/**
 * GET /api/auth/orders, Bearer-authenticated — see lib/orders.ts for why its
 * fields are read defensively rather than trusted. "View" opens that order
 * (GET /api/auth/order-view/<id>) at /account/orders/<id>, so the
 * back button and a refresh both land where you'd expect.
 */
export default function OrdersTab({ token, openId }: { token?: string; openId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ loading: boolean; error: string; orders: Order[] }>({ loading: true, error: "", orders: [] });

  useEffect(() => {
    if (!token) { setState({ loading: false, error: "", orders: [] }); return; }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    getOrders(token).then((r) => {
      if (!live) return;
      setState(r.ok ? { loading: false, error: "", orders: r.orders } : { loading: false, error: r.message, orders: [] });
    });
    return () => { live = false; };
  }, [token]);

  if (!token) return <p className="st-account__empty">Log in again to see your orders.</p>;

  if (openId) {
    return (
      <OrderDetail token={token} id={openId} summary={state.orders.find((o) => o.id === openId)}
        onBack={() => router.push("/account/orders")} />
    );
  }

  if (state.loading) return <p className="st-account__empty">Loading your orders…</p>;
  if (state.error) return <p className="st-account__empty">Couldn&rsquo;t load your orders — {state.error}</p>;
  if (state.orders.length === 0) return <p className="st-account__empty">No orders yet. Once you place one, its status shows up here.</p>;

  return (
    <div className="st-otable">
      <table>
        <thead>
          <tr><th>Order Id</th><th>Date</th><th>Status</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {state.orders.map((o) => (
            <tr key={o.id}>
              <td data-label="Order Id"><b>{o.id}</b></td>
              <td data-label="Date">{fmtDate(o.placedAt) ?? "—"}</td>
              <td data-label="Status"><Pill status={o.status} /></td>
              <td data-label="Total">{fmtMoney(o.total) ?? "—"}</td>
              <td>
                <button type="button" className="st-btn st-otable__view"
                  onClick={() => router.push(`/account/orders/${encodeURIComponent(o.id)}`)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- one order ---------- */

const DETAIL_TABS = [
  { key: "status", label: "Order Status" },
  { key: "items", label: "Item Details" },
  { key: "tracking", label: "Tracking Details" },
] as const;
type DetailTab = (typeof DETAIL_TABS)[number]["key"];

function OrderDetail({ token, id, summary, onBack }: { token: string; id: string; summary?: Order; onBack: () => void }) {
  const [state, setState] = useState<{ loading: boolean; error: string; order?: Order }>({ loading: true, error: "" });
  const [tab, setTab] = useState<DetailTab>("status");

  useEffect(() => {
    let live = true;
    setState({ loading: true, error: "" });
    getOrder(token, id).then((r) => {
      if (live) setState(r.ok ? { loading: false, error: "", order: r.order } : { loading: false, error: r.message });
    });
    return () => { live = false; };
  }, [token, id]);

  const back = (
    <button type="button" className="st-odetail__back" onClick={onBack}>
      <Icon name="left" size={14} strokeWidth={2} /> All orders
    </button>
  );

  if (state.loading) return <>{back}<p className="st-account__empty">Loading order…</p></>;
  if (state.error || !state.order) return <>{back}<p className="st-account__empty">Couldn&rsquo;t load this order — {state.error}</p></>;

  // The detail wins; the list row fills whatever the detail left out.
  const o: Order = { ...summary, ...state.order };
  for (const k of ["status", "total", "placedAt"] as const) o[k] = state.order[k] ?? summary?.[k];
  o.id = summary?.id ?? state.order.id;

  const facts: [string, ReactNode][] = [
    ["Name", o.name],
    ["Contact", o.contact],
    ["Order Created", o.placedAt && (
      <>{fmtDate(o.placedAt)}{o.updatedAt && <><br />Last Updated: {fmtDate(o.updatedAt)}</>}</>
    )],
    ["Address", o.address],
    ["Status", o.status && label(o.status)],
    ["Location", o.location],
    ["Total", fmtMoney(o.total)],
  ];

  return (
    <div className="st-odetail">
      {back}
      <header className="st-odetail__head">
        <span className="st-odetail__ic"><Icon name="cart" size={24} strokeWidth={1.4} /></span>
        <div>
          <h2>Order {o.id}</h2>
          {o.placedAt && <small>Placed {fmtDate(o.placedAt)}</small>}
        </div>
        <Pill status={o.status} />
      </header>

      <dl className="st-odetail__facts">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="st-tabs" role="tablist">
        {DETAIL_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`st-tab${tab === t.key ? " on" : ""}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel" className="st-odetail__panel" key={tab}>
        {tab === "status" && <StatusTimeline o={o} />}
        {tab === "items" && <Items o={o} />}
        {tab === "tracking" && <Tracking o={o} />}
      </div>
    </div>
  );
}

/** Placed → Confirmed → Shipped → Delivered, each ticked off by how far the
    order's status (or its tracking feed) says it has got. A cancelled order
    stops after Placed with a Cancelled step instead. */
function StatusTimeline({ o }: { o: Order }) {
  const s = (o.status ?? "").toLowerCase();
  const cancelled = /cancel|reject|fail/.test(s);
  const stage =
    /deliver(ed)?$|^delivered|complete/.test(s) && !/undeliver|not deliver/.test(s) ? 4
    : /ship|transit|dispatch|out for/.test(s) || o.tracking.length > 0 ? 3
    : /confirm|ready|process|pack|pick|manifest/.test(s) ? 2
    : 1;
  const place = [o.city, o.state].filter(Boolean).join(", ");
  const last = o.tracking[0];

  type Step = { title: string; at?: string; lines: [string, string | undefined][]; done: boolean; bad?: boolean };
  const steps: Step[] = cancelled
    ? [
        { title: "Order Placed", at: o.placedAt, lines: [["Location", place]], done: true },
        { title: "Order Cancelled", at: o.updatedAt, lines: [], done: true, bad: true },
      ]
    : [
        { title: "Order Placed", at: o.placedAt, lines: [["Location", place]], done: true },
        { title: "Order Confirmed", at: o.confirmedAt, lines: [], done: stage >= 2 },
        { title: "Order Shipped", at: last?.at, lines: [["Current Location", last?.location ?? o.location]], done: stage >= 3 },
        { title: "Order Delivered", at: o.deliveredAt, lines: [["Delivery Address", o.address]], done: stage >= 4 },
      ];

  return (
    <ol className="st-otimeline">
      {steps.map((st, i) => (
        <li key={st.title} className={st.bad ? "bad" : !st.done ? "" : steps[i + 1]?.done ? "past" : "done"}>
          <b>{st.title}</b>
          {st.done && st.at && <span>{fmtDate(st.at)}</span>}
          {st.lines.filter(([, v]) => v).map(([k, v]) => <span key={k}><b>{k} :</b> {v}</span>)}
        </li>
      ))}
    </ol>
  );
}

/** Same line markup as the cart drawer, minus the qty stepper. */
function Items({ o }: { o: Order }) {
  if (!o.items.length) return <p className="st-account__empty">Item details aren&rsquo;t available for this order yet.</p>;
  return (
    <div className="st-oitems">
      {o.items.map((it, i) => (
        <div className="st-line" key={i}>
          <span className="st-line__ph">{it.image ? <img src={it.image} alt="" loading="lazy" /> : null}</span>
          <div className="st-line__t">
            <span className="st-line__n">{it.name}</span>
            {it.variant && <span className="st-line__m">{it.variant}</span>}
            <div className="st-line__foot">
              {it.qty ? <span className="st-line__m">Qty {it.qty}</span> : <span />}
              {it.price && <span className="st-line__p">{fmtMoney(it.price)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tracking({ o }: { o: Order }) {
  if (!o.tracking.length) return <p className="st-account__empty">No tracking updates yet — they appear here once the courier picks up your order.</p>;
  return (
    <ol className="st-otimeline">
      {o.tracking.map((t, i) => (
        <li key={i} className={i === 0 ? "done" : "past"}>
          <b>{t.status}</b>
          {t.at && <span>{fmtDate(t.at)}</span>}
          {t.location && <span><b>Location :</b> {t.location}</span>}
          {t.note && <span>{t.note}</span>}
        </li>
      ))}
    </ol>
  );
}

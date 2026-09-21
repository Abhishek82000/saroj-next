"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { initialOf } from "@/components/shell/AccountMenu";
import { useStore } from "@/components/shell/StoreProvider";
import { isValidEmail } from "@/lib/auth";
import { site } from "@/lib/site";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "profile", label: "Profile" },
  { key: "wishlist", label: "Wishlist" },
  { key: "orders", label: "Order History" },
] as const;
type Tab = (typeof TABS)[number]["key"];
const isTab = (v: string | null): v is Tab => TABS.some((t) => t.key === v);

const titleOf = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Account() {
  const { user, hydrated, openLogin, logout, updateUser, favs, say } = useStore();
  const router = useRouter();
  const q = useSearchParams().get("tab");
  const tab: Tab = isTab(q) ? q : "dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (user) { setName(user.name === user.mobile ? "" : user.name); setEmail(user.email); } }, [user]);
  useEffect(() => { if (hydrated && !user) openLogin("Log in to see your account"); }, [hydrated, user, openLogin]);

  if (!user) {
    return (
      <div className="st-empty" style={{ margin: "60px auto", maxWidth: 420, textAlign: "center" }}>
        <p>Log in with your mobile number to see your account.</p>
        <button type="button" className="st-btn st-btn--solid" onClick={() => openLogin()}>Log in</button>
      </div>
    );
  }

  const hi = user.name === user.mobile ? `+91 ${user.mobile}` : user.name;
  const save = () => {
    setErr("");
    if (!name.trim()) return setErr("Add your name.");
    if (email && !isValidEmail(email)) return setErr("Enter a valid email address.");
    updateUser({ name: name.trim(), email: email.trim() });
    say("Profile saved");
  };
  const go = (t: Tab) => router.push(t === "dashboard" ? "/account" : `/account?tab=${t}`);
  const favSlugs = Object.keys(favs);

  const cards = [
    { tab: "profile" as const, icon: "user", title: "Profile", copy: "Manage your account information" },
    { tab: "wishlist" as const, icon: "heart", title: "My Wishlist", copy: "Your most loved products here" },
    { tab: "orders" as const, icon: "cart", title: "Order History", copy: "Check your order status" },
  ];

  return (
    <div className="st-wrap st-account">
      <nav className="st-crumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span>My Account</span>
        <span aria-hidden="true">/</span><b>{TABS.find((t) => t.key === tab)!.label}</b>
      </nav>

      <div className="st-account__grid">
        <aside>
          <div className="st-account__who">
            <span className="st-account__av">{initialOf(user.name) || <Icon name="user" />}</span>
            <div><b>Hi! {hi}</b>{user.email && <small>{user.email}</small>}<small>+91 {user.mobile}</small></div>
          </div>
          <nav className="st-account__nav" aria-label="Account">
            {TABS.map((t) => (
              <button key={t.key} type="button" className={t.key === tab ? "on" : ""} aria-current={t.key === tab ? "page" : undefined}
                onClick={() => go(t.key)}>{t.label}</button>
            ))}
            <button type="button" onClick={() => { logout(); router.push("/"); }}>Logout</button>
          </nav>
        </aside>

        <section className="st-account__main">
          <h1>{tab === "dashboard" ? "Account Overview" : TABS.find((t) => t.key === tab)!.label}</h1>

          {tab === "dashboard" && (
            <div className="st-account__cards">
              {cards.map((c) => (
                <button key={c.tab} type="button" className="st-account__card" onClick={() => go(c.tab)}>
                  <Icon name={c.icon} size={26} strokeWidth={1.4} /><b>{c.title}</b><span>{c.copy}</span>
                </button>
              ))}
              <a className="st-account__card" href={`https://wa.me/${site.whatsapp}`}>
                <Icon name="help" size={26} strokeWidth={1.4} /><b>Help &amp; Support</b><span>Help regarding recent purchase &amp; other</span>
              </a>
            </div>
          )}

          {tab === "profile" && (
            <div className="st-account__form">
              <label className="st-field"><span>Name</span>
                <input type="text" value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} /></label>
              <label className="st-field"><span>Email</span>
                <input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="st-field"><span>Mobile</span><input type="text" value={`+91 ${user.mobile}`} disabled /></label>
              {err && <p className="st-login__err" role="alert">{err}</p>}
              <button type="button" className="st-btn st-btn--solid" onClick={save}>Save changes</button>
            </div>
          )}

          {tab === "wishlist" && (favSlugs.length === 0
            ? <p className="st-account__empty">Nothing saved yet — tap the heart on any piece.</p>
            : <ul className="st-account__list">{favSlugs.map((s) => (
                <li key={s}><Link href={`/product/${s}`}>{titleOf(s)}</Link></li>))}</ul>)}

          {tab === "orders" && <p className="st-account__empty">No orders yet. Once you place one, its status shows up here.</p>}
        </section>
      </div>
    </div>
  );
}

export default function AccountView() {
  return <Suspense><Account /></Suspense>;
}

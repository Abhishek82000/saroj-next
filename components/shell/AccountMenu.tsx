"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";

/** The first letter of a name — or nothing, for an account that is still
    only a mobile number (no name came back from the API). */
export const initialOf = (name: string) => (/^[\p{L}]/u.test(name.trim()) ? name.trim()[0].toUpperCase() : "");

/** The header's account control: a login button when logged out, and once
    logged in a round avatar with the name's first letter that opens /account. */
export default function AccountMenu() {
  const { user, openLogin } = useStore();

  if (!user) {
    return (
      <button className="st-icn" onClick={() => openLogin()} aria-label="Log in or register">
        <Icon name="user" />
      </button>
    );
  }

  const letter = initialOf(user.name);
  return (
    <Link href="/account" className="st-icn st-icn--on" aria-label={`My account — ${user.name}`}>
      {letter || <Icon name="user" />}
    </Link>
  );
}

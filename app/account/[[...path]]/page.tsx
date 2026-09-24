import type { Metadata } from "next";
import AccountView from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

/** /account — the page the header's avatar opens. Everything in it is about
    the signed-in visitor, so it renders on the client from the store. */
export default function AccountPage() {
  return <AccountView />;
}

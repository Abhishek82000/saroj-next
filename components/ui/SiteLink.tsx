"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useStore } from "@/components/shell/StoreProvider";

/** A Next link that keeps the visitor in the mode they're browsing: inside
    /wholesale-fabric a shop or product link goes to its wholesale twin. */
export default function SiteLink({ href, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { href: modeHref } = useStore();
  return <Link href={modeHref(href)} {...rest} />;
}

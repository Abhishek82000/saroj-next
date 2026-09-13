"use client";
import Portal from "@/components/ui/Portal";
import { useStore } from "./StoreProvider";

export default function Toast() {
  const { toast } = useStore();
  return (
    <Portal>
      <div className={`st-toast${toast ? " on" : ""}`} role="status" aria-live="polite">{toast}</div>
    </Portal>
  );
}

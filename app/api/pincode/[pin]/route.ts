import { NextResponse } from "next/server";

/**
 * GET /api/pincode/<6 digits> → { city, state } for the checkout's delivery
 * address. Looked up from India Post (api.postalpincode.in) on the server —
 * that API sends no CORS headers, so the browser can't call it directly.
 * Pincodes don't move, so answers are cached for a day.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ ok: false, message: "Enter a valid 6-digit pincode." }, { status: 400 });
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { next: { revalidate: 86400 } });
    const json = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string }[] | null }[];
    const po = json?.[0]?.Status === "Success" ? json[0].PostOffice?.[0] : undefined;
    if (!po?.District || !po.State) return NextResponse.json({ ok: false, message: "We couldn't find that pincode." }, { status: 404 });
    return NextResponse.json({ ok: true, city: po.District, state: po.State });
  } catch {
    return NextResponse.json({ ok: false, message: "Couldn't look up the pincode — fill in the city and state." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";

type FrankfurterObservation = { date: string; base: string; quote: string; rate: number };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base")?.toUpperCase() ?? "";
  const quote = searchParams.get("quote")?.toUpperCase() ?? "";

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote) || base === quote) {
    return NextResponse.json({ error: { message: "Choose two different valid currencies." } }, { status: 400 });
  }

  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 10);
  const from = start.toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rates?from=${from}&to=${to}&base=${base}&quotes=${quote}`, {
      next: { revalidate: 1800 },
    });
    if (!response.ok) throw new Error("Exchange-rate provider rejected the pair.");
    const payload = await response.json() as FrankfurterObservation[];
    const observations = (Array.isArray(payload) ? payload : [])
      .filter((item) => item.quote === quote && Number.isFinite(item.rate))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (observations.length < 2) throw new Error("Not enough exchange-rate history is available.");
    const previous = observations.at(-2)!;
    const latest = observations.at(-1)!;
    return NextResponse.json({ base, quote, lastPrice: previous.rate, currentPrice: latest.rate, lastDate: previous.date, currentDate: latest.date });
  } catch {
    return NextResponse.json({ error: { message: "Currency rates are temporarily unavailable." } }, { status: 503 });
  }
}

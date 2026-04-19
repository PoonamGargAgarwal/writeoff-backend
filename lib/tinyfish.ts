export interface IRSResult {
  title: string;
  snippet: string;
  url: string;
}

export async function searchIRSRule(keyword: string): Promise<IRSResult[]> {
  const query = `IRS ${keyword} small business deduction 2024`;

  const res = await fetch(
    `https://api.search.tinyfish.ai?query=${encodeURIComponent(query)}&location=US&language=en`,
    {
      headers: {
        "X-API-Key": process.env.TINYFISH_API_KEY!,
      },
    },
  );

  if (!res.ok) {
    console.error("TinyFish search failed:", res.status);
    return [];
  }

  const data = await res.json();
  return data.results.slice(0, 3).map((r: any) => ({
    title: r.title,
    snippet: r.snippet,
    url: r.url,
  }));
}

export async function fetchIRSPage(url: string): Promise<string> {
  const res = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.TINYFISH_API_KEY!,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.content || data.text || "";
}

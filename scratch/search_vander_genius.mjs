async function searchGenius(q) {
  const url = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) return [];
  const json = await res.json();
  const hits = json?.response?.sections?.find(s => s.type === 'song')?.hits || [];
  return hits.map(h => ({
    title: h.result.title,
    artist: h.result.artist_names,
    url: h.result.url
  }));
}

async function main() {
  const queries = [
    'vander bencana alam',
    'vander agak laen',
    'vander balikan',
    'vander batu ponari',
    'vander kampungan',
    'vander pantai selatan',
    'vander gaya gua'
  ];

  for (const q of queries) {
    const hits = await searchGenius(q);
    console.log(`\nSearch "${q}":`);
    hits.slice(0, 3).forEach(h => console.log('  ', h.artist, '-', h.title, '=>', h.url));
  }
}

main().catch(console.error);

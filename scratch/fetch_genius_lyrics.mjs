
async function fetchLyrics(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  // Genius lyrics are typically inside data-lyrics-container="true"
  const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  let lyrics = '';
  while ((match = regex.exec(html)) !== null) {
    let part = match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    lyrics += part + '\n';
  }
  return lyrics.trim();
}

async function main() {
  const urls = [
    { title: 'KING MOKONDO', url: 'https://genius.com/Vander-vandereism-king-mokondo-lyrics' },
    { title: 'Bencana Alam', url: 'https://genius.com/Vander-vandereism-bencana-alam-lyrics' },
    { title: 'Agak Laen', url: 'https://genius.com/Vander-vandereism-agak-laen-lyrics' },
    { title: 'Balikan', url: 'https://genius.com/Vander-vandereism-balikan-lyrics' },
    { title: 'Batu Ponari', url: 'https://genius.com/Vander-vandereism-batu-ponari-lyrics' },
    { title: 'Bales Keroyok', url: 'https://genius.com/Riski-inrahim-bales-keroyok-lyrics' },
    { title: 'Puter Balik', url: 'https://genius.com/Riski-inrahim-puter-balik-lyrics' }
  ];

  for (const u of urls) {
    console.log(`\n================== ${u.title} ==================`);
    const lyr = await fetchLyrics(u.url);
    console.log(lyr);
  }
}

main().catch(console.error);

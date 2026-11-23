async function fetchLyrics(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
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
  const songs = [
    { title: 'Bencana Alam', url: 'https://genius.com/Vander-vandereism-bencana-alam-lyrics' },
    { title: 'Agak Laen', url: 'https://genius.com/Vander-vandereism-agak-laen-lyrics' },
    { title: 'batu ponari', url: 'https://genius.com/Vander-vandereism-batu-ponari-lyrics' },
    { title: 'Kampungan', url: 'https://genius.com/Vander-vandereism-kampungan-lyrics' },
    { title: 'Balikan', url: 'https://genius.com/Vander-vandereism-balikan-lyrics' }
  ];

  for (const s of songs) {
    console.log(`\n================== ${s.title} ==================`);
    const txt = await fetchLyrics(s.url);
    console.log(txt);
  }
}

main().catch(console.error);

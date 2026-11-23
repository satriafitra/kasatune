async function run() {
  const res = await fetch('https://genius.com/Vander-vandereism-king-mokondo-lyrics', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  let full = '';
  while ((match = regex.exec(html)) !== null) {
    full += match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"') + '\n';
  }
  console.log(full);
}
run().catch(console.error);

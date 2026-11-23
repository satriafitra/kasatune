async function check(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const idx = html.indexOf('Lyrics__Container');
  if (idx !== -1) {
    console.log(url, 'found Lyrics__Container at', idx);
    console.log(html.slice(idx, idx + 800).replace(/<[^>]+>/g, ' '));
  } else {
    console.log(url, 'NO Lyrics__Container, looking for lyrics in html...');
    const m = html.match(/class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (m) console.log(m[1].slice(0, 300));
  }
}
async function main() {
  await check('https://genius.com/Vander-vandereism-agak-laen-lyrics');
  await check('https://genius.com/Vander-vandereism-batu-ponari-lyrics');
}
main().catch(console.error);

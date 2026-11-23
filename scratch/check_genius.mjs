async function run() {
  const res = await fetch('https://genius.com/artists/Vander-vandereism', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  console.log('HTML length:', html.length);
  const re = /href="(https:\/\/genius\.com\/[^"]+lyrics)"/g;
  const links = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    links.add(m[1]);
  }
  console.log('Found links:', Array.from(links));
}
run().catch(console.error);

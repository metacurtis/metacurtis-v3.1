import fs from 'node:fs';

export default async function checkFont() {
  const ok = fs.existsSync('public/fonts/CourierPrime_Regular.typeface.json');
  return {
    name: 'Font Asset',
    ok,
    detail: ok ? 'Typeface present in /public' : 'Missing /public/fonts/CourierPrime_Regular.typeface.json',
    advice: ok ? [] : ['Add the typeface JSON to /public/fonts or update VC.FONT_URL'],
  };
}

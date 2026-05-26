import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface ImageSpec {
  filename: string;
  query: string;
}

const IMAGES: ImageSpec[] = [
  { filename: 'paris-hotel-1.jpg', query: 'paris,hotel,luxury' },
  { filename: 'paris-activity-1.jpg', query: 'paris,eiffel,tour' },
  { filename: 'roma-hotel-1.jpg', query: 'rome,hotel,boutique' },
  { filename: 'roma-activity-1.jpg', query: 'rome,colosseum' },
  { filename: 'tokio-hotel-1.jpg', query: 'tokyo,hotel,modern' },
  { filename: 'tokio-activity-1.jpg', query: 'tokyo,shrine' },
  { filename: 'newyork-hotel-1.jpg', query: 'newyork,hotel,manhattan' },
  { filename: 'newyork-activity-1.jpg', query: 'newyork,statue,liberty' },
  { filename: 'santorini-hotel-1.jpg', query: 'santorini,hotel,greece' },
  { filename: 'santorini-activity-1.jpg', query: 'santorini,sunset' },
  { filename: 'marrakech-hotel-1.jpg', query: 'marrakech,riad' },
  { filename: 'marrakech-activity-1.jpg', query: 'marrakech,medina' },
  { filename: 'vehicle-car.jpg', query: 'car,rental,europe' },
  { filename: 'vehicle-van.jpg', query: 'van,minivan' },
  { filename: 'vehicle-suv.jpg', query: 'suv,toyota' },
  { filename: 'vehicle-minibus.jpg', query: 'minibus,touring' },
  { filename: 'paquete-paris.jpg', query: 'paris,romantic,trip' },
  { filename: 'paquete-roma.jpg', query: 'rome,vacation' },
  { filename: 'paquete-santorini.jpg', query: 'santorini,vacation' },
];

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function fetchUnsplashUrl(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.unsplash.com',
      path: `/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.urls?.regular ?? null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  for (const img of IMAGES) {
    const dest = path.join(UPLOADS_DIR, img.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
      console.log(`OK ${img.filename} (cache)`);
      continue;
    }

    let url: string | null = null;
    if (UNSPLASH_KEY) {
      url = await fetchUnsplashUrl(img.query);
    }
    if (!url) {
      url = `https://picsum.photos/seed/${encodeURIComponent(img.filename)}/1200/800`;
    }

    try {
      await download(url, dest);
      console.log(`OK ${img.filename} <- ${url.slice(0, 60)}`);
    } catch (err) {
      console.warn(`FAIL ${img.filename}: ${(err as Error).message}`);
    }
  }
  console.log('Done downloading images.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

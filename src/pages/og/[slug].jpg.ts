import type { APIRoute } from "astro";
import { html } from "satori-html";
import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";
import serviceDetails from "../../data/serviceDetails.json";

export function getStaticPaths() {
  return serviceDetails.map((service) => ({
    params: { slug: service.slug },
  }));
}

export const prerender = true;

export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params;
  const service = serviceDetails.find((s) => s.slug === slug);

  if (!service) return new Response("Not found", { status: 404 });

  // Image Mapping (Copied from [slug].astro to ensure consistency)
  const tourImages: Record<string, string> = {
    "tirupati-package": "/images/temple/tirupati-balaji.webp",
    "thiruvannamalai-girivalam-trip": "/images/temple/thiruvannamalai-girivalam.webp",
    "rameswaram-2-days": "/images/temple/rameswaram.webp",
    "navagraha-tour": "/images/temple/navagraha.webp",
    "kanchipuram-temple-trip": "/images/temple/kanchipuram-temple.webp",
    "chidambaram-temple-trip": "/images/temple/chidambaram-natarajar-temple.webp",
    "sabarimala-trip": "/images/temple/sabarimala-temple.webp",
    "pondicherry-one-day-trip": "/images/temple/pondicherry.webp",
    "vellore-golden-temple": "/images/temple/vellore-golden.webp",
    "mahabalipuram-ecr-temple-route": "/images/temple/mahabalipuram-ecr-temples.webp",
    "one-day-chennai-city-tour": "/images/temple/chennai-city.webp" 
  };

  const categoryImages: Record<string, string> = {
    "Acting Driver Services": "/images/services/acting-drivers.webp",
    "Corporate Travel": "/images/services/corporate.webp",
    "Airport Transfers": "/images/services/airport-transfer.webp",
    "Temple Tours": "/images/services/temple-tours.webp",
    "Premium Fleet Rental": "/images/services/corporate.webp"
  };

  const heroImage = tourImages[service.slug] || categoryImages[service.category] || '/images/logo.webp';
  
  // Handle full URLs vs local paths
  let imageBuffer: Buffer | string = "";
  
  if (heroImage.startsWith('http')) {
      imageBuffer = heroImage;
  } else {
      // Read local file
      try {
          const imagePath = path.resolve(`./public${heroImage}`);
          const fileBuffer = readFileSync(imagePath);
          
          // Convert to JPEG using sharp to ensure compatibility (especially for AVIF)
          const jpegBuffer = await sharp(fileBuffer)
            .resize({ width: 1200, fit: 'inside', withoutEnlargement: true }) 
            .jpeg({ quality: 80 })
            .toBuffer();

          imageBuffer = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;
      } catch (e) {
          console.error(`Failed to load image: ${heroImage}`, e);
          // Fallback or empty
          imageBuffer = ""; 
      }
  }

  // Load Font
  const fontPath = path.resolve("./public/fonts/NotoSans-Bold.ttf");
  const fontData = readFileSync(fontPath);

  // Load Logo
  const logoPath = path.resolve("./public/images/logo.webp");
  const logoBuffer = readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const htmlString = `
    <div style="display: flex; height: 100%; width: 100%; background-color: #fff; position: relative;">
      ${imageBuffer ? `<img src="${imageBuffer}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4;" />` : ''}
      
      <div style="display: flex; flex-direction: column; justify-content: center; padding: 80px; width: 100%; height: 100%;">
        <div style="display: flex; align-items: center; margin-bottom: 40px;">
           <img src="${logoBase64}" style="height: 80px; object-fit: contain;" />
        </div>

        <h1 style="display: flex; font-size: 70px; font-weight: bold; color: #000; margin: 0; line-height: 1.1; text-shadow: 2px 2px 0px #fff; max-width: 90%;">
          ${service.title}
        </h1>

        <div style="display: flex; margin-top: 30px;">
           <span style="font-size: 35px; color: #fff; background-color: #dc2626; padding: 15px 30px; border-radius: 15px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
             ${service.category === 'Temple Tours' ? 'Pilgrimage Special' : 'Premium Service'}
           </span>
        </div>
      </div>
      
      <div style="display: flex; position: absolute; bottom: 0; left: 0; width: 100%; height: 20px; background: #dc2626;"></div>
    </div>
  `;

  const markup = html(htmlString);

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Noto Sans",
        data: fontData,
        style: "normal",
        weight: 700,
      },
    ],
  });

  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 80 })
    .toBuffer();

  return new Response(jpeg as any, {
    headers: {
      "Content-Type": "image/jpeg",
    },
  });
};

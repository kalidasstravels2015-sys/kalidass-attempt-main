const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { html } = require('satori-html');
const sharp = require('sharp');

// SVG Icons
const checkIcon = `
  <svg viewBox="0 0 20 20" width="15" height="15" fill="#34D399" style="margin-right: 6px;">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>
`;

const starIcon = `
  <svg viewBox="0 0 20 20" width="16" height="16" fill="#FBBF24" style="margin-right: 5px;">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
`;

const clockIcon = `
  <svg viewBox="0 0 20 20" width="14" height="14" fill="#FBBF24" style="margin-right: 6px;">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
  </svg>
`;

const phoneIcon = `
  <svg viewBox="0 0 20 20" width="14" height="14" fill="#CBD5E1" style="margin-right: 6px;">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z" />
  </svg>
`;

async function test() {
  const serviceDetails = require('../src/data/serviceDetails.json');
  const service = serviceDetails.find(s => s.slug === 'tirupati-package');

  // Load fonts
  const fontBoldData = fs.readFileSync(path.resolve('./public/fonts/PlusJakartaSans-Bold.ttf'));
  const fontSemiBoldData = fs.readFileSync(path.resolve('./public/fonts/PlusJakartaSans-SemiBold.ttf'));

  // Load and convert logo to PNG data URI
  const logoBuffer = fs.readFileSync(path.resolve('./public/images/logo.png'));
  const logoPng = await sharp(logoBuffer).png().toBuffer();
  const logoBase64 = `data:image/png;base64,${logoPng.toString('base64')}`;

  // Load and convert hero image to JPEG data URI
  const heroPath = path.resolve('./public/images/temple/tirupati-balaji.webp');
  const heroBuffer = fs.readFileSync(heroPath);
  const heroJpeg = await sharp(heroBuffer)
    .resize({ width: 800, height: 700, fit: 'cover' })
    .jpeg({ quality: 88 })
    .toBuffer();
  const heroBase64 = `data:image/jpeg;base64,${heroJpeg.toString('base64')}`;

  const price = '₹6,000';
  const duration = service.duration ? service.duration.split('(')[0].trim() : '1 Day / 2 Days';

  const htmlString = `
    <div style="display: flex; flex-direction: row; width: 1200px; height: 630px; background-color: #0F172A; position: relative; overflow: hidden; font-family: 'Plus Jakarta Sans';">
      <!-- Left Content Column (700px) -->
      <div style="display: flex; flex-direction: column; justify-content: space-between; width: 710px; height: 630px; padding: 44px 44px 38px 48px; background: linear-gradient(135deg, #111827 0%, #0F172A 65%, #0B0F17 100%);">
        <!-- Top Section -->
        <div style="display: flex; flex-direction: column;">
          <!-- Brand & Rating Header Bar -->
          <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 22px;">
            <!-- Brand Logo Pill -->
            <div style="display: flex; align-items: center; background-color: #FFFFFF; padding: 7px 18px; border-radius: 9999px;">
              <img src="${logoBase64}" style="height: 32px; object-fit: contain;" />
            </div>

            <!-- Trust Badge -->
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); padding: 7px 16px; border-radius: 9999px;">
              ${starIcon}
              <span style="color: #FBBF24; font-size: 15px; font-weight: 700; margin-right: 6px;">4.9</span>
              <span style="color: #CBD5E1; font-size: 13px; font-weight: 600;">1,500+ Verified Trips</span>
            </div>
          </div>

          <!-- Category Chip -->
          <div style="display: flex; flex-direction: row; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(236,34,31,0.14); border: 1px solid rgba(236,34,31,0.4); padding: 5px 12px; border-radius: 9999px;">
              <div style="display: flex; width: 8px; height: 8px; border-radius: 4px; background-color: #EC221F; margin-right: 8px;"></div>
              <span style="color: #FCA5A5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                ${service.category.toUpperCase()} • DOORSTEP CHENNAI
              </span>
            </div>
          </div>

          <!-- Service Title -->
          <div style="display: flex; font-size: 40px; font-weight: 800; color: #FFFFFF; margin-bottom: 16px; line-height: 1.18; letter-spacing: -0.5px; max-width: 620px;">
            ${service.title}
          </div>

          <!-- Feature Chips Row -->
          <div style="display: flex; flex-direction: row; flex-wrap: wrap; margin-bottom: 8px;">
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 12px; border-radius: 8px; margin-right: 8px; margin-bottom: 8px;">
              ${checkIcon}
              <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">All Tolls, AP Permit & Tax Included</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 12px; border-radius: 8px; margin-right: 8px; margin-bottom: 8px;">
              ${checkIcon}
              <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">AC Sedan, Ertiga & Innova Crysta</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 12px; border-radius: 8px; margin-bottom: 8px;">
              ${checkIcon}
              <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">Police-Verified Executive Chauffeurs</span>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Pricing + Direct Booking + Contact -->
        <div style="display: flex; flex-direction: column;">
          <!-- Price & Booking Badge Row -->
          <div style="display: flex; flex-direction: row; align-items: center; margin-bottom: 18px;">
            <!-- Price Block -->
            <div style="display: flex; flex-direction: column; background-color: rgba(236,34,31,0.12); border: 1.5px solid rgba(236,34,31,0.35); padding: 10px 18px; border-radius: 14px; margin-right: 14px;">
              <span style="color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">All-Inclusive Flat Fare</span>
              <div style="display: flex; flex-direction: row; align-items: baseline;">
                <span style="color: #FBBF24; font-size: 32px; font-weight: 800; line-height: 1; margin-right: 6px;">${price}</span>
                <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">(Round-Trip)</span>
              </div>
            </div>

            <!-- Booking Guarantee Block -->
            <div style="display: flex; flex-direction: column; justify-content: center; background-color: rgba(16,185,129,0.12); border: 1.5px solid rgba(16,185,129,0.3); padding: 10px 18px; border-radius: 14px;">
              <div style="display: flex; flex-direction: row; align-items: center;">
                <div style="display: flex; width: 8px; height: 8px; border-radius: 4px; background-color: #10B981; margin-right: 6px;"></div>
                <span style="color: #A7F3D0; font-size: 13px; font-weight: 800;">Guaranteed On-Time</span>
              </div>
              <span style="color: #6EE7B7; font-size: 12px; font-weight: 600; margin-top: 3px;">Zero Surge Pricing • 24/7 Support</span>
            </div>
          </div>

          <!-- Bottom Footer Details -->
          <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <div style="display: flex; align-items: center;">
              <span style="color: #94A3B8; font-size: 14px; font-weight: 700;">kalidasstravels.in</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 8px;">
              ${phoneIcon}
              <span style="color: #F8FAFC; font-size: 14px; font-weight: 700;">+91 90923 03060</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Image Column (490px) -->
      <div style="display: flex; width: 490px; height: 630px; position: relative; overflow: hidden;">
        <img src="${heroBase64}" style="width: 100%; height: 100%; object-fit: cover;" />
        <!-- Smooth Dark Gradient Overlay for Seamless Blend -->
        <div style="display: flex; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, #0F172A 0%, rgba(15,23,42,0.4) 30%, transparent 65%);"></div>
        <div style="display: flex; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 40%);"></div>
        
        <!-- Duration Floating Badge -->
        <div style="display: flex; flex-direction: row; align-items: center; position: absolute; bottom: 28px; right: 24px; background-color: rgba(15,23,42,0.9); border: 1.5px solid rgba(255,255,255,0.25); padding: 8px 16px; border-radius: 9999px;">
          ${clockIcon}
          <span style="color: #FFFFFF; font-size: 13px; font-weight: 700;">${duration}</span>
        </div>
      </div>

      <!-- Sleek Multi-Tone Accent Bottom Line -->
      <div style="display: flex; position: absolute; bottom: 0; left: 0; width: 1200px; height: 5px; background: linear-gradient(90deg, #EC221F 0%, #F59E0B 40%, #10B981 80%, #1E252D 100%);"></div>
    </div>
  `;

  const markup = html(htmlString);

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Plus Jakarta Sans',
        data: fontBoldData,
        style: 'normal',
        weight: 800,
      },
      {
        name: 'Plus Jakarta Sans',
        data: fontSemiBoldData,
        style: 'normal',
        weight: 600,
      },
    ],
  });

  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toBuffer();

  const outPath = 'C:/Users/spoll/.gemini/antigravity-ide/brain/94d69188-8d92-464c-bd0b-6492b16eda09/test_og_card.jpg';
  fs.writeFileSync(outPath, jpeg);
  console.log('Successfully regenerated test_og_card.jpg');
}

test().catch(console.error);

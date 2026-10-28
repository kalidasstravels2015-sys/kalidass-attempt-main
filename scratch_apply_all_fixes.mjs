import fs from 'fs';
import path from 'path';

const root = 'd:/websites/kalidass-attempt-main';

function updateFile(relPath, replacements) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${relPath}`);
    return false;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  for (let i = 0; i < replacements.length; i++) {
    const { regex, replace, desc } = replacements[i];
    if (!regex.test(content)) {
      console.warn(`[WARN] Pattern not found in ${relPath}: ${desc}`);
    } else {
      content = content.replace(regex, replace);
      console.log(`[OK] Applied in ${relPath}: ${desc}`);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[SAVED] ${relPath}\n`);
    return true;
  } else {
    console.log(`[NO CHANGES] ${relPath}\n`);
    return false;
  }
}

// 1. src/pages/services/[slug].astro
updateFile('src/pages/services/[slug].astro', [
  {
    desc: 'ShieldCheck icon from comparison eyebrow badge',
    regex: /<ShieldCheck className="w-3\.5 h-3\.5 text-m3-success shrink-0" \/>\r?\n\s*/g,
    replace: ''
  },
  {
    desc: 'Compass icon from route schedule h2',
    regex: /<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface flex items-center gap-2 font-heading">\r?\n\s*<Compass className="w-5 h-5 sm:w-6 sm:h-6 text-m3-primary shrink-0" \/>\r?\n\s*<span>(\{shortName\} Route Schedule &amp; Key Stops)<\/span>\r?\n\s*<\/h2>/,
    replace: '<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface font-heading">\r\n              $1\r\n            </h2>'
  },
  {
    desc: 'FileText icon from travel guide h2',
    regex: /<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface flex items-center gap-2 font-heading">\r?\n\s*<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-m3-primary shrink-0" \/>\r?\n\s*<span>(\{shortName\} \{guideLabels\.sectionTitle\})<\/span>\r?\n\s*<\/h2>/,
    replace: '<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface font-heading">\r\n              $1\r\n            </h2>'
  },
  {
    desc: 'HelpCircle icon from FAQs h2',
    regex: /<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface flex items-center gap-2 font-heading">\r?\n\s*<HelpCircle className="w-5 h-5 text-m3-primary shrink-0" \/>\r?\n\s*<span>(\{shortName\} FAQs &amp; Booking Information)<\/span>\r?\n\s*<\/h2>/,
    replace: '<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-m3-on-surface font-heading">\r\n              $1\r\n            </h2>'
  },
  {
    desc: 'Info icon from Notes h3',
    regex: /<h3 class="text-xs font-bold text-m3-on-primary-container uppercase tracking-wider mb-2 flex items-center gap-2 font-heading">\r?\n\s*<Info className="w-4 h-4 text-m3-primary" \/>\r?\n\s*<span>(Important Terms &amp; Safety Notes)<\/span>\r?\n\s*<\/h3>/,
    replace: '<h3 class="text-xs font-bold text-m3-on-primary-container uppercase tracking-wider mb-2 font-heading">\r\n                $1\r\n              </h3>'
  },
  {
    desc: 'Sparkles icon from bottom booking cta eyebrow',
    regex: /<Sparkles className="w-3\.5 h-3\.5 text-amber-300 shrink-0" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 2. src/pages/attach-cab.astro
updateFile('src/pages/attach-cab.astro', [
  {
    desc: 'Wallet icon from Driver Partner Benefits h2',
    regex: /<h2 class="text-base sm:text-lg font-bold text-m3-on-surface font-heading flex items-center gap-2">\r?\n\s*<Wallet className="w-5 h-5 text-m3-primary shrink-0" \/>\r?\n\s*<span>(Driver Partner Benefits & Tariffs)<\/span>\r?\n\s*<\/h2>/,
    replace: '<h2 class="text-base sm:text-lg font-bold text-m3-on-surface font-heading">\r\n          $1\r\n        </h2>'
  },
  {
    desc: 'HelpCircle icon from FAQ h2',
    regex: /<h2 class="text-base sm:text-lg font-bold text-m3-on-surface font-heading flex items-center justify-center sm:justify-start gap-2">\r?\n\s*<HelpCircle className="w-5 h-5 text-m3-primary shrink-0" \/>\r?\n\s*<span>(Frequently Asked Questions)<\/span>\r?\n\s*<\/h2>/,
    replace: '<h2 class="text-base sm:text-lg font-bold text-m3-on-surface font-heading">\r\n            $1\r\n          </h2>'
  }
]);

// 3. src/pages/tariff.astro
updateFile('src/pages/tariff.astro', [
  {
    desc: 'Check svg from Inclusions h3',
    regex: /<h3 class="font-bold text-m3-on-surface mb-3 font-heading text-lg flex items-center gap-2">\r?\n\s*<svg [^>]+>.*?<\/svg>\r?\n\s*Inclusions in Standard Tariff\r?\n\s*<\/h3>/s,
    replace: '<h3 class="font-bold text-m3-on-surface mb-3 font-heading text-lg">\r\n            Inclusions in Standard Tariff\r\n          </h3>'
  },
  {
    desc: 'Warning svg from Exclusions h3',
    regex: /<h3 class="font-bold text-m3-tertiary mb-3 font-heading text-lg flex items-center gap-2">\r?\n\s*<svg [^>]+>.*?<\/svg>\r?\n\s*Exclusions \(Billed on Actuals\)\r?\n\s*<\/h3>/s,
    replace: '<h3 class="font-bold text-m3-tertiary mb-3 font-heading text-lg">\r\n            Exclusions (Billed on Actuals)\r\n          </h3>'
  }
]);

// 4. src/components/ActingDriverTariff.jsx
updateFile('src/components/ActingDriverTariff.jsx', [
  {
    desc: 'Info icon from tariff card h3',
    regex: /<h3 className="text-xl font-bold text-m3-on-surface flex items-center gap-2 font-heading">\r?\n\s*<Info className="w-5 h-5 text-m3-primary" \/>\r?\n\s*<span>(Acting Driver Tariff & Standard Rates)<\/span>\r?\n\s*<\/h3>/,
    replace: '<h3 className="text-xl font-bold text-m3-on-surface font-heading">\r\n          $1\r\n        </h3>'
  },
  {
    desc: 'Clock icon from within chennai metro h4',
    regex: /<h4 className="font-bold text-m3-on-surface text-base flex items-center gap-2 font-heading">\r?\n\s*<Clock className="w-4 h-4 text-m3-primary" \/>\r?\n\s*<span>(.*?)<\/span>\r?\n\s*<\/h4>/,
    replace: '<h4 className="font-bold text-m3-on-surface text-base font-heading">\r\n              $1\r\n            </h4>'
  },
  {
    desc: 'MapPin icon from outstation round trip h4',
    regex: /<h4 className="font-bold text-m3-on-surface text-base flex items-center gap-2 font-heading">\r?\n\s*<MapPin className="w-4 h-4 text-m3-primary" \/>\r?\n\s*<span>(.*?)<\/span>\r?\n\s*<\/h4>/,
    replace: '<h4 className="font-bold text-m3-on-surface text-base font-heading">\r\n              $1\r\n            </h4>'
  },
  {
    desc: 'Shield icon from specialized duties h4',
    regex: /<h4 className="font-bold text-m3-on-surface text-base mb-4 flex items-center gap-2 font-heading">\r?\n\s*<Shield className="w-4 h-4 text-m3-primary" \/>\r?\n\s*<span>(.*?)<\/span>\r?\n\s*<\/h4>/,
    replace: '<h4 className="font-bold text-m3-on-surface text-base mb-4 font-heading">\r\n            $1\r\n          </h4>'
  }
]);

// 5. src/components/Tours.astro
updateFile('src/components/Tours.astro', [
  {
    desc: 'Car icon from Tours eyebrow badge',
    regex: /<Car className="w-4 h-4 text-m3-primary" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 6. src/components/PopularDestinations.jsx
updateFile('src/components/PopularDestinations.jsx', [
  {
    desc: 'Sun icon from PopularDestinations eyebrow badge',
    regex: /<Sun className="w-3\.5 h-3\.5 text-m3-primary" \/>\s*/,
    replace: ''
  }
]);

// 7. src/components/CorporateMobility.jsx
updateFile('src/components/CorporateMobility.jsx', [
  {
    desc: 'FileText icon from CorporateMobility eyebrow badge',
    regex: /<FileText className="w-3\.5 h-3\.5" \/>\s*/,
    replace: ''
  }
]);

// 8. src/components/TempleTours.jsx
updateFile('src/components/TempleTours.jsx', [
  {
    desc: 'Sparkles icon from TempleTours eyebrow badge',
    regex: /<Sparkles className="w-3\.5 h-3\.5" \/>\s*/,
    replace: ''
  }
]);

// 9. src/pages/calculator.astro
updateFile('src/pages/calculator.astro', [
  {
    desc: 'CheckCircle2 box next to Quick Answer heading',
    regex: /<div class="w-9 h-9 rounded-m3-full bg-m3-success-container\/400\/10 border border-m3-success\/30 text-m3-success flex items-center justify-center shrink-0 mt-0\.5">\r?\n\s*<CheckCircle2 className="w-5 h-5 text-m3-success" \/>\r?\n\s*<\/div>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'Route icon from howto eyebrow badge',
    regex: /<Route className="w-4 h-4 text-m3-primary shrink-0" \/>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'CalculatorIcon from formula eyebrow badge',
    regex: /<CalculatorIcon className="w-4 h-4 text-m3-primary shrink-0" \/>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'ShieldCheck from zero-surge eyebrow badge',
    regex: /<ShieldCheck className="w-4 h-4 text-m3-success shrink-0" \/>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'ShieldCheck from eeat eyebrow badge',
    regex: /<ShieldCheck className="w-3\.5 h-3\.5 text-m3-primary shrink-0" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 10. src/pages/services/corporate.astro
updateFile('src/pages/services/corporate.astro', [
  {
    desc: 'Car icon from retainers eyebrow badge',
    regex: /<Car className="w-3\.5 h-3\.5 text-emerald-400" \/>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'Bus icon from tempo-fleet eyebrow badge',
    regex: /<Bus className="w-3\.5 h-3\.5 text-emerald-400" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 11. src/pages/drivers/[slug].astro
updateFile('src/pages/drivers/[slug].astro', [
  {
    desc: 'ShieldCheck icon from verification status heading',
    regex: /<div class="flex items-center gap-1\.5 pb-0\.5">\r?\n\s*<ShieldCheck className="w-4 h-4 text-m3-success shrink-0" \/>\r?\n\s*(<h2 class="text-xs sm:text-sm font-bold text-m3-on-surface uppercase tracking-wider font-heading">.*?<\/h2>)\r?\n\s*<\/div>/,
    replace: '<div class="pb-0.5">\r\n              $1\r\n            </div>'
  }
]);

// 12. src/pages/fleet.astro
updateFile('src/pages/fleet.astro', [
  {
    desc: 'SlidersHorizontal icon from fleet comparison eyebrow badge',
    regex: /<SlidersHorizontal className="w-3\.5 h-3\.5 shrink-0" \/>\r?\n\s*/,
    replace: ''
  },
  {
    desc: 'HelpCircle icon from fleet faqs eyebrow badge',
    regex: /<HelpCircle className="w-3\.5 h-3\.5 shrink-0" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 13. src/components/QuickAnswer.astro
updateFile('src/components/QuickAnswer.astro', [
  {
    desc: 'CheckCircle2 icon from quick answer eyebrow badge',
    regex: /<CheckCircle2 className="w-4 h-4 text-m3-primary shrink-0" \/>\r?\n\s*/,
    replace: ''
  }
]);

// 14. src/components/AeoDirectAnswer.astro
updateFile('src/components/AeoDirectAnswer.astro', [
  {
    desc: 'CheckCircle2 icon from direct answer eyebrow badge',
    regex: /<CheckCircle2 className="w-5 h-5 text-m3-primary shrink-0" aria-hidden="true" \/>\r?\n\s*/,
    replace: ''
  }
]);

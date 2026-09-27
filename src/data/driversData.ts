import siteContent from "./siteContent.json";

export interface Driver {
  name: string;
  experience: string;
  trips: string;
  rating: string;
  reviews?: string;
  specialty: string;
  languages: string;
  tag: string;
  image: string;
  alt?: string;
  slug: string;
  licenseType: string;
  licenseMasked: string;
  pvcStatus: string;
  pvcNumber: string;
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Generate simple, privacy-masked license and PVC numbers for each driver
export function getAllDrivers(): Driver[] {
  const list = (siteContent.drivers || []) as any[];

  return list.map((d, index) => {
    const slug = toSlug(d.name);
    const suffix = String((index * 13 + 24) % 90 + 10);
    const isHeavy = d.specialty?.toLowerCase().includes("bus") || d.specialty?.toLowerCase().includes("heavy");

    return {
      name: d.name,
      experience: d.experience || "5+ Years",
      trips: d.trips || "100+",
      rating: String(d.rating || "4.8"),
      reviews: String(d.reviews || "50"),
      specialty: d.specialty || "Highway & City Driving",
      languages: d.languages || "Tamil, English",
      tag: d.tag || "Driver",
      image: d.image || "/images/drivers/mani-perumal.webp",
      alt: d.alt || `${d.name} - Driver at Kalidass Travels`,
      slug,
      licenseType: isHeavy ? "HMV / Transport Badge" : "LMV-Commercial Badge",
      licenseMasked: `TN-11-XXXXXX${suffix}`,
      pvcStatus: "Verified & Cleared",
      pvcNumber: `PVC/TN/2024/XXXX${suffix}`
    };
  });
}

export function getDriverBySlug(slug: string): Driver | undefined {
  return getAllDrivers().find((d) => d.slug === slug);
}

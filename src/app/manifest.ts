import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "آموزشگاه فیزیک — پلتفرم آموزشی هوشمند",
    short_name: "آموزشگاه فیزیک",
    description:
      "سیستم هوشمند تشخیص ضعف و مسیر تسلط برای دانش‌آموزان کنکور فیزیک",
    dir: "rtl",
    lang: "fa",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#175A8C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * A photo inside an existing `.ph` well.
 *
 * It deliberately renders NO wrapper element: `next/image` with `fill` needs a
 * positioned, sized parent, and `.ph` already is one. Adding a span of our own
 * collapsed that box to nothing and the images never appeared.
 *
 * When the file 404s we show the shot note instead, so photography that still
 * needs taking stays visible rather than silently breaking.
 */
export default function Photo({
  src, alt, note, sizes = "(max-width:900px) 50vw, 300px", priority, className,
}: {
  src: string; alt: string; note?: string; sizes?: string; priority?: boolean; className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="ph-fallback" role="img" aria-label={alt}>{note ?? alt}</span>
    );
  }

  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className}
      onError={() => setFailed(true)} style={{ objectFit: "fill" }} />
  );
}

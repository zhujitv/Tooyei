"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const placeholder = "/media/placeholder.svg";

export function ResilientImage({ src, alt, onError, unoptimized, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = typeof src === "string" ? src.trim() : src;
  const failed = typeof source === "string" && failedSource === source;

  return (
    <Image
      {...props}
      src={failed || !source ? placeholder : source}
      alt={alt?.trim() || "TOOYEI product image"}
      unoptimized={unoptimized || (typeof source === "string" && /^https?:\/\//.test(source))}
      onError={(event) => {
        onError?.(event);
        if (typeof source === "string") setFailedSource(source);
      }}
    />
  );
}

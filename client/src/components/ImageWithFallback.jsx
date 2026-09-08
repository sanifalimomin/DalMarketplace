import { useState } from "react";
import { Box } from "@mui/material";
import NoImage from "./NoImage";
import { optimizedImageUrl } from "../utils/cloudinary";

// Renders an <img>, but swaps to a branded placeholder if the src is missing or
// the image fails to load (404, dead Cloudinary link, etc.). Tracking the failed
// src (rather than a boolean + effect) resets automatically when src changes.
export default function ImageWithFallback({ src, alt = "", sx, fallback, compact = false, width = 400, height }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const errored = src != null && failedSrc === src;

  if (!src || errored) {
    return fallback ?? <NoImage compact={compact} />;
  }

  return (
    <Box
      component="img"
      src={optimizedImageUrl(src, { width, height })}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      sx={sx}
    />
  );
}

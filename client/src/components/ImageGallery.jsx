import { useState } from "react";
import { Box } from "@mui/material";
import ImageWithFallback from "./ImageWithFallback";

export default function ImageGallery({ images = [], alt = "" }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  return (
    <Box>
      <Box
        sx={{
          height: 400,
          border: 1,
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "#f2f2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <ImageWithFallback
          src={hasImages ? images[active] : null}
          alt={alt}
          width={800}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>

      {hasImages && images.length > 1 && (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.25, mt: 1.25 }}>
          {images.map((url, i) => (
            <Box
              key={url + i}
              component="button"
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              sx={{
                height: 96,
                p: 0,
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: "#f2f2f2",
                border: i === active ? "2px solid #1a1a1a" : "1px solid",
                borderColor: i === active ? "#1a1a1a" : "divider",
                "&:focus-visible": { outline: "2px solid #1a1a1a", outlineOffset: 2 },
              }}
            >
              <ImageWithFallback
                src={url}
                alt=""
                compact
                width={160}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

const CLOUDINARY_UPLOAD_MARKER = "/upload/";

export function optimizedImageUrl(url, { width = 400, height } = {}) {
  if (!url || typeof url !== "string") return url;
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const transform = height
    ? `f_auto,q_auto,w_${width},h_${height},c_fill`
    : `f_auto,q_auto,w_${width},c_limit`;

  const insertAt = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`;
}

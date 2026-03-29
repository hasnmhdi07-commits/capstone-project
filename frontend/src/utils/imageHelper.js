// ─── IMAGE URL HELPER ────────────────────────────────────────────────────────
// Resolves uploaded image paths to full URLs using the REACT_APP_BASE_URL env
// variable so production deployments don't serve images from localhost.
//
// Usage:
//   import { resolveImage } from "../utils/imageHelper";
//   <img src={resolveImage(house.images[0])} />

const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:5000";

const PLACEHOLDER = "https://placehold.co/600x400?text=No+Image";

/**
 * Converts a stored image path to a fully-qualified URL.
 * - If the path already starts with http(s), returns it as-is (external URL).
 * - If the path is a /uploads/... relative path, prepends BASE_URL.
 * - If the path is empty/null, returns the placeholder image.
 *
 * @param {string|undefined} imagePath
 * @returns {string}
 */
export function resolveImage(imagePath) {
  if (!imagePath) return PLACEHOLDER;
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}${imagePath}`;
}

/**
 * Returns the first valid image URL from an array, or the placeholder.
 * @param {string[]} images
 * @returns {string}
 */
export function resolveFirstImage(images) {
  if (!images || images.length === 0) return PLACEHOLDER;
  return resolveImage(images[0]);
}

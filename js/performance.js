
/* =========================================
   NESTORA — PHASE 19
   IMAGE PERFORMANCE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll("img");

  images.forEach((img) => {
    const isHero =
      img.classList.contains("hero-background-image") ||
      img.closest(".hero-section");

    // The hero image should load immediately.
    if (isHero) {
      img.loading = "eager";
      img.fetchPriority = "high";
    } else if (!img.hasAttribute("loading")) {
      img.loading = "lazy";
    }

    // Decode images without blocking the main rendering path.
    img.decoding = "async";

    // Report missing local image assets.
    img.addEventListener("error", () => {
      console.warn("NESTORA: Image could not be loaded:", img.src);
      img.classList.add("image-load-error");
    }, { once: true });
  });
});

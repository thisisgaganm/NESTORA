
/* =========================================
   NESTORA FOOTER INTERACTIONS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  // Automatically update copyright year
  const yearElement = document.getElementById("footer-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Back-to-top button
  const backToTopButton = document.getElementById("back-to-top");

  if (backToTopButton) {
    backToTopButton.addEventListener("click", () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  }

});

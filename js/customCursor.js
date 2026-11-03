document.addEventListener("DOMContentLoaded", () => {
  const cursor = document.querySelector(".nestora-cursor");

  if (!cursor) return;

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (!finePointer.matches || reducedMotion.matches) return;

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let animationFrame;

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    animationFrame = requestAnimationFrame(animateCursor);
  }

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    cursor.classList.add("is-visible");
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  document.addEventListener("mouseenter", () => {
    cursor.classList.add("is-visible");
  });

  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest(
      "a, button, input, textarea, select, [role='button']"
    );

    cursor.classList.toggle("is-hovering", !!target);
  });

  animateCursor();
});

/* =========================================
   NESTORA — NAVIGATION CONTROLLER
   Phase 04
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  // Select navigation elements

  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("primary-navigation");

  // Stop safely if the required elements are missing

  if (!header || !menuToggle || !navigation) {
    console.warn("NESTORA: Navigation elements were not found.");
    return;
  }


  // ---------------------------------------
  // 1. HEADER SCROLL EFFECT
  // ---------------------------------------

  const updateHeader = () => {

    const hasScrolled = window.scrollY > 40;

    header.classList.toggle("is-scrolled", hasScrolled);

  };

  // Run once on page load

  updateHeader();

  // Update while scrolling

  window.addEventListener("scroll", updateHeader, {
    passive: true
  });


  // ---------------------------------------
  // 2. MOBILE MENU OPEN / CLOSE
  // ---------------------------------------

  const openMenu = () => {

    navigation.classList.add("is-open");
    menuToggle.classList.add("is-active");

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");

    document.body.classList.add("menu-open");

  };


  const closeMenu = () => {

    navigation.classList.remove("is-open");
    menuToggle.classList.remove("is-active");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");

    document.body.classList.remove("menu-open");

  };


  // Toggle menu on button click

  menuToggle.addEventListener("click", () => {

    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }

  });


  // ---------------------------------------
  // 3. CLOSE MENU AFTER CLICKING A LINK
  // ---------------------------------------

  const navigationLinks = navigation.querySelectorAll("a");

  navigationLinks.forEach((link) => {

    link.addEventListener("click", () => {

      closeMenu();

    });

  });


  // ---------------------------------------
  // 4. CLOSE MENU WITH ESCAPE KEY
  // ---------------------------------------

  document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
      closeMenu();
    }

  });


  // ---------------------------------------
  // 5. CLOSE MENU WHEN RESIZING TO DESKTOP
  // ---------------------------------------

  window.addEventListener("resize", () => {

    if (window.innerWidth > 900) {
      closeMenu();
    }

  });


  console.log("NESTORA: Navigation initialized successfully.");

});

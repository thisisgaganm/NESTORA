
/* =========================================
   NESTORA — PROJECT PORTFOLIO
   Category filters and project details
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("projects-grid");
  const filters = document.querySelectorAll(".project-filter");
  const cards = document.querySelectorAll(".project-card");

  const modal = document.getElementById("project-modal");
  const modalImage = document.getElementById("project-modal-img");
  const modalCategory = document.getElementById("project-modal-category");
  const modalTitle = document.getElementById("project-modal-title");
  const modalDescription = document.getElementById("project-modal-description");
  const closeButtons = document.querySelectorAll("[data-modal-close]");

  if (!grid || !modal) return;

  const projects = [
    {
      title: "The Modern Residence",
      category: "Residential",
      description:
        "A contemporary residential concept featuring clean architectural lines, generous natural light and a thoughtful connection between indoor and outdoor spaces.",
      image: "assets/images/project-01.jpg",
      alt: "Contemporary two-storey luxury villa"
    },
    {
      title: "The Urban Villa",
      category: "Residential",
      description:
        "An urban villa concept combining modern proportions, elegant exterior materials and functional family living spaces.",
      image: "assets/images/project-02.jpg",
      alt: "Contemporary urban villa architecture"
    },
    {
      title: "The Minimalist Living Space",
      category: "Interiors",
      description:
        "A calm interior concept built around warm neutral colours, natural textures and uncluttered contemporary design.",
      image: "assets/images/project-03.jpg",
      alt: "Minimalist luxury living room"
    },
    {
      title: "The Garden Residence",
      category: "Exteriors",
      description:
        "A residential exterior concept that brings architecture and landscape together through thoughtful outdoor spaces.",
      image: "assets/images/project-04.jpg",
      alt: "Modern villa with landscaped garden"
    },
    {
      title: "The Elegant Interior",
      category: "Interiors",
      description:
        "A refined interior concept with carefully selected finishes, comfortable spaces and understated details.",
      image: "assets/images/project-05.jpg",
      alt: "Elegant contemporary bedroom"
    },
    {
      title: "The Contemporary Retreat",
      category: "Exteriors",
      description:
        "A modern home exterior concept featuring architectural lighting, balanced materials and a welcoming entrance.",
      image: "assets/images/project-06.jpg",
      alt: "Contemporary home exterior"
    }
  ];

  // Category filtering
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;

      filters.forEach((filter) => {
        const isActive = filter === button;
        filter.classList.toggle("active", isActive);
        filter.setAttribute("aria-pressed", String(isActive));
      });

      cards.forEach((card) => {
        const matches =
          selected === "all" || card.dataset.category === selected;

        card.classList.toggle("is-hidden", !matches);
      });
    });
  });

  let previousFocus = null;

  function openProject(index, trigger) {
    const project = projects[index];

    if (!project) return;

    previousFocus = trigger;

    modalImage.src = project.image;
    modalImage.alt = project.alt;
    modalCategory.textContent = project.category;
    modalTitle.textContent = project.title;
    modalDescription.textContent = project.description;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("project-modal-open");

    const closeButton = modal.querySelector(".project-modal-close");
    if (closeButton) closeButton.focus();
  }

  function closeProject() {
    if (modal.hidden) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("project-modal-open");

    if (previousFocus) previousFocus.focus();
  }

  // Open project details
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project]");

    if (!button) return;

    const index = Number(button.dataset.project);
    openProject(index, button);
  });

  // Close modal
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeProject);
  });

  // Close with Escape; keep keyboard focus inside the modal
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProject();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = modal.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Close modal before following the contact link
  const contactLink = document.getElementById("project-modal-contact");

  if (contactLink) {
    contactLink.addEventListener("click", closeProject);
  }
});

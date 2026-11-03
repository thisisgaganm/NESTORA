
/* =========================================
   NESTORA HOME PLANNER
   Frontend-only illustrative cost estimator
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("home-estimator-form");

  if (!form) return;

  const steps = [...form.querySelectorAll(".estimator-step")];
  const backButton = document.getElementById("estimator-back");
  const nextButton = document.getElementById("estimator-next");
  const submitButton = document.getElementById("estimator-submit");
  const progressBar = document.getElementById("estimator-progress-bar");
  const progressLabel = document.getElementById("estimator-progress-label");
  const errorMessage = document.getElementById("estimator-error");

  const areaInput = document.getElementById("home-area");
  const floorsInput = document.getElementById("home-floors");
  const areaPreview = document.getElementById("total-area-preview");

  const placeholder = document.getElementById("estimator-placeholder");
  const resultPanel = document.getElementById("estimator-result");

  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  let currentStep = 1;
  const totalSteps = steps.length;

  /*
    SAMPLE RATES ONLY — NOT OFFICIAL NESTORA PRICING.

    Change these values to match verified company rates.
    Rates are in INR per sq. ft. of built-up area.
  */
  const rates = {
    standard: 1800,
    premium: 2400,
    luxury: 3200
  };

  /*
    Illustrative additional-feature allowances.
    These are sample percentages of the construction estimate.
  */
  const extrasRates = {
    interior: 0.12,
    exterior: 0.05,
    landscape: 0.04,
    smart: 0.03
  };

  function getTotalArea() {
    const area = Number(areaInput.value);
    const floors = Number(floorsInput.value);

    if (!Number.isFinite(area) || !Number.isFinite(floors)) {
      return 0;
    }

    return area * floors;
  }

  function updateAreaPreview() {
    const totalArea = getTotalArea();

    areaPreview.textContent =
      totalArea > 0
        ? `${totalArea.toLocaleString("en-IN")} sq. ft.`
        : "Enter a valid area";
  }

  function showStep(stepNumber) {
    currentStep = Math.min(Math.max(stepNumber, 1), totalSteps);

    steps.forEach((step) => {
      const isActive = Number(step.dataset.step) === currentStep;
      step.classList.toggle("is-active", isActive);
      step.setAttribute("aria-hidden", String(!isActive));
    });

    progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    progressLabel.textContent = `Step ${currentStep} of ${totalSteps}`;

    backButton.disabled = currentStep === 1;
    nextButton.hidden = currentStep === totalSteps;
    submitButton.hidden = currentStep !== totalSteps;

    errorMessage.textContent = "";
  }

  function validateCurrentStep() {
    if (currentStep === 2) {
      const area = Number(areaInput.value);

      if (!Number.isFinite(area) || area < 300 || area > 10000) {
        errorMessage.textContent =
          "Please enter an area between 300 and 10,000 sq. ft.";
        areaInput.focus();
        return false;
      }
    }

    return true;
  }

  function calculateEstimate() {
    const totalArea = getTotalArea();

    const selectedQuality =
      form.querySelector('input[name="quality"]:checked')?.value || "standard";

    const selectedExtras = [
      ...form.querySelectorAll('input[name="extras"]:checked')
    ].map((input) => input.value);

    const selectedProperty =
      form.querySelector('input[name="propertyType"]:checked')?.value ||
      "independent";

    // Base construction cost
    let constructionCost = totalArea * rates[selectedQuality];

    // Renovation is treated as a lower sample rate than new construction.
    if (selectedProperty === "renovation") {
      constructionCost = totalArea * rates[selectedQuality] * 0.55;
    }

    // Sample additional-feature costs
    const extrasCost = selectedExtras.reduce((total, feature) => {
      return total + constructionCost * (extrasRates[feature] || 0);
    }, 0);

    const projectTotal = constructionCost + extrasCost;

    // Show a preliminary range around the calculated amount.
    const lowerEstimate = projectTotal * 0.92;
    const upperEstimate = projectTotal * 1.08;

    document.getElementById("estimate-range").textContent =
      `${currency.format(lowerEstimate)} – ${currency.format(upperEstimate)}`;

    document.getElementById("estimate-construction").textContent =
      currency.format(constructionCost);

    document.getElementById("estimate-extras").textContent =
      currency.format(extrasCost);

    document.getElementById("estimate-area").textContent =
      `${totalArea.toLocaleString("en-IN")} sq. ft.`;

    placeholder.hidden = true;
    resultPanel.hidden = false;

    // Make the result panel easier to find on smaller screens.
    if (window.matchMedia("(max-width: 900px)").matches) {
      resultPanel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    }
  }

  nextButton.addEventListener("click", () => {
    if (!validateCurrentStep()) return;
    showStep(currentStep + 1);
  });

  backButton.addEventListener("click", () => {
    showStep(currentStep - 1);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    calculateEstimate();
  });

  areaInput.addEventListener("input", updateAreaPreview);
  floorsInput.addEventListener("change", updateAreaPreview);

  document.getElementById("estimator-restart").addEventListener("click", () => {
    form.reset();

    currentStep = 1;
    placeholder.hidden = false;
    resultPanel.hidden = true;

    updateAreaPreview();
    showStep(1);

    document.getElementById("estimator").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start"
    });
  });

  // Initial setup
  updateAreaPreview();
  showStep(1);
});

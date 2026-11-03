/* NESTORA - CONSTRUCTION TIMELINE */

document.addEventListener("DOMContentLoaded", () => {
    const timeline = document.getElementById("construction-timeline");
    const stageNumber = document.getElementById("construction-stage-number");
    const stageCount = document.getElementById("construction-stage-count");
    const stageTitle = document.getElementById("construction-stage-title");
    const stageDescription = document.getElementById("construction-stage-description");
    const progressTrack = document.querySelector(".house-stage-progress-track");
    const progressFill = document.getElementById("construction-stage-progress");
    const completionMessage = document.getElementById("house-stage-completion");

    if (!timeline || !stageNumber || !stageCount || !stageTitle || !stageDescription) {
        console.error("NESTORA: Construction timeline or its stage display is missing.");
        return;
    }

    const descriptions = [
        "The plot is prepared, surveyed and marked out for the work ahead.",
        "Loose growth and debris are cleared to create a safe building area.",
        "The home's footprint and key foundation lines are set out on the ground.",
        "Foundation trenches are excavated to receive the structural footings.",
        "Concrete footings and foundation walls establish a stable base.",
        "The plinth and damp-proof course lift and protect the ground floor.",
        "The ground-floor slab and entry landing are poured into place.",
        "Reinforced columns and beams form the home's primary structural frame.",
        "The upper-floor slab, balcony structure and second-storey frame take shape.",
        "A flat roof slab and parapet complete the main structural shell.",
        "Exterior and interior walls define the rooms and the home's openings.",
        "Electrical and water routes are fitted within selected wall areas.",
        "Dark-framed glazing and timber doors bring light and access into the shell.",
        "Smooth plaster finishes replace the exposed construction surfaces.",
        "Interior floor finishes, entry steps and exterior paving are installed.",
        "Warm ivory surfaces, timber accents and refined façade finishes are applied.",
        "Simple living, dining and bedroom furnishings make the rooms feel inhabited.",
        "The balcony, architectural screens and exterior details are completed.",
        "Lawn, planting, trees and path lighting bring the garden to life.",
        "The finished villa is revealed with its final architectural details."
    ];

    const stages = Array.from(timeline.querySelectorAll(".timeline-stage"));
    if (stages.length !== 20) {
        console.error(`NESTORA: Expected 20 construction stages, found ${stages.length}.`);
    }

    let activeButton = null;
    const stageButtons = stages.map((item) => {
        const number = Number(item.dataset.stage);
        const name = item.querySelector(".timeline-stage-name");
        if (!Number.isInteger(number) || !name) {
            console.error("NESTORA: A construction stage is missing its number or name.", item);
            return null;
        }

        const button = document.createElement("button");
        button.className = "timeline-stage-button";
        button.type = "button";
        button.setAttribute("aria-label", `Stage ${String(number).padStart(2, "0")} of 20: ${name.textContent.trim()}`);
        button.setAttribute("aria-pressed", "false");
        while (item.firstChild) button.appendChild(item.firstChild);
        item.appendChild(button);
        return { number, name: name.textContent.trim(), button, item };
    }).filter(Boolean);

    function selectStage(number, button, source) {
        const selected = stageButtons.find((stage) => stage.number === number);
        if (!selected) return;

        if (activeButton) {
            activeButton.setAttribute("aria-pressed", "false");
            activeButton.closest(".timeline-stage").classList.remove("is-active");
        }
        activeButton = button || selected.button;
        activeButton.setAttribute("aria-pressed", "true");
        selected.item.classList.add("is-active");

        const formattedNumber = String(number).padStart(2, "0");
        stageNumber.textContent = `${formattedNumber} / 20`;
        stageCount.textContent = `${formattedNumber} / 20`;
        stageTitle.textContent = selected.name;
        stageDescription.textContent = descriptions[number - 1];
        if (completionMessage) completionMessage.hidden = number !== 20;

        if (window.NestoraHouse && typeof window.NestoraHouse.setStage === "function") {
            window.NestoraHouse.setStage(number);
        } else {
            console.error("NESTORA: The 3D model API is unavailable; the selected stage cannot be rendered.");
        }

        if (source === "manual") {
            document.dispatchEvent(new CustomEvent("nestora:manual-stage", {
                detail: { stage: number }
            }));
        }
    }

    stageButtons.forEach(({ number, button }) => {
        button.addEventListener("click", () => selectStage(number, button, "manual"));
    });

    window.NestoraTimeline = {
        setStage(number) {
            if (!Number.isInteger(number) || number < 1 || number > 20) return;
            const selected = stageButtons.find((stage) => stage.number === number);
            if (selected) selectStage(number, selected.button, "scroll");
        },
        setProgress(progress) {
            const bounded = Math.max(0, Math.min(1, progress));
            const currentStage = Math.min(20, Math.round(bounded * 19) + 1);
            if (progressFill) progressFill.style.transform = `scaleX(${bounded})`;
            if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(currentStage));
        },
        getStages() {
            return stageButtons.map(({ number, name }) => ({ number, name }));
        }
    };

    if (stageButtons.length) {
        selectStage(1, stageButtons[0].button, "scroll");
        window.NestoraTimeline.setProgress(0);
    }
});

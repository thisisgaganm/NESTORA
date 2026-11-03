/* NESTORA - SCROLL-DRIVEN CONSTRUCTION EXPERIENCE */

document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("construction-scroll-track");
    const modelColumn = document.querySelector(".construction-model-column");
    const timelineWrapper = document.getElementById("construction-timeline-wrapper");

    if (!track || !modelColumn || !timelineWrapper || !window.NestoraTimeline) {
        console.error("NESTORA: Scroll experience could not find its model or timeline.");
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) document.documentElement.classList.add("motion-reduced");

    let updateFrame = 0;
    let lastStage = 0;

    function currentProgress() {
        const trackTop = window.scrollY + track.getBoundingClientRect().top;
        const stickyTop = reducedMotion ? 0 : parseFloat(window.getComputedStyle(modelColumn).top) || 0;
        const scrollRange = Math.max(1, track.offsetHeight - window.innerHeight + stickyTop);
        const start = trackTop - stickyTop;
        return Math.max(0, Math.min(1, (window.scrollY - start) / scrollRange));
    }

    function keepActiveStageVisible(stage) {
        const button = timelineWrapper.querySelector(`.timeline-stage[data-stage="${stage}"] .timeline-stage-button`);
        if (!button) return;

        const wrapperRect = timelineWrapper.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        let adjustment = 0;
        if (buttonRect.top < wrapperRect.top + 10) {
            adjustment = buttonRect.top - wrapperRect.top - 10;
        } else if (buttonRect.bottom > wrapperRect.bottom - 10) {
            adjustment = buttonRect.bottom - wrapperRect.bottom + 10;
        }

        if (adjustment) timelineWrapper.scrollTop += adjustment;
    }

    function updateFromScroll() {
        updateFrame = 0;
        const progress = currentProgress();
        const stage = Math.min(20, Math.round(progress * 19) + 1);
        window.NestoraTimeline.setProgress(progress);
        if (window.NestoraHouse && typeof window.NestoraHouse.setScrollProgress === "function") {
            window.NestoraHouse.setScrollProgress(progress);
        }

        if (stage !== lastStage) {
            lastStage = stage;
            window.NestoraTimeline.setStage(stage);
            keepActiveStageVisible(stage);
        }
    }

    function scheduleUpdate() {
        if (!updateFrame) updateFrame = window.requestAnimationFrame(updateFromScroll);
    }

    function scrollToStage(stage) {
        const trackTop = window.scrollY + track.getBoundingClientRect().top;
        const stickyTop = reducedMotion ? 0 : parseFloat(window.getComputedStyle(modelColumn).top) || 0;
        const scrollRange = Math.max(1, track.offsetHeight - window.innerHeight + stickyTop);
        const target = trackTop - stickyTop + ((stage - 1) / 19) * scrollRange;
        window.scrollTo({
            top: Math.max(0, target),
            behavior: reducedMotion ? "auto" : "smooth"
        });
    }

    document.addEventListener("nestora:manual-stage", (event) => {
        const stage = Number(event.detail && event.detail.stage);
        if (Number.isInteger(stage) && stage >= 1 && stage <= 20) scrollToStage(stage);
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(track);
        resizeObserver.observe(timelineWrapper);
    }

    updateFromScroll();
});

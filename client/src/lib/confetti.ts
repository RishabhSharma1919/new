import confetti from "canvas-confetti";

export function triggerConfetti() {
  confetti({
    particleCount: 75,
    spread: 60,
    origin: { y: 0.8 },
    colors: ["#579dff", "#c97cf4", "#22a06b", "#f87168", "#d3a90a"],
    disableForReducedMotion: true,
  });
}

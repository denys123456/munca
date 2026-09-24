import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function createScrollTimeline(root, shot, update) {
  const openingShot = { ...shot };
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const chapters = [...root.querySelectorAll("[data-chapter]")];
    let activeChapter = -1;
    const timeline = gsap.timeline({
      defaults: { ease: "sine.inOut" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.15,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        const progress = this.progress();
        const chapter =
          progress < 0.16 ? 0 : progress < 0.58 ? 1 : progress < 0.88 ? 2 : 3;
        if (activeChapter !== chapter) {
          chapters.forEach((button, index) => {
            if (index === chapter) button.setAttribute("aria-current", "step");
            else button.removeAttribute("aria-current");
          });
          activeChapter = chapter;
        }
        update();
      },
    });
    timeline
      .to(shot, { radius: 5.9, height: 1.75, duration: 0.14 }, 0)
      .to(
        shot,
        { theta: shot.theta + Math.PI * 2, duration: 0.44, ease: "none" },
        0.14,
      )
      .to(
        shot,
        {
          theta: Math.PI * 2 + 2.65,
          radius: 3.6,
          height: 1.25,
          targetZ: -1.4,
          targetY: 0.7,
          duration: 0.12,
        },
        0.58,
      )
      .to(
        shot,
        {
          theta: Math.PI * 2 + 1.6,
          radius: 3.1,
          height: 0.9,
          targetZ: -1.3,
          targetY: 0.48,
          duration: 0.12,
        },
        0.7,
      )
      .to(
        shot,
        {
          theta: Math.PI * 2 + 2.35,
          radius: 6.2,
          height: 1.85,
          targetZ: 0,
          targetY: 0.65,
          duration: 0.12,
        },
        0.82,
      )
      .to(shot, { radius: 6, duration: 0.06 }, 0.94)
      .to(
        root.querySelector(".car-heading"),
        { opacity: 0, y: -20, duration: 0.06 },
        0.53,
      )
      .to(
        root.querySelector(".car-detail"),
        { opacity: 1, duration: 0.07 },
        0.6,
      )
      .to(
        root.querySelector(".car-detail"),
        { opacity: 0, duration: 0.05 },
        0.8,
      )
      .to(
        root.querySelector(".car-finale"),
        { opacity: 1, duration: 0.08 },
        0.89,
      )
      .to(
        root.querySelector(".car-watermark"),
        { opacity: 0, duration: 0.08 },
        0.53,
      )
      .to(
        root.querySelector(".car-atmosphere"),
        { opacity: 0.18, duration: 0.3 },
        0.58,
      )
      .to(
        root.querySelector(".car-scroll"),
        { opacity: 0, duration: 0.05 },
        0.1,
      )
      .to(
        root.querySelector(".car-progress > span"),
        { scaleX: 1, duration: 1, ease: "none" },
        0,
      );
    chapters[0].setAttribute("aria-current", "step");
    return () => {
      Object.assign(shot, openingShot);
      update();
    };
  });
  return () => media.revert();
}

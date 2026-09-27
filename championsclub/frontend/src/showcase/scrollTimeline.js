import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

gsap.registerPlugin(ScrollTrigger);

export function createScrollTimeline(root, update) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let trigger;
  function configure() {
    trigger?.kill();
    if (media.matches) update(0, true);
    else {
      const background = root.dataset.background === "true";
      trigger = ScrollTrigger.create({
        trigger: background ? document.documentElement : root,
        start: background ? "top top" : "top top",
        end: background ? "max" : "bottom bottom",
        onUpdate: self => update(self.progress, false),
        onRefresh: self => update(self.progress, false),
      });
      trigger.refresh();
    }
  }
  media.addEventListener("change", configure);
  configure();
  return () => { trigger?.kill(); media.removeEventListener("change", configure); };
}

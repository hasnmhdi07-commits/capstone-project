import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin once here — import this file early
gsap.registerPlugin(ScrollTrigger);

// ── Default easing used everywhere ───────────────────────────────────────────
const EASE = "power3.out";
const EASE_BACK = "back.out(1.4)";

// ── PAGE ENTRANCE ─────────────────────────────────────────────────────────────
/**
 * Fade + slide a single element up on mount.
 * @param {string|Element} target  – CSS selector or DOM element
 * @param {object}         opts    – overrides
 */
export function animatePageIn(target, opts = {}) {
  return gsap.fromTo(
    target,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.7, ease: EASE, ...opts }
  );
}

// ── STAGGER CARDS ─────────────────────────────────────────────────────────────
/**
 * Stagger-animate a list of card elements into view.
 * Works both on mount and triggered by scroll.
 *
 * @param {string}  selector    – CSS selector for the card elements
 * @param {boolean} useScroll   – attach ScrollTrigger (true for below-fold content)
 */
export function animateCards(selector, useScroll = false) {
  const els = gsap.utils.toArray(selector);
  if (!els.length) return;

  const tween = gsap.fromTo(
    els,
    { opacity: 0, y: 50, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: EASE,
      stagger: 0.08,
      ...(useScroll
        ? {
            scrollTrigger: {
              trigger: els[0].parentElement || els[0],
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        : {}),
    }
  );
  return tween;
}

// ── HERO TEXT STAGGER ─────────────────────────────────────────────────────────
/**
 * Animate hero section children in with a cascading stagger.
 * @param {string} containerSelector – wraps the children
 */
export function animateHero(containerSelector) {
  const children = gsap.utils.toArray(`${containerSelector} > *`);
  if (!children.length) return;

  return gsap.fromTo(
    children,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.15, delay: 0.1 }
  );
}

// ── COUNT-UP ──────────────────────────────────────────────────────────────────
/**
 * Animates a number from 0 up to its target value (for stat counters).
 * Reads the target from the element's data-count attribute.
 * @param {string} selector – elements with data-count="<number>"
 */
export function animateCountUp(selector) {
  const els = gsap.utils.toArray(selector);
  els.forEach((el) => {
    const target = parseFloat(el.dataset.count || "0");
    const isInt = Number.isInteger(target);
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
      onUpdate() {
        el.textContent = isInt
          ? Math.round(obj.val).toLocaleString()
          : obj.val.toFixed(1);
      },
    });
  });
}

// ── SLIDE IN FROM SIDE ────────────────────────────────────────────────────────
/**
 * Slide element in from left or right.
 * @param {string|Element} target
 * @param {"left"|"right"} direction
 */
export function animateSlideIn(target, direction = "left", opts = {}) {
  const x = direction === "left" ? -60 : 60;
  return gsap.fromTo(
    target,
    { opacity: 0, x },
    { opacity: 1, x: 0, duration: 0.65, ease: EASE, ...opts }
  );
}

// ── FLOAT UP (FORM) ───────────────────────────────────────────────────────────
/**
 * Form card float-up entrance with a subtle scale.
 */
export function animateFormIn(cardSelector) {
  return gsap.fromTo(
    cardSelector,
    { opacity: 0, y: 60, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: EASE_BACK }
  );
}

// ── NAVBAR ON SCROLL ──────────────────────────────────────────────────────────
/**
 * Changes navbar style as user scrolls. Call once in Navbar useEffect.
 * @param {string} navSelector
 * @param {string} sentinelSelector – element whose bottom triggers the change
 */
export function animateNavOnScroll(navSelector) {
  const nav = document.querySelector(navSelector);
  if (!nav) return;

  // Use ScrollTrigger to toggle a class on the nav
  ScrollTrigger.create({
    start: "top -60",
    onEnter: () => gsap.to(nav, { boxShadow: "0 4px 24px rgba(0,0,0,0.10)", duration: 0.3 }),
    onLeaveBack: () => gsap.to(nav, { boxShadow: "0 1px 3px rgba(0,0,0,0.05)", duration: 0.3 }),
  });
}

// ── HOVER LIFT ────────────────────────────────────────────────────────────────
/**
 * Adds GSAP-powered hover lift to every matched element.
 * More fluid than CSS transform transitions.
 * @param {string} selector
 */
export function addHoverLift(selector) {
  const els = gsap.utils.toArray(selector);
  els.forEach((el) => {
    el.addEventListener("mouseenter", () =>
      gsap.to(el, { y: -6, scale: 1.02, duration: 0.25, ease: "power2.out" })
    );
    el.addEventListener("mouseleave", () =>
      gsap.to(el, { y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" })
    );
  });
}

// ── CLEANUP HELPER ────────────────────────────────────────────────────────────
/**
 * Kill all ScrollTrigger instances associated with a context.
 * Call in useEffect cleanup to avoid memory leaks on route changes.
 */
export function killScrollTriggers(context) {
  if (context) {
    context.revert();
  } else {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}

export { gsap, ScrollTrigger };

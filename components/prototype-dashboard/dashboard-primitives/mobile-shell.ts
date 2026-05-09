/**
 * Mobile shell constants shared across customer, cleaner, and admin
 * dashboards. Every dashboard footer/drawer/sticky bar must respect the same
 * safe-area math so the bottom navigation never overlaps a More drawer or a
 * detail sheet on iOS / Android home-indicator devices.
 *
 * If a dashboard hard-codes a different value, it WILL drift from the others
 * the moment iOS bumps its safe-area inset — always pull from this file.
 */

/**
 * Bottom offset to use on any element that must sit above the mobile tab bar
 * (drawers, toast stacks, sticky CTAs). Combines a baseline 5rem with the
 * device's safe-area inset.
 *
 * Note: the equivalent CSS calc string used inside inline styles is exported
 * separately as `MOBILE_FOOTER_OFFSET_CSS` so it can be applied via
 * `style={{ bottom: MOBILE_FOOTER_OFFSET_CSS }}` without re-deriving it.
 */
export const MOBILE_FOOTER_OFFSET_CSS = "max(5rem,env(safe-area-inset-bottom)+4.5rem)";

/** Offset for content padding-bottom so the page never sits beneath the tab bar. */
export const MOBILE_PAGE_PADDING_BOTTOM_CSS =
  "max(5rem,env(safe-area-inset-bottom)+4.5rem)";

/** Offset for `scroll-padding-bottom` so anchors don't land under the tab bar. */
export const MOBILE_SCROLL_PADDING_BOTTOM_CSS =
  "max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.75rem))";

/** Toast stack bottom — sits above tab bar with breathing room. */
export const MOBILE_TOAST_BOTTOM_CSS =
  "max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))";

/**
 * Z-index ladder for the dashboard chrome. Centralised so detail sheets,
 * toasts, drawers, and tab bars never collide regardless of which dashboard
 * mounted them.
 */
export const Z_INDEX = {
  /** Sticky page header. */
  header: 40,
  /** Mobile bottom tab bar. */
  tabBar: 40,
  /** More-drawer scrim (sits above content, below the drawer). */
  drawerScrim: 50,
  /** More-drawer panel itself. */
  drawer: 60,
  /** Detail sheet scrim (modal). */
  detailScrim: 70,
  /** Detail sheet panel. */
  detail: 75,
  /** Toast stack — always on top. */
  toast: 80,
} as const;

/** Minimum touch-target size we promise across the platform (Apple HIG / WCAG 2.2). */
export const MIN_TOUCH_TARGET_PX = 44;

/**
 * Tailwind class fragments that pre-bake the mobile-safe touch target. Use on
 * any icon-only button on a mobile surface (toast dismiss, drawer close, more
 * trigger, tab bar entries) so we hit `MIN_TOUCH_TARGET_PX` even when the
 * visual hit looks smaller.
 *
 *   <button className={cn("...visual styles...", touchTargetClass)} />
 */
export const touchTargetClass = "min-h-[44px] min-w-[44px] touch-manipulation";

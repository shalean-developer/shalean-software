/**
 * Shared dashboard primitives — the architectural cleanup layer.
 *
 * Every cross-role chrome element (toast surface, detail-sheet shell, more
 * drawer, mobile tab bar, status chip, section header, metadata row, empty
 * state) lives here so customer / cleaner / admin dashboards stop reinventing
 * the same widget. Role-specific bodies remain inside their own contexts —
 * these primitives only own the shell, motion, spacing, and z-index ladder.
 *
 * Treat this folder as the production-architecture-ready boundary: backend
 * integration (Supabase, auth, realtime) plugs into the role contexts that
 * feed these primitives, never into the primitives themselves.
 */

export {
  DashboardToastStack,
  type DashboardToast,
  type DashboardToastTone,
} from "./dashboard-toast-stack";

export { DashboardDetailSheetShell } from "./dashboard-detail-sheet-shell";
export type { DashboardDetailSheetShellProps } from "./dashboard-detail-sheet-shell";

export { DashboardMoreDrawer } from "./dashboard-more-drawer";

export {
  DashboardMobileTabBar,
  MOBILE_TAB_BAR_Z,
  type DashboardTabItem,
} from "./dashboard-mobile-tab-bar";

export { DashboardSectionHeader } from "./dashboard-section-header";
export { MetadataRow, type MetadataItem } from "./metadata-row";
export { EmptyStateCard } from "./empty-state-card";
export { StatusChip, type StatusChipTone } from "./status-chip";

export {
  MIN_TOUCH_TARGET_PX,
  MOBILE_FOOTER_OFFSET_CSS,
  MOBILE_PAGE_PADDING_BOTTOM_CSS,
  MOBILE_SCROLL_PADDING_BOTTOM_CSS,
  MOBILE_TOAST_BOTTOM_CSS,
  Z_INDEX,
  touchTargetClass,
} from "./mobile-shell";

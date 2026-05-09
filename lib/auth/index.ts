export {
  signInAction,
  signUpAction,
  signOutAction,
} from "./actions";

export {
  isAuthCallbackRoute,
  isAuthRoute,
  isProtectedRoute,
  AUTH_CALLBACK_PATH,
} from "./config";

export {
  readAppRoleFromUser,
  roleHasAtLeastRole,
  userHasAtLeastRole,
} from "./roles";

export {
  canAccessPath,
  evaluateRouteAccess,
  getAuthenticatedRedirectPath,
  getRequiredRoleForPath,
} from "./auth-guards";

export {
  createAuthClient,
  getBrowserOperationalSession,
  subscribeAuthEvents,
} from "./auth-client";

export {
  hydrateOperationalSession,
  subscribeOperationalAuthSession,
  useOperationalAuthSession,
} from "./auth-session";

export {
  normalizeOperationalIdentity,
  normalizeOperationalSession,
} from "./auth-normalizers";

export {
  normalizeAuthEvent,
  createAuthDebugLogger,
} from "./auth-events";

export {
  getRoleHomePath,
  roleHasPermission,
  toCanonicalOperationalRole,
} from "./role-contracts";

export {
  getServerSession,
  getServerUser,
  requireAdmin,
  requireAuthenticatedUser,
  requireRole,
  requireUser,
} from "./session";

export type {
  AppRole,
  AuthActionState,
  AuthenticatedUser,
} from "./types";

export type {
  AuthSessionState,
} from "./auth-session";

export type {
  OperationalAuthEvent,
  OperationalAuthEventType,
} from "./auth-events";

export type {
  OperationalIdentity,
  OperationalSession,
} from "./auth-normalizers";

export type {
  CanonicalOperationalRole,
  OperationalPermission,
} from "./role-contracts";

export { APP_ROLES } from "./types";

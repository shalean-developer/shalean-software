import { getRuntimeEnvironment, validateRuntimeEnv } from "./env-validation";

export type RuntimeConfig = {
  environment: ReturnType<typeof getRuntimeEnvironment>;
  siteUrl: string | null;
  vercelEnv: string | null;
  commitSha: string | null;
  deploymentId: string | null;
  region: string | null;
  primaryRegion: string | null;
  envValid: boolean;
};

export function getRuntimeConfig(): RuntimeConfig {
  const validation = validateRuntimeEnv();
  return {
    environment: validation.environment,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
    vercelEnv: process.env.VERCEL_ENV?.trim() || null,
    commitSha:
      process.env.VERCEL_GIT_COMMIT_SHA?.trim() ??
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ??
      null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID?.trim() || null,
    region: process.env.VERCEL_REGION?.trim() || null,
    primaryRegion: process.env.SCALE_PRIMARY_REGION?.trim() || null,
    envValid: validation.ok,
  };
}

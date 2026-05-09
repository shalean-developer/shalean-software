export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionDeploymentEnv } = await import("@/lib/config/production-env");
    validateProductionDeploymentEnv();
  }
}

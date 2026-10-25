# Coolify deployment

Every push/merge to `main` is built on the Coolify host through the `extrastudio-coolify` GitHub App. The root Dockerfile serves the checked-in static website with Caddy, preserving the existing port 8080 and directory, extensionless HTML and 404 routing.

Keep existing domains and runtime settings on the same application. `SOURCE_COMMIT` is enabled in Coolify; `/deployment-version.json` returns the deployed commit with `Cache-Control: no-store`.

Build and deploy logs: Coolify → application → Deployments. Runtime: Logs. Push delivery: GitHub App settings → Advanced → Recent deliveries.

Verification marker: `coolify-main-autodeploy-20261025`.

# Deploying to Azure

Target architecture: **Azure App Service** (Linux, Node 20) for the app,
**Azure Database for PostgreSQL — Flexible Server** for the data, and App
Service's **built-in authentication (Microsoft Entra ID)** in front of the
whole app until in-app authentication and RBAC land (roadmap phase 5).

> Static Web Apps is not suitable: every page here is server-rendered
> against a live database.

## 1. Create the database

Portal → *Create a resource* → **Azure Database for PostgreSQL Flexible
Server**.

- Version: 16. The Burstable **B1ms** tier is fine to start.
- Authentication: PostgreSQL authentication; note the admin user/password.
- Networking: Public access. Tick **"Allow public access from any Azure
  service within Azure"** (lets App Service connect). Add your own IP if
  you want to run migrations or the seed from your machine.

Once created, open **Databases** and add a database named `riskregister`.

Build the connection string (Settings → Connect shows the pieces):

```
postgresql://<admin>:<password>@<server-name>.postgres.database.azure.com:5432/riskregister?sslmode=require
```

`sslmode=require` matters — Azure PostgreSQL rejects unencrypted
connections.

## 2. Create the App Service

Portal → *Create a resource* → **Web App**.

- Publish: Code · Runtime stack: **Node 20 LTS** · OS: **Linux**.
- The **B1** plan is enough to start.

After creation, under **Settings → Environment variables** add:

| Name | Value |
|---|---|
| `DATABASE_URL` | the connection string from step 1 |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (the GitHub workflow ships a pre-built package) |

Under **Settings → Configuration → Startup Command** set:

```
npm start
```

## 3. Wire up GitHub deployment

The repo already contains `.github/workflows/deploy-azure.yml` (manual
trigger). It needs three pieces of configuration in GitHub
(*Settings → Secrets and variables → Actions*):

1. **Variable** `AZURE_WEBAPP_NAME` — the Web App's name.
2. **Secret** `AZURE_WEBAPP_PUBLISH_PROFILE` — in the App Service, click
   **Download publish profile** (enable *SCM basic auth* under
   Configuration → General settings if the button is greyed out) and paste
   the file's XML content.
3. **Secret** `DATABASE_URL` — same connection string; the workflow uses
   it to run `prisma migrate deploy` before each deployment. GitHub's
   runners must be able to reach the database, so either allow public
   access on the Postgres networking blade while deploying, or skip the
   secret and run migrations yourself (see below).

Then: GitHub → **Actions → Deploy to Azure App Service → Run workflow**.

### Running migrations / seed manually instead

From your machine (with your IP allowed on the Postgres firewall):

```bash
DATABASE_URL="postgresql://...azure...:5432/riskregister?sslmode=require" npx prisma migrate deploy
DATABASE_URL="postgresql://...azure...:5432/riskregister?sslmode=require" npm run db:seed   # optional sample data
```

## 4. Turn on authentication (do this before sharing the URL)

The app itself has no login yet, so gate it at the platform level:

App Service → **Settings → Authentication** → *Add identity provider* →
**Microsoft** → accept the defaults (creates an Entra ID app
registration) → under *Restrict access* choose **Require authentication**,
unauthenticated requests → **HTTP 302 redirect**.

Every visitor now has to sign in with an account in your tenant before
they can see anything. By default any user in the tenant can sign in; to
limit it to specific people, open the created app registration in Entra
ID → Enterprise application → **Properties → Assignment required = Yes**,
then add users/groups under **Users and groups**.

## 5. Verify

- `https://<app-name>.azurewebsites.net` → Entra sign-in → dashboard.
- Create a risk, refresh — it persists.
- App Service → **Log stream** is the first place to look if anything
  fails (most common causes: missing `DATABASE_URL`, or the Postgres
  firewall blocking the App Service).

## Costs & housekeeping

B1 App Service + B1ms Postgres is a modest monthly cost suitable for a
pilot; both scale up in place. Set the Postgres **backup retention**
(default 7 days) to match your records-management needs — relevant given
the audit-trail requirement (FR-X1, NFR-3).

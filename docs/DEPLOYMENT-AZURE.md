# Deploying to Azure — step-by-step guide

Written for someone who has used **Azure Static Web Apps** before but not
App Service or Azure PostgreSQL. Allow 30–45 minutes end to end.

**Cost plan used in this guide:** the app runs on the **F1 Free** App
Service tier (£0, with a ~30-second wake-up after idle periods), and the
database — the only paid component — is created in an **Azure Sponsorship
subscription** if one with remaining credit is available (consuming
credit, not cash), otherwise in the main subscription at roughly
£12–14/month, where it can be **stopped between review cycles** to pause
compute billing.

## How this differs from what you know from SWA

With Static Web Apps, Azure built your site from GitHub and served files
from a CDN — there was no server and no database, and access was wired up
with a single deployment token.

This app is different in three ways:

1. **It needs a running server.** Every page is rendered on request and
   forms execute server-side code, so we use **App Service** — a machine
   that runs `npm start` continuously — instead of SWA's file hosting.
2. **It needs a database.** All risks live in PostgreSQL, so we create an
   **Azure Database for PostgreSQL** and give the app its address via an
   environment variable.
3. **Deployment is push, not pull.** Instead of SWA building on every
   commit, a GitHub Actions workflow (already in the repo) builds the app
   and pushes the result to App Service when you trigger it. The
   credential is a **publish profile** — App Service's equivalent of
   SWA's deployment token.

You will create two Azure resources (database, web app), copy three
values into GitHub, click one workflow, and switch on authentication.

---

## Part 1 — Create the PostgreSQL database (~10 min)

0. **Check sponsorship credit first (optional but worth 2 minutes):**
   Portal → **Subscriptions** → open **Microsoft Azure Sponsorship** →
   the Overview / Cost Management blades show remaining credit and
   expiry. If there's usable credit, create the database (this Part) in
   *that* subscription; the web app can live in a different subscription
   without any issue — the connection string doesn't care.
1. Portal → **Create a resource** → search **"Azure Database for
   PostgreSQL Flexible Server"** → **Create**.
2. **Basics** tab:
   - **Subscription**: the Sponsorship subscription if it has credit,
     otherwise your main one.
   - **Resource group**: create one, e.g. `rg-risk-register` (as with
     SWA, it's just the folder everything lives in).
   - **Server name**: globally unique, e.g. `riskregister-db-<yourname>`.
     Note it — it becomes part of the connection address.
   - **Region**: pick one near you; use the same for the web app later.
   - **PostgreSQL version**: **16**.
   - **Workload type**: **Development** (this preselects the cheap
     Burstable **B1ms** size — fine for a pilot).
   - **Authentication method**: **PostgreSQL authentication only**.
   - **Admin username / password**: choose and **write both down** — you
     need them for the connection string, and the password is not
     retrievable later (only resettable).
3. **Networking** tab:
   - **Connectivity method**: **Public access (allowed IP addresses)**.
   - Tick **“Allow public access from any Azure service within Azure to
     this server”** — this is what lets the web app reach the database.
   - Click **“Add current client IP address”** — this lets *you* run the
     database setup commands from your machine in Part 3.
4. **Review + create** → **Create**. Deployment takes a few minutes.
5. When it's done, open the resource → left menu **Databases** →
   **+ Add** → name: `riskregister` → **Save**.
6. Build your connection string from the pieces (server name, admin
   user, password):

   ```
   postgresql://ADMINUSER:PASSWORD@SERVERNAME.postgres.database.azure.com:5432/riskregister?sslmode=require
   ```

   Example: admin `chris`, password `S3cret!`, server `riskregister-db-chris` →

   ```
   postgresql://chris:S3cret!@riskregister-db-chris.postgres.database.azure.com:5432/riskregister?sslmode=require
   ```

   Keep `?sslmode=require` — Azure refuses unencrypted connections. If
   your password contains characters like `@ : / # ?`, they must be
   URL-encoded (`@` → `%40`, etc.).

## Part 2 — Create the App Service (~5 min)

1. Portal → **Create a resource** → **Web App** (not Static Web App) →
   **Create**.
2. **Basics** tab:
   - **Resource group**: the same `rg-risk-register`.
   - **Name**: e.g. `riskregister-app-<yourname>` — this becomes
     `https://<name>.azurewebsites.net`.
   - **Subscription**: your main subscription is fine (it doesn't have
     to match the database's).
   - **Publish**: **Code**.
   - **Runtime stack**: **Node 22 LTS**.
   - **Operating System**: **Linux**.
   - **Region**: same as the database.
   - **Pricing plan**: create new → click **Explore pricing plans** /
     change size → pick **Free F1**. £0 forever; the trade-offs are that
     the app sleeps when idle (first visit after a quiet spell takes
     ~30 seconds to wake) and there's a daily CPU quota — both fine for
     a small number of users around review cycles. You can scale the
     same app up to B1 later in one click (**Settings → Scale up**) with
     no redeployment.
3. **Review + create** → **Create**, then **Go to resource**.
4. Left menu **Settings → Environment variables** → **App settings** →
   **+ Add** twice:
   - `DATABASE_URL` = the connection string from Part 1 step 6
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`
     (unlike SWA, nothing is built on Azure — GitHub ships a pre-built
     package)
   - **Apply** and confirm the restart.
5. Left menu **Settings → Configuration** → **General settings** →
   **Startup Command**: `npm start` → **Save**.

## Part 3 — Create the database tables (~5 min)

The tables are created by Prisma migrations. Simplest is from your own
machine (your IP was allowed in Part 1 step 3). In a terminal inside the
cloned repo:

```bash
npm install
DATABASE_URL="<your connection string>" npx prisma migrate deploy
DATABASE_URL="<your connection string>" npm run db:seed   # optional: 5 sample risks
```

Expected output: `1 migration applied` (and `Seeded 5 risks…` if you ran
the seed). If you see a connection timeout, the firewall is the cause —
Postgres resource → **Networking** → check your IP is listed.

(The deploy workflow can also run migrations automatically on every
deploy if you add `DATABASE_URL` as a GitHub secret in Part 4 — good to
set up, but doing it once by hand first proves the database works.)

## Part 4 — Connect GitHub to the App Service (~5 min)

1. In the App Service → **Overview** → click **Download publish
   profile** (top toolbar). If it's greyed out: **Settings →
   Configuration → General settings** → **SCM Basic Auth Publishing
   Credentials** → On → Save, then retry. Open the downloaded file in a
   text editor and copy its entire contents.
2. In your GitHub repo → **Settings → Secrets and variables → Actions**:
   - **Secrets** tab → **New repository secret**:
     - Name `AZURE_WEBAPP_PUBLISH_PROFILE`, value = the pasted file
       contents.
     - (Recommended) Name `DATABASE_URL`, value = the connection string —
       enables automatic migrations on deploy.
   - **Variables** tab → **New repository variable**:
     - Name `AZURE_WEBAPP_NAME`, value = the app name from Part 2
       (e.g. `riskregister-app-chris`).

## Part 5 — Deploy (~5 min)

1. GitHub repo → **Actions** tab → left list **“Deploy to Azure App
   Service”** → **Run workflow** → green **Run workflow** button.
2. Watch it: install & build → migrations → package → deploy. All green
   in ~3–5 minutes.
3. Open `https://<app-name>.azurewebsites.net`. First load after a
   deploy can take ~30 seconds while Node starts; then you should see
   the dashboard (with the sample risks if you seeded).

## Part 6 — Switch on sign-in BEFORE sharing the URL (~5 min)

The app has no login of its own yet, so put Azure's authentication gate
in front of it — no code required:

1. App Service → left menu **Settings → Authentication** → **Add
   identity provider**.
2. **Identity provider**: **Microsoft**. Accept the defaults (it creates
   an Entra ID app registration for you).
3. **Restrict access**: **Require authentication**.
   **Unauthenticated requests**: **HTTP 302 Found redirect**.
4. **Add**.

From now on every visitor must sign in with an account in your Microsoft
tenant. By default *anyone in the tenant* may sign in. To restrict to
named people: **Microsoft Entra ID → Enterprise applications** → find
the app registration that was created → **Properties → Assignment
required? = Yes** → **Save**, then **Users and groups → Add
user/group**.

## Part 7 — Verify

- Visit the URL in a private/incognito window → you're bounced to a
  Microsoft sign-in → after signing in, the dashboard loads.
- Create a test risk, refresh the page — it's still there (that's the
  database working).
- Check GitHub → Actions shows the deploy green.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Site shows generic Azure error page | **Log stream** (App Service left menu) shows the real error; nine times out of ten it's `DATABASE_URL` missing/typoed |
| `ECONNREFUSED` / timeout in Log stream | Postgres **Networking**: “Allow public access from any Azure service” not ticked |
| `password authentication failed` | Wrong password in the connection string, or special characters not URL-encoded |
| Workflow fails at *Deploy* step | Publish profile secret stale (re-download after enabling SCM basic auth) or `AZURE_WEBAPP_NAME` doesn't match |
| Workflow fails at *migrations* step | GitHub's runners can't reach the DB — remove the `DATABASE_URL` secret and run migrations from your machine (Part 3) instead |
| Site takes ~30s on first visit after idle | Expected on the F1 Free tier (it sleeps). If it becomes annoying: **Settings → Scale up** to B1 and enable **Configuration → General settings → Always on** |
| Site stops responding late in the day | F1's daily CPU quota exhausted (check **Diagnose and solve problems**); resets daily, or scale up to B1 |

## Costs

With this guide's plan: App Service **F1** = £0. PostgreSQL **B1ms** ≈
£12–14/month — £0 out of pocket if it's on sponsorship credit. If the
database is on a paid subscription and the register is only used around
periodic reviews, you can **stop the server** in between (Postgres
resource → Overview → **Stop**) to pause compute billing; note Azure
auto-restarts a stopped server after 7 days, and the app errors while
the database is stopped. Both resources scale up in place later. Set
Postgres **backup retention** (default 7 days) to match your
records-management needs — relevant to the audit-trail requirement
(FR-X1, NFR-3).

## Later deployments

Push changes to `main`, then Actions → **Deploy to Azure App Service** →
**Run workflow**. Migrations apply automatically if the `DATABASE_URL`
secret is set. Nothing on the Azure side needs touching again.

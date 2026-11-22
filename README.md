# Chance of Idea — Backend

The REST API for **Chance of Idea**, a marketplace for unfinished software
projects. Users can publish projects, browse and search listings, apply to
take over projects, coordinate GitHub repository transfers, report projects,
and receive notifications.

## Technology

- [NestJS](https://nestjs.com/) and TypeScript
- PostgreSQL with TypeORM
- Redis and BullMQ
- GitHub OAuth and the Octokit API
- JWT access and refresh authentication
- SMTP and Nodemailer for email verification
- Swagger and Scalar for interactive API documentation
- Jest and Supertest for tests

## Features

- GitHub OAuth and email-based authentication
- Short-lived JWT access tokens and HTTP-only refresh cookies
- User profiles, onboarding, locale, theme, and role settings
- Project creation, publishing, editing, search, filtering, and deletion
- Categories and tags with seed data
- Applications to take over projects, including accept/reject workflows
- GitHub repository discovery and repository-transfer sessions
- Project reports with reviewer approval and rejection
- Admin promotion and notification management
- BullMQ mail processing and Redis-backed email verification codes
- Interactive API reference at `/docs`

## Requirements

Choose one of these setup methods:

- Node.js 20+ and npm, PostgreSQL 17, and Redis
- Docker and Docker Compose

External integrations are optional for starting the server, but features that
use them require the corresponding credentials:

- A GitHub OAuth App
- A GitHub App and private key for repository operations
- An SMTP account for email authentication

## Environment configuration

Create a `.env` file in the repository root. `FRONTEND_URL` is required at
startup.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `3000`. |
| `FRONTEND_URL` | Yes | Trusted frontend origin used by CSRF protection. |
| `DB_HOST` | No | PostgreSQL host. Defaults to `db`. |
| `DB_PORT` | No | PostgreSQL port. |
| `DB_USER` | No | PostgreSQL username. |
| `DB_PASSWORD` | No | PostgreSQL password. |
| `DB_NAME` | No | PostgreSQL database name. |
| `DB_SSL` | No | Set to `true` to enable SSL for PostgreSQL. |
| `REDIS_HOST` | No | Redis host. Defaults to `redis`. |
| `REDIS_PORT` | No | Redis port. Defaults to `6379`. |
| `GITHUB_CLIENT_ID` | GitHub login | GitHub OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | GitHub login | GitHub OAuth App client secret. |
| `GITHUB_APP_ID` | Repository operations | GitHub App ID. |
| `GITHUB_PRIVATE_KEY` | Repository operations | GitHub App private key. |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | GitHub login | Key used to encrypt stored GitHub access tokens. |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens. |
| `MAIL_VERIFICATION_SECRET` | Email login | HMAC secret for email verification codes. |
| `SMTP_HOST` | Email login | SMTP server hostname. |
| `SMTP_PORT` | Email login | SMTP server port. |
| `SMTP_FROM` | Email login | Sender address used for email. |
| `SMTP_USER` | Email login | SMTP account username. |
| `SMTP_PASSWORD` | Email login | SMTP account password. |
| `MODERATION_BECOME_ADMIN_CODE` | Admin promotion | Secret code accepted by the admin-promotion endpoint. |

Use strong, unique secrets for `GITHUB_TOKEN_ENCRYPTION_KEY`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and
`MAIL_VERIFICATION_SECRET`. Never commit `.env` or production secrets.

Example local configuration:

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:3001

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=chanceofidea
DB_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_TOKEN_ENCRYPTION_KEY=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
MAIL_VERIFICATION_SECRET=
MODERATION_BECOME_ADMIN_CODE=

SMTP_HOST=
SMTP_PORT=587
SMTP_FROM=
SMTP_USER=
SMTP_PASSWORD=
```

Configure the GitHub OAuth App callback URL to match the running API. For the
default local port, use:

```text
http://localhost:3000/auth/oauth_callback
```

## Local development

Install dependencies:

```bash
npm ci
```

Create `.env`, then start PostgreSQL and Redis. Run the migrations:

```bash
npm run migration:run
```

Start the API in watch mode:

```bash
npm run start:dev
```

The API listens at `http://localhost:3000` by default. Its interactive API
reference is available at `http://localhost:3000/docs`.

For a production build:

```bash
npm run build
npm run start:prod
```

## Docker Compose

The development Compose file runs PostgreSQL, Redis, and the backend:

```bash
docker compose build backend
docker compose up -d db redis
docker compose run --rm --no-deps backend npm run migration:run
docker compose up backend
```

Configure the PostgreSQL credentials and published ports in `.env`. Compose
sets `DB_HOST=db` and `REDIS_HOST=redis` for the backend container.

The backend container runs the NestJS development watcher and mounts the source
directory. PostgreSQL data is persisted in the `postgres_data` named volume.

`docker-compose.prod.yaml` provides a backend/Redis setup intended for an
external PostgreSQL database. Set the database variables and Redis connection
variables for the deployment environment.

## API overview

All request and response schemas are available in the Scalar documentation at
`/docs`.

| Area | Main endpoints |
| --- | --- |
| Authentication | `GET /auth/oauth_callback`, `GET /auth/refresh`, `POST /auth/email/start`, `POST /auth/email/finish` |
| Users | `GET /user/me`, `POST /user/pass-onboarding`, `POST /user/become-admin` |
| Settings | `PATCH /settings/update` |
| Projects | `POST /project`, `GET /project`, `PATCH /project`, `DELETE /project`, `POST /project/publish`, `GET /project/projects` |
| Applications | `POST /application`, `POST /application/accept`, `POST /application/reject`, `GET /application/incoming`, `GET /application/outcoming` |
| Categories and tags | `GET /category`, `GET /tag` |
| GitHub | `GET /github/repositories` |
| Notifications | `GET /notification/all`, `DELETE /notification/read`, `DELETE /notification/read-all` |
| Reports | `POST /report/create`, `GET /report/reports/me/:page`, `GET /report`, `PATCH /report`, `DELETE /report`, `POST /report/approve`, `POST /report/reject` |
| Transfer sessions | `POST /transfer-session/i-have-recieved`, `POST /transfer-session/i-dont-want` |

Protected endpoints use the `AuthGuard`. Project mutations also require
GitHub verification and ownership; report approval and rejection require admin
access.

After OAuth or email login, the API:

- returns the access token in the `x-access-token` response header
- sets a seven-day HTTP-only `refresh` cookie

The refresh cookie is sent to `GET /auth/refresh` and is used to obtain a new
access/refresh pair.

## Database migrations

TypeORM manages database migrations; schema synchronization is disabled.

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
npm run migration:generate
```

The TypeORM CLI is configured in `src/database/data-source.ts`, and migrations
are stored in `src/database/migrations/`. Review generated migrations before
applying them.

## Testing and code quality

Run unit tests:

```bash
npm test
npm run test:watch
npm run test:cov
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Lint and format:

```bash
npm run lint
npm run format
```

## Project structure

```text
src/
  application/       Project application workflows
  auth/              OAuth, email authentication, JWT, and guards
  category/          Categories
  github/            GitHub repository operations
  mail/              SMTP queue processor and mail service
  notification/      Notification delivery and read state
  project/           Project listings and publishing
  redis/             Redis service
  report/            User reports and moderation
  settings/          User preferences
  tag/               Project tags
  transfer-session/  Repository-transfer coordination
  user/              Profiles and role state
  database/          TypeORM data source and migrations
  dto/               Request and response validation DTOs
  config/            Environment-backed service configuration
```

## Deployment

The Docker image is based on `node:20-alpine`. `render.yaml` contains an example
Render deployment for the Docker web service and Redis.

Production deployments need:

- a reachable PostgreSQL database with migrations applied
- a reachable Redis instance
- all required GitHub, JWT, mail, and moderation secrets
- the real frontend origin in `FRONTEND_URL`
- HTTPS when using the refresh cookie's `secure` setting

## License

This project is licensed under the
[GNU General Public License v3.0](./LICENSE).

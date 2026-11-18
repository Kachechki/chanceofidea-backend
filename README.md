# Chance of Idea — Backend

Chance of Idea is a marketplace for unfinished projects. This repository contains
the REST API for publishing projects, browsing listings, applying to adopt
projects, coordinating GitHub repository transfers, and receiving notifications.

The API is built with NestJS and TypeScript. PostgreSQL stores application data,
Redis supports caching and queues, and SMTP is used for email authentication
messages.

## Features

- GitHub OAuth and email authentication
- JWT access and refresh tokens stored through secure cookies
- Project creation, editing, publishing, search, and deletion
- Categories and tags for organizing project listings
- Applications to take over projects, including acceptance and rejection
- GitHub repository lookup and repository-transfer sessions
- User profiles, onboarding state, locale, and theme settings
- User notifications
- Interactive API reference at `/docs`

## Requirements

- Node.js 20 or later and npm
- PostgreSQL 17 (or Docker and Docker Compose)
- Redis
- A GitHub OAuth App
- An SMTP account for email authentication

## Configuration

Create a `.env` file in the repository root. `FRONTEND_URL` is required at
startup.

| Variable | Description |
| --- | --- |
| `PORT` | API HTTP port; defaults to `3000` |
| `FRONTEND_URL` | Trusted frontend origin used by CSRF protection |
| `DB_HOST` | PostgreSQL hostname; defaults to `db` |
| `DB_PORT` | PostgreSQL port; defaults to `5432` for migrations |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |
| `DB_SSL` | Set to `true` to enable PostgreSQL SSL |
| `REDIS_HOST` | Redis hostname; defaults to `redis` |
| `REDIS_PORT` | Redis port; defaults to `6379` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_PRIVATE_KEY` | GitHub App private key |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Key used to encrypt GitHub access tokens |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |
| `MAIL_VERIFICATION_SECRET` | Secret used when validating email verification codes |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_FROM` | Sender address used for email |
| `SMTP_USER` | SMTP account username |
| `SMTP_PASSWORD` | SMTP account password |

Use strong, unique secrets for the encryption key and JWT secrets. Do not commit
`.env` or production secrets to source control.

For local development, an example configuration is:

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:3001

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=database
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

SMTP_HOST=
SMTP_PORT=587
SMTP_FROM=
SMTP_USER=
SMTP_PASSWORD=
```

Configure the GitHub OAuth App callback URL for your environment. For a local
server on the default port, the API callback route is:

`http://localhost:3000/auth/oauth_callback`.

## Run locally

Install dependencies:

```bash
npm ci
```

Start PostgreSQL and Redis, then set `DB_HOST=localhost` and
`REDIS_HOST=localhost` in `.env`. Apply the database migrations:

```bash
npm run migration:run
```

Start the API in watch mode:

```bash
npm run start:dev
```

The API listens on `http://localhost:3000` by default. If you set a different
`PORT`, use that port instead. The interactive API reference is available at
`http://localhost:3000/docs`.

For a production build:

```bash
npm run build
npm run start:prod
```

## Run with Docker Compose

Configure the variables used by `docker-compose.yaml` in `.env`, including
PostgreSQL credentials, Redis settings, and `PORT`. The Compose services expose
PostgreSQL on `DB_PORT` and Redis on `REDIS_PORT`.

Build the backend image and start the database and Redis:

```bash
docker compose build backend
docker compose up -d db redis
```

Once PostgreSQL is ready, apply migrations from the backend container:

```bash
docker compose run --rm --no-deps backend npm run migration:run
```

Then start the API:

```bash
docker compose up backend
```

The Compose file publishes the API and PostgreSQL ports configured in `.env`.
The backend container uses `DB_HOST=db` and `REDIS_HOST=redis`.

## API overview

The full request and response schemas are available at `/docs`.

| Area | Main routes |
| --- | --- |
| Authentication | `GET /auth/oauth_callback`, `GET /auth/refresh`, `POST /auth/email/start`, `POST /auth/email/finish` |
| Users | `GET /user/me`, `POST /user/pass-onboarding` |
| Settings | `PATCH /settings/update` |
| Projects | `POST /project`, `GET /project`, `PATCH /project`, `DELETE /project`, `POST /project/publish`, `GET /project/projects` |
| Applications | `POST /application`, `POST /application/accept`, `POST /application/reject`, `GET /application/incoming`, `GET /application/outcoming` |
| Categories and tags | `GET /category`, `GET /tag` |
| GitHub | `GET /github/repositories` |
| Notifications | `GET /notification/all`, `DELETE /notification/read`, `DELETE /notification/read-all` |
| Transfer sessions | `POST /transfer-session/i-have-recieved`, `POST /transfer-session/i-dont-want` |

Most protected routes require a bearer access token or a valid refresh cookie.
Project mutation routes also require GitHub verification and project ownership.
The OAuth callback and email-authentication start/finish routes establish the
access and refresh-token session.

The API sets refresh tokens in the HTTP-only `refresh` cookie and returns access
tokens in the `x-access-token` response header.

## Database migrations

Migrations are managed with TypeORM. Run pending migrations after configuring
the database and before starting the API:

```bash
npm run migration:run
```

Other migration commands:

```bash
npm run migration:show
npm run migration:revert
npm run migration:generate
```

Review generated migrations before applying them. Automatic schema
synchronization is disabled.

## Tests and code quality

```bash
npm test
npm run test:e2e
npm run test:cov
npm run lint
```

## License

See [LICENSE](./LICENSE).

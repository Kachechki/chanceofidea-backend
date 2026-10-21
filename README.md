# Chance of Idea — Backend

Chance of Idea is a marketplace for unfinished projects. This repository contains
the REST API used to publish projects, browse and filter listings, apply to take
over a project, and coordinate repository transfers. Users authenticate with
GitHub.

The API is built with NestJS and TypeScript, and uses PostgreSQL for persistence.

## Features

- GitHub OAuth authentication and JWT-protected endpoints
- Project creation, editing, publishing, search, and deletion
- Categories and tags for organizing project listings
- Applications to take over projects, including acceptance and rejection
- GitHub repository lookup and transfer-session confirmations
- Interactive API reference at `/docs`

## Requirements

- Node.js 20 or later and npm
- PostgreSQL 17 (or Docker and Docker Compose)
- A GitHub OAuth App

## Configuration

Create a `.env` file in the repository root. The following variables are used by
the application:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port for the API (defaults to `3000`) |
| `DB_HOST` | PostgreSQL hostname (`localhost` for a local database, `db` in Docker Compose) |
| `DB_PORT` | PostgreSQL port (normally `5432`) |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Key used to encrypt stored GitHub access tokens |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |

Use strong, unique secrets for the encryption key and JWT secrets. Do not commit
`.env` or production secrets to source control.

Configure the GitHub OAuth App to use the callback URL for your environment. For
a local server on the default port, the API callback route is
`http://localhost:3000/auth/oauth_callback`.

## Run locally

Install dependencies:

```bash
npm ci
```

Start PostgreSQL and set `DB_HOST` to the address reachable from your local
machine, typically `localhost`. Apply the database migrations:

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
PostgreSQL credentials and `PORT`. The Compose service configures the backend to
reach PostgreSQL at `db`.

Build the backend image and start PostgreSQL:

```bash
docker compose build backend
docker compose up -d db
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

## API overview

The full request and response schemas are documented in the interactive
reference at `/docs`. The main routes are:

| Area | Routes |
| --- | --- |
| Authentication | `GET /auth/oauth_callback` |
| Users | `GET /user/me` |
| Projects | `POST /project`, `GET /project`, `GET /project/projects`, `PATCH /project`, `DELETE /project`, `POST /project/publish` |
| Applications | `POST /application`, `POST /application/accept`, `POST /application/reject`, `GET /application/incoming`, `GET /application/outcoming` |
| Categories and tags | `GET /category`, `GET /tag` |
| GitHub | `GET /github/repositories` |
| Transfer sessions | `POST /transfer-session/i-have-recieved`, `POST /transfer-session/i-dont-want` |

All routes except the OAuth callback require authentication. Project and
application routes that modify a project also enforce project-owner permissions.

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

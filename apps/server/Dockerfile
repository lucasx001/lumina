# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.11 AS build

WORKDIR /workspace

# Copy only manifests first so dependency installation remains cacheable.
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY apps/server/prisma.config.ts apps/server/prisma.config.ts
COPY apps/server/prisma/schema.prisma apps/server/prisma/schema.prisma

RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/server apps/server

RUN bun --cwd=apps/server run prisma:generate \
  && bun --cwd=apps/server run build

FROM oven/bun:1.3.11 AS runtime

WORKDIR /workspace

ENV NODE_ENV=production

# Install only runtime dependencies. Prisma Client is copied from the build stage
# because the Prisma CLI is intentionally a development dependency.
COPY package.json bun.lock bunfig.toml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/i18n/package.json packages/i18n/package.json
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY --from=build /workspace/apps/server/dist apps/server/dist
COPY --from=build /workspace/apps/server/prisma/generated apps/server/prisma/generated

EXPOSE 3000

CMD ["node", "apps/server/dist/src/index.js"]

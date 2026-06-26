FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://translate:translate@postgres:5432/translate_ai?schema=public
RUN npx prisma generate
RUN npm run build
RUN npx tsc -p tsconfig.seed.json

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/scripts ./scripts
COPY package*.json ./
RUN chmod +x scripts/docker-entrypoint-api.sh
EXPOSE 3000
CMD ["/app/scripts/docker-entrypoint-api.sh"]

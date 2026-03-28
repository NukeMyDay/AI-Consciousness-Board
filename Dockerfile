FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && rm -rf /root/.npm

COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "build"]

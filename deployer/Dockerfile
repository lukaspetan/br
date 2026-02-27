FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV PORT=3002
ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "dist/index.js"]

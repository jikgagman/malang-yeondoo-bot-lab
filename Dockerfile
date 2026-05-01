FROM node:22-alpine

RUN apk add --no-cache sqlite

WORKDIR /app

COPY package.json ./
COPY index.html overlay.html styles.css overlay.css app.js overlay.js lcu-proxy.js README.md ./
COPY assets ./assets
COPY seed ./seed

ENV NODE_ENV=production
ENV PORT=4173

EXPOSE 4173

CMD ["npm", "start"]

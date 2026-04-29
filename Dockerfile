FROM node:22-alpine

RUN apk add --no-cache sqlite

WORKDIR /app

COPY package.json ./
COPY index.html styles.css app.js lcu-proxy.js README.md ./

ENV NODE_ENV=production
ENV PORT=4173

EXPOSE 4173

CMD ["npm", "start"]

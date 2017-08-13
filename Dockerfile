FROM node:8

# Create app directory
WORKDIR /app-build

COPY package.json .

RUN npm install --production

COPY . .

RUN npm run deploy

RUN mkdir /app && cp -r /app-build/deploy/. /app/ && cd /app && rm -r /app-build

WORKDIR /app

EXPOSE 5000
EXPOSE 80

ENV NODE_ENV=docker

CMD ["node", "/app/src/main.js"]
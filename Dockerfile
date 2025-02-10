FROM node:20.18.2-alpine3.20 AS build
WORKDIR /usr/src/app
# Install dependencies
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Run the build script.
RUN npm run build

FROM node:20.18.2-alpine3.20 AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:20.18.2-alpine3.20 AS final
WORKDIR /usr/src/app
ENV NODE_ENV production
#USER node
COPY --from=deps /usr/src/app/node_modules ./dist/node_modules
COPY --from=build /usr/src/app/dist/src ./dist/
COPY package.json ./dist/
COPY .env ./.env
EXPOSE 3000
CMD ["node", "dist/server.js"]

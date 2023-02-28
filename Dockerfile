FROM node:18-alpine as build
WORKDIR /app
COPY ./package.json ./package-lock.json /app/
RUN npm ci
COPY . /app
RUN npm run build

# -----------------------------------------------------
FROM node:18-alpine as runtime
WORKDIR /app
RUN apk add --no-cache docker-cli docker-cli-compose
COPY --from=build /app/package.json /app/package-lock.json /app/
COPY --from=build /app/build /app/build
COPY ./docker-entrypoint.sh /sbin/
RUN npm i --omit=dev \
  && npm config set logs-max 0 \
  && npm config set offline true \
  && npm config set update-notifier false \
  && rm -rf /root/.npm \
  && mkdir -p /root/.npm/_logs

ENTRYPOINT ["/sbin/docker-entrypoint.sh"]

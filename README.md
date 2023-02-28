# Genhook - Generic Webhook Handler

## Usage example (docker)

```bash
$ docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ./data/webhook-handler/webhooks:/app/webhooks:ro \
  -v /docker/compose:/docker/compose:ro \
  wdevio/genhook:latest
```

## Usage example (docker compose)

```yaml
version: '3.9'
services:
  genhook-webhook-handler:
    image: wdevio/genhook:latest
    container_name: genhook-webhook-handler
    restart: unless-stopped
    ports:
      - "9999:9999"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /root/.docker/config.json:/root/.docker/config.json:ro
      - ./data/webhook-handler/webhooks:/app/webhooks:ro
      - /docker/compose:/docker/compose:ro
      - /etc/localtime:/etc/localtime:ro
    environment: # Optional environment variables (defaults are given for reference)
      HOST: '0.0.0.0'
      PORT: 9999
      URL_PREFIX: '/update-webhooks'
      SCRIPTS_DIR: '/app/webhooks'
```

## Webhook example

- /app/webhooks/my-app.secret
```text
7e473aea-9c08-463a-9836-f031ca258d89
```

- /app/webhooks/my-app.sh
```bash
#!/bin/sh

cd /docker/compose/my-app
echo Pulling latest images...
docker compose pull -q api frontend
echo Restarting needed services...
docker compose up -d
```
- **The hook will be callable at the following URL: ```http://localhost:9999/update-webhooks/my-app/7e473aea-9c08-463a-9836-f031ca258d89```**

## Nginx proxy example

```nginx
http {
  # ...

  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 300s; # 5 minutes - max runtime of your script

  server {
    listen        80;

    location /ci/ {
      proxy_pass http://10.0.0.2:9999/;
      proxy_pass_request_headers on;
    }

    # ...
  }
}
```

---
title: Setting up Headscale
description: A guide for setting up Headscale behind Traefik
---

## Introduciton
If you used Tailscale, it is a pretty nice way to easily connect all of your devices together in a secure way. Personally, I use it to connect all of my servers together, and to gain access to my homelab without having to port forward for a Wireguard and OpenVPN server. However, this relies on Tailscale's infrastucture, mainly their [control and cooridination server](https://tailscale.com/blog/how-tailscale-works#the-control-plane-key-exchange-and-coordination) in order to provide encryption keys for your clients and for facilitating connections between clients. Now this is fine, but this makes me reliant on Tailscale being alive and not going bankrupt. Whether you are fine with that is up to you, but for me, this makes me interested in hosting my own Tailscale control and cooridination server, which is what [Headscale](https://headscale.net/stable/) aims to do. It is an "open source, self-hosted implementation of the Tailscale control server." This guide will go over how to set this up behind the Traefik reverse proxy. 

## Requirements
For this, you will need
- A Linux server with [Docker](https://docs.docker.com/engine/install/)
- Ability to port forward ports 80 and 443

## Traefik setup
1. Make a folder for Traefik
```sh
mkdir traefik
```
2. In the new `traefik` folder, make 3 new folders 
```sh
cd traefik
mkdir config logs data
```
3. Make your environment file, dynamic configuration file, log files, and `acme.json` for use with HTTPS
```sh
touch config/traefik-dynamic.yaml logs/access.log logs/traefik.log data/acme.json .traefik_env
```
4. Create a Docker Compose file with this content
```sh
nano docker-compose.yaml
```
```yaml
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    restart: unless-stopped
    env_file: ./traefik_env
    command:
      - --api=true
      - --api.dashboard=true

      - --log.level=INFO
      - --log.filePath=/logs/traefik.log
      - --accesslog=true
      - --accesslog.filepath=/logs/access.log

      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.endpoint=unix:///var/run/docker.sock
      - --providers.docker.watch=true
      - --providers.docker.network=proxy

      - --providers.file.filename=/traefik-dynamic.yml
      - --providers.file.watch=true

      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=websecure
      - --entrypoints.web.http.redirections.entrypoint.permanent=true

      - --entrypoints.websecure.http.tls.domains[0].main=domain.com
      - --entrypoints.websecure.http.tls.domains[0].sans=*.domain.com
      - --entrypoints.websecure.http.tls.certresolver=cloudflare

      - --certificatesresolvers.cloudflare.acme.email=email
      - --certificatesresolvers.cloudflare.acme.storage=acme.json
      - --certificatesresolvers.cloudflare.acme.dnschallenge=true
      - --certificatesresolvers.cloudflare.acme.dnschallenge.provider=cloudflare # change provider when needed. this example uses cloudflare
      - --certificatesresolvers.cloudflare.acme.dnschallenge.resolvers[0]=1.1.1.1:53
      - --certificatesresolvers.cloudflare.acme.dnschallenge.resolvers[1]=8.8.8.8:53
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./data/acme.json:/acme.json
      - ./config/traefik-dynamic.yml:/traefik-dynamic.yml
      - ./logs:/logs
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /etc/localtime:/etc/localtime:ro
    networks:
      - proxy
    labels:
      - traefik.enable=true
      - traefik.docker.network=proxy
      - traefik.http.routers.dashboard.entrypoints=websecure
      - traefik.http.routers.dashboard.rule=Host(`traefik.domain.com`)
      - traefik.http.routers.dashboard.service=api@internal
      - traefik.http.routers.dashboard.middlewares=auth
      - traefik.http.middlewares.auth.basicauth.users=admin:hashedpass
    volumes:
      - ./data:/data
    working_dir: /data
networks:
  proxy:
    external: true

```
---
title: Redoing my DNS setup
description: Documenting my shinanegans in redoing DNS within my lab. It involves PiHole and Unbound
---
## Introduction
As I've setup and mainatined my homelab over the years, one of the things I've neglected to "properly" configure was my DNS setup. I've used PiHole in a Docker container on my home server and it was mostly functional. My deployed adlists were blocking ads and malicious domains, and DNS resolutions were fine. The web UI was behind my Traefik reverse proxy with a cool dedicated subdomain under my local subdomain tha I used for my server. However, this setup had some issues, and I was generally not very satisfied with it. 

I had to manually configure local DNS records in the PiHole web UI for my local subdomain of my main domain, as well as the service subdomains of my local subdomain. I disliked this as if I had to add a new service to my homelab, I would need to enter the PiHole web UI and manually add another A record. I used external upstream DNS servers from the likes of Quad9 and Cloudflare, sending my DNS requests to a 3rd party. I had tried to setup an Unbound instance but it didn't work. My intial plan to have PiHole and Unbound as seperate Docker stacks didn't pan out well as I had to create external Docker networks in order for them to communicate with each other. It was also a pain to make changes. I also had no redundancy, so if my main server went down, I will get knocks on my door from angry family members. This would force me to configure a 2nd external DNS server in my router in order to avoid that. Overall, it was functional, but it had some big issues. 

This all came to a head when I moved out for college and got a student dorm. I moved in my stuff for the year, and got to work setting up my homelab in my dorm. After a few days of troubleshooting and setup. all my services were operational. It was mostly smooth for a few months. Now that I was out of the house and in an environment where I didn't have to worry about stability, I had finally decided to kick myself and try to fix my DNS setup. I had always wanted to do a setup with PiHole and Unbound in docker containers. This was also around the time I found [Nebula Sync](https://www.youtube.com/watch?v=OcSBggDyeJ4) from Techno Tim. I also happened to have a spare Pi that I was no longer using for my classes. All was looking good and the time was perfect for a DNS redeployment. 

## Initial Setup
Once the assignments from my courses started lightening up (or randomly became productive), I started work on a new Docker stack, where I would consolidate my DNS setup into a single Docker Compose file. 

It would consist of 3 parts:
- PiHole as the main "frontend" DNS provider
- Unbound as PiHole's upstream DNS as well as root DNS server
- Nebula Sync for syncing up my ad lists (and potentially other settings) to my Pi, running a similar PiHole + Unbound setup without Nebula Sync. 

For initial testing and iteration, I would base my PiHole setup off the base PiHole compose file from PiHole themselves, and then add on an Unbound configuarion on top. The syncing would come later once I confirmed that Unbound and PiHole worked well together on both my main server and Pi. 
Below is an approximation to my first variation of my Compose file. 
```yaml
services:
  pihole:
    container_name: pihole
    hostname: pihole
    image: pihole/pihole:latest
    networks:
      proxy: null
      dns:
        ipv4_address: 10.0.0.3
    ports:
      - 54:53/tcp
      - 54:53/udp
      - 201:80/tcp
    environment:
      TZ: America/New_York
      FTLCONF_webserver_api_password: old-pass
      FTLCONF_dns_listeningMode: all
    volumes:
      - ./pihole:/etc/pihole
      - ./dnsmasq.d:/etc/dnsmasq.d
    cap_add:
      - NET_ADMIN 
      - SYS_NICE
    depends_on:
      - unbound
    restart: unless-stopped
  unbound:
    hostname: unbound
    container_name: unbound
    image: mvance/unbound:latest
    networks:
      dns:
        ipv4_address: 10.0.0.2
    volumes:
      - ./unbound:/opt/unbound/etc/unbound
    healthcheck:
      test:
        - NONE
    restart: unless-stopped
networks:
  dns:
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.0.0/16
          gateway: 10.0.0.1
```
I would also use the [example configuration](https://github.com/MatthewVance/unbound-docker/blob/master/unbound.conf) for my Unbound from the [mvance/unbound](https://github.com/MatthewVance/unbound-docker) repository. 

This version of my stack would allow me to get basic instances of PiHole and Unbound up and running via a single Compose file. I didn't even bother putting it behind Traefik as I didn't want other factors potentially messing things up. I would test DNS resolution by running `dig` commands on my main laptop or on the server itself via the PiHole container if I was testing Unbound's DNS resolution. I would test popular domains like `google.com`, my own domain and its subdomains. One issue I found was that my local subdomain wasn't returning any IP address. This was because that subdomain lead to an IP that was classified as a "private IP" in Unbound. 

## Troubleshooting
As any good tech would do, I looked up to see how to have Unbound do DNS resolution for subdomains that would resolve to IPs within a private IP range. I tried various solutions but none would work. Once that failed, I would proceed to make a Reddit post detailing my issue. After some time, the post recieved some responses with potential solutions.   
One of the solutions proposed was to write an extra configuration file containing DNS records for my domain and including that configuration in my main `unbound.conf`. This is What I ended on with that solution: 
`unbound.conf`:
```
#auth-zone:
#    name: "local.domain.com"
#    for-downstream: yes
#    for-upstream: no
#    zonemd-check: no
#    zonemd-reject-absence: no
#    zonefile: "/opt/unbound/etc/unbound/domain.com.conf"
```
`local.domain.com.conf`:
```
local.domain.com. A 192.168.x.x
*.local.domain.com. A 192.168.x.x
... # for other subdomains that lead to other servers I run
``` 

This somewhat worked. When I just had records for my local subdomain, Unbound would resolve the local subdomain correctly and return the correct IP, but my other subdomains would return nothing. With records for my other subdomains, I would be back at square one. 

I had asked the user for help with resolving only specific subdomains, but they didn't know how to do so. Fair enough, I'll just look for it myself, which is probably what I should've in the first place. I loaded the Unbound documentation, and looked for "domain". Lo and behold, [the `private-domain` option](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html#unbound-conf-private-domain) was exactly what I was looking for. 

I added `private-domain: local.domain.com` to my `unbound.conf` and it worked flawlessly. I can still resolve popular domains, my own domain with my local and external subdomains.

### Honorable Mentions
There were also other solutions in the post. Some users suggested that I handle the resolutions for the subdomains on PiHole. If I wanted to do it at the PiHole level, I had 2 options. The first was my old way of doing things, which was to manually create an A record for my local subdomain and for every service subdomains of my local subdomain, which was what I was trying to avoid for the reasons I mentioned earlier. The 2nd option was to add `address=/*.local.domain.com/192.168.x.x`. This solution did what I wanted it to do. It resolved the issue of the local subdomain not being resolved, while properly resolving all my other subdomains. However, I wanted to do the resolution at the deepest level possible (at Unbound), and leave PiHole for just dealing with blackholing ad-serving and malicious domains. 

## Configuring the Pi
While I was dealing with setting up DNS on the main server, I was also configuring my Pi to have an Unbound + Pihole setup. I ran the automated PiHole install script, and followed the Unbound setup guide from the PiHole documentation. I decided to do this bare metal on the Pi because Docker would introduce overhead, which was not very good as I am using a Raspberry Pi 3B+, a relatively weak single board computer. There is not much to discuss here. It went relatively smoothly except I just added the same `private-domain` options. I also had an issue where PiHole was not reading the database files correctly but that was resolved by running `sudo pihole -r` to repair my installation.

## Syncing the 2 Machines
Now that both machines have working PiHole and Unbound instances that work well together, I can now set up Nebula Sync and start syncing the boxes together. Nebula works with a master-replica structure, where syncs are one way, and configurations are synced from the master instance to the replica instances. I decided that with this structure, I would run Nebula Sync on my main server, in the same compose file as PiHole and Unbound. The PiHole intances on both machines didn't have much on them aside from my adlists, so there was not much to sync in the first place. There were also settings that I didn't want to sync as they would break one another (ie the upstream DNS servers as I had Docker IPs and localhost). After some configuration and troubleshooting, this is the final solution I ended on. 
```yaml
  nebula-sync:
    image: ghcr.io/lovelaze/nebula-sync:latest
    container_name: nebula-sync
    environment:
      - PRIMARY=https://pihole.local.domain|pass
      - REPLICAS=https://pihole.local-pi.domain|pass
      - CLIENT_RETRY_DELAY_SECONDS=20
      - FULL_SYNC=false
      #- RUN_GRAVITY=true
      - NS_DEBUG=true
      #- SYNC_GRAVITY_GROUP=true
      - SYNC_GRAVITY_AD_LIST=true
      - SYNC_GRAVITY_AD_LIST_BY_GROUP=true
      - SYNC_GRAVITY_DOMAIN_LIST=true
      - SYNC_GRAVITY_DOMAIN_LIST_BY_GROUP=true
      #- SYNC_GRAVITY_CLIENT=true
      #- SYNC_GRAVITY_CLIENT_BY_GROUP=true
      - CRON=0 * * * *
    depends_on:
      pihole:
        condition: service_healthy
```

## The End is Here (Final Configuration)
I now had a pretty robust DNS setup in my homelab. 
I had 2 PiHole instances that each use an Unbound instance as its upstream server. Unbound was acting as both a root DNS server and a recursive DNS server. The instances were also on seperate machines, providing redundancy in the case that one or the other dies due to some totally unknown cosmic (ie me) force. The instances we're also synced with each other, keeping consistency between the 2. Both instances of PiHole also had their web UIs behind a reverse proxy, providing a nice domain name for each, as well as HTTPS. 

This is the final `docker-compose.yml` for the DNS stack: 
```yaml
services:
  pihole:
    container_name: pihole
    hostname: pihole
    image: pihole/pihole:latest
    networks:
      proxy: null
      dns:
        ipv4_address: 10.0.0.3
    ports:
      - 53:53/tcp
      - 53:53/udp
      - 200:80/tcp
    labels:
      - traefik.enable=true
      - traefik.docker.network=proxy
      - traefik.http.routers.pihole.entrypoints=web
      - traefik.http.routers.pihole.rule=Host(`pihole.local.domain`)
      - traefik.http.middlewares.pihole-https-redirect.redirectscheme.scheme=websecure
      - traefik.http.services.pihole.loadbalancer.server.port=80
      - traefik.http.routers.pihole-secure.entrypoints=websecure
      - traefik.http.routers.pihole-secure.rule=Host(`pihole.local.domain`)
      - traefik.http.routers.pihole-secure.tls=true
      - traefik.http.routers.pihole-secure.service=pihole
    environment:
      TZ: America/New_York
      WEBPASSWORD_FILE: pihole-pass
      FTLCONF_dns_listeningMode: all
    secrets:
      - pihole-pass
    volumes:
      - ./pihole:/etc/pihole
      - ./dnsmasq.d:/etc/dnsmasq.d
    cap_add:
      - NET_ADMIN
      - SYS_NICE
    depends_on:
      - unbound
    restart: unless-stopped
  unbound:
    hostname: unbound
    container_name: unbound
    image: mvance/unbound:latest
    networks:
      dns:
        ipv4_address: 10.0.0.2
    volumes:
      - ./unbound:/opt/unbound/etc/unbound
    healthcheck:
      test:
        - NONE
    restart: unless-stopped
  nebula-sync:
    image: ghcr.io/lovelaze/nebula-sync:latest
    container_name: nebula-sync
    environment:
      - PRIMARY=https://pihole.local.domain|password
      - REPLICAS=https://pihole.local-pi.domain|password
      - CLIENT_RETRY_DELAY_SECONDS=20
      - FULL_SYNC=false
      - NS_DEBUG=true
      - SYNC_GRAVITY_AD_LIST=true
      - SYNC_GRAVITY_AD_LIST_BY_GROUP=true
      - SYNC_GRAVITY_DOMAIN_LIST=true
      - SYNC_GRAVITY_DOMAIN_LIST_BY_GROUP=true
      - CRON=0 * * * *
    depends_on:
      pihole:
        condition: service_healthy
secrets:
  pihole-pass:
    file: /secrets/pihole.txt
networks:
  dns:
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.0.0/16
          gateway: 10.0.0.1
  proxy:
    external: true

```
Here is my final `unbound.conf`:
```
server:
    ###########################################################################
    # BASIC SETTINGS
    ###########################################################################
    cache-max-ttl: 86400
    cache-min-ttl: 300
    directory: "/opt/unbound/etc/unbound"
    do-ip4: yes
    do-ip6: yes
    do-tcp: yes
    do-udp: yes
    edns-buffer-size: 1232
    interface: 0.0.0.0@53
    # interface: ::0
    port: 53
    prefer-ip6: no
    rrset-roundrobin: yes
    username: "_unbound"

    log-local-actions: no
    log-queries: no
    log-replies: no
    log-servfail: no

    # If you want to log to a file, use:
    #logfile: /opt/unbound/etc/unbound/unbound.log
    # Set log location (using /dev/null further limits logging)
    logfile: /dev/stdout
    #logfile: /dev/null

    # Set logging level
    # Level 0: No verbosity, only errors.
    # Level 1: Gives operational information.
    # Level 2: Gives detailed operational information including short information per query.
    # Level 3: Gives query level information, output per query.
    # Level 4:  Gives algorithm level information.
    # Level 5: Logs client identification for cache misses.
    verbosity: 1

    # PERFORMANCE SETTINGS
    # https://nlnetlabs.nl/documentation/unbound/howto-optimise/
    # https://nlnetlabs.nl/news/2019/Feb/05/unbound-1.9.0-released/

    infra-cache-slabs: 4
    incoming-num-tcp: 10
    key-cache-slabs: 4
    msg-cache-size: 142768128
    msg-cache-slabs: 4
    num-queries-per-thread: 4096
    num-threads: 3
    outgoing-range: 8192
    rrset-cache-size: 285536256
    rrset-cache-slabs: 4
    minimal-responses: yes
    prefetch: yes
    prefetch-key: yes
    serve-expired: yes

    #so-rcvbuf: 4m 
    so-reuseport: yes
    #so-sndbuf: 4m

    ###########################################################################
    # PRIVACY SETTINGS
    ###########################################################################

    aggressive-nsec: yes
    delay-close: 10000
    do-daemonize: no
    do-not-query-localhost: no
    neg-cache-size: 4M
    qname-minimisation: yes

    ###########################################################################
    # SECURITY SETTINGS
    ###########################################################################
    # Only give access to recursion clients from LAN IPs
    access-control: 127.0.0.1/32 allow
    access-control: 192.168.0.0/16 allow
    access-control: 172.16.0.0/12 allow
    access-control: 10.0.0.0/8 allow
    access-control: fc00::/7 allow
    access-control: ::1/128 allow
    auto-trust-anchor-file: "var/root.key"
    chroot: "/opt/unbound/etc/unbound"
    deny-any: yes
    harden-algo-downgrade: yes
    harden-below-nxdomain: yes
    harden-dnssec-stripped: yes
    harden-glue: yes
    harden-large-queries: yes
    harden-referral-path: no
    harden-short-bufsize: yes
    hide-http-user-agent: no
    hide-identity: yes
    hide-version: yes
    http-user-agent: "DNS"
    identity: "DNS"

    private-address: 10.0.0.0/8
    private-address: 172.16.0.0/12
    private-address: 192.168.0.0/16
    private-address: 169.254.0.0/16
    private-address: fd00::/8
    private-address: fe80::/10
    private-address: ::ffff:0:0/96

    private-domain: local.domain
    private-domain: local-pi.domain

    ratelimit: 1000
    tls-cert-bundle: /etc/ssl/certs/ca-certificates.crt
    unwanted-reply-threshold: 10000
    use-caps-for-id: yes
    val-clean-additional: yes

    ###########################################################################
    # FORWARD ZONE
    ###########################################################################

    # include: /opt/unbound/etc/unbound/forward-records.conf

    ###########################################################################
    # LOCAL ZONE
    ###########################################################################

    # Include file for local-data and local-data-ptr
    include: /opt/unbound/etc/unbound/a-records.conf
    include: /opt/unbound/etc/unbound/srv-records.conf

    ###########################################################################
    # WILDCARD INCLUDE
    ###########################################################################
    #include: "/opt/unbound/etc/unbound/*.conf"

remote-control:
    control-enable: no
```
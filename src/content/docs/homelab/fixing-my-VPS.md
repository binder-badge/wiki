---
title: Slimming down my VPS's
description: Documenting the process of migrating Docker applications to bare metal on a VPS
---
## Introduction
As a part of my infrastructure, I have 2 public servers as a part of my network. They are VPSs from Oracle using their free tier, each with 1 CPU core and 1 GB of RAM. I use them to run a variety of tasks. I mainly run lighter apps like PsiTransfer for file sharing amd wastebin to share text, or "proxy-related" applications like Wireguard, 3X-UI to run X-ray proxies, or Headscale. 

## The problem
Now while these Oracle VPSs are very useful, they are not very performant. Trying to run multiple applcations would make the management of these boxes a complete pain. SSH would take forever to open and was sluggish to use, nigh near unusable. Some months, the services running will drop out as the boxes themselves have completely locked up and needing forced reboots. APT updates would take too long, and lock up the box. My CPU and memory would constantly be pegged at 100% usage.  

Overall, this was a pretty terrible experience. I was spending more time troubleshooting my public VPSs rather than actually using the services running on them. 

### Diagnosing the root cause
Considering that my main constriant was resource usage, I first looked at what services I ran on these boxes. 

Both VPS's were running only Docker apps. Both had Traefik as their reverse proxy. VPS 1 had Headscale, Headplane, 3X-UI, and WG-Easy. It also ran other support services like Watchtower and Dozzle for updates and Docker monitoring. VPS 2 meanwhile were running more public facing applications. It was running wastebin, PsiTransfer, Gotify. It also ran WG-Easy and 3X-UI.

Now while these apps are not the heaviest programs to exist, they definitely had some impact on my servers. I felt that the number of apps I was running also definitely didn't help the situation. I also figured that Docker might also introduce some overhead as they don't run just the applications themselves but also their dependencies.

## Fixing the issue
While it was initially fine, my Dockerized apps was starting to become a burden on these machines. While I didn't do a deep profiling to see what services were taking the most resources, I decided to completely kill my Docker services entirely. I killed all of my containers, and then stopped the Docker service. With nothing running, I was finally able to actually use SSH without wanting to do throw my laptop at the wall. 

With a fresh slate, I had decided to start moving some apps to run as bare metal applications. I would still keep Docker around just in case I wanted to run Docker only apps, but I would run most of my apps "traditionally" with a bare-metal deployment. I reviewed my needs at the time and figuring out what applications I needed to get back to a bare minimum state. 

My Headscale-Tailscale setup was my primary remote access solution for my lab, so I prioritized getting VPS 1 back up, as that was designnated for running Headscale. I figured that I would at least get my Traefik reverse proxy back up on both servers before anything so that I can get Let's Encrypt certificates for my services. After doing that, I made a copy of my Headscale keys, database, and configurations. I installed the Headscale package for Debian/Ubuntu, and put my data in the appropriate places. Started up Headscale with `systemctl start headscale`, updated my dynamic Traefik config to point to the new Headscale instance, all was good. I had tried to run Headplane, my Headscale admin panel, as bare metal, but `npm` proved to be troublesome as my server locked up during installation. I decided to run this in Docker to prevent the headache oh having to deal with `npm`. 

Once it was done, I moved onto VPS 2. This was also an important machine as that was what provided push notifications for my lab via Gotify. There wasn't much to say about this. I just followed the Gotify guide for doing a bare metal installation and moved in my database, as well as my custom images for notifications. 

## Conclusion
As for the other applications I ran previously, I figured that they were simply not needed, and were not worth running. I was the only person actually using the services, and even that proved to be unreliable. They were also not core to my infrastructure and were sometimes redundant. I didn't need a public file upload site when I had one internally for myself and my devices. I didn't need to run multiple VPNs and proxies as I was not in a country that warranted it. Watchtower and Dozzle were not needed as I no longer used Docker to deploy and run my apps. I might get back into running X-Ray proxies as it is something I'm curious about. Otherwise, these applications would lay dormant and be brought up when needed. 

Now I was no longer fighting my public servers and it has been smooth sailing ever since. 
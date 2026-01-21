---
title: Baking a Pi in my lab
description: An article about integrating a Pi into my lab
---
## Background 
Since I've started tinkering around with my homelab and teaching myself server adminstration and networking during high school, I've always stuck with a single machine in my homelab. While that single machine served my needs pretty well, the stability of my simple lab hung on in the hands of my main server. I've always disliked that. I wanted my lab to be reliable, as well as a small little playground for me to tinker around with new services and to mess around with networking. 

However, living with my parents gave me some restrictions with what I could do with my lab. The physical space that I had for my lab was relatively small, as it was a small shelf in my parents' bedroom, that also stored the router along with other things. I also had the unoffical role as the network administrator of the house, as I was the most technically knowledgable in the house. This would mean that if something was wrong with the family's internet connection, or someone had an issue with their machine, I would usually hear my name along with every IT person's favorite phrases of "My WiFi isn't working!" or "Something is wrong with my computer!" This would force me to essentially do things in order to prevent instability and I couldn't do things that would potentially break their internet. 

Fast forward to me moving out of the house and bringing my homelab with me for college, I now had my own space. I also bought a Raspberry Pi 3B+ kit as that was one of the things needed for one of my classes. I had only used the Pi once for that class, and never again. Now that I had a 2nd computer that I could use as a 2nd server, I realized that I can finally add a 2nd machine into my lab, and make it more robust and redundant. 

## Well, what now? 
Now that a 2nd server was in my hands, I started thinking up for some potential uses for using this thing in my lab. I mainly wanted to have redundancy for certain important services in order to keep some level of functionality in case of my main server going down. I also had to consider that this was a relatively weak single board, so I didn't have plans to run many things on it. 

I had also started experimenting with Raspian and Ubuntu for the Pi. I was considering Alpine, but I am lazy and didn't want to do a lot of work to get stuff working. After some testing with various operating systems, I had settled on Raspberry Pi OS Lite. This was because it was already something that I am using and was familiar with. It was also a bit lighther than Ubuntu. 

Now that the OS was settled on, I now had to decide what services this should run. On my main server, I had a variety of services available. I had 
- uptime monitoring
- DNS ad-blocking
- music streaming
- podcast streaming
- 3rd party viewers for social media like Twitter and Reddit
- video and picture conversion tools
- PDF editing tools
- a search engine
- and many many more services. 

While it would be nice to have a full replica of my services but running on a secondary server, I realized that replicas of most of these services wouldn't be that useful. I also had limited resources on a Raspberry Pi. After some deliberation, I decided I would host
- redundant DNS for my network
- uptime monitoring
- backup entry into my homelab in case of my main server going down

## Time to deploy
With the goals laid out, I got to work with setting up the Pi. I flashed the stock SD card with Raspberry Pi OS Lite, with SSH and user account already configured. Once I ran a `sudo apt update && sudo apt upgrade` to update my Pi, I had taken a look at some of my choices for setting up my desired services. I had initially planned to use Docker to setup some of my services. However, I decided against this as this seemed a bit overkill for hosting a smaller set of applications like in this case. It also didn't help that I had a friend tell me that they've accidentally killed their Pi by running too many Docker applcations. This gave me the final push to revert back to simpler times and deploy things bare-metal on the Pi. 

For my applcations, I would deploy the mostly the same ones that I use on my main Debian server. I would have
- Unbound and PiHole for DNS
- Uptime Kuma for uptime monitoring of some of my important services as well as the uptime of both of my public VPSs
- Tailscale to have the server act as a 2nd subnet router into my network and for remote access
- NGINX to route traffic for the web panels of each applcation and to serve HTTPS
- Cockpit to provide a nice admin GUI for monitoring my Pi

## Conclusion
As for the deployment of these applcations, there isn't much to write home about. The deployment just went off without much fan fare. I setup a subdomain for my Pi, got wildcard HTTPS certificates for my subdomain using Certbot, and had NGINX serve my web panels for Cockpit, Uptime Kuma, and PiHole with their own sub-subdomain and HTTPS. I setup my monitors for my 2 VPSs, as well as for DNS within my lab, and some of my most used internal services. 

On my main server, I had updated my Homepage dashboard to add a few widgets and bookmarks for the services on my Pi.

With that, I had offically integrated a Pi into my lab. It now serves as a secondary machine that provides some redundancy for my homelab in case my main server fails and won't have unhappy family members hounding me to fix their broken internet. 
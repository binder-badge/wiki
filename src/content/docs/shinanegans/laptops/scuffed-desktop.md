---
title: Making a Scuffed Desktop
description: Documentation on how I made an old laptop into a custom desktop
---
## Introduction
What if you have an old laptop? What if it's an old laptop that isn't worth repairing or don't want to repair it? This is a situation I found myself in for a few years. I had an old laptop (a `Lenovo Ideapad 300-17ISK` to be exact) given to me from a friend and it had been collecting dust in my closet for a few years. I had already pulled the more useful bits out of it and used it for other things. I pulled out its 500GB hard drive for use in my homelab, and RAM I had stowed away for potential use in other projects. (I never ended up using it. I had nothing that used DDR3). The bottom casing of the laptop was broken at the hinge point, and decided that It wasn't worth replacing. The laptop was a couple years old. Even if I had replaced the casing, I would likely run into the same issue a year or 2 down the line, as the casing broke at the hinge area. I had decided to just scrap the casing, and replace it with a custom solution, one that is potentially more sleek, and maybe smaller. I wanted a desktop, maybe to give to a friend, or as a media PC for myself, or as a new addition in my homelab as a redundant VPN or DNS box.

An idea like this had already been stewing in my head, just lack of motivation and life got in the way. The difficulty of this would also stop me from starting this as I wanted to preserve most of the internal components like the daughterboards to make it as port-rich and feature rich as possible. If I only wanted to have the motherboard and storage, then it would be much, *much* easier.  

Unfortunately, as the snob I am, I wanted this to be absolutely packed with features. This should be a *fun* experience. 

Who am I kidding? This is going to be painful. 

## My plans
For this project, I want to add some features to this to make this a beauty to use and/or fix, despite its internals. 

I wanted an end product that was somewhat elegant, both on the outside and on the inside. I wanted a computer where I could operate on it almost like a normal tower-style PC, where I can screw open a panel, and have easy access to what I would usually want easy access to. Things like the RAM, storage, and wireless card I want to be accessible from a single side. I also hoped that I would make a custom case for this thing, using wood and 3D printed parts.

The laptop would have a few major parts I wanted to make use of. These are the
- Motherboard (of course)
- Battery
- The daughterboard for the headphone jack and 2 extra USB ports
- The daughterboard for the DVD drive
- Speakers
- Power button board and cable

Let's go through all the listed parts and their uses one by one. 

The battery would be used as mini UPS for the system, kicking in if AC power isn't available. 

The daughterboard for the audio jack and USB ports would provide extra ports for the system. 

I wanted to replace the original DVD drive for an extra hard drive, so I would need the DVD drive board for that upgrade. 

The speakers are there to act as either a fallback audio option, or to act as BIOS speakers. Having some kind of fallback would provide me with some kind of safety net for audio and serve for easier troubleshooting. 

I wanted to preserve the daughter board for the power button as I am not smart enough to solder on a dedicated power button.  

## Dissembling the Laptop
Just like any good tech in a shop, the first step was immediately going onto Youtube, looking for a teardown of my model of laptop. Luckily, there were a few videos already out there. I'm not going to dive too deep into the teardown process as I just followed the videos. The teardown was *okay* for the most part. However, I encountered a few major snags. Below is a list of them, and how I solved it 
### Issues
- sThe power plug took way too much time to remove. It seemed like it was still stuck to something, despite it being very, very loose. 
	- I pried it upward from under using my screwdriver
	- I also had to use a little bit of force to do so
- The display cable was horrible to remove
	- There was a little handle made of tape that you're supposed to pull upwards but I broke it
	- You have to use ***a lot*** of force. I felt as if I was going to destroy the connector, but I had to pull hard in order to get it out. 
- Removing the keyboard was a bit confusing
	- A video I was watching for the teardown showed the keyboard being popped up from the top, but I couldn't seem to find an opening there. 
	- I looked at a different video which was a battery replacement guide. That guide showed the keyboard being lifted from the bottom right corner. That worked and allowed me to pry off the rest of the keyboard. 
### A small rant
I'm gonna go on a small tangent about this laptop and how it's been laid out. The way that you have to replace the battery, one of the most commonly replaced parts in a laptop, you have to almost dissemble the entire thing in order to get to it. You need to unscrew the back screws, remove the keyboard, and then remove the top panel. This would then expose the motherboard, and the connector for the battery. In my non-professional opinion, this isn't great as this puts a big barrier for doing basic maintenance on this thing. You have to do many steps in order to even access the battery. 

To conclude this section, tearing apart this laptop was a new experience for me, and taught me a little more about how laptops are laid out. However, this was at times an absolute pain to take apart, especially that display cable. 

## Testing and Maintainence
At this point, I had all the major internal parts of the laptop. I had the:
- motherboard
- DVD drive
- power button board
- board with extra IO
- speakers 
- a battery. 

Now I needed to make sure that things were working, with the first part being the motherboard. I connected the power plug into the motherboard, hooked up a portable monitor I had, and plugged the laptop into power. The motherboard booted right up, and outputting the `No boot media` screen onto my display. Great! Now I know that the absolute basics are up and running. 

I shut down the machine, plugged in a spare 250GB SATA SSD and my Ventoy USB. I installed Linux Mint, as it was a nice distro, and I didn't want to put the time into setting up a fresh Windows install. Wasting hours waiting for drivers and updates to install seemed like a waste of time, especially on a hobby project like this. Linux just seemed like the best option for a situation like this. I installed and setup Mint, plugged my phone in for USB tethering, and got `Prime95` to stress test the system (primarily the CPU) and `btop` to monitor the system. It was hovering around 50-52 degrees when being slammed on all cores, After doing an initial 10 minute test to verify things are not crashing and burning, I stopped the stress test, and turned off the computer. Now it was time to give this machine some care. I took off the heatsink and fan. I repasted the system,and cleaned out the fan using an old toothbrush. The motherboard itself wasn't dirty, so I didn't clean it. Once I put it all back together, I ran `Prime95` for around 15-20 minutes. It was stable and didn't even go past 50 degreens. 

Once I stopped, I got to work on testing the other components. Plugged in the IO board, all ports on it worked and was being seen by Mint. The stereo speakers worked and played sound on both speakers. The power button board contained a power button, and powered on the machine when I pressed the button. The DVD drive was tossed to the side as I wasn't planning to use it and was going to be replaced by a DVD drive replacement shell for an extra hard drive. Now it was time to move onto the next phase, planning and brainstoming. 

## Planning and Brainstorming
Now that I know that all the parts that I needed are functional, I can finally start moving parts around to map out a layout to use. I first connected all the parts together in a pretty similar layout to how it was while it was inside the case. While this was a sensible layout, I wanted to avoid it as took too much space horizontally. I noticed that the cable for connecting the IO board to the motherboard was pretty long, so I had the idea to move the IO board under the motherboard. The speakers also had decently long wires, so I did the same thing to it as well. Now all that was left was the 2 hard drives. I couldn't do much about those as the cables for those didn't allow as much freedom in the placement.


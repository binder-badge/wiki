---
title: Proxying Minecraft with FRP
description: A guide for proxying a Minecraft server using FRP
---
## Introduction
This guide is for running a proxy for Minecraft in the more literal sense. This will not go over how to setup a proxy like Velocity and setting up routing from a single proxy server to multiple Minecraft servers. This is for setting up a tunnel connection between a public proxy server and a Minecraft server. People will send traffic to the public server, which then gets directed to the Minecraft server. 

## Backstory
So imagine yourself in this situation. You've just setup a new Minecraft server. You can play on it by yourself, on your own network, no issue. However, there's a problem. Some friends (or a friend, whatever case you're in) want to join you in your new Minecraft server. With your new guests wanting to join in, you need to somehow expose it to the public internet so that your friends can join. You can port forward and directly expose your Minecraft server on its designated but maybe you can't port forward as you're behind CGNAT. Maybe you're not comfortable with poking holes in your firewall and exposing your home network to the public internet.

I found myself in this situation a while back, as I was setting up a Minecraft server for myself and someone else to play on. I had VPN access back to my house, but that wasn't really great as it would allow only me to play on the server, and my friend would need to install my VPN software and configure it to join my VPN in order to remote back into my house and play. 

I looked for some ways to expose my Minecraft server without having to port forward on my home network. I banged my head against the wall for a while. It was not fun. I tried [playit.gg](https://playit.gg/), [rathole](https://github.com/rathole-org/rathole), iptables port forwarding, and NGINX streams. All seemed to either not work at all, or be unreliable in my case. I tried destroying and recreating my public server to no avail.

## Tutorial
After a few weeks of suffering, I stumbled upon [frp](https://github.com/fatedier/frp). It looked slightly intimidating, but was overall nice to setup. This program will need to be installed on both the Minecraft server and your public server. The Minecraft server is considered the client while your public server is considered the server. I will be referring to them as such. Here is a guide on how I've set it up for my Minecraft server(s):

### Requirements
- A computer running the Minecraft server (This guide assumes it runs Linux)
- A public Linux server with the ability to expose ports

### Server setup
1. Download the latest release from the [frp](https://github.com/fatedier/frp) Github using this command (good enough for 99% of cases, v0.63.0 was the latest version at the time of release)
```sh
wget -O frp.tar.gz https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_amd64.tar.gz
```
or by using this script to automatically get the correct download for your system
```bash
# coming soon^tm
```

2. Open up the downloaded file
```sh
tar -xvzf frp.tar.gz
```
3. Rename the extracted folder to `frp` for easier typing
```sh
mv frp_0.63.0_linux_amd64 frp
```

4. Enter the `frp` folder
```sh
cd frp
```

5. Move the `frps` (the server component of `frp`) executable to `/usr/local/bin`
```sh
mv frps /usr/local/bin
```

6. Remove all other files aside from `frps.toml`
```sh
rm -f frpc* LICENSE
```

7. Open `frps.toml` and replace its text with what's below. 
```sh
nano frps.toml # command for opening file
```

```toml
bindAddr = "0.0.0.0"
bindPort = 7000
auth.method = "token"
auth.token = "insert-super-secret-token"
```
This configuration will tell `frps` to run on port 7000 and setup authentication using a simple token. Of course, replace the sample token with a new token you made. You will also need this token later. 

Take note of the IP or domain that you used for your public server, as we'll need that later as well.

8. Expose port 7000 for `frps`
```sh
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 7000 -j ACCEPT
sudo netfilters-persistent save
sudo netfilters-persistent reload
```

9. Start `frps` with your `frps.toml`
```sh
frps -c /path/to/frps.toml
```

Congrats, you have now setup a `frp` server! Now we will have your client (at-home Minecraft server) connect to it!

### Client Setup
1. Download the latest release from the [frp](https://github.com/fatedier/frp) Github using this command (good enough for 99% of cases, v0.63.0 was the latest version at the time of release)
```sh
wget -O frp.tar.gz https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_amd64.tar.gz
```
or by using this script to automatically get the correct download for your system
```bash
# coming soon^tm
```

2. Open up the downloaded file
```sh
tar -xvzf frp.tar.gz
```
3. Rename the extracted folder to `frp` for easier typing
```sh
mv frp_0.63.0_linux_amd64 frp
```

4. Enter the `frp` folder
```sh
cd frp
```

5. Move the `frpc` (the client component of `frp`) executable to `/usr/local/bin`
```sh
mv frpc /usr/local/bin
```

6. Remove all other files aside from `frpc.toml`
```sh
rm -f frps* LICENSE
```

7. Open `frpc.toml` and replace its text with what's below. 
```sh
nano frpc.toml # command for opening file
```

```toml
serverAddr = "server.domain.or.ip"
serverPort = 7000
auth.method = "token"
auth.token = "insert-super-secret-token"

[[proxies]]
name = "bedrock-server"
type = "udp"
localIP = "127.0.0.1"
localPort = 19132
remotePort = 19132
```
This configuration will tell `frp` client to connect to the public server on port 7000 and authenticate using the token you made earlier. It connects the Minecraft server running on UDP port 19132 on your home computer to the public `frp` server's UDP port 19132. 

In this case, this is connecting a Bedrock server running in your house to the public `frp` server as a proxy configuration. Bedrock servers by default use UDP port 19132. The configuration options starting with `local` refer to the machine you're running the Minecraft server on, while `remote` refers to the public `frp` server you've setup earlier. 

On the public `frp` server, you'll also need to expose UDP port 19132, which can be done using these commands
```sh
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 19132 -j ACCEPT
sudo netfilters-persistent save # commands to save this rule to the machine so that it works after a reboot
sudo netfilters-persistent reload
```

8. Start `frpc` with your `frpc.toml`
```sh
frpc -c /path/to/frpc.toml
```

Congrats, you have now connected your home Minecraft server to your public `frp` server! From here, all your friends need to do is to connect to your public server in order to play. 

## Further Reading
Now that you have setup `frp` and connected your home server to your public server, there are a few things you can do to further improve this. 

### Auto-starting
With `frps` and `frpc` left as is, you would need to manually restart them every time you reboot either your home server, or the public server. This can be solved with setting up an auto-start service on both your home server and the public server. 

1. On the public server, create `/etc/systemd/system/frps.service`
```sh
sudo touch /etc/systemd/system/frps.service
```

2. Open `/etc/systemd/system/frps.service` and paste in this text
```sh
sudo nano /etc/systemd/system/frps.service
```
```
[Unit]
Description=Fast Reverse Proxy tunneling server

[Service]
ExecStart=/usr/local/bin/frps -c /home/<username>/frp/frps.toml

[Install]
WantedBy=multi-user.target
```
* Remember to replace `<username>` with the name of your user on the public server

3. Save and exit. 

4. Start and enable the service
```sh
sudo systemctl start frps.service
sudo systemctl enable frps.service
```

5. Check the status of the service
```sh
sudo systemctl status frps.service
```

On your home server, the process is identical. Just replace `frps` with `frpc`.  


### Using a Java Minecraft server
If you're running a Java server instead of a Bedrock similar, the only thing that needs to be changed is the `iptables` command used and the `frp` configs used on both the server and client. 

#### Server Changes
Instead of running:
```sh
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 19132 -j ACCEPT
``` 
you would instead run:
```sh
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 25565 -j ACCEPT
```
This would expose TCP port 25565 on the server, as that is the default port of a Java server. If you chose to use a different port, replace 25565 with your desired port. 
#### Client Changes
In your `frpc.toml`, replace your `[[proxies]]` section with the text below.
```toml
[[proxies]]
name = "java-server"
type = "tcp"
localIP = "127.0.0.1"
localPort = 25565
remotePort = 25565
```
- If your Minecraft server is on a different port, simply replace the value of `localPort` to your desired port number. 

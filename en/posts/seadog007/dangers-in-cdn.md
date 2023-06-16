---
title: "The Hidden Dangers of CDNs: Why CDNs May Not Be as Secure as You Think"
date: 2023-06-15
tags: [Security, CDN, Cloud, Internet, Network, Networking]
author: seadog007
layout: en/layouts/post.njk
image: /img/posts/seadog007/dangers-in-cdn/cover_en.png
---

<!-- summary -->
Content distribution networks (CDNs) are an important part of the modern Internet, providing fast and reliable connections and network resources to users around the world. However, while CDNs offer many benefits, they also introduce new security risks that many people may not be aware of. In this article, we'll explore the hidden dangers of CDNs and examine why CDNs may not be as secure as you think. Explore how to protect yourself and your business from these potential security risks that CDNs might introduce. This article will help you better understand the potential risks involved with CDNs and how to mitigate them.
<!-- summary -->

## What is CDN?
CDN stands for Content Delivery Network or Content Distribution Network.

Many companies have written a detailed introduction to CDNs, such as Cloudflare, which is a major player in CDNs, has done a detailed introduction
- What is CDN?](https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/)

Here to briefly introduce, CDN is basically a group of servers placed in different places, these servers provide nearby users access to relevant web pages, in order to achieve a variety of different functions.
![](/img/posts/seadog007/dangers-in-cdn/cdn_cf.png)
(Source: [Cloudflare Blog](https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/))

### Why use CDN?
"Can't we just use our own server and let users connect directly? Why do we need a CDN?"
You might think so, but in reality, CDNs have become the norm on larger sites because of the amount of resources they have and the different features they offer.
![](/img/posts/seadog007/dangers-in-cdn/cdn_benifit.png)

For example, because the servers and network nodes placed by CDN vendors exist all over the world, the main function is to help users who purchase CDN services to save bandwidth on the original server. It can also receive DDoS traffic from that region and do the first layer of blocking.

Because of the wide distribution of CDN sites, CDNs can also provide lower connection latency for users in the corresponding area, improving connection speed.

Most CDNs also provide HTTPS Reverse Proxy service, which adds HTTPS protection to services that originally did not have HTTPS.

Some CDNs even provide WAF/IP rules protection, which can protect the hosts behind them from various malicious attacks. It can also help to prevent attackers from getting the original site IP.

### How does a CDN work?
As I said earlier, a CDN is actually a set of servers around the world that forward requests back to the original site when users connect to them. If you draw a picture, it should be like this.
![](/img/posts/seadog007/dangers-in-cdn/cdn_work.png)

## The Risks Introduced by CDNs
The use of CDNs is not risk-free. After all, information on a website passes through the servers of CDNs before reaching the user, and these CDNs may provide some additional functionality. When a website is set up incorrectly, it may lead to some security risks. Such as
- Wrong IP logging method
- Invalid Cache mechanism
- Unexpected transport protocols
- Bypassing blocking lists
- Domain reputation impact

Of course there are many more risks might be associated with CDNs, but for the limitation of this article, these are just five examples.


### 1. Wrong IP logging method
Generally, the HTTP server records the IP address by using the Src IP field of the TCP socket.
However, if the request is forwarded from CDN today, the Src IP of the TCP scoket will become the source IP of the CDN server because the CDN server will be the source of the request to the origin, which will cause the origin server to record the wrong IP and lead to problems in the subsequent forensic investigation/event response/audit related process.
![](/img/posts/seadog007/dangers-in-cdn/ip_wrong.png)

To solve this problem, CDN vendors usually insert a specific HTTP Header into the forwarded HTTP request to tell the actual client's IP to the origin server
![](/img/posts/seadog007/dangers-in-cdn/ip_http_header.png)

The CDN server in the above image uses the Real-IP header to tell the origin server the actual client's address in the forwarded request.

These default HTTP Header Names are actually well-known if you have used them, and fewer people will change them, e.g:
- Cloudflare: CF-Connecting-IP
- Akamai: True-Client-IP
- Cloudfront: CloudFront-Viewer-Address
- Fastly: Fastly-Client-IP

If an attacker knows the location of the origin server (e.g., by scanning the entire network), the attacker can send a request with a specific HTTP Header directly to the origin server, thereby achieving the effect of spoofing the IP and causing false records. Even Bypass related ACL settings.
![](/img/posts/seadog007/dangers-in-cdn/ip_log_attack.png)

#### Mitigation
There are actually two methods to solve this situation
- Only Rewrite the requests from the CDN
- Directly block all requests from non-CDN servers

1. if only the requests from CDN servers are rewritten, they will be logged to the correct IP as shown in the picture below. The disadvantage of this solution is that it is more difficult to implement and configure if you are not using a common Reverse Proxy (e.g. Nginx, Apache) to log the relevant IP
![](/img/posts/seadog007/dangers-in-cdn/ip_log_partial.png)

2. directly blocking non-CDN requests, this way is faster and better to set up, and you don't have to worry about two different situations (CDN/non-CDN traffic)
![](/img/posts/seadog007/dangers-in-cdn/ip_deny.png)


### 2. Invalid Cache Mechanism
Most CDNs provide a cache mechanism so that the originating site will not keep receiving repeated requests and wasting traffic, but if the cache mechanism is set incorrectly, it may also cause security risks. Such as
- Malicious implantation of front-end backdoors (aka. cache poisoning)
- Leaking user information

#### Why does this happen?
The CDN determines whether a resource is to be cached or not, usually by using the file extension or the MIME type returned by the server. For example, Cloudflare is to use only the file extension to evaluate.
![](/img/posts/seadog007/dangers-in-cdn/cf_default_cache.png)

If your CDN only uses the file extensions as the criteria, this may lead to a situation where `/test.css?v=1` and `/test.css?v=2` may be different things on the original site, but return the same result after passing through the CDN.

CDNs usually have settings that can be changed to determine which features (e.g. HTTP Path/Query) should be used to determine if this is the same resource.

#### Case Study - ChatGPT
The ChatGPT server rewrites the HTTP Path incorrectly, resulting in `/session` and `/session/test.css` both pointing to the same API.
![](/img/posts/seadog007/dangers-in-cdn/chatgpt_tweet.png)

However, because ChatGPT uses the Cloudflare that uses the file extension to determine if a resource should be cached, this request for `/session/test.css` will be cached by the CDN. The attacker can do the following:
1. send the link `chat.openai.com/api/auth/session/aaa.css` to the victim (or just spread it around for others to click)
2. when someone clicked the link, the CDN server will cache the response
3. the attacker can now access this link to get the ChatGPT Access Token of others

![](/img/posts/seadog007/dangers-in-cdn/chatgpt_hit.jpg)
(Source: [https://twitter.com/naglinagli/status/1639351113571868673](https://twitter.com/naglinagli/status/1639351113571868673))

#### Mitigation
- Set the Cache-related settings properly
    - Very difficult
    - Check that the following settings are consistent on the CDN and the original site
        - URL rewrites
        - Parameter
- Use the frameworks to set the HTTP Cache-Control Header so CDN can cache properly.


### 3. Unexpected transport protocols
CDNs usually help you to enable some newer protocols that you may not be aware of, such as HTTP/2, HTTP/3, QUIC, IPv6, and so on.

Take IPv6 as an example, usually CDN will help you to enable IPv4 + IPv6 Dual Stack, so that people using two different IP protocols can connect to your website. The following figure shows the related configuration of Akamai Site Accelerator
![](/img/posts/seadog007/dangers-in-cdn/akamai_v6.png)

However, there are CDNs that are turned on by default and cannot be turned off, such as Cloudflare
![](/img/posts/seadog007/dangers-in-cdn/cf_v6.png)

This may lead to unexpected errors in the application, or the associated ACL may be bypassed.

#### Case Study - Popcat
For those who don't know what [Popcat](https://popcat.click/) is, here is a short introduction. Popcat is a click-based game that aggregates player clicks to the API and adds them to the leaderboard for the country the IP belongs to.

- Popcat is divided into two parts
    - Front-end
        - Returning the total number of clicks from the front-end to the API every 30 seconds
    - API
        - A request can only contain 800 clicks
        - Only one HTTP request for the same IP within 30 seconds

Our purpose is obviously to get a bunch of IPs for our ranking. However, the game designer did not consider the IPv6 protocol at the beginning of the design, probably because his original host only has IPv4 support. After the game designer use Cloudflare as CDN, we can see that the DNS result actually has AAAA (IPv6) DNS records, which means we can use IPv6 to connect to this site.
![](/img/posts/seadog007/dangers-in-cdn/popcat_v6.png)

We can get a large number of IPv6 locations in several ways
- With Own v6 Allocation
- ISPs provided IPv6 Address
- 4in6 Tunnel

More Details: https://hackmd.io/@seadog007/popcat

#### Mitigation
There are two solutions to the mitigation the risks associated with the introduction of IPv6 in CDNs
- Disable the IPv6 feature of the CDN
- Find a way to make the native application support it
    - Non-self-developed systems may be a problem

### 4. Bypassing Blocking Lists
CDNs often have a variety of built-in blocking lists to provide some compliance or easy firewall functionality.
For example, Akamai's built-in lists are divided into two types: IP and GEO
![](/img/posts/seadog007/dangers-in-cdn/akamai_bl.png)

Another example is Cloudflare's built-in Geo Firewall Policy, or the paid version of the IP List
![](/img/posts/seadog007/dangers-in-cdn/cf_rule.png)

![](/img/posts/seadog007/dangers-in-cdn/cf_bl.png)

These features may help website operators in different scenarios, such as ITAR, OFAC region lists for compliance purposes, and some game operators use them to restrict the regions where games can access the API due to regional distribution needs.

However, if you study a little bit more, it is not difficult to find that different CDN vendors implement GeoIP in different ways: for example, Cloudflare uses Maxmind's DB to do IP country classification, while Akamai crawls IRRDB to the lowest level to determine the IP country (equivalent to whois).

What problems will this cause? We can use different ways to fake the IP location of the region, so that it is not the same as the actual IP usage area, and then bypass the relevant settings, we can also work with the IPv6 problem mentioned earlier in this article, to allow attackers to bypass the ACL set by the site at a very low cost.

#### Demo - Akamai
1. We need to first take a >/48 segment of IPv6, such as the `2a0f:5707:ffa4::/46` IP segment used here
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_1.png)

2. create a more specific inetnum6 whois data, where the Country field can be filled in by yourself
For example, here is an IP segment of /48
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_2.png)

"Country: KP" specifies that this IP segment belongs to DPRK
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_3.png)

3. If we use this IP to connect to a CDN (such as Akamai) that uses IRRDB as the source of the GeoIP, we can now bypass the relevant blocking rules
Here you can also use the tool provided by Akamai to do GeoIP check
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_4.png)

By doing so, we can also create IP segments of other countries, like the Japanese segment that we can use to play Japanese games without worrying about being blocked from using VPNs.
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_5.png)

#### Demo - Cloudflare
If the CDN vendor is using an external GeoIP DB for the CDN, such as Cloudflare, we can work from the external DB
We know that the GeoIP DB used by Cloudflare is Maxmind, then we can found that Maxmind has a GeoIP correction form.
https://www.maxmind.com/en/geoip-location-correction

Malicious attackers can also use this method to bypass the Geo type blocking list by modifying the specified IP to another country.

#### Mitigation
- Compare the GeoIP implementations used by various CDNs
- Don't put too much faith in the GeoIP related rules of CDNs
    - VPN, springboard, etc. may be used
    - The native IP address is the one that has been changed


### 5. Domain Reputation Impact
To understand this weakness, first we need to understand the operation principle of HTTPS and HTTP Reverse Proxy.
First of all, a CDN server might be responsible for thousands of websites with one IP address, so users of these websites will all connect to the same server, and the CDN server will have to determine where the users want to go.

HTTP Reverse Proxy (CDN is also a kind of Reverse Proxy) uses the Host field in the HTTP Header to determine which website the user wants to connect to.

In the other hands, because HTTPS is protected by SSL/TLS, Reverse Proxy cannot see the HTTP Header before the SSL/TLS handshake is completed, so how can it determine which website the user wants to connect to? For this problem, Reverse Proxy uses the Server Name Indication (SNI) field in SSL/TLS Handshake to make the determination.

This is also how we can specify which HTTP site to connect to using `-H Host`
`curl -H 'Host: www.example.com' http://<ip>`

However, HTTPS sites cannot be connected to by specifying the HTTP Header (unless it is the Default Server for that IP)
`curl -H 'Host: www.example.com' https://<ip>`
will likely to fail

We have to do this by using curl's --resolve parameter
`curl --resolve www.example.com:443:<ip> https://www.example.com`

Many firewalls use the SNI as the criteria for determining HTTPS traffic.
So what happens if these two fields don't match? We use SNI "A" with HTTP Host "B". If the CDN Server is using SNI Prefer Forwarding, it will simply look at the SNI to decide which origin site to forward the request to.

But if the CDN is using Host Prefer Forwarding, at this time, the site you connect to with SNI A will see the content of site B, and then there may be a situation that attacker can use.
![](/img/posts/seadog007/dangers-in-cdn/fw_table.png)

Because this issue has existed for some time, some CDNs have made corresponding fixes for this issue, and in the case of inconsistent SNI and Host Header, the response from each CDN probably looks like this
- Cloudflare: 403
- Cloudfront: 403
- Akamai: 503 or 400
- Fastly: Host Prefer Forwarding

Fastly does not have proper blocking and prevention, we can use this to achieve an attack called Domain Fronting. In a worse case, if the CDN does not check the ownership of the domain when adding the domain, we can add a domain with any name to do the forwarding, which can also bypass the detection in an environment with SSL Inspection.

For example, we can add a domain called there-is-no-way.this.exist.com to Fastly, and when browsing in an environment with SSL Inspection, the HTTP Header we see will be this Domain.
![](/img/posts/seadog007/dangers-in-cdn/fastly_1.png)

#### Demonstration
We first added a domain `www.president.gov.tw` to Fastly, and we know that `bbc.com` is using Fastly's service, so we can curl to access this site.
![](/img/posts/seadog007/dangers-in-cdn/fastly_2.png)

At this point the various inspection mechanisms will appear to look like this
- SSL Inspection (HTTP Host Header): www.president.gov.tw
- SNI Inspection: bbc.com
- IP Firewall: 151.101.64.81 (AS54113 / Fastly, Inc.)
- Content: 103.147.22.128:80 (not realted with the above at all)

The actual location of this content will not be visible to any inspection mechanism on the client side because it uses the feature of CDN to hide the IP of the original site, which makes it more difficult to identify and block malicious attacks.

#### Case Study - China APT
China APT has used pypi.python.org as a fronting domain, and the various client-side blocking mechanisms would look like this
- DNS: Query for pypi.python.org
- IP Based Firewall: Connect for Fastly (151.xxx.xxx.xxx)
- SNI Check: pypi.python.org

Almost every check mechanism is bypassed, the below is related Cobalt Strike Beacon Profile looks like
![](/img/posts/seadog007/dangers-in-cdn/china_apt.png)
(Source: [Hiding in Plain Sight: Obscuring C2s by Abusing CDN Services](https://teamt5.org/en/posts/hiding-in-plain-sight-obscuring-c2s-by- abusing-cdn-services/))

#### Impact
This issue affects the reputation of domains such as bbc.com, which looks like this on Virustotal. The impact on the reputation of domains may result in emails being rejected or some users not being able to connect.
![](/img/posts/seadog007/dangers-in-cdn/bbc_virus.png)

#### Mitigation
For this kind of problem, basically, CDN users can only do limited things, they can only choose a good CDN vendor, or try to convince them to fix the problem.


## Conclusion
After reading this article, do you think using a CDN is really bad? Of course this talk and this article are not meant to tell people not to use CDNs. In most cases, the benefits of using CDNs exceed the drawbacks of using CDNs significantly.

CDNs offer more protection for site administrators, but CDN customers still need to check the Best Practices Guide for CDNs and compare different CDN vendors. Finally, don't put too much trust in the features offered by CDNs, as they may cause the original site to malfunction or introduce weaknesses.

Feel free to leave a comment or contact [Cymetrics](https://cymetrics.io/en/) directly for assistance with any security-related questions.

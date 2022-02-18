---
title: Taming the OSCP
author: crystal
date: 2022-02-18
tags: [Security]
layout: en/layouts/post.njk
image: /img/posts/crystal/oscp/cover.jpg
---

<!-- summary -->
<!-- The break of dawn on a August morning marked the end of my OSCP journey as I waved goodbye to my proctor and finally uploaded the exam report. Half a year ago, I wouldn't have dreamt of obtaining the OSCP, but now with the beast tamed and the struggle over, let me share my (fortunately) fruitful journey with you.
<!-- summary -->

It's going to be a really long post, and I know there are tons of resources out there about the OSCP, so feel free to jump further below if you're just looking for links and advice!

*Special note: I took the exam on 2021/8 so this may be a bit outdated depending on when you're reading!*

If you're trying to get a career in cybersecurity, you've probably heard of the OSCP. It's hailed as the gatekeeper of the penetration testing industry and you hear so many stories of people failing 3+ attempts before getting the certification. What's with this monstrous exam? Is it worth it?

## The OSCP

OSCP, which stands for Offensive Security Certified Professional, is the first of a series of certifications offered by Offensive Security (OffSec). Yes, you heard me right, it's a beginner's course. Every once in a while, OffSec upgrades their courses with new material and add or change offered certifications, so you might be confused when someone mentions an OffSec certification you've never heard of. You can see what's currently in stock on their site: 

#[OSCP certs](/img/posts/crystal/oscp/oscp-certs.png)

You can see from the naming that the code PEN-200 for OSCP is the most elementary and general, and you can get deeper with OSEP (PEN-300), test your web skills with OSWP(WEB-300), or get into exploit development with OSED(EXP-301) and OSEE(EXP-401).

#[PWK journey](/img/posts/crystal/oscp/certs-journey.png)

Here's also another picture I found on another site (but I forgot) that shows all the available cybersecurity-related certifications up until 2021/02. Can't comment if it's accurately rated by difficulty or not, but I still put it here for your reference:

#[certs](/img/posts/crystal/oscp/certs-all.png)

Back to OSCP, the course covers more breadth than depth to give you an overview on network penetration testing. It simulates a corporate network and requires you to quickly gather information, uncover simple vulnerabilities (such as outdated software, suspicious websites, services with excessive permission, etc), and weaponize discovered weaknesses to gain access to machines.

This is also why OSCP is a beginner's course - the vulnerabilities are often public exploits that need a bit of tweaking or weaknesses that should be simple to manually execute, like SQL injection, but NEVER some zero day vulnerability that you have to develop an exploit for. In other words, everything is **KNOWN and on the internet** if you know where to look for. In my opinion, the OSCP is more of a test on your enumeration methodology, basic skillset, and ability to sense rabbit holes. Sure it'll eliminate some script kiddies, but it won't make you an exploitation master.

## The exam

OSCP isn't your ordinary multichoice exam. You get 24 hours to compromise 5 machines, and then you get another 24 hours to write a complete penetration testing report, so the full length is 24+24 hours. Since it's an online exam, you will be proctored throughout the first 24 lab hours. 15 minutes prior to your scheduled exam time, you need to connect to the proctoring software, which uses your webcam and a screen-sharing chrome plugin, verify you identity with the proctor, show him or her your physical environment (yes you must show the entire room, including under your desk), and make sure your equipment is working fine. Any delay during this phase is your own loss, so I highly recommend to do a test session beforehand and clear possible issues. After your exam begins, the proctors will be staring at you until exam time expires or you choose to end the exam. If you're taking a bathroom break or have to leave your station for any reason, just give the proctor a heads up. And don't worry, the proctors work in shifts so they won't pull all-nighters with you.

A 24-hour test sounds terrifying, but the exam isn't designed to keep you blasting on your computer for 24 hours. It expects you to sleep, eat, rest, and do some exercise if need be. I recall someone on reddit saying that you should be able to finish the test within 12 hours, so don't hump instant noodles and coffee thinking you'll have to camp out on your desk and stress non-stop!

After finishing your penetration testing report, you have to compress it and upload to a site, and once you submit the file, you can't modify anything anymore, not even the filename, so make sure you follow instructions perfectly! There are lots of report templates on the internet, and OffSec also provides you with a simple one too. Most of the canned wording is filled in for you, so your main task is to complete the writeup for your exploitation, which should be pretty straightforward even if you've never written a professinal report before.

It's extremely important to remember that you no longer have access the the lab environment after your exam time, so take detailed notes and screenshots of every step because you won't be able to go fetch the missing pieces! I have the habit of writing my report as I exploit, so the report reflects my progress and by the time I'm done with the exam, I'm also done with my report.

Each machine is allocated points that you get for fully compromising the machine, distributed in 25 25 20 20 10 and sums up to 100. This means, for a 25 pointer, you'll have to get user and root access, *and* not get any deductions on your reporting to get full points. I'm not sure how many partial points are awarded for low privileged access, but you can find stories of people who compromised all 5 machines and failed OSCP because of bad reporting. That should tell you how much effort to put into the report. Overall, you pass OSCP if you score at least 70 points, so maybe don't stop too prematurely during exam time if you've only compromised borderline points. On the otherhand, if you don't manage to get 70 points during lab, don't bother with the report - take some rest and gather your strength for your next attempt! By the way, I think you get a maximum of 5 extra points if you finish all the course exercises and submit a complete writeup for that (didn't do because didn't thnk was worth it).

## Course and Equipment

The OSCP exam and course is sold in a bundle, so you're actually buying the PEN-200 course and one exam attempt. You can purchase additional exam attempts at a discount (hopefully you won't have to), but you can't solely buy your first exam attempt.

What's in the course? When you sign up you'll get a package with a 851 course pdf and 4GB of video, which is essentially an animated audiobook. You'll also get credentials to your VPN connection and forum account.

Before you start, you need a few things.

First, you need a Kali machine. The package comes with an older stable version of Kali, and I've heard people complaining about tool incompatibility since Kali is a rolling release, but I used my own up-to-date Kali and never encountered problems that Google couldn't solve.

Second, you need note-taking software. I personally like CherryTree which comes pre-installed in Kali, but I think anything you're familiar with should work. When going through the course and labs, try to organize your attempts, steps, commands, and screenshots. It helps you practice note taking and reporting, *aannddd* you never know if something similar will come up during the exam, so keep some reference!

As for the exam, after scheduling dates you'll get instructions on what and how to prepare and a FAQ site for reference. Expect:
* webcam: I used my Mac's camera and it worked fine, but you can use any external camera as long as the proctor can see your documents clearly from the other side
* internet: the course package comes with a README suggesting adequate ping times, if you want official reference. My network at home during labs is 16Mbps/3Mbps, and it mostly works fine though RDP and tunneling might lag a bit. Since there's additional screen-sharing and video during the actual exam, I went to my school's lab for higher bandwidth, but I think 100Mbps/60Mbps should be really smooth.
* ID documents: must be goverment issued and in English, so I could only use my passport. **Bear in mind the name on your ID has to exactly match your registered name!**

## Syllabus

The syllabus, roughly in order:

1. Intro to PWK(PEN-200): basically info mentioned above and exam rules
2. Basics
    1. How to install and use Kali linux and the command line
    2. Tools: netcat, powershell, wireshark 
    3. Simple bash scripting
3. Reconnaisance
    1. Passive recon: google hacking, email password dump...
    2. Active recon
        1. port scanning
        2. DNS, SMB, NFS, SMTP, SNMP enumeration
    3. Vulnerability scanning
4. Web attacks
    1. Manual exploration and common tools
    2. XSS, Directory traversal, File inclusion, SQL injection...
5. Buffer Overflow (Windows + Linux): very simple, don't even have to bypass NX, you just need return address + shellcode
6. Client-Side Attacks: HTA, Microsoft Word... (intro to making malware)
7. Finding, tweaking, compiling, and using public exploits
8. File Transfer Techniques
9. Anti-virus Bypass
10. Privilege Escalation
11. Password Cracking
12. Port Forwarding and Tunneling
13. Active Directory (AD)
14. Metasploit and Powershell Empire
15. Complete walkthrough of a penetration test

Unless you don't have any IT background, skip the Basics section. And if you're here to find a shortcut to OSCP, also skip passive recon, client-side attacks, anti-virus, port forwarding, AD, and Metasploit, which leaves you only 3/5 of the context. Don't get me wrong, these chapters are really valuable in real world testing, but they just won't be on the exam due to the it's structure and restrictions. 

Focus on the following if you're in a rush:

* Active recon
* Web attacks
* Public exploits
* File transfer
* Privilege Escalation

I've been playing on Hack The Box (HTB) for a while before starting OSCP, so I've got a basic level of understanding of most topics covered in the course and only spent a few days skimming through the pdf and picking up missing pieces. According to discussions on reddit, if you're starting on ground zero, try to go through the course materials and compile your own notes while completing the exercises. If you've got some exposure already, use the course materials as a review of or supplement to your knowledge base. It may get boring, but it tries to link the dots and you might get clarification on some details or uncover critical advice/tips! Every section in the pdf comes with exercises that you can try out (lab gives you exclusive client machines), and if you finish all of them and submit a complete writeup, you might get extra points on the exam!

Personally, the most beneficial part was the last chapter in which I was given a complete walkthrough of a penetration test. You're given a machine as the entry point and have to enumerate and choose between viable attack vectors to reach the AD which is several network layers deep. It not only strings together all the topics but gives you a complete picture of how you should tackle the task. Even though I knew individual techniques, I was missing a systematic approach to guide my attacks efficiently and effectively. I hunted after whatever came my way, which often resulted in hours down a rabbit hole and getting lost and tired when the obvious route was sitting there in plain sight.

> I think the ultimate goal in OSCP is to establish a stable and reliable methodology to help you plan and evaluate your attacks instead of blindly firing at every target.

By the way, you'll find official writeups for a few machines in the forum. They are super important and I definitely going through the walkthrough a few times because it will prune your methodology, explain how to analyze and choose targets, and save you many hours. 

*Do keep in mind that the lab machines are designed with rabbit holes to lure and trick you, so it's paramount to learn time management and how to determine the truly meaty baits.*

## Labs

The lab environment simulates a corporate network, roughly with the infrastructure below. You get to access a public network through a VPN, but you need tunneling to get into the internal IT, DEV, ADMIN departments. This is a shared environment, so don't forget to reset machines first, or you'll get a broken, misconfigured, or spoilt box.

The private segment contains a linux, a win10, and a windows server, all exclusively for you to practice in the exercises. You need to spin up the machines yourself and they'll shut down when you disconnect your VPN. I only used the win10 for the windows BOF exercises since they'll give you a similar debugging machine during the exam and I thought it would be safer to learn how to use the provided debugger.

#[Lab environment](/img/posts/crystal/oscp/lab-env.png)

As of 2021/08/19 (my last day with access to labs) there are 70 machines, excluding those meant for exercises, and includes 5~8 ex-exam boxes.

Your VPN credentials are also used to log into a student forum, which hosts discussions on machines, course materials, and any genral questions on the exam. You can chat of discuss with peers but moderators will delete comments that give too explicit hints (yeah, spoilers). You can ask just about anything from equipment requirements to specific techniques or even random suggestions to the course and you'll be answered most of the time.

## Preparation

Of course, the most awaited question: how do I prepare?

I don't believe there's a one-fit-all answer, but I'll show you my experience, thoughts, and resources.

I gave myself half a year to prepare, roughly from 2021/02 ~ 2021/08, thanks to all the terrifying stories on the internet. Starting February, I spent about 16 hours a week playing HTB, and because I wanted to do the exam right after doing labs, I signed up for 60 days lab access around the end of June and passed the exam end of August.

### Feb~June HTB

HTB is a really cool platform for hacking practice. You can play jeopardy style CTFs, play with hundreds of machines, learn specific techniques with tracks, or hunt AD machines in fortresses. It offers you so much resources to play around.

#[Hack The Box](/img/posts/crystal/oscp/htb.png)

The machines, or we call boxes, are similar to OSCP and come in different OSes and difficulties. You can play with a small batch of rotated boxes for free, and for a monthly fee you get access to all retired machines, which is in the multitude of hundreds. New boxes are released every month, and there's an official forum and a helpful community.

Most importantly, beginners can learn a lot of techniques and experiences from these boxes and the available writeups on the internet. My favorite resources are [ippsec videos](https://www.youtube.com/channel/UCa6eh7gCkpPo5XXUDfygQQA) and [0xdf hacks stuff](https://0xdf.gitlab.io) because they don't simply *tell* you the answer, but also guides you through their thought process, encountered pitfalls, and additional research or insights which I think is critical in building your own mindset.

On learning, my personal approach is to try everything I can think of, but when I run out of ideas I go for writeups and forum hints. Sure, I may stumble across the solution after a while, but for a beginner that's rather inefficient and unsystematic thinking.

> I'm not telling you to check writeups whenever you get stuck because you won't learn much this way, but I think when you've exhausted options it's time to learn from other people. You can't know what you don't know, and we all start our baby steps with imitating and copying others. Now's when you should check the resources I mentioned. Observe *how* other people think and modify your methodology, then try doing it yourself to really absorb the knowledge.

If you decide to do HTB, I recommend VIP access since it's only $10 pounds a month an you get hundreds of boxes to play. I mean, a retest costs $249 and if you don't need 2 years HTB practice for OSCP. If you need reference on OSCP-like boxes, check [TJnull's list](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=1839402159).

#[TJnull's list is constantly updating!](/img/posts/crystal/oscp/tjnull.png)

The OSCP-like boxes don't rate high on HTB, probably since you don't need much creativity so not as fun, but I tried to do all the easy and medium retired boxes that rated 4 or higher, starting from the oldest and easiest ones.

There was so much to learn, and I was a bit overwhelmed with all the stuff thrown my way. Every box had something new to offer, so I was constantly mindblown and rarely made through boxes without hints. Gradually though, my intuition got sharper and I started spotting weaknesses myself or narrowing down suspicious targets. The notes compiled during this period also proved useful in later stages.

By the way, I heard that [Proving Grounds (PG)](https://www.offensive-security.com/labs/) which is similar to HTB is also pretty nice. Though PG doesn't have as many machines, it was bought by OffSec so the boxes possibly resemble the exam machines more. PG is also included in TJnull's list.

### July~August OSCP Lab

After completing 80% of the easy and medium boxes (linux + windows) I thought I was ready for the OSCP lab. The pdf didn't take long because HTB taught deeper stuff, but OSCP was more coherent in terms of building your mindset.

I was a bit disoriented at first. Whether it be CTF or HTB, PG boxes, the challenges were always independent and straightforward, but now that I'm thrown into a vast network of machines, where and how do I start? Some machines are even dependent on each other, how do I choose my target?

This is where the OSCP methodology comes into play!

> You must first identify machines and their natures through massive scanning and DNS information, then granularly analyze the network, formulate a strategy, prioritize targets, and finally compromise them. You don't stop at the root flag; you roam the machine for loot, or juicy information that can lead you to other machines, and adjust your strategy as pieces gradually come together.

Sure, you can simply go through the list of IPs based on the flag submission page, but you'll miss out on the valuable experience of comprehensively understanding the battlefield and refining your strategies as you go. Think of yourself as a commander, you need to see the big picture to construct an effective and efficient plan.

I think this is also why opinion on the OSCP is quite polarized. The course aims to simulate real-world scenarios where users interact, have different behavior, and possess various privileges. Some machines are heavily guarded while others may run seriously outdated software. It actually does a great job training students to become well-rounded junior pentesters. However, the exam itself is a different story - you get five independent machines and your sole target is to get the root flags within the timeframe. 

*So I would say the OSCP course is a great learning experience, but if you just want the certification, other resources like HTB may be more suitable.*

In retrospect, I'm glad I did both. The downside to doing lots of OSCP boxes is that you get trapped in the very methodology you were trying to build. You do your scanning, poke at the services, find a possible foothold, find the exploit code, get a user shell, try the few escalation techniques you know, and get a root shell. Rinse and repeat. The problem is that it's always the same attack vectors and when you don't find anything, you brain tells you "it's got to be one of those, enumerate more" until you spot it. The process for HTB boxes is generally the same, but you need much more observation and exploitation techniques. You might find a suspicious file with the wrong permissions or in a weird location. You might have to reverse engineer executables to find and exploit vulnerable code. You might have to open multiple connections and monitor background processes during differnt logins. The possibilities are endless, but trust it won't be as simple as "searchsploit, run, get shell".

> To conclude, I recommend exposure in both aspects, whether it's my approach (start with HTB to learn techniques then build strategy with OSCP) or the other way around (build foundation with OSCP then use HTB to train 'thinking outside the box').

### End of August: OSCP pre-exam

We've all done dry runs back in school, so why not with OSCP? One of the best ways to train time and stress management is to give yourself a complete mock exam. It's better to know your own pace and find your optimal strategy than barge into the exam without mental preparation.

Try to schedule a 24 hour timeframe matching the day and time of your actual exam, and follow the test rules to compromise 5 machines. That means no Metasploit, no peeking at hints or writeups, no phones during test time, and taking notes as you would for the report.

For the 5 machines, I used the ones recommended in [John J Hacking - The OSCP Preparation Guide 2020](https://johnjhacking.com/blog/the-oscp-preperation-guide-2020/):

* Buffer Overflow Machine: VulnHub Brainpan (25 Points)
* Jeeves (25 Points)
* Chatterbox (20 Points)
* Cronos (20 Points)
* Sense (10 Points)

TJnull also suggested another set on VulnHub:

#[Dry run](/img/posts/crystal/oscp/dry-run.png)

> Don't fret if you don't score 70 points. The point of a dry run is to help you assess how well prepared you are and pinpoint areas for improvement. You've still got time! If you sailed smoothly, you earned some confidence to calm your nerves; if not, you earned knowledge and techniques for the actual exam!

## Resources

Listing some resources and blogs that helped me a lot:

Boxes:
* [Hack The Box](https://www.hackthebox.eu/)
* [Proving Grounds](https://www.offensive-security.com/labs/)
* [VulnHub](https://www.vulnhub.com/)
* [TJnull's list](https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=1839402159)
* [ippsec videos](https://www.youtube.com/channel/UCa6eh7gCkpPo5XXUDfygQQA)
* [0xdf hacks stuff](https://0xdf.gitlab.io)

More OSCP Prep: 
* [John J Hacking - The OSCP Preparation Guide 2020](https://johnjhacking.com/blog/the-oscp-preperation-guide-2020/)
* [Rana Khalil](https://rana-khalil.gitbook.io/hack-the-box-oscp-preparation/)

Great stuff:
* [HackTricks](https://book.hacktricks.xyz/)
* [Payloads All the Things](https://github.com/swisskyrepo/PayloadsAllTheThings)
* [Sushant747 Total OSCP Guide](https://sushant747.gitbooks.io/total-oscp-guide/content/)
* [revshells](https://www.revshells.com/)
* [GTFOBins](https://gtfobins.github.io/)

## More advice

* Book your exam a month in advance. The better slots are taken 2~3 weeks prior, so if you don't want to start at midnight, act early. On the bright side, you get 3 chances to reschedule and having deadlines is good motivation
* **Sleep well, eat lots, and take a break every once in a while. *Seriously.*** The answer is right there before your eyes, but your soggy and stressed brain will blind you. You don't need 24 hours for this; 12 hours with a clear and sharp mind is enough. Words of wisdom from [Rana Khalil's tips](https://twitter.com/rana__khalil/status/1283578422904664065?lang=en):

> You'll run out of ideas before you run out of time 

* You can only use Metasploit once during the exam, so save it. If you can find an exploit on Metasploit, you'll find it somewhere on the internet too. Don't rely on Metasploit during labs.
* OffSec's mantra: Try Harder. My interpretation is to research more, observe deeper, and try everything you can find or think of. But when you're banging your head against a wall, googling the same keyword or running the same exploit 20 times will not help. Know when to reach out.
* Stats from OffSec's site gives you this "Pass rate vs machines compromised" chart, but I don't find it informative since intuituvely, the more you practice the better results you get, fair and square. What I'm trying to say is, the machines are designed to train your familiarity with the material, so if you already can blast through the machines without hints or hesitation, rooting 10 or 60 boxes doesn't matter. At the end of the day, only skills matter. Don't be obsessed with the numbers.

#[Pass rate vs machines compromised](/img/posts/crystal/oscp/pass-rate.png)

## My two cents

I was pretty anxious when deciding to do the OSCP because honestly I haven't been in cybersecurity for long and lots of things are new to me. But as I embarked on this journey and solved more boxes, I found myself armed with more notes and techniques, while the insecurity transformed into solid improvement, going from 'consciously incompetent' to 'consciously competent' on the learning curve.

OSCP really isn't technically difficult. The challenge lies in identifying the intended vulnerability via keen observation and connecting the dots. Once you find it, execution should be a breeze. In the first hours of my exam, I was so nervous my hand was shaking and I couldn't think straight, but after a walk the fog cleared up, dots reconnected themselves, and things just made sense. For those with the exam coming up, you can do this. You're already good enough to pass. It's just pressure messing with your brain, so don't fret if you've only got 25 points after 15 hours, because you've still got more than enough time to take down *all* the boxes.

For those interested in trying the OSCP, do some boxes on HTB to get the feel. It's totally normal to get lost or stuck in the beginning because my first boxes were a mixture of "What do I do" and "What next". You've just made your baby steps, and things will get smoother if you stick with it a bit more!

In the past few months, the skills and mindset that OSCP and HTB gave me was totally worth the struggle. Hopefully you hacker wannabes will find them as fruitful as I did!

Comment below if you have any questions. I'll answer as much as I'm allowed to XDD
---
title: "Red Team Hero's Certification Adventure Guide"
date: 2025-07-11
tags: []
author: ken
layout: en/layouts/post.njk
image: /img/posts/ken/redteam-cert/cover_en.png
---


<!-- summary -->

I'm honored to have the opportunity to share my journey in certification and learning at [CYBERSEC 2025](https://cybersec.ithome.com.tw/2025/en/session-page/3477). The Red Team is responsible for simulating real-world attacker behaviors, aiming to test an organization’s defenses, identify potential security weaknesses, and evaluate how well a company can respond under actual attack scenarios.

At Cymetrics, services such as external exposure assessments, vulnerability scanning, penetration testing, red team engagements, and even social engineering are all part of the Red Team’s toolkit and testing scope.

However, effective Red Teaming goes far beyond intuition. It often demands unconventional thinking, the discovery of hidden attack vectors, and the exploitation of subtle system vulnerabilities. So what else does it take to become a qualified Red Teamer? That’s right, certifications!

In many Red Team engagement tenders, the required certifications are clearly listed. Reference guidelines for Red Team operations often specify certifications like OSCP, CPENT, or CPSA as minimum qualifications or mandatory requirements.

<!-- summary -->


Reference：[紅隊演練作業參考指引v1.0_1121231](https://download.nics.nat.gov.tw/api/v4/file-service/UploadFile/Common_Standards/%E8%AD%98%E5%88%A5/%E7%B4%85%E9%9A%8A%E6%BC%94%E7%B7%B4%E4%BD%9C%E6%A5%AD%E5%8F%83%E8%80%83%E6%8C%87%E5%BC%95v1.0_1121231.zip)

![image](/img/posts/ken/redteam-cert/1.png)

![image](/img/posts/ken/redteam-cert/2.png)



In the list of cybersecurity professional certifications announced by the Ministry of Digital Affairs (revised on January 24, 2025), there are currently 89 certifications categorized under the "technical" category.

Naturally, this raises a key question: With so many certifications available, which ones are truly worth the time and effort to pursue? What about those not listed in the official document, yet still pose significant challenges and offer real-world value?

![image](/img/posts/ken/redteam-cert/3.png)


First, let’s take a look at the [Security Certification Roadmap](https://pauljerimy.com/security-certification-roadmap/), which categorizes certifications based on different fields. As of July 31, 2024, the roadmap includes a total of 481 international cybersecurity certifications.

Today, we’ll focus specifically on the "Penetration Testing" category, which covers certifications related to ethical hacking and offensive security. This roadmap is organized by difficulty level, meaning that the higher a certification appears on the chart, the more challenging it generally is to obtain.

Here, I’ve selected a few well-known certifications as examples.
At the entry level, certifications such as EC-Council's CEH, CREST's CPSA, and CompTIA's PenTest+ are some of the more popular and accessible options in the market, making them suitable starting points for newcomers in the field.

![image](/img/posts/ken/redteam-cert/4.jpg)


Next, as we move into the intermediate technical level, we start to see certifications like EC-Council's LPT Master or CPENT. These two are actually based on the same exam. The difference is that if you score 90% or above, EC-Council will additionally award you the LPT Master certification.

Other notable certifications at this level include the internationally recognized GIAC GPEN, as well as the increasingly popular OSCP, which more and more professionals in Taiwan are now obtaining. These are all highly representative certifications at this stage.


![image](/img/posts/ken/redteam-cert/5.jpg)


Once your technical skills have reached an advanced level, it’s no surprise that you’ll start seeing the high-level certifications from Offensive Security appear on your profile, specifically those leading toward the OSCE3 path. This includes the trio of certifications: OSWE, OSEP, and OSED, which together make up the OSCE3 designation.


![image](/img/posts/ken/redteam-cert/6.jpg)

Based on the current job market and procurement requirements in Taiwan, when it comes to technical cybersecurity certifications, most people usually narrow their choices down to two major providers: EC-Council and Offensive Security (OffSec).

Because of this, I won’t spend too much time introducing certifications from EC-Council and OffSec. That’s not to say they’re not good. Those who are interested in them will naturally pursue them, and most people are already quite familiar with their offerings.

Instead, I’d like to focus on some lesser-known but highly valuable certifications, ones that are worth learning or taking on as a challenge.

Up next, I’ll introduce a few noteworthy certifications and learning resources.

- [eLearnSecurity](#eLearnSecurity)
- [The SecOps Group](#The-SecOps-Group)
- [TCM Security](#TCM-Security)
- [CyberWarFare Labs](#CyberWarFare-Labs)
- [Altered-Security](#Altered-Security)
- [Hack The Box](#Hack-The-Box)
- [TryHackMe](#TryHackMe)
- [Virtual Hacking Labs](#Virtual-Hacking-Labs)
- [Mossé Cyber Security Institute](#Mossé-Cyber-Security-Institute)
- [HackTricks](#HackTricks)
- [WiFiChallenge Lab](#WiFiChallenge-Lab)
- [Web Security Academy](#Web-Security-Academy)

## eLearnSecurity

> https://security.ine.com/


| Certification | eJPT |
| -------- | -------- |
| Difficulty     |   ⭐️    |
| Recommendation     |   👍👍    |
| Price	     |   299 $USD   |


eLearnSecurity recommends the eJPT as an excellent hands-on entry-level certification, especially as a next step after obtaining CEH. Originally, the course for this certification was free, but now it’s only accessible through INE’s subscription plan, under the course name Penetration Testing Student (PTS). The provided learning materials include vulnerable labs and a practice environment, offering a fairly complete learning experience.

The exam consists of 35 questions, with a total duration of 48 hours. You need to score 70% or above within the time limit to pass. The questions mainly focus on vulnerability identification and exploitation, and there are no restrictions on which tools you can use.

Overall, with two full days to complete the exam, the pressure isn’t too intense. It’s a great practical certification for beginners to build experience and confidence.



## The SecOps Group

> https://secops.group/

| Certification | CNPen |
| -------- | -------- |
| Difficulty     |   ⭐️    |
| Recommendation     |   👍👍    |
| Price     |   250 £GBP   |


In addition to eJPT, another entry-level certification option is CNPen, offered by SOG. This certification is categorized as Intermediate Level. What’s unique about SOG is that they don’t provide any formal courses or training materials, only an outline of what the exam will cover. However, they do offer a mock exam to help candidates get a feel for the actual test format.

The CNPen exam lasts 4 hours and consists of 15 questions. A score of 60% or higher is required to pass. One important thing to note is that not all questions carry equal weight. The score is calculated based on difficulty-adjusted points, so passing is not just about how many questions you get right.

The exam follows a chained scenario-based format, meaning you must solve the earlier parts of a challenge before you can progress to the later stages. If you don’t pass on your first attempt, don’t worry. SOG offers one free retake. If you pass on the first try, you can still opt to retake the exam to try for a higher score.

In addition, SOG also offers two more advanced certifications: the Certified Red Teamer (CRTeamer) at the Intermediate Level, and the Certified Active Directory Pentesting eXpert (C-ADPenX) at the Expert Level. These are great next-step options, though like CNPen, no official training materials or courses are provided.


## TCM Security

> https://tcm-sec.com/

| Certification | PNPT |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️    |
| Recommendation     |   👍👍👍    |
| Price     |   499 $USD   |


After reviewing the entry-level certifications, let’s move on to a more advanced option: the PNPT, which is often compared to CPENT and OSCP.

TCM Security offers a 20% discount on the PNPT for military personnel, law enforcement, healthcare workers, and students. If you happen to purchase it during Black Friday, you can combine the occupational discount with the promotional offer, making it a great opportunity to obtain a discount code if you belong to one of those groups.

The PNPT exam lasts 5 days, and if you don’t pass on your first attempt, you’re allowed one free retake. After the exam ends, you are given 2 additional days to write a report. Unlike CPENT, which focuses on answering specific questions, or OSCP, where you describe how you captured flags, PNPT requires a full penetration testing report. You’ll need to document the exploitable vulnerabilities you discovered over the 5 days, rank them by risk level, provide remediation suggestions, and explain the full attack chain used to obtain Domain Admin access. Finally, you must present a 15-minute debrief in an online call. You must complete all components to successfully pass the exam.

In my opinion, the overall difficulty of the exam is moderate and doesn’t require highly advanced exploitation techniques. Lateral movement and bypass methods in AD are relatively straightforward. More often, what’s needed is strong OSINT (Open Source Intelligence) skills. Many candidates rush to compromise the next machine and end up missing key pieces of valuable information.

If your goal is to learn how to write a complete penetration testing report and effectively communicate risk to clients, PNPT stands out as a solid choice compared to other certifications.


## CyberWarFare Labs

> https://cyberwarfare.live/

| Certification | CRTA |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️    |
| Recommendation     |   👍👍👍    |
| Price     |   99 $USD   |


Next, as a Red Teamer, how could you not know how to attack Active Directory (AD) ? The first AD-related hands-on certification I want to introduce is the CRTA, offered by CyberWarFare Labs. This is considered an entry-level red team certification.

The regular price is $99 USD, but it frequently goes on sale, so be sure to check for discounts before purchasing. Once you complete the purchase, you’ll get 30 days of lab access, along with a PDF course guide and a toolkit. The course materials are available for lifetime access.

As of June 4, 2025, the exam duration was shortened from 24 hours to 6 hours, so be sure to take note of this change. This certification is particularly helpful for beginners seeking to build practical Active Directory attack skills. With a manageable difficulty level, it’s feasible to read through the course content, complete the labs, and pass the exam all within 30 days.

You'll gain a clear understanding of foundational AD concepts, such as understanding domains, privilege escalation, Kerberoasting, and how to fully compromise a domain using Golden Ticket and Silver Ticket attacks.


## Altered Security

> https://www.alteredsecurity.com/

| Certification | CRTP |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️    |
| Recommendation     |   👍👍👍👍    |
| Price     |   249 $USD   |


Next up is the CRTP (Certified Red Team Professional), a certification with relatively high recognition. According to the official website, CRTP is one of the most beginner-friendly red team certifications available. It helps learners understand a wide range of Windows and Active Directory (AD) attack concepts.

The course content is quite comprehensive, covering topics such as AD enumeration, privilege escalation, Kerberos-based attacks, ACL misconfigurations, SQL Server trust relationships, and even defensive techniques and bypass methods.

In my opinion, this certification is extremely valuable for anyone working on internal penetration tests or red team engagements, especially for those looking to systematically learn PowerShell commands and core AD concepts. If you’re able to complete all 40 lab challenges provided in the course, you likely won’t have much trouble passing the exam.

Personally, I completed the labs in both Kali and Windows environments, testing different tools and attack techniques to verify whether they would work across platforms, and more importantly, to confirm that I truly understood the course material.

The CRTP exam lasts 24 hours, and includes a total of six machines. You’re given a set of credentials to access the initial host, and from there, the goal is to compromise the remaining five machines. Essentially, aside from escalating privileges on the first machine, you must move laterally and take down five other systems to complete the challenge. After the exam, you have 48 hours to write and submit a report, which offers plenty of time.

Beyond the certification itself, Altered Security also provides a platform called Red Labs, which includes 100 target machines that are free to use. For anyone looking to sharpen their AD attack skills, this is an incredibly generous resource.

And for those who enjoy collecting badges, Red Labs is a must-try. The platform awards badges for completing different learning paths, achieving streaks, and more. There are currently 17 unique badges available to collect.

In addition, Altered Security offers two free Azure red teaming learning modules, making it an excellent starting point for anyone interested in learning Azure attack techniques. Best of all, these resources are completely free, so it’s definitely worth checking out.


## Mossé Cyber Security Institute

> https://www.mosse-institute.com/

| Certification | MRT |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️⭐️    |
| Recommendation     |   👍👍    |
| Price     |   699 $USD   |


Next, let’s talk about MCSI, a platform that offers a wide range of online certification courses, each focusing on different cybersecurity topics. One of their standout courses designed specifically for red teamers is called MRT.

This course teaches you how to write Windows-based malware and covers the entire attack chain, from initial access to persistence, making it a fairly complete training package. One unique aspect of the MRT course is that it’s divided into six different levels. After completing the requirements for each level, you’ll earn a corresponding certificate, allowing you to gradually build a portfolio of hands-on experience as you learn.

Here are some examples of the exercises included in the course:

- At the most basic level, you’ll learn how to write a TCP reverse shell that runs on Windows.
- As you move into more advanced challenges, you'll tackle tasks like writing a malware program that can disable Windows Defender, BitLocker, Error Reporting, and the local firewall.
- For even more advanced tasks, you might be asked to develop your own custom tool to forward network connections.

This makes the MRT course a great fit for learners looking to progressively develop real-world red teaming and malware development skills.


## HackTricks

> https://training.hacktricks.xyz/

| Certification | ARTA、ARTE |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️    |
| Recommendation     |   👍👍👍👍    |
| Price     |   359 €EUR, 1099 €EUR   |


Anyone who’s done penetration testing has probably visited HackTricks to check out a cheat sheet at some point, whether it’s for Wi-Fi attacks, web exploitation, or various network services based on port numbers. HackTricks provides reference material for almost every scenario, making it an extremely useful handbook during penetration tests.

Now that cloud services have become so prevalent, many organizations rely heavily on platforms like AWS, GCP, and Azure. As a result, cloud-based attack scenarios are becoming increasingly common in both penetration tests and red team engagements.

To address this, HackTricks Training offers two certifications for each of the three major cloud platforms - AWS, GCP, and Azure. The naming is intuitive and easy to remember: AWS certifications start with “A”, GCP with “G”, and Azure with “AZ”.

These certifications fall under two tracks: RTA and RTE. All RTA course content is included within the corresponding RTE course. For RTA, you simply need to complete the course and labs to receive a certificate of completion. For RTE, you must pass a final exam at the end of the course to earn the certification.


## WiFiChallenge Lab

> https://lab.wifichallenge.com/

| Certification | CWP |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️    |
| Recommendation     |   👍👍👍    |
| Price     |   99 $USD   |


In red team engagements, Wi-Fi attacks are actually quite common. WiFiChallenge Lab is an excellent free platform for learning and practicing these techniques. If you’ve taken the OSWP (PEN-210) exam, you’re likely already familiar with WiFiChallenge. The platform covers various scenarios such as OPN, OWE, WEP, PSK, MGT, and SAE, allowing you to systematically practice a wide range of Wi-Fi attack techniques.

In addition to the labs, WiFiChallenge also offers its own Wi-Fi certification called CWP. The full course and exam bundle costs $199 USD, but if you just want to take the exam, you can purchase an exam-only voucher for $99 USD.

The exam duration is 6 hours, and to pass, you must successfully crack at least 4 out of 5 access points. Personally, I think the CWP offers better value than OSWP. Not only is it more affordable, but it also provides richer content and a broader learning experience.


## Web Security Academy

> https://portswigger.net/web-security

| Certification | BSCP |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️    |
| Recommendation     |   👍👍👍    |
| Price     |   99 $USD   |


After everything we’ve covered so far, one thing is clear: as a red teamer, you can’t afford not to know how to attack web applications. Anyone who has used Burp Suite is surely familiar with PortSwigger, the company behind it. Their Web Security Academy is an excellent platform for building a strong foundation in web attacks. The platform offers structured learning paths for different attack types such as XSS, SQLi, SSRF, CSRF, and more. Each topic comes with clear theoretical explanations paired with hands-on labs, making it ideal for learning web attack techniques step by step.

In addition to educational resources, PortSwigger also offers its own official certification called BSCP. The exam fee is $99 USD, which is relatively affordable compared to many other certifications.

However, there’s one important requirement to keep in mind: you must have a valid Burp Suite Professional license in order to take the exam. If you don’t have the Pro version, you won’t be able to sit for the test, so be sure to take note of that.


## Hack The Box

> https://www.hackthebox.com/

| Certification | CPTS、CAPE |
| -------- | -------- |
| Difficulty     |   ⭐️⭐️⭐️⭐️    |
| Recommendation     |   👍👍👍👍    |
| Price     |   490 $USD, 1260 $USD   |


I’m sure everyone is already familiar with Hack The Box (HTB), but here I’m not talking about the regular machines. I want to highlight HTB’s Pro Labs instead.

Pro Labs offer realistic, hands-on training specifically designed around Active Directory (AD) environments. Each lab consists of multiple machines and includes various flags you need to capture.

In addition, after completing a Pro Lab, you don’t just receive an official certificate of completion. You also earn 40 CPE credits, which is quite useful for maintaining certifications from other providers. At the current price of $49 USD per month, it’s a solid investment for anyone looking to strengthen their practical AD attack skills.

If you feel that a certificate of completion isn’t enough, don’t worry. HTB has also launched its own certification program, which currently includes five certifications. Among them, two are especially worth noting: CPTS and CAPE. That’s not to say the others aren’t valuable, but for red team professionals, CPTS and CAPE are strong priorities.

For example, CPTS has already been included in the latest official cybersecurity certification list announced by the Ministry of Digital Affairs in Taiwan. On the other hand, CAPE is HTB’s newly released certification focused on Active Directory attacks, and can be considered an advanced version of CPTS. For those aiming to develop a career in red teaming, both of these certifications are excellent options.


## TryHackMe

> https://tryhackme.com/

After introducing HTB, we definitely can’t leave out TryHackMe!

TryHackMe offers a dedicated learning path focused on red teaming, called Red Teaming Training. It’s an excellent way to build a solid foundation and learn various offensive techniques. This learning path is made up of several modules, covering everything from initial access, privilege escalation, and lateral movement to Active Directory attacks, making it a fairly comprehensive course.

In addition, once you complete the learning path, you’ll receive an official certificate of completion, which makes it a great starting point for anyone new to red teaming.


## Virtual Hacking Labs

> https://www.virtualhackinglabs.com/

VHL provides a rich and diverse environment that includes Windows, Linux, and Android machines, as well as web servers, mail servers, routers, and more. There's a wide variety of systems to practice on, and each machine has a different difficulty level. The number of machines you complete and the difficulty of the challenges correspond to different levels of certification.

The most basic level, Basic, requires you to gain administrator access on at least 20 lab machines. For the Advanced certificate, you must gain administrator access on at least 10 Advanced+ machines, and at least two of them must be exploited manually without using Metasploit or other automated tools.

Additionally, if you're looking to practice Active Directory attacks, VHL also offers a PRO LAB. To complete it, you need to successfully compromise at least 10 machines and two network segments, making it significantly more challenging.

For all certification levels, VHL requires you to submit a complete report, documenting how you gained administrator access and how you captured the flags.

I think VHL is a great platform for practicing report writing, and since you receive a corresponding certificate after completing the challenge, it's truly a win-win.


## Summarize

![image](/img/posts/ken/redteam-cert/7.png)


For cybersecurity beginners, at the entry level, many people start with EC-Council’s CEH as their first certification, alongside basic programming skills. In addition to CEH, eJPT and CNPen are also great options, especially since they’re relatively affordable. If you’re particularly interested in Active Directory (AD) attack techniques, CWL’s CRTA can also be a good entry point.

Once you’ve gained some skills and experience, and are aiming to pursue a career in penetration testing or red teaming, OSCP becomes an excellent target. Some people even choose to go straight for OSCP from the beginning. But if you feel you’re not quite ready yet, the earlier entry-level certifications are great for building confidence and a solid foundation.

Of course, earning the OSCP is only the beginning. It alone isn’t enough to become a professional red teamer. You’ll also need proficiency across Wi-Fi, Active Directory, web applications, and cloud environments.

At a more advanced stage, your goals become more defined, such as working toward OSCE3. After completing CRTP, you can go on to challenge CRTE, CRTM, and other certifications to further enhance your AD attack techniques. At the same time, completing multiple HTB Pro Labs will sharpen your real-world skills and make your techniques more refined.

In summary, I believe that the cybersecurity path is about continuous learning and persistent effort, with the goal of becoming stronger over time.

Lastly, you might ask, “With so many certifications, do I really need them?” For me, the most important thing isn’t how many certificates I’ve earned or how many machines I’ve rooted. It’s whether I’m truly progressing throughout the learning process, acquiring new knowledge, skills, and attack techniques that make a real difference.



If you have any cybersecurity-related questions, feel free to leave a comment or contact [Cymetrics](https://cymetrics.io/) directly for assistance.



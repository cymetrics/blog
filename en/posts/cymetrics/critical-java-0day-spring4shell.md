---
title: Spring4shell - a new critical RCE vulnerability found in Java Spring Framework 
date: 2022-03-31
tags: [Security]
author: cymetrics
layout: en/layouts/post.njk
image: /img/posts/cymetrics/spring4shell/cover-en.png
---

<!-- summary -->
Last year, a critical vulnerability in the Java ecosystem named [Log4Shell](https://tech-blog.cymetrics.io/posts/huli/what-is-log4j-and-log4shell/) has been found, it is described as a "nuclear bomb-level loophole".

Recently, another critical vulnerability has been found in Spring core, because of its similarity to Log4Shell, it's named "Spring4shell".
<!-- summary -->

## Spring4shell（Spring Core RCE）

First of all, it's a 0-day vulnerability and has no patch available at the time of writing.

On March 29, staff working at KnownSec disclosed the vulnerability without detail on Twitter, but the account is deleted now: @80vul. (a.k.a. SuperHei) The Leader of KnownSec 404 Team

![](/img/posts/cymetrics/spring4shell/p1.png)

The vulnerability affects the project with Spring core + JDK 9.0 and above.

If you are not sure what is your java version, you can run `java -version` to check:

```bash
$ java -version
openjdk version "17.0.2" 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8-86)
OpenJDK 64-Bit Server VM (build 17.0.2+8-86, mixed mode, sharing)
```

On March 30, another Twitter account @vx-underground disclosed a POC for Spring4Shell

![](/img/posts/cymetrics/spring4shell/p2.png)

There are a few backups on GitHub:

1. https://github.com/craig/SpringCore0day
2. https://github.com/dinosn/spring-core-rce/

A malicious actor can write a web shell on the server via Spring4Shell, and then achieve RCE(Remote code execution).

For now, the payload in the well-known PoC contains the following text:

```
class.module.classLoader.resources.context.parent.pipeline.first.pattern=
class.module.classLoader.resources.context.parent.pipeline.first.suffix=
class.module.classLoader.resources.context.parent.pipeline.first.directory=
class.module.classLoader.resources.context.parent.pipeline.first.prefix=
class.module.classLoader.resources.context.parent.pipeline.first.fileDateFormat=
```

Spring is a popular web framework in Java, and this vulnerability enables a remote attacker to get the shell by sending a crafted request.  

Because there is no official patch for Spring4Shell for now, we suggest that you can check:

1. If JDK version is 9 or above
2. If the project uses Spring Framework

If your projects are affected by Spring4Shell potentially, before the patch release, we suggest that:

1. Use a lower JDK version
2. Add rules to WAF to detect the malicious payload 

You can refer to the following articles for more detail:

1. [SpringShell: Spring Core RCE 0-day Vulnerability](https://www.cyberkendra.com/2022/03/springshell-rce-0-day-vulnerability.html)
2. [Snyk Vulnerability Database](https://security.snyk.io/vuln/SNYK-JAVA-ORGSPRINGFRAMEWORK-2436751)
3. [Spring4Shell: Security Analysis of the latest Java RCE '0-day' vulnerabilities in Spring](https://www.lunasec.io/docs/blog/spring-rce-vulnerabilities/)

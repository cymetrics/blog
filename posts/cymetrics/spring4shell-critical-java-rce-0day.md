---
title: Spring4shell 來襲！繼 Log4Shell 後又一 Java 生態系嚴重漏洞出現
date: 2022-03-31
tags: [Security]
author: cymetrics
layout: zh-tw/layouts/post.njk
image: /img/posts/cymetrics/spring4shell/cover.png
---

<!-- summary -->
去年底在 Java 生態系中發現了極為嚴重的 [Log4Shell](https://tech-blog.cymetrics.io/posts/huli/what-is-log4j-and-log4shell/) 漏洞，透過非常簡單的攻擊方式就能夠拿到 shell，成功打到 RCE（Remote Code Execution，遠端程式碼執行），而最近又爆出了 Java 知名 Framework Spring 的嚴重漏洞，由於特性與 Log4Shell 相似，被命名為 Spring4shell。
<!-- summary -->
在介紹 Spring4shell 之前，先來簡單看看另一個容易與它搞混的漏洞：CVE-2022-22963。

## CVE-2022-22963：Spring cloud function SpEL RCE

在 2022 年 3 月 27 號，Spring cloud function 被爆出了一個 0 day 的漏洞，於 3 月 29 號修復，編號為 CVE-2022-22963。

此漏洞影響版本為 Spring cloud function 3.1.6 與 3.2.2。

攻擊者可以在 HTTP Header 中可以透過 SpEL（Spring Expression Language）注入程式碼，導致遠端程式碼執行（RCE，Remote Code Execution），像是這樣：

```
spring.cloud.function.routing-expression: T(java.lang.Runtime).getRuntime().exec("whoami")
```

此漏洞在 GitHub spring-cloud-function 的 [提交](https://github.com/spring-cloud/spring-cloud-function/commit/dc5128b80c6c04232a081458f637c81a64fa9b52) 中已得到修復。

網路上已有公開的攻擊腳本：[RanDengShiFu/CVE-2022-22963](https://github.com/RanDengShiFu/CVE-2022-22963) 與 [dinosn/CVE-2022-22963](https://github.com/dinosn/CVE-2022-22963)，建議廠商排查是否有使用到 Spring cloud function 後儘速修復，升級至最新版。

更多技術細節可參考：[RCE 0-day Vulnerability found in Spring Cloud (SPEL)](https://www.cyberkendra.com/2022/03/rce-0-day-exploit-found-in-spring-cloud.html)

## Spring4shell（Spring Core RCE）

由於此漏洞出現之時間與 CVE-2022-22963 極為相近，又都是 Spring 相關的產品，因此多數人容易將 Spring cloud function SPEL RCE（CVE-2022-22963）與 SpringShell (Spring Core RCE) 搞混，但兩者指的是不同的漏洞。

此漏洞在撰文當下（2022 年 3 月 31 日）暫無 CVE 編號，也沒有修補的版本可供更新，是一個嚴重的 0 day。

Spring4shell 最早是由中國的資安公司 KnownSec 的員工於推特上揭露部分資訊，但目前帳號已不存在：@80vul. (a.k.a. SuperHei) The Leader of KnownSec 404 Team

![](/img/posts/cymetrics/spring4shell/p1.png)

影響版本為 Spring core + JDK 9.0 （含）以上，範圍甚廣。

如果不確定版本的話，可以使用 `java -version` 指令檢測版本：

```bash
$ java -version
openjdk version "17.0.2" 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8-86)
OpenJDK 64-Bit Server VM (build 17.0.2+8-86, mixed mode, sharing)
```

在台灣時間 3/30 晚上十點，專門蒐集 APT 樣本的 @vx-underground 於推特上揭露了非公開的 PoC：

![](/img/posts/cymetrics/spring4shell/p2.png)

在此之前也有人在 GitHub 上傳 PoC，但上傳沒多久之後就刪除，而他們揭露的 PoC 內容，其實就是之前被刪除的 GitHub repo 的備份檔案，目前已有多人備份其內容或是 PoC：

1. https://github.com/craig/SpringCore0day
2. https://github.com/dinosn/spring-core-rce/

攻擊者可以透過 Spring4shell 漏洞在伺服器寫入檔案，寫入 shell 後即可透過 shell 達成 RCE，成功在遠端執行程式碼。

目前流傳最廣的 PoC 中，payload 包含以下特徵
```
class.module.classLoader.resources.context.parent.pipeline.first.pattern=
class.module.classLoader.resources.context.parent.pipeline.first.suffix=
class.module.classLoader.resources.context.parent.pipeline.first.directory=
class.module.classLoader.resources.context.parent.pipeline.first.prefix=
class.module.classLoader.resources.context.parent.pipeline.first.fileDateFormat=
```

由於 Spring 是 Java 中使用率極高的框架，而此漏洞又可以透過一個簡單的 request 就寫入 shell，特性跟 Log4Shell 類似，因此被命名為 Spring4shell，可想而知其嚴重性。

由於目前官方尚未釋出修補 SpringShell 的版本，因此暫無修復方式，建議透過以下幾種方式進行檢查：

1. 確認 JDK 版本是否為 9 以上
2. 確認程式碼中是否有用到 Spring Framework

如果上面條件都成立，在官方尚未釋出修復版本前，暫時建議的修復方式為：

1. 考慮降低 JDK 版本
2. 在網路防護設備中添加規則，偵測惡意 request

如果擔心自己已經被攻擊，也可以使用 yara 或是 linux command `grep` 搭配關鍵字檢查 log 檔。

更多技術細節可參考其他國外廠商之文章：

1. [SpringShell: Spring Core RCE 0-day Vulnerability](https://www.cyberkendra.com/2022/03/springshell-rce-0-day-vulnerability.html)
2. [Snyk Vulnerability Database](https://security.snyk.io/vuln/SNYK-JAVA-ORGSPRINGFRAMEWORK-2436751)
3. [Spring4Shell: Security Analysis of the latest Java RCE '0-day' vulnerabilities in Spring](https://www.lunasec.io/docs/blog/spring-rce-vulnerabilities/)
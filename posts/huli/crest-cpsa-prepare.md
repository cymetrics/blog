---
title: CPSA(CREST Practitioner Security Analyst) 資安分析師考試心得
date: 2021-12-15
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/crest-cpsa-prepare/p1.png
canonical: https://blog.huli.tw/2021/12/15/crest-cpsa-prepare/
---

<!-- summary -->
為了工作上的需求，我在近期考過了 CPSA(CREST Practitioner Security Analyst) 資安分析師這張證照，趁著記憶猶新來分享考試的準備以及一些心得。
<!-- summary -->

CREST 這個組織與 CPSA 這張證照在網路上可以找到的中文資料極少，在台灣算是比較冷門的一張證照，我是看了這篇：[ECSA v10 等效申請CREST CPSA 資安分析師證照教學 / ECSA with CPSA Equivalency Recognition Step](https://medium.com/blacksecurity/crestcpsa-5a07e25e7da3) 才對這個組織以及這張證照有基本的理解。

我在十二月跟另外一個同事去考了這張證照，都有順利考到，趁著剛考完沒多久，趕快來寫篇心得記錄一下。

## CPSA 介紹

還是不免俗地簡單介紹一下 CPSA 這張證照，全名為 CREST Practitioner Security Analyst，是 CRSET 的入門證照，官網有附上 CRSET 系列的圖，可以看到 CPSA 隸屬於滲透測試的分類底下，是這分類最初階的一張證照：

![](/img/posts/huli/crest-cpsa-prepare/p1.png)

在行政院公布的[資通安全證照專業清單](https://nicst.ey.gov.tw/Page/D94EC6EDE9B10E15/3386e586-1930-4f48-9b5e-1c9f256b7549)裡面，也有出現這一張證照：

![](/img/posts/huli/crest-cpsa-prepare/p2.png)

底下則是[官網](https://www.crest-approved.org/examination/practitioner-security-analyst/index.html)對於這張證照的介紹：

> The CREST Practitioner Security Analyst (CPSA) examination is an entry-level examination that tests a candidate’s knowledge in assessing operating systems and common network services at a basic level below that of the main CRT and CCT qualifications.  The CPSA examination also includes an intermediate level of web application security testing and methods to identify common web application security vulnerabilities.

說明了 CPSA 是張入門的證照，而測驗內容則是基本的作業系統與網路相關安全知識，還有中階的 Web Security 相關知識。

考試的形式是 120 題的選擇題（有五個選項的單選題），總共有兩個小時的時間可以作答，需要去特定的考場（Pearson Vue test centres）考試。

## CPSA 考試內容及準備

CPSA 官網有提供考試的[大綱](https://www.crest-approved.org/wp-content/uploads/crest-crt-cpsa-technical-syllabus-2.4.pdf)，內容滿詳細的，但我比較喜歡這個 CPSA 的[課程](https://icsiglobal.com/all-courses-list/29-crest-cpsa-exam-preparation-cpsa/region-UK/)提供的簡化過的版本，稍微看過一遍之後會對考試的內容有基本的理解：

### Module 1: Soft Skills and Assessment Management

1. Engagement Lifecycle
2. Law and Compliance
3. Scoping
4. Understanding, Explaining and Managing Risk
5. Record Keeping, Interim Reporting and Final Results

### Module 2: Core Technical Skills

1. IP Protocols
1. Network Architectures
1. Network mapping and Target Identification
1. Filtering Avoidance Techniques
1. OS Fingerprinting
1. Application Fingerprinting and Evaluating Unknown Services
1. Cryptography
1. Applications of Cryptography
1. File System Permissions
1. Audit Techniques

### Module 3: Background Information Gathering and Open Source

1. Registration Records
2. Domain Name Server (DNS)
4. Google Hacking and Web Enumeration
5. Information Leakage from Mail Headers

### Module 4: Networking Equipment

1. Management Protocols
1. Network Traffic Analysis
1. Networking Protocols
1. IPsec
1. VoIP
1. Wireless
1. Configuration Analysis

### Module 5: Microsoft Windows Security Assessment

1. Domain Reconnaissance
1. User Enumeration
1. Active Directory
1. Windows Passwords
1. Windows Vulnerabilities
1. Windows Patch Management Strategies
1. Desktop Lockdown
1. Exchange
1. Common Windows Applications

### Module 6: UNIX Security Assessment

1. User Enumeration
1. UNIX/Linux Vulnerabilities
1. FTP
1. Sendmail/SMTP
1. Network File System (NFS)
1. R-Services
1. X11
1. RPC Services
1. SSH

### Module 7: Web Technologies

1. Web Server Operation & Web Servers and Their Flaws
1. Web Enterprise Architectures
1. Web Protocols
1. Web Markup Languages
1. Web Programming Languages
1. Web Application Servers
1. Web APIs
1. Web Sub-Components

### Module 8: Web-Testing Methodologies

1. Web Application Reconnaissance
1. Threat Modelling and Attack Vectors
1. Information gathering from Web Mark-up
1. Authentication Mechanisms
1. Authorisation Mechanisms
1. Input Validation
1. Information Disclosure in Error Messages
1. Use of Cross Site Scripting (XSS)
1. Use of Injection Attacks
1. Session Handling
1. Encryption
1. Source Code Review

### Module 9: Web Testing Techniques

1. Web Site Structure Discovery
1. Cross Site Scripting Attacks
1. SQL Injection
1. Parameter Manipulation

### Module 10: Databases

1. Databases
1. Microsoft SQL Server
1. Oracle RDBMS
1. MySQL

你會發現考試的內容滿廣的，幾乎什麼都有，什麼都考一點，所以剛開始時我會覺得比較難準備，不知道重點應該要放在哪邊。

因此我做的第一個準備是上網找一些考過的心得，都是英文的：

1. [CREST CPSA Exam](https://www.reddit.com/r/AskNetsec/comments/9qionx/crest_cpsa_exam/)
2. [Taking the CPSA (Crest Practitioner Security Analyst) Exam](https://blog.rothe.uk/taking-the-cpsa-exam/)
3. [CREST Practitioner Security Analyst (CPSA) Exam - Study Guide](https://www.linkedin.com/pulse/crest-practitioner-security-analyst-cpsa-exam-study-jean/)

第三個寫得最詳細，而且裡面有附滿多參考資料跟資源的，我覺得滿有幫助。

底下是一些我自己準備的方向：

1. 各種專有名詞的全稱，例如說 HTTP 或是 SSL 這些的全名是什麼
2. 網路相關知識，包含 OSI 模型以及 IP, TCP, UDP, ICMP 這些 protocol
3. 對常見加密演算法（DES、AES 以及 RSA 等等）以及 hash（MD5 跟 SHA1）的基本理解
4. DNS 相關知識
5. 常用的服務對應到哪些 port

因為自認為自己對 web 比較熟悉，因此 web 的方向我沒有做什麼準備，想說直接正面迎戰。

CPSA 的及格線是答對 60% 的題目，我採取的策略是集中火力專攻上面那些部分，然後放掉我覺得比較難懂或是一直懶得看的一些主題，所以考試大綱上有些東西我連看都沒看過，考試的時候就是用猜的。

而我主要準備的資源也不是上面這些，雖然官方建議的書我有買，但看起來有點無聊而且內容滿多的，所以我主要準備是參考我同事找到的一個 GitHub 上有人整理過的資源，用 `crest exam github` 當關鍵字可以找到，上面有一些很實用的重點整理。

總之呢，我自己考完之後覺得如果你對網路相關知識已經滿熟悉的了（就計算機概論碰到網路相關問題都可以答對的話），又有基本的 web 知識，稍微唸個一兩週以後要考過應該不難。

## CPSA 考試

考試的報名費是 400 美金，大概台幣 11000 左右，台灣似乎只有兩個考場，一個在台北一個在高雄，台北的考場在信義區市政府捷運站附近：https://goo.gl/maps/2hCkEpEidb8WbYQw7

需要提前 30 分鐘報到，進入考場之後就是要先把東西全都收進去置物櫃裡面，不能再看書了，所以如果想看的話建議在考場附近看完再進去考場，接著就是報到的流程，記得要帶護照跟上面有簽名的證件（我是拿信用卡），要拍個照然後簽一些文件。

都弄好以後就會帶你進去測驗的地方，會有許多用木板隔著的個人電腦桌，就用那台電腦來考試，考的時候可以標記題目，之後檢查比較容易。

似乎是沒有限制一定要考多久，所以考完之後就可以直接用系統交卷了，我好像考了一小時到一個半小時左右，交完以後考場人員會來你的座位上帶你離開，先到外面置物櫃拿東西，東西拿完以後他會直接把測驗結果印給你，上面會寫說你的分數以及有沒有過關，還會有每個大分類的答題狀況。

我的話最後是低空飛過，驚險過關，接著大概隔個兩三天就會收到 CREST 寄來的證書了。

## 總結

整體而言我覺得考試的難度不高但有點瑣碎，我自己網路知識基礎滿差的，所以在這邊掉了不少分數，因此我才說如果網路知識基礎 ok 的話，對於考試應該滿吃香的，至少那些題目都答得出來。

雖然目前在台灣這張證照的知名度不高，但聽說在國外一些地方有一定的知名度，若是有 OSCP 的話，還可以拿這張證照加上 OSCP 去換另一張 CRT 的證照，一魚兩吃。對我來說的話反正就先考起來，未來會不會用到我也不知道，但先準備好就是了。

如果大家有興趣的話可以去考考看，有什麼相關的問題也可以在底下留言，在能力範圍內我會盡量回答。
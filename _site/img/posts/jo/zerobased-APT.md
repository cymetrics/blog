---
title: 零基礎資安系列（六）- 電影中酷駭客做的事？關於 APT（Advanced Persistent Threat）
author: jo
date: 2021-08-22
tags: [Security,ZeroBased,APT]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-APT/cover.jpeg
---
<!-- summary -->
## 前言
> **電影中的駭客只是敲敲打打幾分鐘就可以竊取商業機密？！**
> 答案是但也不是，為什麼會這麼說呢？
>其實每一次成功的攻擊結果也許只需要短短的幾分鐘就能將商業機密帶走，但在駭客敲鍵盤的那幾分鐘之前，其實就已經花了好幾個月甚至以年記的時間來佈局這幾分鐘的攻擊，那駭客的佈局到底是在佈局什麼呢，這就是今天想和大家分享的，電影中那些酷駭客在完成攻擊前所做的事。
<!-- summary -->

## 釋例

電影中，駭客所執行的方式，其實在業界稱之為**進階持續性威脅（Advanced Persistent Threat）** 也就是所謂的 APT，那這種攻擊厲害在哪呢？
其實 APT 並不是一種攻擊手法，而是一整套的攻擊手法彙整，舉個例來說，葉問開始學習武術，攻擊的手法不外乎便是左勾拳（Phishing）、右勾拳（OS injection），而當他將這些攻擊進行**變化**並且**整合**起來，摸索出克敵之道成為流派之後，便可以稱之為 詠春（APT），額外說明一下 APT 與攻擊鏈概念很像，所以我會在下面說明 APT 所擁有的要素和案例說明。

![](/img/posts/jo/zerobased-APT/p1.jpeg)

photo by 電影-葉問
## APT（Advanced Persistent Threat）

開宗明義，APT 就是以**進階有變化**的攻擊手法，**持續並嘗試不被發現**的入侵目標，並且竊取資料掌控系統**對目標造成威脅**。

### 上面提到 APT 通常會包含三種要素：

**1.進階性（Advanced）**
**上勾拳無法打敗對手，但昇龍拳可以**
一般使用工具執行的攻擊手法，例如 SQL Injection 的 OR 1=1--' 便不算是一種進階的攻擊手法，若同樣以 SQL Injection 來舉例，可能便是透過公司的**網路曝險**和相關的測試找出公司使用的資料庫類型以及版本，甚至從錯誤訊息中獲得資訊，藉以構建針對目標的 SQL Injection  payload，便可以稱為一種進階的手法。

**2.持續性（Persistent）**
**直接放大絕招容易被閃躲，所以持續不斷的試探，讓對手露出破綻**
就像是大開大闔的攻擊總是特別容易被阻擋，因此藉由緩慢而低調的各種測試和收集資訊方式，慢慢的尋找突破口，不求快速有成效，只求持續而且不被發現便可以稱為持續性。

**3.威脅性（Threat）**
**攻擊一定會造成傷勢，結束後傷勢越重表示威脅性越高**
駭客攻擊一定有目的，無論是直接透過勒索軟體藉此勒索贖金，或是竊取商業機密資料來獲取利益，甚至是破壞公司的服務或是客戶資料造成商譽受損，這些都是所謂的威脅性。

### APT 有哪些階段
簡化來說可以分成五個階段
**選擇目標：**
此階段有各種可能性，無論是因為企業曝光率高，或是競爭對手的僱傭甚至是網路曝險的資訊都有可能導致企業成為駭客的攻擊標的。

**收集資訊：**
透過各式各樣的工具以及攻擊手法，收集攻擊目標可能導致風險的弱點。

**執行滲透：**
嘗試將所有收集到的弱點串起，達成各個攻擊鏈

**分析資訊：**
**獲取成果：**


## MITRE ATT&CK
















而 **HttpOnly** 則可以說他是 XSS 之敵，如果有看過我的 [基礎第二篇 XSS 攻擊介紹](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting) 的朋友，可以發現在 XSS 攻擊中，網站會允許攻擊者在網站中植入惡意的 JavaScript 藉此竊取使用者的 Cookie ，舉例來說：

![](/img/posts/jo/zerobased-secure-samesite-httponly/p2.png)


```txt
Set-Cookie: widget\_session=abc123; SameSite=None; Secure
```

## 結論



## 延伸閱讀



### 零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）

> [認識 XSS（Cross-Site Scripting）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)




## 參考資料

### httpCookies Element

> [https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/ms228262(v=vs.100)?redirectedfrom=MSDN](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/ms228262%28v=vs.100%29?redirectedfrom=MSDN)


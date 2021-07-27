---
title: 資安科普番外篇（一）-大意了啊沒有閃！常見網站曝險你中了幾項？！
author: jo
date: 2021-07-09
tags: [Security,ZeroBased]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-common-risk-exposure/cover.jpeg
---
<!-- summary -->
## 前言

>曝險就是暴露的風險，而曝險評估就是**模擬駭客在網路上搜尋網站的資訊進行攻擊鏈的構建進行暴露的風險評估**，而在協助許多商業網站（ e.g. 擁有會員登入、金流功能）執行非侵入式的網路曝險檢測時，發現許多商業網站的檢測結果在去除極端值後，有 60% 以上的網站曝險是共通的，來關注一下這些常見的網路曝險你的網站是否也大意了沒有閃。
<!-- summary -->

## 摘要

以去除極端值之後的檢測結果統計，排列出目前發生比例大於 50 % 的網路曝險，並說明**可能造成的風險**以及如何簡單的進行**初步自我曝險檢測**。

之後會在番外篇（二 ）中提供這幾項**風險的改善複雜度**說明以及解決辦法和關鍵字，另外也會說明這些曝險與目前現行一些較為**知名法規的關聯**。

## 常見網站曝險排名

## №５ X-Frame-Options 未設置或安全等級不足

排行第五的 X-Frame-Options 設置，在這個項目裡有大於 50％ 的網站設置的安全等級不足或是沒有進行設置，X-Frame-Options 用途為**針對 Iframe 點擊劫持攻擊**的手法進行防禦，避免網頁被內嵌。

**點擊劫持攻擊**是一種攻擊者在網站上通過 iframe 隱藏目標網頁，欺騙用戶點擊隱藏惡意連結，舉例來說，覆蓋在影片播放鍵上的隱藏超連結，當使用者點擊後，便會下載惡意程式或是彈出惡意網頁讓使用者瀏覽，讓使用者的機敏資訊外洩而導致資安事件的發生，這樣的攻擊很有可能會使網站業者的商譽受到損害。

而發生此項曝險表示當攻擊者獲取這項資訊時，很有可能會嘗試對網站進行 Iframe 點擊劫持的攻擊手法。

### 新聞參考：

[**Web clickjacking fraud makes a comeback thanks to JavaScript tricks**](https://nakedsecurity.sophos.com/2019/08/29/web-clickjacking-fraud-makes-a-comeback-thanks-to-javascript-tricks/)

### 初步自我檢視方式

按下 F12 後，點選 Network 在左方開啟想要檢視的檔案，接著選擇 Header 便可以查看是否有設置 [X-Frame-Options](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Headers/X-Frame-Options#%E4%BD%BF%E7%94%A8_x-frame-options)。

![](/img/posts/jo/zerobased-common-risk-exposure/p1.png)

**X-Frame-Options有三種值：**

`DENY`表示網頁無論如何都無法被嵌入到 frame 中，即使於相同網域內嵌入也不允許。

`SAMEORIGIN`唯有當符合[同源政策](https://developer.mozilla.org/zh-TW/docs/Web/Security/Same-origin_policy)下，才能被嵌入到 frame 中。

`ALLOW-FROM _uri_`［已廢止］唯有列表許可的 URI 才能嵌入到 frame 中，不過新版瀏覽器已不再支援此指令。


## №４Cookie 基本設定未設置或安全等級不足

排名第四的 Cookie 基本設定未設置或安全等級不足，在這個項目裡有大於 60％ 的網站設置安全等級不足或是沒有進行設置，而 Cookie 的三項基本設定為，能夠**阻止（ XSS ）跨站腳本攻擊影響擴大**的 HttpOnly 、**強化 Https 機制**的 Secure 以及**預防（ CSRF ）跨站請求偽冒**的 SameSite 。

由於三項安全設定也同樣都是網站公開資訊，在相關資訊容易被取得的情況下使三項基本設定很容易成為攻擊者篩選攻擊標的第一層過濾，也就是當攻擊者發現這三項設定設置不全甚至未設置的網站業者，攻擊者會特別關注，將網站納入攻擊的標的清單。

### XSS 跨站腳本攻擊：

[**零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）**  
](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)

### CSRF 跨站請求偽冒：

[**零基礎資安系列（一）-認識 CSRF（Cross Site Request Forgery）**  
](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-request-forgery)

### 新聞參考：

[**麥當勞官網遭爆有XSS漏洞，可解密竊取用戶密碼**  
](https://www.ithome.com.tw/news/111254)

### 初步自我檢視方式

因為這堪稱網站安全三本柱的三個基本設定，為了三項基本設定寫了一篇文章，提供自我檢視風險的方式以及更深入的說明，有興趣了解更多關於 Cookie 三項基本設定資訊的朋友可以參考下方文章

[**零基礎資安系列（三）-網站安全三本柱（Secure & SameSite & HttpOnly）**  
](https://tech-blog.cymetrics.io/jo/zerobased-secure-samesite-httponly)


## №３ 郵件系統 DMARC 設定

排名第三的郵件系統 DMARC 設定，在這個項目裡有大於 70％ 的網站DMARC 設置不全或無設置，**DMARC 會向收件伺服器指示該如何處理特定郵件**，讓伺服器在收到疑似來自自身機構卻未通過驗證檢查的郵件，或是不符合 DMARC 政策記錄中驗證規定的郵件時，採取合適的處置方式。

例如無法通過驗證的郵件有兩種，一種是**冒用自身機構名義的郵件**，另一種則是**從未經驗證的伺服器寄出的郵件**， DMARC 便會拒絕惡意電子郵件訊息（拒收）或隔離惡意電子郵件訊息（垃圾信件），**強化收件者對未授權郵件的識別**，藉此**讓社交工程發生的可能性減低**，是**除了進行社交工程演練以及強化員工資安意識以外很好的防護手段**。

**DMARC 的設定在近期受重視程度逐漸提高**，如世界知名顧問公司 Gartner 就在他們的 [list of critical security projects](https://www.gartner.com/smarterwithgartner/gartner-top-security-projects-for-2020-2021/) 中，建議將 DMARC 納入安全評估，而綜合了報告以及測試結果，其實也意味著目前大多數的業者仍是依靠**社交工程演練**以及**資安訓練**來作為防範社交工程的手法，但因爲現在的攻擊手法，許多駭客在攻擊前都會利用**「勒索軟體即服務」 （Ransomware-as-a-Service，RaaS）**的方式，降低攻擊技術門檻及成本提高攻擊頻次，而在疫情影響大家逐漸習慣在家工作的情況下，社交工程變得更加防不勝防，靠傳統的方式並不能確保自身不受社交工程的影響。

### 新聞參考：

[**報導：巴西最大醫療診斷業者Grupo Fleury也遭勒索軟體REvil攻陷**  
](https://www.ithome.com.tw/news/145223 )

### 初步自我檢視方式

在檢視 DMARC 的設定時，其實最大的問題在於沒有設定 DMARC ，而通常檢視自身 DMARC 的設定需要前往網域供應商網站查看 DMARC 的 TXT 記錄：

1.  登入網域供應商提供的管理控制台。
2.  找出用於更新網域 DNS TXT 記錄的網頁或資訊主頁。
3.  查看網域的 DNS TXT 記錄。如果網域已經有 DMARC 記錄，就會看到一筆以 v=DMARC 開頭的 TXT 記錄項目。

### 如何檢查現有的 DMARC 記錄參考：

[**設定 DMARC 前的注意事項**  
](https://support.google.com/a/answer/10032674?hl=zh-Hant&ref_topic=2759254)

## №２CSP 未設置或安全等級不足

排名第二的CSP 未設置或安全等級不足，在這個項目裡有將近 90% 的網站CSP 未設置或安全等級不足，**網頁內容安全政策 （ Content Security Policy, CSP）**主要是為了防範 **XSS（跨站腳本攻擊）**，以告知瀏覽器發出的 Request 位置是否受到信任來阻擋非預期的對外連線，加強網站安全性，在 http header 定義限制載入的跨站 script 像是 `img-src、script-src`…等這些可以載入外部資源的標籤。

根據檢測的結果顯示，其實幾乎檢測出有錯誤設置的網站裡都有 `unsafe-inline` 以及 `unsafe-eval` 的身影，但其實 CSP 是**預設禁止使用 inline script 或 inline CSS 以及 eval 函式**的。

以禁止使用 inline script 或 inline CSS 來說，**為了開發時程或是更好的引用第三方套件**，經常會在 HTML 中寫入 inline 的程式碼，但這種手法也是攻擊者會使用的，然而在瀏覽器並不能確認的情況下，為求安全， CSP 希望以預設禁止的方式讓開發人員將 inline 的程式碼移到外部來避免 HTML 中出現 inline 程式的可能，而禁止 eval 函式是因為雖然 eval （）在開發上有一定的方便性，但也因此容易衍生出 XSS 的風險，所以 **eval 函式與 inline 的程式碼相同，都是被 CSP 預設禁止**的。

其實看到這邊應該可以發現，在 CSP 發生錯誤設置的情況基本上會是因為在開發的過程中為了開發上的便利或為了更好的引用第三方套件而導致，不過從實務的角度上來說，這樣的選擇無可厚非，只是該如何在資安以及開發的速度及便利性上取得平衡，無論是在其他針對 XSS 方面補強或更改設置其實都行，因此，在下一篇裡我也會針對這個問題提出一些解決辦法，希望讓大家能夠依據自身的情況去做一些調整。

### 初步自我檢視方式

按下 F12 後，點選 Network 在左方開啟想要檢視的檔案，接著選擇 Header 便可以查看是否有設置 CSP 以及 CSP 是否有 unsafe-inline 以及 unsafe-eval 的身影。

![](/img/posts/jo/zerobased-common-risk-exposure/p2.png)

## №１網站憑證完整性不足

排名第一的網站憑證完整性不足，在這個項目裡有 90% 的完整性不足例如**憑證撤銷機制未設定完整**或**憑證授權機關資源紀錄檢查**，在沒有這些設定的情況下業者很難防堵任意數位憑證認證機構擅自簽署網域憑證，而憑證完整性不足的業者中還包含了**使用不安全的加密**及**過期憑證**與**過舊的 SSL/TLS 協議**，以上問題增加了業者在憑證層面可能發生資安事件的風險機率。

### **憑證撤銷機制未設定完整：**

可能是未提供 CRL 或 OCSP。 CRL 或 OCSP 為兩種檢查憑證是否被撤銷的方式，用於客戶端驗證伺服器是否可以信任。

### **憑證授權機關資源紀錄檢查：**

授權某 CA 為某機構發行憑證的 DNS 紀錄，能確保只有授權的 CA 能為業者的網域發行憑證，防止任意 CA 擅自簽署網域的憑證。

### **使用不安全的加密：**

可能是低強度加密套件使用已知且公開的演算法進行資料混淆或是過舊已被破解的加密法。

### **憑證過期：**

憑證不合法、已過期、或是被撤銷而失效。

### **過舊的 SSL/TLS 協議：**

SSL（ Secure Sockets Layer）安全通訊端層，可以用於保持網際網路連線安全防止系統之間的敏感資料被駭客讀取甚至修改任何傳輸資訊。  
 TLS（ Transport Layer Security）傳輸層安全性，取代 SSL 的加密協定，比 起 SSL 能提供更高更安全的連線。

而使用過舊或已廢棄的協議可能導致駭客利用已知漏洞竊取傳輸中的機敏資料。

### 初步自我檢視方式

以 Chrome 為例，點擊網址左方小鎖頭可以看到目前是否為安全連線以及憑證是否有效，點選憑證後可以看見憑證詳細資訊，在 github 上也有提供許多憑證測試工具，可以根據需求選擇工具或是針對工具進行調整。

![](/img/posts/jo/zerobased-common-risk-exposure/p3.png)
![](/img/posts/jo/zerobased-common-risk-exposure/p4.png)

## 小結

**常見曝險的發生原因大致有兩種**

1.  為了方便業者使用所以有些網頁應用或伺服器端的預設值會以可用性為優先進行考量，也因此當許多的業者直接採用預設值而未進行配置檢視時，很有可能因此產生風險。
2.  有時業者爲了更好的在網站中使用第三方套件或者是開發時程吃緊的緣故而採用了不安全的配置使風險產生。

綜合上述兩點，其實在沒有進行過評估或是執行風險管理的情況下，很容易衍生曝險使網站成為攻擊目標，上述是目前發生比例大於 50 % 的網路曝險說明及非常初步的自我檢測方式，如果希望能更精確的針對自身網站的風險進行評估及管理的話，建議可以以文中的關鍵字去搜尋相關工具進行檢測。

但若希望省時且擔心**檢測出問題不知道該如何修復**或是**修復問題的 CP 值該如何衡量**的話，可以尋找相關的資安服務進行曝險評估。

以自身為例，Cymetrics 便有提供網站資安曝險評估的服務，包含**實時風險情資調整評級權重**以及**關鍵字形式的全中文風險建議**及**複雜度改善評級象限**的資安服務，如果有相關的資安需求也歡迎將 Cymetrics 的產品列入比較。

## 延伸閱讀：

### 零基礎資安系列（一）-認識 CSRF（Cross Site Request Forgery ）

> [認識 CSRF（Cross Site Request Forgery）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-request-forgery)

### 零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）

> [認識 XSS（Cross-Site Scripting）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)

### 零基礎資安系列（三）-網站安全三本柱（Secure & SameSite & HttpOnly）

> [網站安全三本柱（Secure & SameSite & HttpOnly）](https://tech-blog.cymetrics.io/jo/zerobased-secure-samesite-httponly/)


## **參考資料：**

### X-Frame-Options：

> [https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Headers/X-Frame-Options](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Headers/X-Frame-Options#%E4%BD%BF%E7%94%A8_x-frame-options)

### Gartner list of critical security projects：

> [https://www.gartner.com/smarterwithgartner/gartner-top-security-projects-for-2020-2021/](https://www.gartner.com/smarterwithgartner/gartner-top-security-projects-for-2020-2021/)

### DMARC：

> [https://support.google.com/a/answer/10032674?hl=zh-Hant&ref\_topic=2759254](https://support.google.com/a/answer/10032674?hl=zh-Hant&ref_topic=2759254)

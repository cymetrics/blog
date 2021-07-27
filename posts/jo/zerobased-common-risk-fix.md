---
title: 資安科普番外篇（二）-如何有效率選擇風險進行修復 feat.風險和法規息息相關？！
author: jo
date: 2021-07-16
tags: [Security,ZeroBased]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-common-risk-fix/cover.jpeg
---
<!-- summary -->
## 前言

>繼上一篇的[**資安科普番外篇（一）-大意了啊沒有閃！常見網站曝險你中了幾項？！**](https://tech-blog.cymetrics.io/jo/zerobased-common-risk-exposure/))之後，接著我們要來談談關於網站風險的修復，這部分我想大家的直覺應該都是**無條件高風險先修**，但當以這個思維執行時，**把時間以及金錢成本加入權衡之後，又總是很難給出一個符合老闆期待的高 CP 值作法**，而這其實就是我們今天所要討論的主題，**如何有效率的選擇風險進行修復**以及**風險在法規技術面上的影響。**
<!-- summary -->

## 摘要

這些商業網站（ e.g. 擁有會員登入、金流功能）在修復風險以前，若將改善複雜度加入考量，可以很大程度的減少在風險管理上的困難，那麼什麼是改善複雜度呢？

改善複雜度就是在權衡了**時間以及金錢成本後做出的最適風險修復方案。**

舉例來說 常常會聽到許多朋友反應 CSRF Token 設置不易，沒有這麼多時間可以對這項風險進行設定，這時候我會詢問兩個問題

1.  **產業別是否為金融產業（風險管控特別嚴格的產業）**
2.  **網站的 Cookie 是否設置了 SameSite 的屬性**

問這兩個問題的原因為，在不屬於風險管控特別嚴格的產業中，當網站的 Cookie 設置了 SameSite 時，通常是可以將 CSRF Token 的設置順序向後排，待有資源時再執行此風險的修復，原因是 SameSite 的功能便是在網站執行跨站請求時，讓伺服器端無法從 Cookie 中取得 Session Id ，進而阻止 CSRF 風險的發生，當然，若是網站連 SameSite 的屬性都尚未設置的話，那我會強烈建議儘速執行 SameSite 的設置，接著將預計花費在設置 CSRF Token 這項高改善複雜度中風險的人力及時間，挪到其餘序列更高的風險修補上（ e.g 低改善複雜度中風險）

當然權衡的因素很多，除了改善的難易度以外，評估修復的順序也必須思考風險本身的風險（包括攻擊難易度、弱點普遍度、漏洞影響程度）而在接下來的章節中，我也會把這些因素加入說明。

此外，因應產業對於法規面的需求，以下說明也會提到常見的風險可能會對應到法規中哪一項規範的技術面項目。

## 常見風險改善複雜度

說明了什麼是改善複雜度後，接下來將改善複雜度實際套用到上一篇中的常見風險來和大家說明，除了希望能夠更清楚的說明改善複雜度的概念以外，也希望當各位遇到以下風險時， 能夠以此當做參考來進行最適的風險修復方案。

![](/img/posts/jo/zerobased-common-risk-fix/p1.png)


## №５ X-Frame-Options 未設置或安全等級不足

排行第五的 X-Frame-Options 設置，在這個項目裡有大於 50％ 的網站設置的安全等級不足或是沒有進行設置，X-Frame-Options 用途為**針對 Iframe 點擊劫持攻擊**的手法進行防禦，避免網頁被內嵌。

### **改善複雜度等級為：低複雜度中風險**

**X-Frame-Options 未設置或安全等級不足：建議若**要避免此風險，需確保只有可信任來源才能嵌入 。

此項目的改善複雜度並不高，只要按照修復風險參考資料中的設定，選擇適合網站的值即可，建議可以在 Cookie 的三項基本設置完成後進行風險修補。

### 常見風險對應法規技術面項目：

**PCIDSS**：Develop and maintain secure systems and applications

### 細項說明：

> 6.5.1: Protected from injection flaws, particularly SQL injection. Also consider OS Command Injection, LDAP and XPath injection flaws as well as other injection flaws.

### **懶人包：需防範可能導致內嵌或是注入的攻擊。**

### **修復風險參考資料：**

[**X-Frame-Options 回應標頭 - HTTP | MDN**  
](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Headers/X-Frame-Options)


## №４Cookie 基本設定未設置或安全等級不足

排名第四的 Cookie 基本設定未設置或安全等級不足，在這個項目裡有大於 60％ 的網站設置安全等級不足或是沒有進行設置，而 Cookie 的三項基本設定為，能夠**阻止（ XSS ）跨站腳本攻擊影響擴大**的 HttpOnly 、**強化 Https 機制**的 Secure 以及**預防（ CSRF ）跨站請求偽冒**的 SameSite 。

### 改善複雜度等級為：低複雜度中風險

**SameSite 未設定**：建議依據網站需求選用 Strict 或 Lax 進行設定

**HttpOnly Flag 未設定**：建議在設置中開啟 HttpOnly

**Secure Flag 未設定**：建議在設置中開啟Secure

三個項目的改善複雜都不高，如果檢測出未開啟或進行設定的話，建議三項應優先且儘速進行設置。

### 常見風險對應法規技術面項目：

**PCIDSS**：Develop and maintain secure systems and applications

### 細項說明：

> 6.5.1: Protected from injection flaws, particularly SQL injection. Also consider OS Command Injection, LDAP and XPath injection flaws as well as other injection flaws.

> 6.5.7: Protect all web applications and application interfaces from cross-site scripting (XSS).

> 6.5.9: Do not allow cross-site request forgery (CSRF).

### **懶人包：除了防範可能導致內嵌或是注入的攻擊，針對 XSS 以及 CSRF 的攻擊也需要特別注意。**

### 風險修復參考資料：

[**零基礎資安系列（三）-網站安全三本柱（Secure & SameSite & HttpOnly）**](https://tech-blog.cymetrics.io/jo/zerobased-secure-samesite-httponly/)


## №３ 郵件系統 DMARC 設定

排名第三的郵件系統 DMARC 設定，在這個項目裡有大於 70％ 的網站DMARC 設置不全或無設置，**DMARC 會向收件伺服器指示該如何處理特定郵件**，讓伺服器在收到疑似來自自身機構卻未通過驗證檢查的郵件，或是不符合 DMARC 政策記錄中驗證規定的郵件時，採取合適的處置方式。

### 改善複雜度等級為：低複雜度高風險

無SPF 紀錄：建議為網域設定 SPF 紀錄

### 改善複雜度等級為：中複雜度高風險

**無 DMARC 紀錄**：建議為網域設定 DMARC 紀錄（先設置 SPF 與 DKIM）

由於 DMARC 必須仰賴 SPF 與 DKIM 機制才能發揮功效，因此建議先檢查是否有 SPF 設置錯誤的問題，而雖然 SPF 的改善複雜度並不高，但許多網站的設置皆為預設，因此建議按照上一篇文章的初步檢視之後，可以將 SPF 的改善列為優先項目。

此外，雖然 DMARC 的改善複雜度不低，但此項目對於防範社交工程來說效果十分顯著，所以若針對社交工程有疑慮的朋友，不妨在 SPF 設置完成之後，參考風險修復參考資料對 DMARC 進行設置。

### 風險修復參考資料：

**SPF：**

[**關於 email security 的大小事 — 設定篇 SPF**  
](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-spf/)

**DMARC & DKIM：**

[**關於 email security 的大小事 — 設定篇 DKIM、DMARC**](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-dkimdmarc/)

## №２CSP 未設置或安全等級不足

排名第二的CSP 未設置或安全等級不足，在這個項目裡有將近 90% 的網站CSP 未設置或安全等級不足，**網頁內容安全政策**（ Content Security Policy, CSP）主要是為了防範 **XSS（跨站腳本攻擊）**，以告知瀏覽器發出的 Request 位置是否受到信任來阻擋非預期的對外連線，加強網站安全性，在 http header 定義限制載入的跨站 script 像是 img-src、script-src…等這些可以載入外部資源的標籤。

### **低複雜度中風險**

**CSP未設定或安全等級不足**：建議為避免此風險可於 HTTP Headers 中設置 Content-Security-Policy。

此項目的改善複雜度不高，建議可以在 Cookie 的三項基本設定以及 X-Frame-Options 完成後對此項目進行設置。

### 常見風險對應法規技術面項目：

**PCIDSS** ：Develop and maintain secure systems and applications

### 細項說明：

> 6.5.1: Protected from injection flaws, particularly SQL injection. Also consider OS Command Injection, LDAP and XPath injection flaws as well as other injection flaws.

> 6.5.7: Protect all web applications and application interfaces from cross-site scripting (XSS).

### **懶人包：除了防範可能導致內嵌或是注入的攻擊，針對 XSS 的攻擊需要特別注意。**

### **風險修復參考資料：**

[**Content Security Policy (CSP) - HTTP | MDN**  
](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## №１網站憑證完整性不足

排名第一的網站憑證完整性不足，在這個項目裡有 90% 的完整性不足例如**憑證撤銷機制未設定完整**或**憑證授權機關資源紀錄檢查**，在沒有這些設定的情況下業者很難防堵任意數位憑證認證機構擅自簽署網域憑證，而憑證完整性不足的業者中還包含了**使用不安全的加密**及**過期憑證**與**過舊的 SSL/TLS 協議**，以上問題增加了業者在憑證層面可能發生資安事件的風險機率。

### 改善複雜度等級為：低複雜度高風險

**SSL/TLS 協議過舊**：建議停用如 TLS 1.1 等過舊協議。

### 改善複雜度等級為：低複雜度中風險

**使用不安全的加密法**：建議在伺服器設定中停用此加密套件

### 改善複雜度等級為：中複雜度中風險

**憑證撤銷機制未設定完整**：建議依據伺服器設定，使用加密套件完整此功能

**憑證授權機關資源記錄檢查**：建議為網域設定 CAA RR

**憑證過期**：建議聯繫 CA 更新憑證

普遍網站在憑證相關的設置上較容易有疏漏，建議優先檢視協議過舊以及是否使用不安全的加密法，也因為這兩項的初步檢視較為容易，所以建議在憑證的類別中，將這兩項進行優先修復，而改善複雜度為中的三項憑證設置，由於檢視方式以及改善複雜度較高，因此可以評估這三項憑證項目的必要性，優先修復其餘中複雜度中風險項目，但因為憑證與資料的加密和保護息息相關，所以與之相關聯的法規項目也特別多，所以如果很在意法遵的朋友建議還是將憑證項目的風險修復順序提高一個層級。

### 常見風險對應法規技術面項目：

**憑證撤銷機制未設定完整、不安全加密套件、憑證過期**

**PCIDSS** ：

Encrypt transmission of cardholder data across open，public networks

### 細項說明：

> 1: Use strong cryptography and security protocols to safeguard sensitive cardholder data during transmission over open, public networks.

> 1.1: Ensure wireless networks transmitting cardholder data, or connected to the cardholder data environment, use industry best practices to implement strong encryption for authentication and transmission.

Develop and maintain secure systems and applications

### 細項說明：

> 6.5.4: Do not allow insecure communications.

### **懶人包之 PCIDSS**：除了不允許不安全的通訊以外，也需要使用強加密和安全協議來保護敏感數據。

**ISO27001：**

Cryptographic Controls

### 細項說明：

> Encryption and cryptographic controls are often seen as one of the key weapons in the security arsenal, however, on its own it is not the “silver bullet” that solves every problem. Incorrect selection of cryptographic technologies and techniques or the poor management of cryptographic material (e.g. keys and certificates) can create vulnerabilities themselves.

### **懶人包之 ISO27001**：加密技術的選擇錯誤或加密素材（例如密鑰和證書）的管理不善可能會導致服務產生漏洞。

**GDPR：**

Responsibility of the controller

### 細項說明：

> Taking into account the nature, scope, context and purposes of processing as well as the risks of varying likelihood and severity for the rights and freedoms of natural persons, the controller shall implement appropriate technical and organisational measures to ensure and to be able to demonstrate that processing is performed in accordance with this Regulation. 2Those measures shall be reviewed and updated where necessary.

> Where proportionate in relation to processing activities, the measures referred to in paragraph 1 shall include the implementation of appropriate data protection policies by the controller.

> Adherence to approved codes of conduct as referred to in [Article 40](https://gdpr-info.eu/art-40-gdpr/) or approved certification mechanisms as referred to in [Article 42](https://gdpr-info.eu/art-42-gdpr/) may be used as an element by which to demonstrate compliance with the obligations of the controller.

Data protection by design and by default

### 細項說明：

> Taking into account the state of the art, the cost of implementation and the nature, scope, context and purposes of processing as well as the risks of varying likelihood and severity for rights and freedoms of natural persons posed by the processing, the controller shall, both at the time of the determination of the means for processing and at the time of the processing itself, implement appropriate technical and organisational measures, such as pseudonymisation, which are designed to implement data-protection principles, such as data minimisation, in an effective manner and to integrate the necessary safeguards into the processing in order to meet the requirements of this Regulation and protect the rights of data subjects.

> The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed. 2That obligation applies to the amount of personal data collected, the extent of their processing, the period of their storage and their accessibility. 3In particular, such measures shall ensure that by default personal data are not made accessible without the individual’s intervention to an indefinite number of natural persons.

> An approved certification mechanism pursuant to [Article 42](https://gdpr-info.eu/art-42-gdpr/) may be used as an element to demonstrate compliance with the requirements set out in paragraphs 1 and 2 of this Article.

Security of processing

### 細項說明：

> Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including inter alia as appropriate:

> 1.the pseudonymisation and encryption of personal data;

> 2.the ability to ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services;

> 3.the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident;

> 4.a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures for ensuring the security of the processing.

> In assessing the appropriate level of security account shall be taken in particular of the risks that are presented by processing, in particular from accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to personal data transmitted, stored or otherwise processed.

> Adherence to an approved code of conduct as referred to in [Article 40](https://gdpr-info.eu/art-40-gdpr/) or an approved certification mechanism as referred to in [Article 42](https://gdpr-info.eu/art-42-gdpr/) may be used as an element by which to demonstrate compliance with the requirements set out in paragraph 1 of this Article.

> The controller and processor shall take steps to ensure that any natural person acting under the authority of the controller or the processor who has access to personal data does not process them except on instructions from the controller, unless he or she is required to do so by Union or Member State law.

### **懶人包之 GDPR** ：控制者應實施適當的數據保護政策和數據保護原則，例如將必要的保護措施整合到資料處理過程中，也需確保處理數據的系統和服務機密性、完整性、可用性，避免未經授權而揭露的個人數據。

### **風險修復參考資料：**

**協議過舊：**

[**Windows Server 2019 現已依憑證繫結提供 TLS 版本強制執行功能 - Security documentation**](https://docs.microsoft.com/zh-tw/security/engineering/disable-legacy-tls)

**憑證相關：**

aws:

[**What Is AWS Certificate Manager?**](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

gcp(load balancer):

[**Using Google-managed SSL certificates | Load Balancing | Google Cloud**](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs)

gcp(k8s engine):

[**Using Google-managed SSL certificates**](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)

azure key vault:

[**Get started with Key Vault certificates**  
](https://docs.microsoft.com/en-us/azure/key-vault/certificates/certificate-scenarios)

## **結論**

將風險與法規比對並不是為了說明若是未修復風險會違反多少法規，而是為了藉著風險的修復來佐證自身對於法規的重視，舉例來說， 當客戶詢問公司有沒有符合 GDPR 的規範時，若是能夠提供憑證的風險修復紀錄，其實就是一個很好的佐證資料。

而本文所提到的改善複雜度，則是為了目前常見的資源有限但問題不會消失的情況而提供決策的輔助，目前市面上有許多相關的評估報告和掃描也是圍繞著風險管理的概念延伸，若是能因此而管理自身的風險以及對應的法規並找到最適的風險修復方案的話，無論是在稽核或是安全性的管控上都是一筆十分划算的投資。

## 延伸閱讀：

**資安科普番外篇（一）-大意了啊沒有閃！常見網站曝險你中了幾項？！**

> [大意了啊沒有閃！常見網站曝險你中了幾項？！](https://tech-blog.cymetrics.io/jo/zerobased-common-risk-exposure/))

## 參考文獻：

**PCIDSS**

> [https://kirkpatrickprice.com/](https://kirkpatrickprice.com/video/pci-requirement-6-develop-maintain-secure-systems-applications/)

**ISO27001**

> [https://www.isms.online/iso-27001](https://www.isms.online/iso-27001/annex-a-10-cryptography/)

**GDPR**

> [https://gdpr-info.eu](https://gdpr-info.eu/art-24-gdpr/)

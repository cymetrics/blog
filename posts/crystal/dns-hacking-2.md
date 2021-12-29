---
title: DNS Hacking 之 電話簿攻防之術：DNSSEC、DoT/DoH
author: crystal
date: 2021-12-13
tags: [Security, DNS, DNSSEC]
layout: zh-tw/layouts/post.njk
image: /img/posts/crystal/dns-hacking/cover-2.jpg
---

<!-- summary -->
作為網路世界最悠久的協議之一，DNS 最初的設計自然不是以資安考量為主軸。於是，隨著各種技術演進效能提升，越來越多的攻擊手法也應運而生。這次，讓我們來認識 DNS 的資安弱點與相應的防禦方式。
<!-- summary -->

有稍微接觸過資安的話，你可能會聽過 CIA 模型或三要素。

CIA 代表 Confidentiality Integrity Availability 這三個維度。Confidentiality，中文翻譯為『機密性』，表示資料是否只能被具備相應權限的人所存取，未授權者無法觀察或竊聽資料內容。Integrity，中文翻譯為『完整性』，表示資料是真實且可驗證的，或者也可以反過來説：資料是無法竄改或偽造的。Availability，中文翻譯為『可用性』，表示資料的取得不會被干擾、供給不會被中斷。

#[CIA Triad - 取自 <a href="https://www.securitymadesimple.org/cybersecurity-blog/what-are-the-3-principles-of-information-security">SecurityMadeSimple</a>](/img/posts/crystal/dns-hacking/cia.png)

這三個性質被列為設計跟評估資安時的基本準則，違反任何一條都會造成資安上的疑慮與風險，不過當然依據行業跟系統的性質不同會各有特別側重的要素。例如，金融交易要是資訊外流（C）或是交易內容遭到竄改（I）會造成龐大的財務與商譽損失，一丁點錯誤都不能有；電力系統也許更偏重服務的持續性（A），要是隨便一個攻擊就能讓系統癱瘓，一天到晚停電會造成相當大的損失。

這次，讓我們用 CIA 的角度剖析一下 DNS 有哪些資安弱點，以及為了強化這三個面向而發展出的防禦機制。

## Confidentiality (機密性) 

DNS 系統中，所有的對話都是以 UDP 明文傳輸，這表示所有的內容（查詢的對象跟結果）都可以被路徑上的觀察者看到。而要達成機密性，表示網路上的竊聽者無法透過觀察流量來判斷使用者發起 DNS lookup 的目標。換句話說，就是要保障使用者存取的內容的匿名跟隱密的特性。

在這裡，機密性顯然不成立。

正因為 DNS 本來不具備機密性，導致它成為監視與審查最好下手的目標。當然，審查也是一把雙面刃，美其名曰保護弱者、打擊犯罪，若是被濫用也可能會背上思想控制、侵犯人權與自由的罪名。

列舉一些耳熟能詳的應用場景，例如電信業者提出兒童防護方案，在偵測到惡意或兒少不宜網站的 DNS queries 時擋下流量。或是數個歐洲國家陸續推出從 DNS 層級過濾流量的計畫來防止用戶訪問發布盜版資源的非法網站。還有公司為了防止機密資料外流及病毒，可能會擋下特定網站、服務、或地區的連線。當然，許多國家也會操控著國內的電信業者來過濾人民存取的內容、監視違反國家利益的行為、甚至利用這些證據。攻擊者可能也會藉此追蹤特定對象的網路足跡，進行更進一步的威脅。

這種從路徑上的某一點切入，攔截、閱讀、或竄改通訊內容的攻擊，就稱為 on-path attack。應用在不同的場景中，就變成大家或多或少聽過的 man-in-the-middle (MitM)、man-in-the-browser (MitB) 等手法了。

新聞族繁不及備載：
* [A Hong Kong Website Gets Blocked, Raising Censorship Fears](https://www.nytimes.com/2021/01/09/technology/hong-kong-website-blocked.html)
* [Six Big UK ISPs Ordered to Block Five Piracy Streaming Websites](https://www.ispreview.co.uk/index.php/2021/10/six-big-uk-isps-ordered-to-block-five-piracy-streaming-websites.html)
* [Germany is about to block one of the world's biggest porn sites](https://www.wired.co.uk/article/germany-porn-laws-age-checks)

為了補足 DNS 缺乏隱私的特性，2016 年 DoT(DNS over TLS) 在 [RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858) 中被提出，利用 TLS 協議加密 DNS 流量，讓網路中的竊聽者無法直接看到傳輸的內容，也無法竄改資料（不過這就是完整性的部分了）。

當然，這之中還有個美中不足的地方，那就是儘管竊聽者看不到 DNS query 的內容，他還是可以夠過監聽 port 53(DNS) 跟 port 853(DoT) 觀察到『有 DNS 流量』的事實。打個比方，就是：雖然我不知道你去醫院看什麼病，但我確定你有進去掛號看診。

但是，我根本不想要被知道有去過醫院呀！為了完全隱匿蹤跡，2018 年 [RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) 中出現 DoH(DNS over HTTPS)，把 DNS query 藏在有加密的 HTTPS 請求中送到 port 443，這樣一來就只有兩端的發起者跟回覆者知道 DNS lookup 曾經發生過，竊聽者只會看到一連串 HTTPS 的流量但無法辨別隱匿的 DNS query。

放在一起比較就會長得像下面這張圖：DoT 跟 DoH 都走加密通道，不過 DoH 混雜在一般 HTTPS 的流量中。

#[DoT DoH](/img/posts/crystal/dns-hacking/dot-doh.png)

這兩種方案哪個比較好呢？這個問題有許多爭議，結論還是以應用場景而定。隱私上當然 DoH 較完整，但管理上難以單獨對 DNS 流量進行配置，以網管人員的角度來說十分複雜。DoT 則相反，能提供網管人員高一些的可視性跟安全感。另一方面，這些隱私機制本身也備受爭議，例如 2019 年的 DDoS 蠕蟲 Godlua 就曾用 DoH 來隱藏跟 command-and-control server 的溝通，以及 Mozilla 支援 DoH 也備受抨擊：[Internet group brands Mozilla 'internet villain' for supporting DNS privacy feature](https://techcrunch.com/2019/07/05/isp-group-mozilla-internet-villain-dns-privacy/)

容易被誤會的一點是：用了 DoT DoH 就沒辦法監視流量了嗎？其實也不是。加密只保護端點之間的通訊，所以資料到端點被解密後會經過什麼處理就不在保護範圍內了。所以，你的 DNS 供應商還是可以在接收到 DNS query 後過濾惡意或兒少不宜的內容，或是把你的足跡紀錄起來提供給其他單位的。

## Integrity (完整性) 

前面提過，完整性指的是確保資料無法被篡改或偽造的特性，或者說，具備完整性就表示資料是能被驗證且無法否認的。

先讓我們來看看幾個故事：
2014 年，土耳其政府為了[防止人民存取 Twitter](https://time.com/32864/turkey-bans-twitter/)，要求當地電信業者將所有對 twitter.com 的 DNS query 導到政府官網，以致人民開始透過國外的 DNS resolver 來規避政府的限制，甚至將 Google 的 DNS 位置 8.8.8.8 噴漆在牆上。

2008 年，研究員 [Dan Kaminsky](https://en.wikipedia.org/wiki/Dan_Kaminsky) 展示了一種 DNS 的攻擊手法，能讓 DNS resolver 儲存錯誤的 DNS 紀錄，導致所有向它發起 DNS query 的人都得到錯誤的答案，藉此劫持流量導向任意網域。這個攻擊稱為 DNS poisoning，透過污染 DNS resolver 中的 DNS 紀錄操控使用者通訊的對象。

### DNS cache poisoning (DNS spoofing)

這個攻擊的成立基於兩個特性：
1. DNS 所使用的 UDP 不會驗證收受方 IP 的真實性，我們可以創建一個 UDP 封包然後在來源 IP 隨意指定一個位置，也就是說，我們可以偽造一個來自 Authoritative DNS 的 UDP 封包然後傳給 DNS resolver。
2. DNS resolver 發出 DNS query 後，會接受第一個收到的答案，也就是說，如果你可以比真正的 Authoritative DNS 更快回覆一筆答案給 DNS resolver，你的訊息就會被相信並採用。

因此，這個攻擊的步驟只有兩階段：首先選定一個你想污染的 DNS 紀錄的網域，再向 DNS resolver 發起 DNS query。接著，發送大量的偽造 UDP 回覆（DNS 紀錄放你想指向的 IP）給 DNS resolver，只要其中一個比 Authoritative DNS 的回覆更早抵達，你的假 DNS 紀錄就會被存放在 DNS resolver 中。如此一來，在 TTL 過期以前，其他來詢問此網域的用戶都會被帶到你的網站。

聽起來簡單，其實實作起來沒那麼容易，因為要偽造回覆你還需要知道幾個資訊：
* 這個 DNS query 的 request ID （一組 16-bit 的數字）
* DNS resolver 查找的 Authoritative DNS 的 IP
* DNS resolver 的向 Authoritative DNS 請求實用的 port

這些資訊在 Kaminsky 提出攻擊時是相對容易取得或猜到的資訊，經過一系列的強化措施（隨機化 port 與 request ID 等）後 DNS poisoning 已經較難成功。

不過即便如此，現實生活中都還能經常觀察到攻擊發生，根據 [NISC 的統計報告](https://www.helpnetsecurity.com/2021/10/26/organizations-dns-attacks/) 指出，72% 的受訪企業一年內曾遭受 DNS 相關攻擊，其中有 33% 就是 DNS poisoning。甚至在幾天前，研究員發現透過 ICMP 的 caching 機制可以讓本來應該隨機化的 port 變得可以預知，導致強化機制失效：[New Side Channel Attacks Re-Enable Serious DNS Cache Poisoning Attacks](https://thehackernews.com/2021/11/new-side-channel-attacks-re-enable.html)

當然，最廣為人知的就屬中國的 Great Firewall (GFW)，大家說的翻牆，翻的就是使用 DNS poisoning 來阻擋特定網域的 GFW 呀！今年六月多的一篇論文：[How Great is the Great Firewall? Measuring China's DNS Censorship](https://arxiv.org/abs/2106.02167) 發在了資安領域三大 conference 之一的 USENIX Security Symposium，透過長期實驗觀察 GFW 的機制、影響、與規避 DNS poisoning 的方法。

這一段詳述了 GFW 對 DNS 的操作：

> GFW is designed as an on-path/man-on-the-side (MotS) system which takes advantage of UDP-based DNS resolution to inject fake responses when censored domains are detected in users’ DNS queries.
> More specifically, when the GFW detects a DNS query for a censored domain, it will forge a response with an incorrect DNS record towards the client. 
> As an on-path system, the GFW cannot modify or drop the legitimate response returned by the blocked domain’s authoritative name server or the public resolver chosen by the client. However, since the GFW is usually closer (in terms of physical network distance) to the client, the injected response will usually arrive ahead of the legitimate one, thus being accepted by the client who is now unable to access the domain.

以及繞過 GFW 的方法：

> Since the GFW operates as an on-path injector and does not alter the legitimate response from the actual DNS resolver chosen by a client, a circumvention strategy for the client is to not quickly accept any returned responses when querying a censored domain. Instead, the client should wait for an adjustable amount of time for all responses to arrive ... and check them against the injection patterns and forged IPv4 addresses discovered

一句話總結：GFW 離用戶比較近，所以用戶會先收到 GFW 偽造的紀錄並採用，但因為 GFW 不會對真正的紀錄做修改，所以用戶如果等久一點收集多一些回覆，再依據論文中找到的 injection pattern 過濾假的回覆，就可以得到真的答案。

類似的新聞很多：

* [AWS DNS network hijack turns MyEtherWallet into ThievesEtherWallet](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
* [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
* [DNSpooq bugs expose millions of devices to DNS cache poisoning](https://www.welivesecurity.com/2021/01/20/dnspooq-bugs-devices-dns-cache-poisoning/)
* [Hacktivists deface multiple Sri Lankan domains, including Google.lk](https://www.zdnet.com/article/hacktivists-deface-multiple-sri-lankan-domains-including-google-lk/)

### DNSSEC

顯而易見，DNS 並不具備完整性的特性，因為我們無法驗證收到的回覆是否是可以信任的。

那麼，我們要如何讓 DNS 紀錄是可驗證的呢？

先回想一下，你訪問網站的時候都怎麼確認它是不是值得信任的。不外乎就是確認網址列的網域正確，而且旁邊有個鎖頭，看起滿安全的。

#[web certificate](/img/posts/crystal/dns-hacking/certificate.png)

這裡的鎖頭顯示為安全，代表網站憑證的驗證通過了。憑證就像是網站的身分證，要經過公認機關（Certificate Authority, CA）的核發才能得到，換言之，擁有合法憑證就代表有值得信任的權威背書，如果你相信這個權威，就可以相信這個網站。這種傳遞信任的邏輯，我們稱做信任鍊。

同樣的邏輯，如果我們也可以讓 DNS 紀錄有信任鍊的支撐，那我們就不用擔心會收到假的 DNS 紀錄了，因為認可這筆紀錄的是具有公信力的機構，他都覺得沒問題了那我當然也覺得沒問題囉。

在 DNS 中實作信任鍊的機制，就稱為 DNSSEC，定義在 [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033)、[RFC 4034](https://datatracker.ietf.org/doc/html/rfc4034)、[RFC 4035](https://datatracker.ietf.org/doc/html/rfc4035) 中，利用不同層級的 DNS server 之間的關係以及三種新的紀錄（DNSKEY、DS、RRSIG）來達成。

用網站憑證的信任鍊來類比就會很好理解：你想申請的憑證送到 CA 審核後，會被 CA 的 intermediate 憑證簽署，而 intermediate 憑證本身又被 Root CA 的憑證簽章，如此一來，你的憑證就等同於是被 Root CA 所核准。

換到 DNS 的場景，你把剛剛的『憑證』兩個字換成『DNS 紀錄』，『CA』換成『DNS』就行了。我們再讀一次，把角色名字換一下：你（authoritative DNS）想申請的 DNS 紀錄送到 TLD DNS 審核後，會被 TLD DNS 的 DNS 紀錄簽署，而 TLD DNS 的 DNS 紀錄本身又被 Root DNS 的 DNS 紀錄簽章，如此一來，你的 DNS 紀錄就等同於是被 Root DNS 所核准。

概念上很簡單吧！不過實作上稍微複雜一些，首先我們用 `dnstests.ovh` 這個網域的 DNS 紀錄介紹一下前面提過的三種新的紀錄：

```txt
;; ANSWER SECTION:
dnstests.ovh.		3599	IN	SOA	dns10.ovh.net. tech.ovh.net. 2021111601 86400 3600 3600000 60
dnstests.ovh.		3599	IN	RRSIG	SOA 8 2 3600 20211216102459 20211116102459 24561 dnstests.ovh. npTSXxSbKNeIQ2eljfHkM1kJR20wHLopGcZsnURTiojdno7ZPbnThDzL WmE7dgU4mxGS20xH4fKZIHKUmifDtzg/NmYFJ/wxjLQB2a2t0HDjnq2S 3QYaXYGIVEOunzc/IALJbZvYCbaXLcwAYlZeA19uE8OwXUbJZnK8gKAh GeQ=
dnstests.ovh.		3599	IN	NS	dns10.ovh.net.
dnstests.ovh.		3599	IN	NS	ns10.ovh.net.
dnstests.ovh.		3599	IN	RRSIG	NS 8 2 3600 20211216102459 20211116102459 24561 dnstests.ovh. H8C/BVwg+h7BB8S1ZEOdC2PcVbfTaQZ5CwdYjBeq0tQ/T8NO5H5RHu7/ hyVoHEGgUrTmKHgXA27kFZZARbxfImLkSesrzCEDZJinVvyr/5k/UAL5 5ZPaXtPdRznwvY/pELHcIftNIYUg8beYl/MTof3n9utWCBGIbJo3a9U0 RjU=
dnstests.ovh.		3599	IN	A	213.186.33.5
dnstests.ovh.		3599	IN	RRSIG	A 8 2 3600 20211216102459 20211116102459 24561 dnstests.ovh. ZuGlGMqdb4aUnwjdN7ygG/2F6Vr+K6UnISHgUO68BMaUCqH0q3t+GDyR 7yM269RGkNkYC3/S5q7bSkMYzXxVc4PaQxxDE+LjDuunBJPwniDbmVim XenIIGhlVvP2fGVXiVm5R+kOrMm1nzh/DxGkYKaj4gchd7Iyh4CVRv7i hwk=
dnstests.ovh.		59	IN	NSEC	subdomain.dnstests.ovh. A NS SOA RRSIG NSEC DNSKEY
dnstests.ovh.		59	IN	RRSIG	NSEC 8 2 60 20211216102459 20211116102459 24561 dnstests.ovh. BNIpl23leVFMu4D6afbMjGt18+H98n0s05cpRq9VcFj1HyANYS7G7QyM geMKfiaCB4aIhTg2Kfq5g6zEgsQAEYZuGQOJ8mdhPaqdz0xPQd01pDrr I/GUWMaNxVJx6sVMoximt7eAiF0G+FPqSdmi+L6QkiUY0i0TQo2fymYs qSg=
dnstests.ovh.		3599	IN	DNSKEY	257 3 8 AwEAAdnP4dGVQ7yMFi1GvCXQAxfw+p1mpXb2ORwbh/Lt6A6JvwUmhUGF WobYWrX8TTs7wR4l9o+qfS9ZJbEqqFmZsfkGz0whzkzJdnr/N6QyOWF9 c9m+zOpPD/l3xKar6xJkz6HpSNxH404ftBfQeN60H9g4i0AcKQWjkQFS I9vOjaCGbsfbI9/meFNAU77zAU/SkG2SCaPq+aMVPNJnBRR4Z03NLAp+ wijg5eWCuSjB5qtmr+azdKOW4Q6hHgNzkQJqQNzfPz/tu84jis/7fsbJ ScT7Nfv8N+anf956RBuRLHbDiXCrzmeKPF6CUKUo3hkD2bDRIXu0z/LW UQvd1Mqsqlk=
dnstests.ovh.		3599	IN	DNSKEY	256 3 8 AwEAAbuItCAOIzcSvBfHIYl5JbzHjbA2RVHKA9/dvCgbCFQEA/7Q6IUU IVHoEfd+oPuz0rnV9Xq6R2GI89wrAOCp2aGaeFm+pin4eugTtzyBNTyr RKHd/OmDWkfDyLS37jhZmI2dWxNNAWWkAQBPOmH3g+J84IiIZ2JnQKZ2 /3aLj527
dnstests.ovh.		3599	IN	RRSIG	DNSKEY 8 2 3600 20211216102459 20211116102459 2839 dnstests.ovh. l9NCVGEfxryUSKngfVJ6WyTGkEVtZSobzwHXZOA61hN5rKBB3vTi/kQn bUhW43zHUJOgMKRV+m1DNZUaqVKBDQvaZj2oM4AJLDNzOUDEjFFzdhZr Q8b8LoRhC694HCJ31NRuO1YN5cDlgTE+q378eNd3MQeimang0eBa43rQ 88xV2uZ5A/QbawEfk+aGIul9i3TF+qHsPSXPon1nXj29FHo8xxsXdy7E YJb8d/AvNqHALkrd6Us0UuhXflrYurlW/NNt1j+xvbdJ8Z8WsRqcrkFQ XKR2y0WDSRGzH3CLVGiUWR1DVqbxtqrx12NYGgDOEVypNyv7bGrFf8jc 6DS84g==
dnstests.ovh.		3599	IN	RRSIG	DNSKEY 8 2 3600 20211216102459 20211116102459 24561 dnstests.ovh. tNZAVJgCYtWMlzb3mdVn3QSpmH6noIo17nkkmP7TiLb/0KmiqcRIZhJv lFNR6zsjym5V4WkFEJD2Cc/0fd5kPWHbVTEICTeDvOh3h/YTbetGDNhu 0MpLpN5UwWGayADkIKY0a8IKg7+uimQKFtR0zA6GFw6Yyx6XXqaohXSq LAY=

```

紀錄類型標記在 IN 之後，你會發現一個有趣的規律：同一種類型的紀錄會放在一起，稱為一個 RRset (resource record set)，而且在每個 RRset 之後都接著一筆 RRSIG 紀錄。

> 如同簽署網站憑證會有公鑰私鑰，簽署 DNS 紀錄同樣也用數位簽章的技術，所以發出去的公鑰就是放在 DNSKEY 紀錄裡，而簽完每一種 RRset 的結果會放在 RRSIG 紀錄裡。

範例中你會觀察到，RRSIG 紀錄的第五個欄位（就是 'RRSIG' 字串後的那個）都會標記簽署的是哪一種 RRset，然後最後一個欄位是一大堆加密字串，也就是簽章本人。

你可能也發現，為什麼會有兩筆 DNSKEY 紀錄？

那是因為，DNSSEC 的機制裡會生成兩對公私鑰組合，一對稱為 ZSK (zone signing key)，就是剛剛用來簽署其他 RRset 用的，是上面 DNSKEY 紀錄中第五個欄位寫 256 的那一把；另一對稱為 KSK (key signing key)，是用來簽署 DNSKEY 紀錄的，第五個欄位寫 257。

有了 ZSK 我們就能驗證 RRset 的真偽，但是我們怎麼知道 ZSK 本人不是偽造的紀錄呢？這就是 KSK 的職責之一：用數位簽章來保護 ZSK，把信任鍊的擔保責任從末端的 RRset 交到 ZSK 再轉移到 KSK 身上。

仔細看下圖 RRSIG 紀錄的欄位，特別標出來的是簽署的 RRset 類型跟標示要用哪一把 DNSKEY 驗證的 key tag（不是 uuid，而是由 DNSKEY 中的欄位算出來的數字）。再回去看上面的範例，就會發現簽署 A NS MX 等紀錄用的都是 24561 （ZSK 的 key tag），但倒數第二筆簽署 DNSKEY 紀錄時用的是 2839 （KSK 的 key tag）。

#[RRSIG from <a href="https://docs.infoblox.com/display/NAG8/RRSIG+Resource+Records">Infoblox</a>](/img/posts/crystal/dns-hacking/rrsig.png)

但是就算多了一個 KSK 來保護 ZSK 也不夠啊？KSK 不就還是有可能是假的嗎？

沒錯！所以必須要有下一個 ~~替死鬼~~ DNS 紀錄來傳承信任鍊。這個任務會交給上一層 zone 來驗證，當我們要驗證 `dnstests.ovh` 的 DNSKEY 時要去找 `.ovh`，而介接這兩層的方式，就是用放在上層 `.ovh` 的 DS 紀錄。

```txt
dnstests.ovh.		21600	IN	DS	2839 8 2 D33EA743F0D93C6E62CF899DC32F5CBBBC340853C69CAA65C77BAE0F 1764EE29
```

#[DS from <a href="https://docs.infoblox.com/display/NAG8/DS+Resource+Records">Infoblox</a>](/img/posts/crystal/dns-hacking/ds.png)

如圖所示，DS 紀錄的主要內容就是 child zone 的 KSK(key tag 2839) 的 hash 值，放在 digest 欄位，前面的數字則指示了 hash 與 child KSK 用的演算法，以及 child KSK 的 key tag。補充一下，雖然圖中看不出來，不過 DNSKEY(KSK) 紀錄跟驗證他的 DS 紀錄有著同樣的 owner 值，只是存放在不同層級的 zone 之中。

有了 DS 紀錄串接兩層，後面就好辦了。畢竟 DS 紀錄其實也就是一筆一般的紀錄，所以也會被該 zone 的 ZSK 簽署，重複我們最一開始建構信任鍊的流程。至此， zone 之內與跨 zone 的連結都有了，我們就可以用下面這張圖描述 DNSSEC 的機制：

#[trust chain from <a href="https://blog.cloudflare.com/dnssec-an-introduction/">Cloudfare</a>](/img/posts/crystal/dns-hacking/chain.png)

這張圖里的箭頭標示出的是簽章的方向，也是信任建構的方向。從最末端的 `example.com` A 紀錄，經過 zone 內的 DNSKEY 連結到上一層的 `.com` zone，在一路傳遞到最上層 `.` root zone 的 DNSKEY(KSK)。這把 root KSK 是世界上所有機器都知道且設定信任的資訊，而且他的創立與簽署是需要經過一群人每隔五六年舉行  Root Zone Signing Ceremony 才能完成的呢！

稍微延伸一下，因為 KSK 是每個 zone 中的信任根基，所以又稱為 trust anchor，取個定錨的概念。有些人會困惑：明明 ZSK KSK 都是用來簽署紀錄，幹嘛不用一把鑰匙就好，反正上一層的 DS 紀錄簽的都是鑰匙呀，哪一個有差嗎？

其實也沒錯，RFC 裡其實並沒有規定一定要用兩把不同的 DNSKEY，不過基於維運跟安全上的考量，一般會分開來。就像密碼每隔一段時間就該更換一樣， DNSKEY 也是需要定期 rollover 的，如果你只有一把 DNSKEY，那每次更新就都要跑去上一層 zone 那邊更新你的 DS 紀錄，對網管來說是很麻煩的一件事。分成 ZSK KSK 的好處在於，ZSK 可以頻繁地更換（例如每年），反正每次更新自己用 KSK 簽一下並發布就好，KSK 則可以用久一點（例如每五年），減少跟上一層 zone 溝通的頻率。另一個優點是，因為 ZSK 使用的頻率比 KSK 高很多，所以兩者可以存放在不同的地方提升安全性：ZSK 放在容易存取的地方、KSK 放比較安全但不易存取的位置。如果只有一把鑰匙，那洩漏出去就完蛋了，但分成兩段之後，儘管 ZSK 的性質跟保護機制都讓他比 KSK 有更高的洩漏的可能，但只要管理好 KSK 的安全性至少就能頻繁 rollover 減低傷害，也讓信任鍊的維持有穩定的基礎，這也呼應了『錨』的特性吧！

最後總結一下：DNSSEC 用信任鍊來建立 DNS 紀錄的完整性，而構成信任鍊需要增加幾筆新的紀錄類型：
* DNSKEY：在一個 zone 中，用來簽署 DNS 紀錄的公鑰，分成簽署一般紀錄的 ZSK 與簽署 DNSKEY 的 KSK。
* DS：不同層級的 zone 之間傳遞信任的紀錄，簽署了下層 zone 的 KSK。
* RRSIG：在一個 zone 中，用 ZSK 簽署 DNS 紀錄的結果，即簽章

其實另外還有兩種『證明紀錄不存在』的紀錄類型： NSEC 與 NSEC3，不過這個我們留待下一篇講子網域枚舉時再一起說明，大家會更有感覺。

## Availability (可用性) 

最後來到可用性，指的是服務的供給會不會被切斷，例如造成 DNS 超載停止回應、或是讓用戶收不到回覆等等 DoS (Denial of Service) 攻擊。

這裡介紹幾種常見手法：
1. NXDOMAIN attack: 攻擊者向 DNS resolver 大量請求不存在的網域（NXDOMAIN），讓 DNS resolver 忙於查詢這些目標而無法回應其他用戶的正當請求，或是也可以用來讓 DNS resolver 的 cache 塞滿攻擊者的垃圾回覆。其中一種變形是對一個合法存在的網域大量請求各種隨機產生的子網域，稱為 Random subdomain attack。
2. Phantom domain attack: 攻擊者架設許多回應很慢或甚至不回應的 DNS（Phantom server），然後向 DNS resolver 大量請求這些 DNS 下的子網域，導致 DNS resolver 的資源都耗費在等待 Phantom server 的回覆，造成 performance 下降或是無法服務其他用戶。
3. Domain lock-up attack: 這個攻擊類似前一個 Phantom domain attack，不過這次攻擊者架設的惡意 DNS 不僅會回覆，還會刻意放慢回覆時間、傳送垃圾封包，讓這個 TCP 連線不斷延長。當受害的 DNS resolver 跟這些惡意 DNS 溝通時就會被纏著不放（跟推銷電話一樣，但 resolver 很有禮貌不會直接掛斷），以致資源耗盡而卡住（lock-up）。
4. DNS amplification attacks: 攻擊者發起大量請求的時候，利用封包裡面偽造的地址讓 DNS 把回覆反彈到受害者的機器，且往往都一次做大筆的 DNS query，達成用小流量的請求做到對受害者大流量回覆的倍增（amplification）效果。跟前面幾種都不一樣，這個攻擊的目標不是阻斷 DNS 的服務，而是讓受害者被大流量的 DNS 回覆吃光資源。

更多攻擊方式可以參考 Infoblox 發布的 [Top Ten DNS Attacks](https://www.infoblox.com/wp-content/uploads/infoblox-ebook-top-ten-dns-attacks.pdf)。

要避免 DNS 的可用性被破壞，我們有幾種選擇。

第一，多買幾台好一點的機器，如果你的 DNS 能承受比預期流量多出數倍的負載，那就比較不容易被打垮。第二，用 [anycast routing](https://www.cloudflare.com/learning/cdn/glossary/anycast-network/) 讓多台機器共用 IP，等同讓多台機器作為彼此的 backup 服務用戶，達到 load balancing 的效果。

第三，也是最普遍的做法，架設 DNS firewall，也就是一台擋在 authoritative DNS 之前的 firewall，不只可以設定規則擋掉或是只允許特定 IP，還可以充當 cache 的角色減輕 DNS 的負擔跟加速用戶 lookup，算是經濟實惠又最好管理的選擇。

## 結論

最後稍微整理一下重點：

| 三要素 | 問題 | 解法 |
| ----- | --- | ---- |
| Confidentiality (機密性) | 防止 DNS queries 被監視或審查 | DoT(DNS over TLS), DoH(DNS over HTTPS) |
| Integrity (完整性) | 防止 DNS 紀錄被竄改或偽造 | DNSSEC |
| Availability (可用性) | 防止 DNS 被過多過大流量癱瘓導致使用者無法查詢 | DNS 防火牆 |

想實際看一下 DNSSEC 各種紀錄跟驗證的話，可以參考這篇 [How to test and validate DNSSEC using dig command line](https://www.cyberciti.biz/faq/unix-linux-test-and-validate-dnssec-using-dig-command-line/) 跟這篇 [BIND DNSSEC Guide](https://ftp.eenet.ee/pub/isc/dnssec-guide/html/dnssec-guide.html#how-to-test-recursive-server)，教你如何用 `dig` 還有他的 DNSSEC 版 `delv` 指令測試。

當然，還有更多的攻擊方式這裡沒辦法一一介紹，但希望有讓大家更了解 DNS 的資安問題與運作機制，附上一些參考資料：

* [What is the difference between DNS over TLS & DNS over HTTPS?](https://www.thesslstore.com/blog/dns-over-tls-vs-dns-over-https/)
* [Why does DNS need additional layers of security?](https://www.cloudflare.com/learning/dns/dns-over-tls/)

* [DNSSEC: An Introduction](https://blog.cloudflare.com/dnssec-an-introduction/)
* [Why is DNS security important?](https://www.cloudflare.com/learning/dns/dns-security/)
* [A Minimum Complete Tutorial of DNSSEC](https://metebalci.com/blog/a-minimum-complete-tutorial-of-dnssec/)
* [DNSSEC Guide : Chapter 6. Advanced Discussions](https://dnsinstitute.com/documentation/dnssec-guide/ch06.html)


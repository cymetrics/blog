---
title: DNS Hacking 之 基礎知識：DNS 運作與紀錄類型
author: crystal
date: 2021-11-24
tags: [Security, DNS, Subdomain Takeover]
layout: layouts/post.njk
image: /img/posts/crystal/dns-hacking/cover-1.jpg
---

<!-- summary -->
要打掛別人的網站難道只能從網頁中的漏洞下手嗎？其實，常常被忽略的 DNS 的漏洞可能更致命，讓駭客輕輕鬆鬆接管你的網站！但首先，我們要認識 DNS 的運作機制，以及有哪些紀錄類型。
<!-- summary -->

## DNS 如何運作

想像一下你要寄一箱水果到客戶劉先生的家裡，但你並不知道人家的地址。你總不能就只把『螃蟹公司業務部門劉先生』寫在包裹外面，因為郵差先生當然也不知道這個人是誰、更不知道他到底住哪裡。那，你要怎麼知道劉先生的門牌號碼，順利寄出水果呢？

首先，你可能會先 google 一下螃蟹公司的電話號碼，然後播一通電話過去問問該如何聯繫到業務部門的窗口。對方可能會給你另一支電話號碼或是轉撥分機，讓你聯繫上業務部門的人。最後，業務人員也許能直接從他的通訊錄中找到並告訴你劉先生家的地址，或是給你劉先生的電話讓你親自聯繫他。

這樣經過層層關係追朔出地址的做法，就是 DNS 運作的方式。

網路世界中，DNS 是一本巨大的通訊錄，紀錄每個網域的名稱（人看得懂的 `google.com`）與實際地址（人看不懂的 `172.217.160.78`）的對應關係。

你可以想成是，有一個服務專線會幫你處理前述反覆打電話的過程，當你透過專線詢問『螃蟹公司業務部門劉先生』的地址時，他就會直接回覆你詳細的門牌資訊。

當然，這麼複雜的工作不是一個人可以有效完成的，所以查詢的工作也需要多個層級的聯絡人，例如一個地方級聯絡人手上有信義區所有公司的電話號碼，而上一層的縣市級聯絡人手上則有所有地方級聯絡人的電話號碼，再往上也許還有區域級甚至全國級的聯絡人。為你服務的接線生手上也不會有所有聯絡人的資訊，畢竟這個清單太龐大了，而且他光是翻遍自己手上的筆記本就要耗費太多時間與資源。所以接線生的筆記本只會紀錄最常用的數筆電話號碼，以及最高層級的聯絡人（可以透過他層層推進往下查詢）。

同理，DNS 也是一個樹狀結構，有層級的分別。實際的機制我們用下圖解釋：

#[DNS Lookup](/img/posts/crystal/dns-hacking/dns-lookup.png)

當小華雙十一想要大買特買，在瀏覽器輸入 `www.abc.com` 的網址時，會依照圖中的流程發生這些事：

1. 你的瀏覽器對撥打專線尋求接線生的協助，這個接線生就是我們說的 DNS resolver。
2. 稱職的接線生手上沒有 `www.abc.com` 的記錄，但為了幫你找到正確的地址，會先去詢問最高層級的 DNS，也就是概念上屬於 `.` 網域的 Root DNS。
3. Root DNS 查一下自己手上的子網域清單，找到負責 `.com` 網域的 TLD(Top Level Domain) DNS，於是把這個地址轉介給 resolver。
4. resolver 轉向 `.com` 網域的 TLD DNS 詢問 `www.abc.com` 的地址。
5. TLD DNS 從手上的清單找到負責 `abc.com` 網域的 Authoritative DNS 的位置，回覆給 resolver。
6. resolver 向負責 `abc.com` 網域的 Authoritative DNS 詢問 `www.abc.com` 這個子網域。
7. Authoritative DNS 的記錄裡存在 `www.abc.com` 的記錄，把 IP 告訴 resolver！
8. DNS resolver 回覆瀏覽器查詢結果，可能是一個或是數個 IP 的清單。
9. 瀏覽器對查到的 IP 發起 HTTP Request，成功帶小華到購物網站！

經過好一番波折我們才終於得到一個網域名稱對應的實際 IP，如果每次都要經過這麼多次查詢未免太繁瑣了。作為一個世上最大的分散式資料庫系統，能快速查詢結果及同步更新是極為重要的。

還記得我們說過接線生手上有一個紀錄聯絡人的筆記本嗎？每個 DNS resolver 都會有 caching 的機制，記錄一些常用聯絡人的資訊，讓查詢的過程可以跳過幾個步驟。如果接線生手上本來就有 `www.abc.com` 的地址，那就會直接回覆給瀏覽器，不用經過更多查詢。如果差了一點，只有 `abc.com` 網域的 Authoritative DNS 位置，那也可以直接跳到第六個步驟開始。通常 DNS resolver 手上本來就會有多個 TLD DNS 的位置了，所以除非 DNS cache 剛被清空，否則很少會需要從頭開始詢問 Root DNS。

不過，DNS cache 中的紀錄也不是就一直存放在裡面的。每一筆紀錄都會有一個 TTL (Time-to-live)，這是一個代表『此紀錄可以被 cache 存多久』的數字，如果超過有效期限就表示這筆紀錄不新鮮，需要丟掉然後重新查詢一次來獲得新紀錄。這個機制的好處是能快速更新各個網域『搬家』的狀態，假設 TTL 為一小時，網管人員若是發布新的紀錄或是更改了服務的 IP，則可以確保至少在一小時後新紀錄就能生效，否則 DNS resolver 怎麼確認手上的地址是否還有效呢？

整理一下幾種角色：

* Root DNS：最高層級的 DNS，共有 13 種，全世界共有 600-700 多台，由 ICANN 管理，是每個 DNS Resolver 的已知資訊。存放關於各個 TLD DNS 的資訊。
* TLD DNS：次高層級的 DNS，負責如 `.com`、`.net`、`.org`、`.tw` 等最後一個後綴的網域，會存放各個 Authoritative DNS 的資訊。由 ICANN 下的分支 IANA 管理。
* Authoritative DNS：其他較低層級的 DNS，一般來說會是查詢的最後一站，專屬於掌握此網域的機構並存放此機構的子網域資訊。
* DNS Resolver：Lookup 的第一站，接線生的角色。 DNS cache 中會存放常用聯絡人，或更精確的說，最近使用的聯絡人的紀錄，向其他 DNS 查詢後會把回覆的紀錄寫進 cache。

## DNS 記錄有哪些

DNS 記錄非常多種，常見的有： `SOA`、`A`、`AAAA`、`CNAME`、`NS`、`MX`、`TXT`、`SRV`、`PTR`

不常見的還有： `DNSKEY`、`CAA`、`IPSECKEY`、`RRSIG`、`NSEC`、`AFSDB`、`APL`、`CDNSKEY`、`CERT`、`DCHID`、`DNAME`、`HIP`、`LOC`、`NAPTR`、`P`、`SSHFP` 等等

這裡我們先介紹常見的紀錄，不常見的下次再說 XDDD

### SOA

在討論 SOA 記錄之前，我們需要先了解 DNS zone 的概念。

很多人誤以為一個網域就是一個 DNS zone，但其實 zone 是一個方便管理 DNS 記錄的分群法，或者可以說是『適合通一管理的網域們的紀錄集合』。

想像你的公司 `abc.com` 有三個子網域：`blog.abc.com`、`news.abc.com`、`internal.abc.com`，可能本來都放在同一個 DNS zone。但有一天你發現了一個問題：性質上，`internal.abc.com` 是內部網域，會需要較嚴格的權限控管，而且下面也許還有更多子網域來辨別各個內部系統；另一方面，`abc.com`、`blog.abc.com`、`news.abc.com` 都是官網上會連結到的對外網域，性質較為相近。當你想要進行設定時，要一次設置共用設定有些困難、個別處理又顯得麻煩，各個網域全部混雜在一起讓你管理變得複雜。

這時，你就會考慮將 `internal.abc.com` 獨立出來變成自己的 DNS zone，這個切分允許管理者做更精細的控制，而且日後擴展新的子網域也更方便套用設定。

所以，DNS zone 可以是一個網域、多個網域、或是一個網域以及他的數個子網域等等各種分群方式，一台 DNS 上也可以有多個 DNS zone。

每個 DNS zone 都能用一個 zone file 代表，基本上就是一個文字檔，寫著所有屬於此 DNS zone 的網域的所有紀錄。而 zone file 的第一筆必須是 SOA (Start of Authority) 紀錄，主要記載這個 zone 相關的資訊，例如管理員信箱、用來辨別是否有更新的序號、主要的 NS 等等。

此外，主要負責管理 zone file 的那一台 DNS 稱為 primary nameserver，其餘備用或是用於 load balancing 的 nameserver 稱為 secondary nameserver，只有 zone file 的唯讀權限，並且會透過一個稱為 zone transfer 的溝通過程從 primary nameserver 那裡更新 zone file。

SOA 紀錄的欄位及敘述，以 `example.com` 為範例整理成下面這張表：

```txt
example.com.		3600	IN	SOA	ns.icann.org. noc.dns.icann.org. 2021110801 7200 3600 1209600 3600
```

| 欄位 | 值  | 敘述 |
| --- | --- | --- |
| name         |	example.com        | |
| record       | 	SOA                | |
| MNAME        |	ns.icann.org       | DNS zone 的 primary nameserver |
| RNAME    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; |	noc.dns.icann.org  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | 管理員信箱，第一個點其實翻譯成 `@` ，所以這個例子中是 `noc@dns.icann.org` |
| SERIAL       |	2021110801         | 可以想成版本序號，更動時會讓 secondary nameserver 知道該更新了 |
| REFRESH      |	7200               | secondary nameserver 詢問更新該間隔的時間 |
| RETRY        |	3600               | 若 primary nameserver 沒有回應，secondary nameserver 再次詢問前該間隔的時間 |
| EXPIRE       |	1209600            | primary nameserver 多久沒有回應，secondary nameserver 該停止回應 DNS query |
| TTL          |	3600               | |

### A/AAAA

最基本的 DNS 記錄，代表 Address，也就是實際的 IP 地址。 A 用於 IPv4 地址，AAAA 用於 IPv6 地址。

```txt
example.com.		17460	IN	A	93.184.216.34
```

一般來說只會有一筆 A 紀錄，不過你可能在用 AWS 等第三方服務的時候會發現 `dig` 指令竟然顯示了好幾筆紀錄，這其實是實作 load balancing 的一種方法，用數個 IP 分散網站的流量。

```txt
abc.com.		60	IN	A	13.226.115.26
abc.com.		60	IN	A	13.226.115.14
abc.com.		60	IN	A	13.226.115.45
abc.com.		60	IN	A	13.226.115.117
abc.com.		300	IN	NS	ns-1368.awsdns-43.org.
abc.com.		300	IN	NS	ns-1869.awsdns-41.co.uk.
abc.com.		300	IN	NS	ns-318.awsdns-39.com.
abc.com.		300	IN	NS	ns-736.awsdns-28.net.
abc.com.		900	IN	SOA	ns-318.awsdns-39.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400
```

### CNAME

CNAME 指的是 canonical name，也就是標準的、真實的名稱，讓指向的網域作為別名代表自己的意思。可以想成是一條線索接著一條線索，順著指向最終的寶藏。

```txt
foo.abc.com.	21600	IN	CNAME	bar.abc.com
```

進行 DNS lookup 的時候，如果得到 CNAME 紀錄，就會以對應的網域為目標重啟一次新的 DNS lookup，直到成功解析出 IP 為止。也因此，CNAME 紀錄跟 A 紀錄互斥，後者是直接給出網域對應的 IP，前者則是把原本的網域映射到另一個網域，等同採用對方的 DNS 紀錄。如果一個網域有 CNAME 紀錄，那麼根據 RFC ，除了使用 DNSSEC 的情況會設置 RRSIG、NSEC 的紀錄外，不能有其他的 DNS 紀錄（例如 NS、MX、TXT 等等）


你可能會困惑，如果兩個網域最後都解析到同一個 IP，那我們為什麼不刪掉其中一個就好了，反正都會是同一個網站啊？

這個問題的盲點在於，同一台機器的同一個 port 並不是只能運行一個網站，網頁伺服器是可以透過網址決定處理方式的。

假設你有 `blog.abc.com` 跟 `news.abc.com` 兩個網域，且他們都用 CNAME 紀錄指到 `abc.com`。當你 URL 輸入 `http://blog.abc.com/` 時，這個請求同樣是送到 `abc.com` 的 IP，但是網站伺服器會判斷是要存取 `blog.abc.com` 的資料而回應公司的部落格頁面。透過網站伺服器的分流，就能讓使用不同 URL 的訪客分別存取到部落格、時事、跟主網頁的資訊。而且這樣做的好處是，這三個網域都在同一台機器上，所以要變更 IP 的時候只要調整 `abc.com` 的 A 紀錄就可以確保三個都一起搬家。

### NS

NS 指的是 name server，也就是負責解析這個網域的 Authoritative DNS，所以 NS 紀錄就代表『去這個 DNS 問可以找到你要的 IP 喔』。

如同前面介紹過的，一個 DNS zone 通常不會只有一台 DNS 在運行，所以相對的 NS 紀錄也通常會有多筆資料。這些 Authoritative DNS 就是負責這個 DNS zone 的 primary nameserver 跟 secondary nameserver 們。

你可以拿一些網域試試看，會發現往往都會在主網域下發現 SOA 紀錄跟多筆 NS 紀錄：

```txt
$ dig any onedegree.hk

;; ANSWER SECTION:
onedegree.hk.		21600	IN	NS	ns1-03.azure-dns.com.
onedegree.hk.		21600	IN	NS	ns2-03.azure-dns.net.
onedegree.hk.		21600	IN	NS	ns3-03.azure-dns.org.
onedegree.hk.		21600	IN	NS	ns4-03.azure-dns.info.
onedegree.hk.		3600	IN	SOA	ns1-03.azure-dns.com. azuredns-hostmaster.microsoft.com. 20200910 3600 300 2419200 300
...
```

這並不是說子網域不能有 NS 紀錄，只是通常一個 DNS zone 會以一個主網域以及他下面的多個子網域構成，所以 SOA、NS 等代表整個 zone 的資訊就會掛在主要網域的下面。

### MX

MX 指的是 mail exchange，也就是郵件伺服器，所以 MX 紀錄指示的是『負責這個網域的郵件伺服器的網域』。

```txt
onedegree.hk.		3600	IN	MX	0 onedegree-hk.mail.protection.outlook.com.
```

當你要寄出一封信到 `receiver@onedegree.hk` 時，幫你寄信的 mail server 首先會去查找 `onedegree.hk` 的 MX 紀錄，得知信件應該送到 `onedegree-hk.mail.protection.outlook.com` 這個網域。再來才會透過 SMTP（email 專用的協議）把信送到 `onedegree-hk.mail.protection.outlook.com` 實際上的 IP 位置。沒有設置 MX 紀錄就像不告訴機長目的地的機場在哪裡，信件會完全無法發送。

為了增加維運的穩定度，MX 紀錄也可以有很多筆，但是 SOA 紀錄裡又沒有標示 primary mail server 之類的主次關係，寄信的時候怎麼知道要用哪一個結果呢？

上面的範例紀錄中，除了 TTL (`3600`) 之外還有一個寫在目標網域之前的數字 `0`，這個數字是 priority number，可以想像成是採用紀錄的優先序，所以帶有越小的數字表示越優先寄送給這個 mail server。兩個不同 priority number 的 MX 紀錄自然好懂，就是先嘗試寄給數字小的，如果失敗了再嘗試寄到數字大的。那如果兩個 MX 紀錄 有一樣大的 priority number，就是隨機採用其中一筆紀錄，做 load balancing 達到信件分流減少負載的效果。

### TXT

TXT 指的是 text，也就是純文字的紀錄，原意是讓網管能為他的網域加一些註解，不過現在大多主要用於防範垃圾信以及驗證網域擁有權。

格式基本上沒有限制，雖然 RFC 有定義需要是由雙括號包住、等號分隔的 key-value 型態（`"attribute=value"`），但並不是所有的 TXT 紀錄都會遵守此規範。

以防範垃圾信及偽冒信來說，會設置 SPF、DKIM、DMARC 這三個目前廣泛套用的機制，利用合法發信網域宣告的 IP 位置及郵件政策來實現 email security。這三筆紀錄會在郵件驗證的時候被查詢且採用，以此保障收受信人的安全。

更詳細的介紹可以參考我之前寫過的一系列文章：

[關於 email security 的大小事 — 原理篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-theory)
[關於 email security 的大小事 — 設定篇 SPF](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-spf)
[關於 email security 的大小事 — 設定篇 DKIM、DMARC](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-dkimdmarc)
[關於 email security 的大小事 — 範例篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-examples)
[關於 email security 的大小事 — 延伸篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-extra)

另一方面，當我們使用第三方服務，例如用 Sendgrid 替自己的網域寄信、或是希望創建出的電商頁面掛上自己的子網域名時，往往會需要先驗證網域擁有權，避免有心人士濫用服務來仿冒我們的網域。這時候廠商就可能會要求我們發一筆指定的 TXT 紀錄以茲證明，畢竟如果你真的是網域的擁有者，就應該能夠存取發佈 DNS 紀錄。這個概念就像是用某個信箱註冊服務時，必須去信箱裡點選確認信才能證明信箱真的是你的。

舉例來說，網頁為了行銷需求大多會設置 Google Analytics (GA) 來幫助 marketing 了解使用者的行為，因為這些資料也許包含過多或是敏感的商業資訊，所以 Google 為了確保能存取資料的必須是網域的擁有者，會要求用戶先驗證網域所有權，在 DNS 發佈一筆 `"google-site-verification=<long-random-string>"`，然後當 Google 檢查 TXT 紀錄發現確實存在這筆指定紀錄，就可以證明是合法的網域擁有者。

下圖是 `onedegree.hk` 的一些 TXT 紀錄，你可以看到有多種驗證紀錄及 SPF 紀錄：

```txt
onedegree.hk.		3600	IN	TXT	"facebook-domain-verification=etkvd5dxxpnlcjkol3e1vi3k348k03"
onedegree.hk.		3600	IN	TXT	"google-site-verification=kEw0MSSQxwrU4d5GXYBTL6HLTwnQW4aJjh8Om-NTY4Q"
onedegree.hk.		3600	IN	TXT	"google-site-verification=EntX-1hrFmMHtANmXdTE4rpEwSxpsZGwnVUPWA9476A"
onedegree.hk.		3600	IN	TXT	"VXZDM75TVG5AVR81FP8ZS1Q3RTRJCPO1LFMCGU6G"
onedegree.hk.		3600	IN	TXT	"v=spf1 include:spf.protection.outlook.com include:servers.mcsv.net include:email.freshdesk.com -all"
onedegree.hk.		3600	IN	TXT	"MS=ms90944132"
onedegree.hk.		3600	IN	TXT	"apple-domain-verification=6dcjCOWtHHIBWjLW"
onedegree.hk.		3600	IN	TXT	"atlassian-domain-verification=x2gMLRLJwdsyccXscDcOrLausiFdjmV/P37fCfiKf/eEaA6l9tPsfrEadfGQsA7j"

```

### SRV

SRV 紀錄算是相對少見的一種紀錄，是為了支援特定網路協議（例如 [SIP](https://en.wikipedia.org/wiki/Session_Initiation_Protocol)、[XMPP](https://en.wikipedia.org/wiki/XMPP) 等多媒體或 messaging 功能）的服務 (**s**e**rv**ice) 所誕生的紀錄，定義在 [RFC 2782](https://datatracker.ietf.org/doc/html/rfc2782) 中。

其他的 DNS 紀錄大多都只會含有網域名或是 IP，不過 SRV 紀錄最大的特色就是會寫出目標 port 以及使用的協議，格式為：

```txt
_service._proto.name.   TTL  class type priority weight port    target

_xmpp._tcp.example.com. 86400  IN   SRV    10       5   5223  server.example.com
```

從上面的範例可以看到，要向 `example.com` 發起使用 TCP 的 XMPP 服務請求的話，就需要聯繫 `server.example.com` 的 5223 port。

那 priority 跟 weight 是什麼呢？跟前面提過的 MX 紀錄相似，這兩個參數都是用來調配目標伺服器的流量，只不過是分兩階段評比，先比 priority 再比 weight。也就是說，查詢到多筆 SRV 紀錄時會先看 priority 的大小，如果平手了再用 weight 一決勝負。有趣的一點是這兩個的勝負條件完全相反，priority （優先序）代表嘗試連線的順序，越小越吃香；反之 weight （權重）代表同優先序之間負載分配的比例，所以越大越有利。

下面的範例取自[維基百科](https://en.wikipedia.org/wiki/SRV_record)：

```txt
_sip._tcp.example.com.   86400 IN    SRV 10       60     5060 bigbox.example.com.
_sip._tcp.example.com.   86400 IN    SRV 10       20     5060 smallbox1.example.com.
_sip._tcp.example.com.   86400 IN    SRV 10       20     5060 smallbox2.example.com.
_sip._tcp.example.com.   86400 IN    SRV 20       0      5060 backupbox.example.com.
```

今天一個用戶想要連線時，會發現前三條紀錄的 priority 都是 10，所以除非前三個都連不上，否則他是不會去嘗試 priority 20 的 `backupbox.example.com` 的。再來，因為 priority 10 的比重是 60 20 20，所以代表有 60% 的請求會選擇發給 `bigbox.example.com`，剩下的再平分到 `smallbox1.example.com` 跟 `smallbox2.example.com` 這兩台機器。另外，如果 `bigbox.example.com` 沒有回應，那麼服務就會由 `smallbox1.example.com` 跟 `smallbox2.example.com` 平均分擔，各處理 50% 的流量。

### PTR

PTR 紀錄可以說是 A 紀錄的對立面，A 紀錄把網域對應到 IP（用於 DNS lookup），而 PTR 紀錄則是把 IP 對應到網域（用於 reverse DNS lookup）。

PTR 紀錄也必須放在某個網域下，所以根據規範，會將 IP 反轉，然後後綴加上 `".in-addr.arpa"` 來構成網域，例如 `14.13.12.11` 就會被放在 `"11.12.13.14.in-addr.arpa"` 的網域下。如果是 IPv6，反轉後會被轉換成 4-bit 區段，並加上 `".ip6.arpa"`，如 `2001:db8::567:89ab` 會變成 `b.a.9.8.7.6.5.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa`。

`.arpa` 是最早創立的一個 TLD，源於網路世界草創期的先驅 Advanced Research Projects Agency (ARPA) 的縮寫，不過目前被重新定義為 Address and Routing Parameter Area (ARPA)。`.arpa` 由 IETF 用於管理網路架構，不提供網域註冊也鮮少新增子網域。

## 結論

DNS 是網路世界的電話簿，負擔起全世界的網路流量跟導航，是每個人生活中不可或缺的一環。從 1980 年代到現在，DNS 已經有十分悠久的歷史，也經歷了多次修改與強化，然而如同多數古老的協議，最初的設計其實並沒有考量到太多資安層面，導致隨著應用範圍越來越廣、各種技術越來越進步，層出不窮的攻擊手法才使得許多潛在的資安議題浮出檯面，各種防禦也因應而生。

為了後續能介紹一些 DNS 相關的攻擊，開頭還是要先科普一下確定大家都具備基礎知識。下一篇我們會聊聊 DNS 常見的攻擊手法與相應的防禦，探討這場攻防戰的演進史。

這篇中的資訊多取自維基百科與 [Cloudfare DNS Learning](https://www.cloudflare.com/learning/dns) 的介紹，Cloudfare 提供相當完整且深入的資訊，推薦給大家～

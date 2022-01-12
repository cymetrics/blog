---
title: DNS Hacking 之 Subdomain Enumeration 的技巧與自動化挖掘
author: crystal
date: 2022-01-12
tags: [Security, DNS, Enumeration]
layout: zh-tw/layouts/post.njk
image: /img/posts/crystal/dns-hacking/cover-3.jpg
---

<!-- summary -->
總算講完理論的部分啦！這一篇裡，我們要來看看如何挖掘一個網站的子網域，建立更大的攻擊面，並介紹有哪些實用工具。最後，我會講一下我自己的自動化 recon 流程。
<!-- summary -->

## 前言

做滲透的第一步都是先收集資料，了解你的目標有哪些資產、哪些範圍、以及這些服務之間的關係。對目標的架構有更多認識，才能幫你判定哪些攻擊面是比較關鍵、比較脆弱、或是比較有價值的。而其中一個非常重要的資訊，就是目標網域的相關網域跟子網域。也許你在主網站沒有發現什麼問題，但卻挖到了後台登入頁面的漏洞、或是發現某個暴露在外的內部服務，通常這些地方的防護沒那麼嚴謹而且都藏著很有價值的線索，說不定就是一次測試的重大發現。同時，許多子網域常常都是為了使用第三方服務所架設的，當這些服務有漏洞時，目標網域當然也會跟著受到影響，因此當你有一個子網域清單，就能對測試目標對外的系統架構有多一些瞭解，也更容易發現可能的突破點。

收集子網域資訊，可以從被動跟主動兩方面著手。

被動（passive recon）指的是不跟目標做互動，單純透過搜索引擎跟其他公開服務來得到資訊，基本上就是查資料，不會對目標造成任何影響或留下足跡，對方甚至也不會知道。主動（active recon）則是透過跟目標的互動來枚舉資訊，也許會造成比較大的流量或是被對方的偵測機制記錄下來。

## 被動（passive recon）

前面提過，被動搜集就是找資料，所以這邊提供大家一些適合尋寶的地方：

### Google dorks

這個應該不用多作解釋，就是利用 Google 搜尋引擎的功能來找到頁面。

#[Google dorking amazon.com](/img/posts/crystal/dns-hacking/dorking.png)

好處是這個方法找到的通常都會有網站而且在使用中，不管是要再往下挖、只找或只排除某個網域，也只要在搜尋欄位加一些其他參數就好。
反之，壞處就是只能找到有網站的子網域，一些其他的服務（例如 ftp）可能就找不到了。

當然，Google 可以 dorking 其他的搜尋引擎也可以。譬如說用 duckduckgo 或是 bing 都能得到不一樣的結果。

### Certificate Transparency

大家都聽過網站憑證，也知道它的安全性除了建立在密碼學的基礎上，更是仰賴我們對 Certificate Authority (CA) 的信任。於是有人質疑了：要如何確保 CA 是可以信任的，沒有亂發憑證或是被駭客入侵所以簽署惡意憑證呢？有沒有人可以監察這些守門人？

在這些考量下，Certificate Transparency (CT) 誕生了。CT 是一個由多個 CA 合作的專案，透過共同維護一個龐大的分散式資料庫，把每一張憑證的申請單位、核准的 CA、發行的時間等資訊全部記錄下來並透明化公開，讓任何人都可以監督或分析。能延伸的應用很多，例如網域擁有者可以監測自家網域的憑證狀態，及時發現明明沒有註冊卻憑空出現的憑證，或是資安產品也可以做成曝險控管服務，甚至應用在資安事件後的鑑識證據等等。

這個專案的參與者涵括多個較大的供應商，如 Google、Cloudfare、Digicert、Let's Encrypt、Sectigo 等等，你可以在 [CT 的專案網頁](https://certificate.transparency.dev/) 上看到更多資訊。這些供應商通常也會在他們的服務裡加入監測功能，讓你可以直接從 dashboard 上看到警訊或是從 email 收到通知。

有些公司也會做成公開介面、API、或是開放資料庫連結供大家查詢：
* [Google](https://www.google.com/transparencyreport/https/ct/)
* [Cloudfare - Merkle Town](https://ct.cloudflare.com/)
* [Sectigo - crt.sh](https://crt.sh/)
* [Let's Encrypt - Oak](https://letsencrypt.org/docs/ct-logs/)

既然所有有發行憑證的網域都會留下紀錄，那我們當然可以利用這個服務來列舉子網域。下面這張圖是用 Sectigo 提供的 crt.sh 來搜尋 amazon.com 的結果：

#[certificate transparency: amazon.com](/img/posts/crystal/dns-hacking/ct.png)

或是用 crt.sh 的話可以用 psql 連進去查：

```txt
$ psql -h crt.sh -p 5432 -U guest certwatch

certwatch=> SELECT distinct(NAME_VALUE) FROM certificate_identity ci WHERE ci.NAME_TYPE = 'dNSName' AND reverse(lower(ci.NAME_VALUE)) LIKE reverse(lower('%.amazon.com'));
```

#[crt.sh with psql: amazon.com](/img/posts/crystal/dns-hacking/psql-crt.png)

跟 google dorking 一樣，CT 上面有紀錄的網域至少都是曾經存在過的，不過目前是否仍在使用就需要進一步過濾。還有，CT 畢竟只顯示有申請憑證的紀錄，所以沒有網頁服務或是不使用憑證的 HTTP 網域就找不到了。

### 公開服務與資料集

下面列舉的第三方服務不見得本來就是為了記錄網域而開發的，但是他們查找的資訊卻很適合我們的目的，因此也可以作為來源之一加入我們的清單。

##### Rapid 7 FDNS 

Rapid 7 自 2013 起，為了分析網路上的流量跟系統而發起了名為 Project Sonar 的計畫，除了 SSL、DNS、HTTP 相關的流量外也包含了 UDP 的服務，至今累積了十分龐大的資料庫。後來他們將這些資料釋出，供學術研究或其他分析用途，而其中一份每月更新的資料就是 [FDNS (Forward DNS)](https://opendata.rapid7.com/sonar.fdns_v2/) ，紀錄了 Project Sonar 偵測到的所有 DNS 紀錄：

> DNS 'ANY', 'A', 'AAAA', 'TXT', 'MX', and 'CNAME' responses for known forward DNS names. This dataset contains the responses to DNS requests for all forward DNS names known by Rapid7's Project Sonar. The file is a GZIP compressed file containing the name, type, value and timestamp of any returned records for a given name in JSON format.

你可以自己 parse 這些資料擷取出需要的資訊，不過這些檔案非常大，壓縮後都還有 20+ GB，所以一般人電腦上要存放應該不太容易，是個豐富而龐大的資源。

##### VirusTotal

沒錯，就是那個什麼檔案都丟上去看看的 VirusTotal，他其實也有檢測網域的功能。

只要到這個網址：`https://www.virustotal.com/gui/domain/{domain_name}/relations`，往下滑就會有子網域的列表跟評分，例如：

#[virustotal: amazon.com](/img/posts/crystal/dns-hacking/virustotal.png)

##### searchcode

連各種服務的 access key 或是資料庫帳號密碼都可以寫死在程式裡面推到 github 上去了，子網域為什麼不行？[searchcode](https://searchcode.com/) 這個服務就是一個開源程式庫的搜尋引擎，幫你找到藏在字裡行間的那些網域名稱！搜尋的範圍包括 github、bitbucket、gitlab、google code、sourceforge 等等，也有提供 API 使用。

試試看：

#[searchcode: amazon.com](/img/posts/crystal/dns-hacking/searchcode.png)

不過我個人覺得這個方法能找到的結果有限，畢竟除非是開發者自己不小心洩漏，不然一般寫 code 的時候會用到的都是公開的 API 或 SDK 規定的 endpoint，搜尋結果同值性較高。當然如果直接找到前人（？）整裡好的子網域清單就是中獎了 XDDD

##### DNSDumpster

這也是一個免費且公開的服務，由 HackerTarget.com 維護，旨在讓 DNS 的 recon 更輕鬆方便。[網頁](https://dnsdumpster.com/) 上寫著：

> DNSdumpster.com is a FREE domain research tool that can discover hosts related to a domain. Finding visible hosts from the attackers perspective is an important part of the security assessment process.
> More than a simple DNS lookup this tool will discover those hard to find sub-domains and web hosts. The search relies on data from our crawls of the Alexa Top 1 Million sites, Search Engines, Common Crawl, Certificate Transparency, Max Mind, Team Cymru, Shodan and scans.io.

一樣用 amazon.com 試試看：

#[DNSDumpster: amazon.com](/img/posts/crystal/dns-hacking/dumpster-1.png)

#[DNSDumpster: amazon.com](/img/posts/crystal/dns-hacking/dumpster-2.png)

因為 HackerTarget.com 本來就有在做網路掃描，所以這邊得到的子網域清單也是定期每月更新一次，跟 Shodan 一樣不是實時的最新結果，而且超過一百筆過後就要升級收費查詢次數也有限制。 DNSDumpster 整合了多個資料來源，甚至還會整理成網域之間的關聯圖，其實也算是做過一點自動化了。

## 主動（active recon）

下面介紹幾個透過 DNS 做主動 recon 的小技巧。跟被動搜集不一樣，因為是直接跟對方的 DNS 拿到的資料，所以準確率機戶是百分百。除了用 DNS 之外，從網站上爬出所有連結然後整理成列表也是一個方法，不過既然是爬蟲這裡就不寫了。

以下需要一點 DNS 背景知識，如果有不理解的概念或名詞可以參考：

[DNS Hacking 之 基礎知識：DNS 運作與紀錄類型](https://tech-blog.cymetrics.io/posts/crystal/dns-hacking-1/)
[DNS Hacking 之 電話簿攻防之術：DNSSEC、DoT/DoH](https://tech-blog.cymetrics.io/posts/crystal/dns-hacking-2/)

### zone transfer

我們介紹 DNS zones 時說過，SOA 紀錄裡寫的會是主要負責該 zone 的 primary nameserver，但一個 zone 裡其實還會有其他備用或是用於 load balancing 的 secondary nameserver。為了讓資訊同步，將 primary nameserver 的 zone file 複製一份到 secondary nameserver 的這個溝通過程，就稱為 zone transfer。

轉移的模式有兩種：
* Full transfer (AXFR): 當新的 DNS 上線時，會做 Full transfer 把整個 zone 的資訊都複製一份過去，是相對耗時且耗資源的做法。
* Incremental transfer (IXFR): 與 Full transfer 不同，只傳送有被更新的部分，是比較有效率且省資源的做法。兩台 DNS 是否有一樣的紀錄依據 SOA 紀錄中的 SERIAL 欄位判定。

zone transfer 這個機制本身並沒有問題，出事的是常常有設定上的缺失。zone transfer 理應是負責一個 zone 的多個 DNS 之間溝通用的，不應該允許任意發起請求的機器得到這個資訊。特別是自架的 DNS 服務，網管人員也許沒有太多資安意識，可以運作就好了，所以容易有設定出錯。當設定開啟 zone transfer 功能卻沒有設定白名單來控管傳送對象時，就會讓我們有機可乘，輕輕鬆鬆透過一個指令發起 zone transfer：

```bash
# get authoritative nameservers
dig ns <domain>

# request zone transfer
dig axfr @<nameserver> <domain>
```

例如之前不小心掃到的一家公司，毫不保留的全部都吐出來了：

#[zone transfer](/img/posts/crystal/dns-hacking/transfer.png)

也許你會覺得，應該很少人會犯這種錯誤吧？也不算太嚴重啊？其實這個錯誤比你想的更普遍、影響也更廣。

幾個月前我們幫一家公司做滲透測試的時候，意外的發現他們的網域有 zone transfer 的弱點。但更意外的是，他們用的 authoritative DNS 不是自己架的，而是用一家台灣非常大的 DNS provider 的服務。也就是說，所有跟這家供應商註冊網域跟使用 DNS 服務的公司，都連帶成為受害者，任何子網域都無所遁形。供應鏈發生的弱點就會造成下游的風險，影響往往是倍數成長！

### zone walk

還記得我們之前介紹過的 DNSSEC 嗎？為了解釋信任鍊的原理，我們帶出了 DNSKEY、RRSIG、DS 這三種新紀錄，也留下了一個伏筆：『DNSSEC 能證明了我拿到的紀錄是真的，那能證明我沒拿到的紀錄是真的不存在嗎？』或是換句話說，當我查不到紀錄的時候，是真的沒有這筆紀錄，還是紀錄被攻擊者故意騙我說不存在呢？

為了解決這個問題，DNSSEC 其實還有一種新的紀錄：NSEC。

NSEC 要表達的是：這是所有紀錄排序後，在我下一個的網域，所以，在我們之間沒有其他網域了。NSEC 等同於在一條線上標示出所有存在的點，然後從這些點上一刀切下去，把線分成好多個線段。我們用一個例子說明吧。

假設公司 `cymetrics.com` 的 zone 裡只有四個子網域，前綴分別為 crystal, huli, jo, nick，那它的 NSEC 記錄們會長的像下面這樣，在排序後用一個 linked list 的方式串接起來：

```txt
cymetrics.com.          300	IN	NSEC	crystal.cymetrics.com.    A SOA RRSIG NSEC
crystal.cymetrics.com.  300	IN	NSEC	huli.cymetrics.com.       A NS RRSIG NSEC
huli.cymetrics.com.     300	IN	NSEC	jo.cymetrics.com.         A MX RRSIG NSEC
jo.cymetrics.com.       300	IN	NSEC	nick.cymetrics.com.       A TXT RRSIG NSEC
nick.cymetrics.com.     300	IN	NSEC	cymetrics.com.            A TXT RRSIG NSEC
```

於是今天，當有人想找 `david.cymetrics.com` 的時候，我們就可以給他第二筆紀錄，告訴他： `david` 不存在哦，但是他的前一個是 `crystal` 後一個是 `huli`。
反之，當有人要找 `huli.cymetrics.com` 的時候，就沒辦法騙人了。攻擊者當然不想給真正的紀錄，那要怎麼從 NSEC 裡面選一個呢？攻擊者不能回第二或第三筆紀錄，因為 `huli.cymetrics.com` 明顯就是端點之一，一定存在；但他也不能回其他三筆紀錄，因為 `huli` 並不在 `crystal` 之前、`jo` 到 `nick` 之間、或 `nick` 之後，所以不適用任何記錄標示的範圍內。沒有一筆紀錄邏輯成立，DNS resolver 就能偵測有人在作祟。

那如果請求的網域存在，但是請求的紀錄類型不存在呢？例如，我想要 `nick.cymetrics.com` 的 MX 紀錄，但這個網域下沒有，該如何證明？

再回去看上面的 NSEC 記錄們，你會發現最尾巴有一串紀錄類型的字串，這就代表了這個 NSEC 擁有者**有**的紀錄，所以當你請求的網域跟紀錄類型沒有剛好的 match 的時候，DNS 一樣會回覆你這筆 NSEC，表示：找不到你請求的東西，不過我這裡有 `nick.cymetrics.com` 的 A TXT RRSIG NSEC 紀錄喔！同理，這樣攻擊者也沒辦法故意不給某一種類型的紀錄，因為 DNS resolver 從 NSEC 裡面就可以判斷紀錄是否真實存在了。

因為有 DNSSEC，在無法偽造或竄改記錄的前提下，NSEC 提供了 DNS 紀錄的不在場證明。DNS resolver 只要驗證 NSEC 的區間範圍與存在的紀錄類型，就可以判斷請求的目標是不是真的存在，解決的上面提出的困擾。

有這麼值得信賴的機制，豈不是一大福音？既然所有真的存在的網域都用 NSEC 串在一起了，我們只要順藤摸瓜，用遞迴的方式一直查詢下去直到繞回原點，就可以枚舉出所有存在的網域了啊！

用 dig 看一下之前的 `dnstests.ovh` 長這樣：

```txt
$ dig nsec dnstests.ovh
dnstests.ovh.		60	IN	NSEC	subdomain.dnstests.ovh. A NS SOA RRSIG NSEC DNSKEY

$ dig nsec subdomain.dnstests.ovh
subdomain.dnstests.ovh.	60	IN	NSEC	www.dnstests.ovh. A TXT RRSIG NSEC

$ dig nsec www.dnstests.ovh
www.dnstests.ovh.	60	IN	NSEC	dnstests.ovh. A RRSIG NSEC
```

要自己寫程式也可以，不過已經有工具能幫我們做到這件事了：`ldns-walk`

```txt
ldns-walk @<nameserver> <domain>

# try with larger domain
$ ./ldns-walk @router.tms.com.tw tms.com.tw
tms.com.tw.	tms.com.tw. A NS SOA MX TXT RRSIG NSEC DNSKEY 
_acme-challenge.tms.com.tw. TXT RRSIG NSEC 
_dmarc.tms.com.tw. TXT RRSIG NSEC 
12949916._domainkey.tms.com.tw. TXT RRSIG NSEC 
ftp.tms.com.tw. A RRSIG NSEC 
loopback.tms.com.tw. CNAME RRSIG NSEC 
router.tms.com.tw. A RRSIG NSEC 
smtp1.tms.com.tw. A RRSIG NSEC 
_acme-challenge.webmail.tms.com.tw. TXT RRSIG NSEC 
www.tms.com.tw. A RRSIG NSEC 
```

是不是很方便呢？馬上就可以拿到一張列表啦！我開心，你開心，但有人又不開心了。

對想收集資料的攻擊者如此友善，不也是一種資安漏洞嗎？而且說不定我的 zone 裡有一些不想揭露的網域啊？

有鑑於此，NSEC3 誕生了。跟原先的 NSEC 相比，NSEC3 為了防止 zone walk 加入了 hash 這個步驟，讓原本的網域名稱加了一層面具。以我們剛剛範例的網域來說，假設 hash 完的結果對應如下（這裡只取前面幾個位元）：

```txt
cymetrics.com.          -> FOS7E3K
crystal.cymetrics.com.  -> O8H5F0P
huli.cymetrics.com.     -> QEE453Y
jo.cymetrics.com.       -> VS75HE2
nick.cymetrics.com.     -> LCA56W1
```

那做成 NSEC3 就會是

```txt
FOS7E3K     300	IN	NSEC    1 0 10 1234567890ABCDEF     LCA56W1     A SOA RRSIG NSEC
LCA56W1     300	IN	NSEC    1 0 10 1234567890ABCDEF     O8H5F0P     A TXT RRSIG NSEC
O8H5F0P     300	IN	NSEC    1 0 10 1234567890ABCDEF     QEE453Y     A NS RRSIG NSEC
QEE453Y     300	IN	NSEC    1 0 10 1234567890ABCDEF     VS75HE2     A MX RRSIG NSEC
VS75HE2     300	IN	NSEC    1 0 10 1234567890ABCDEF     FOS7E3K     A TXT RRSIG NSEC
```

其中，`1 0 10 1234567890ABCDEF` 這段的四個數字分別代表了 hash 用的演算法、opt out flag、iteration 次數、跟 salt，計算 hash 時會用到。關於 NSEC3 的細節與設置不在這次探討範圍內，有興趣的可以參考 DNS Institute 的介紹：[機制](https://dnsinstitute.com/documentation/dnssec-guide/ch06s02.html)、[配置](https://dnsinstitute.com/documentation/dnssec-guide/ch07s03.html)。

這下，當有人詢問 `david.cymetrics.com` 的時候，我們就會先把 `david.cymetrics.com` 做一次 hash，假設得到 R3K6GS，再把 R3K6GS 拿去對應 NSEC3 發現它落在 LCA56W1 到 O8H5F0P 之間，於是回應上面的第二筆紀錄。攻擊者不能像之前一樣簡單的列舉網域，因為他就算知道了 LCA56W1 跟 O8H5F0P 這兩個端點，卻反推不出他們 hash 前本來是什麼網域，沒辦法再往下查了。

有了 NSEC3，我們無法像剛剛那樣，順藤摸瓜把網域們一個連一個撈出來，而就算我們能列舉出所有的網域，也都是看不懂的 hash。

那怎麼辦？這樣我們就沒辦法了嗎？

對，這樣我們就真的沒辦法直接得到網域的名字了。不過，這並不代表我們就無計可施。用 hash 只是換一個難以辨識的別名，但標示區間的概念還是一樣的！

換個方式想，不能順藤摸瓜，我們可以亂槍打鳥。丟一個名字過去，就能得到包夾他的兩個端點所構成的區間，再丟一個會落在區間外的點，就可以再獲得一筆資訊，如此就可以慢慢重建出所有存在的網域的 hash 清單。

以前面的紀錄為例，我們可以看看下面這張圖。第一次試了 `david.cymetrics.com` 後我們會得到 LCA56W1 跟 O8H5F0P，同時還有產生 hash 用的參數，於是在虛線上可以標出兩個點。為了探索右邊的未知區域，我們選了 hash 後開頭是 W 的 `james.cymetrics.com`，並得到 VS75HE2 跟 FOS7E3K 兩個點，剩下兩大塊未知區域。再來我們用 hash 後開頭是 H 的 `ferb.cymetrics.com` 再試一次，這次是得到 FOS7E3K 跟 LCA56W1，剛剛這兩個點我們都知道了，所以線段接起來了，中間沒有其他網域！特別說明一下虛線應該用一個圓周來表示比較好，因為頭尾是相接的，不過用 slides 畫畫有點麻煩，請多包涵 XD。至此我們已經成功得到四個網域 hash 過的名稱，只要對著剩下未知的 O8H5F0P 到 VS75HE2 亂槍打鳥多試幾次，就可以把整個圓周兜出來了！

#[NSEC3 walk](/img/posts/crystal/dns-hacking/nsec3.png)

有了網域名清單，剩下的就是找出 hash 之前的名字，這部分就只能暴力破解了，拿一個很大的字典檔當子網域的前綴，然後逐一 hash 再比對找到吻合的紀錄。這一整個方法其實也有工具做好了：[nsec3walker](https://dnscurve.org/nsec3walker.html)，用法也很簡單

``` bash
# collect domains under target.domain and output
./collect target.domain > target.domain.collect

# unhash collected domains
./unhash < target.domain.collect > target.domain.unhash
```

### brute-forcing

最後就是暴力破解啦！這個跟剛剛的 NSEC3 有點像，就是用字典檔建構出可能的子網域，不過這裡不是在本機上運算，而是逐一拿去向 authoritative DNS 詢問，看看到底哪些存在。

暴力破解會遇到兩個問題。

第一個是你的字典檔選得不好，例如大多網站可能都有 `www.` 這個子網域，但偏偏你的字典檔漏掉了，那不管你怎麼跑都不可能找到這個結果。或是網域名稱可能加上了一些變形，例如他用的是 `tw2021.` 或 `tw2019.`，那就算你的字典檔裡有 `tw` 也一樣找不到，或是他的子網域會加上某個字串，例如除了 `web.`、`internal.` 還用 `web-uat.`、`internal-sit.` 等。

要解決這個問題有兩層方向，第一是選一個好一點的字典檔，例如我自己用的是 [commonspeak2](https://github.com/assetnote/commonspeak2-wordlists) ，其他還有大佬 Jason Haddix 整合多個字典檔而成的 [all.txt](https://gist.github.com/jhaddix/86a06c5dc309d08580a018c66354a056) 跟專門收藏字典檔的 [Seclists](https://github.com/danielmiessler/SecLists/tree/master/Discovery/DNS)。好或不好、夠或不夠，我覺得看你的需求而定，畢竟不可能有一個字典檔是真的百發百中，也許你的目標網域的命名就是用一些不一樣的命名。第二層是用工具幫你產生 mutations 來擴充你的字典檔，例如加上時間日期或是某個特定的字串，但我覺得這個比較適用於你已經知道某些子網域命名的規律的情況下了，因為你的字典檔大小倍數增長，表示你要花的時間也是倍數增長，所以盲目的變形不會是最有效率的做法。

第二個會遇到的問題是，字典檔太大，跑起來要花太久了。假設你要測 10000 個子網域，但一秒只能跑 10 個 DNS query，就表示你要花 16 多分鐘才能跑完，而一個不大的字典檔至少包含十萬筆資料，你要等的時間是以小時計算的，跑完約 48 萬筆資料的 commonspeak2 都過半天了。我用的 DNS resolver 是 [massDNS](https://github.com/blechschmidt/massdns)，如果網路速度跟對方的 authoritative DNS 回應不要太慢，在幾分鐘內就可以把 commonspeak2 跑完，真的是神速。

不可否認，brute-forcing 是一個簡單粗暴又有效的方法，雖然非常吵雜，行蹤馬上就會被發現，而且會產生非常大的流量，本質上就是我們前一篇講的服務阻斷攻擊。也因此，有些時候會被對方的 authoritative DNS 擋下來或列入黑名單，也可能會被當成是殭屍網路關注，例如我之前測試後就有被電信公司通知說偵測到 IP 有異常 DNS 流量 XDDD

## 來自動化吧

其實要做 subdomain enumeration，現成的工具很多了，包括很有名的 [OWASP Amass](https://github.com/OWASP/Amass)、[Sublist3r](https://github.com/aboul3la/Sublist3r)、[Subfinder](https://github.com/projectdiscovery/subfinder) 等等，都整合了數十種 passive recon 的資料來源，雖然很多需要自己去申請 API key 才能拉到資料，但的確已經節省了非常多手動的功夫。而像是 [DNSRecon](https://github.com/darkoperator/dnsrecon)、[SubBrute](https://github.com/TheRook/subbrute)、[Domained](https://github.com/TypeError/domained) 等 active recon 跟 brute force 工具，其實也結合了好幾個其他的開源專案，來讓網域資料搜集盡可能一鍵解決。

我自己的自動化工具，重點其實是找到子網域後的進一步檢查，來幫我快速找到可以通報 bug bounty 的設定漏洞，所以前面收集子網域的步驟也是仰賴這些開源專案組合而成的。我的作法是，把 passive recon、active recon、brute-forcing 的結果都先收成一個候選網域清單，再一次丟到 DNS resolver 裡面找到真實存在、連線得到的。

如下圖所示，用 Amass 做 passive recon 來拉到有公開紀錄跟相關的網域（Amass 也有 active recon 哦）、做 zone transfer 跟 zone walk 的檢查、用 commonspeak2 建構字典檔，然後結合起來丟到 massDNS 裡面 resolve。

#[workflow](/img/posts/crystal/dns-hacking/workflow.png)

這個架構其實是取自 Patrik Hudak 的 [Subdomain Enumeration: 2019 Workflow](https://0xpatrik.com/subdomain-enumeration-2019/)，重點在擷取 Amass 在 passive recon 的優勢、commonspeak2 不算太大但效果還不錯、還有 massDNS 飛快的 resolve 速度。Amass 雖然能一次統整大量的 source 得到大批候選清單，但 DNS resolver 的速度就比較慢了，而且 massDNS 除了能單純過濾出真實存在（有 A/CNAME 紀錄）的網域之外，還可以指定要 resolve 其他類型紀錄，這種各司其職的模式對於我後續檢查弱點來說比較有彈性。

當然除了這些，你也可以參考 Patrik Hudak 的作法，在 massDNS 做完後考慮用 [Altdns](https://github.com/infosec-au/altdns) 對結果加上一些變形再拿去 massDNS 做一次，因為已知存在的網域也許會在不同環境、時間、用途之下有些許命名差異，這麼做可能可以幫你挖到一些隱藏起來的網域。第二次才加變形的好處是你前面的第一批候選清單不會倍數放大爆炸，而且確定存在的網域才比較可能有兄弟姐妹存在。

當然，這只是我自己的作法，還有很多開源專案值得參考借鏡，建立符合你需求的自動化組合最重要。另外，字典檔的選擇也可以多試試幾種，或是結合幾個你自己用起來最有效的！

## 結論

這次我們聊到 subdomain enumeration 的幾種技巧跟資源，不過其實還有很多沒介紹到的小地方，例如從辨識 AS 去找到對應的 IP netblocks 再反過來找 domain，還有許多線上跟網路相關的資料庫或是 wayback machine 等，都可能藏著不為人知的網域。推薦可以看看 Amass 整合的來源們，也許會有新的收穫或靈感喔。

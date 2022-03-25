---
title: DNS Hacking 小番外之：談談 zone walk 
author: crystal
date: 2022-03-25
tags: [Security, DNS]
layout: zh-tw/layouts/post.njk
image: img/posts/crystal/dns-hacking/dns-hacking-zone-walk.jpg
---

<!-- summary -->
如前一篇提過的，前陣子為了快速且大量掃描網域相關的問題，我寫了個自動化工具來找 zone transfer、zone walk、subdomain takeover 等問題，其中在測試 zone walk 的時候發現了關於業界防治 zone walk 的一個有趣的現象，所以想寫一個短篇聊聊。
<!-- summary -->

## zone walk recap

關於 zone walk 的原理，這裡簡單再複習一下。

為了補足傳統 DNS 不符合完整性的問題，發展出以數位簽章方式建構信任鍊的 DNSSEC 機制，從此每一筆紀錄都會有另一筆紀錄『背書』，類似網路憑證的原理來證明 DNS 紀錄的可信度。但是， DNSSEC 只能保證『你拿到的是真的』而不能保證『你沒拿到是真的沒有』而不是被惡意丟包。為了支援 DNSSEC 的這個小小的不足，並達到真正的、正負面陳述都滿足的完整性，衍生出了一種新紀錄：NSEC。

NSEC 利用標示端點的方式，宣稱『在 A 到 B 的區間內不存在任何網域』，也就是說如果 `cymetrics.com` 的 zone 裡只有四個子網域，前綴分別為 crystal, huli, jo, nick，那就會 sort 後用一個類似 linked list 的方式把他們轉成下面這樣，之後當有人來詢問的不存在的網域時（例如 `david.cymetrics.io`），我會給他下列第二筆紀錄，表達『 crystal 的下一個是 huli，中間沒有別人了』：

```txt
cymetrics.com.          300	IN	NSEC	crystal.cymetrics.com.    A SOA RRSIG NSEC
crystal.cymetrics.com.  300	IN	NSEC	huli.cymetrics.com.       A NS RRSIG NSEC
huli.cymetrics.com.     300	IN	NSEC	jo.cymetrics.com.         A MX RRSIG NSEC
jo.cymetrics.com.       300	IN	NSEC	nick.cymetrics.com.       A TXT RRSIG NSEC
nick.cymetrics.com.     300	IN	NSEC	cymetrics.com.            A TXT RRSIG NSEC
```

但是這樣有一個很大的問題，那就是我只要沿這著個 linked list 一直爬，就可以得到這個 zone 下面所有的網域，要枚舉簡直輕而易舉！用了 DNSSEC 之後反而把資訊通通告訴別人了，藏都藏不住，簡直得不償失。

為了應付這個問題，NSEC3 誕生了，利用 hash 把真正的網域名用一層面具藏起來，這樣就算駭客可以爬出所有的結果，也都是看不懂的東西！

NSEC3 版本（hash 只是示意，一般不會這麼短的 XDDD）：
```txt
FOS7E3K     300	IN	NSEC    1 0 10 1234567890ABCDEF     LCA56W1     A SOA RRSIG NSEC
LCA56W1     300	IN	NSEC    1 0 10 1234567890ABCDEF     O8H5F0P     A TXT RRSIG NSEC
O8H5F0P     300	IN	NSEC    1 0 10 1234567890ABCDEF     QEE453Y     A NS RRSIG NSEC
QEE453Y     300	IN	NSEC    1 0 10 1234567890ABCDEF     VS75HE2     A MX RRSIG NSEC
VS75HE2     300	IN	NSEC    1 0 10 1234567890ABCDEF     FOS7E3K     A TXT RRSIG NSEC
```

不過這方法也是治標不治本，畢竟駭客也可以 hash 好一張很大的彩虹表，然後再一一比對找出本來的網域名稱，尤其網域命名通常都是有含義的，例如用產品名稱（`vpn.`、`cms.`）、環境名稱（`internal.`、`dev.`、`test.`）、公司簡寫等再搭配數字或其他變化，其實是很容易 fuzz 出來的。

不過無妨，現實總是不完美的。在知道了以上的機制後，我們可以寫一個簡單的程式去實作 zone walk。

```python
def zone_walk(domain):
    doms = list()
    
    # zone 沒有用 DNSSEC 或 NSEC3, 不做 zone walk 
    ans = query_record(domain, "DNSKEY")
    if len(ans) == 0:
        print('[*] Not using DNSSEC, no zone walk possible!')
        return doms
    
    # zone 用 NSEC3, 不做 zone walk
    ans = query_record(domain, "NSEC3PARAM")
    if len(ans) > 0:
        print('[*] Using NSEC3, not vulnerable to zone walk! If you would like to traverse zone and crack hashes, use nsec3walker instead.')
        return doms

    doms = [domain]
    while True:
        ans = query_record(domain, "NSEC")
        # zone 用 DNSSEC, 但沒有簽任何 NSEC ？？
        if len(ans) == 0:
            print('[*] No NSEC record found!')
            return doms
        
        nextdom = ans[0].split()[0].strip('.')
        if nextdom == doms[0]:
            print('[*] Finished zone walk')
            break
        else:
            doms.append(nextdom)
            domain = nextdom
    
    return doms

l = [] # 測試的 domain 清單
for d in l:
    print(d)
    print(zone_walk(d))
```

前面在實際去爬 NSEC 之前，我們先判斷是否符合情境，否則就不用試了。要知道有沒有用 DNSSEC，我們可以看看有沒有 DNSKEY 紀錄，再來要知道是不是有用 NSEC3，可以看看有沒有 NSEC3PARAM 紀錄。當然不一定要用這兩個判斷，你也可以用 RRSIG，如果有 DNSSEC 就會得到回答，有 NSEC3 更是可以從簽署的 RRSet 看出來，像下面這樣。

```txt
bankchb.com.		7081	IN	RRSIG	NSEC3PARAM 8 2 7200 20220327154117 20220323151159 28470 bankchb.com. gSQghpTzVa7dZ1gD09K/fHq/BYluFaWRQco0z6xk+Cb/a3t6UzwyNKB1 XWgwUJ20cveJcLWhX3bGmw0MCjDCydxrjMc+jTuDj/pBe2BAV0UIoDGH oTz+B+HGyzqqnr6nSPUj13NYMEKIh/eNPcz5DZFlfTz0Z1gZkcxskJLD WNnZE83L/AVOnWGueHJMAVTsXPYexY58WqBfKwuAYLZZRO4UDLu21MYg uRfZK2LfZKHEJ8f1TWcT019XmEW2K3hJ/BO2nZ+jZsnFb3MZS19YT50P EmejkDpxbkLvLnYHRAqouoTvQUKC0x+4GhXMAFCGz5EoDBzriT23ftkb VEA2uA==
bankchb.com.		21481	IN	RRSIG	SOA 8 2 86400 20220328002618 20220323232618 28470 bankchb.com. eA0XM21R1Je+UELOeB2n0tBP4pnPwcQDsQy0T2cOYw3u1VGR5axF5s6/ uGQX2e0aqKwHFgY1sQ3dR0lrYKDOTQIX7FbYneM5hy7Ya+JahzdsonIp YlZ97bVjFUYpuC80RSiwIMcwLbDQZgm82lRZJ6nq1GQZks+Uzhp/73TD 0JXwioejoey3W+pTTs7c/gGlkSao9h0PGviBuoTuiKiM1FElLQ8E4VyC Nq0mbxqV3dtJPn0folZO4qYCDjIZB0tzhxFjotly0QSgPhxFau3BjBuo Ar/tSlAv5OPYav2nszYfGb3eR26Mvinh6YVrKIFUFYhr2i6swlaGWj9E xG5L6w==
```

回到程式碼，在迴圈裡會判斷繞到頭了才結束，應該要把所有的網域都爬出來，存到陣列之後回傳。理論上，有用 DNSSEC 的話就要有 NSEC 紀錄，所以不應該撞到這個分支，但要是因為沒有使用 NSEC 或是其他設置原因還沒有紀錄，就把截至當下找到的紀錄們傳出來，方便我再進一步驗證。

## \000？？？

對著大量的網域測試的時候，我卻很意外的發現大量的結果都是有 DNSSEC 卻沒有 NSEC 紀錄，而且清一色結果都是根網域的 NSEC 指向了一筆 `\000` 前綴的網域：

```txt
crypto.com
[*] No NSEC record found!
['crypto.com', '\\000.crypto.com']
kraken.com
[*] No NSEC record found!
['kraken.com', '\\000.kraken.com']
whitebit.com
[*] No NSEC record found!
['whitebit.com', '\\000.whitebit.com']
```

這就奇怪了，怎麼連了一個就斷掉了呢？

為了解開這個謎題，我開始搜尋有哪些 RFC 提到這樣的實作。過去也有相當大的聲量在討論 zone walk 的問題，所以直覺上我認為說不定是某個與 NSEC3 並行的做法，雖然看不出是 proxy 還是什麼涵義。

過程中查到在 [RFC4470 Minimally Covering NSEC Records and DNSSEC On-line Signing](https://www.ietf.org/rfc/rfc4470.txt) 中有這樣一段敘述：

> This mechanism involves changes to NSEC records for instantiated names, which can still be generated and signed in advance, as well as the on-demand generation and signing of new NSEC records whenever a name must be proven not to exist. ... Whenever an NSEC record is needed to prove the non-existence of a name, a new NSEC record is dynamically produced and signed.  The new NSEC record has an owner name lexically before the QNAME but lexically following any existing name and a "next name" lexically following the QNAME but before any existing name.

簡單來說，就是把本來區間的兩個端點往內縮一些，不要剛好標在『存在的網域上』，並且端點的選擇每次都會隨機，只要包圍的區間不涵蓋任何真正存在的網域就好。例如前面的情況，我們想詢問不存在的 `david.cymetrics.io`，這時就不會回 `crystal.cymetrics.com    	NSEC	huli.cymetrics.com` 而是動態產生另一筆 NSEC 紀錄，例如 `custard.cymetrics.com   NSEC	garlic.cymetrics.com`。因為 custard 跟 garlic 也都是不存在的，不過 NSEC 標示的區間還是有效的，而且 NSEC 紀錄之間沒有連結了，駭客就無法做 zone walk。另外，NSEC 也要否決萬用字元（*, wildcard）的可能性，所以還要多回傳一筆 NSEC 紀錄是 `\).com    NSEC    +.com`。

但即使是如此，我們還是透露了『確定沒有網域』的區間，等同幫駭客用刪去法縮減了可能性，剛剛的例子中，我雖然不知道存在 crystal 跟 huli，但我至少知道 daky 跟 garfield 都是不存在的，省了需要猜的次數。所以為了盡可能不透露資訊，內縮的端點的選擇要盡可能貼近被詢問的網域，讓區間盡可能縮小，駭客要找到存在的網域的機率幾乎等同於亂猜直接猜中的機率。例如比起前面隨機選的，現在更好的選擇可能是 `daviczzzzz.cymetrics.com` 跟 `davieaaaaa.cymetrics.com`，這樣駭客就無法知道更多了。

甚至，他還提出了更好的選擇方式（RFC 內稱為 epsilon function），左端點把 query 最後一個字元換成前一個字母加上一串 `\255`，右端點在 query 加上前綴 `\000`，所以這一串下來：

```txt
query: david.cymetrics.com

# original
crystal.cymetrics.com    	NSEC	huli.cymetrics.com

# random choice
custard.cymetrics.com   NSEC	garlic.cymetrics.com

# even better!
daviczzzzz.cymetrics.com    NSEC	davieaaaaa.cymetrics.com

# proposed epsilon (with wildcard)
davie\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255.example.com 3600 IN NSEC \000.david.example.com

\)\255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255.example.com 3600 IN NSEC \000.*.example.com
```

終於看到 `\000` 開頭的東西了！難道 RFC4470 就是我們的答案了嗎！本來是這樣想的，不過實際 dig 一下，好像又有些出入？

```bash
dig nsec '*.whitebit.com'

# expected
\)\255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255\255\255\255\255\255\255\255\255\255\255\255\255\255
     \255\255.whitebit.com.		3600	IN	NSEC	\000.*.whitebit.com

# actually
*.whitebit.com.		3600	IN	NSEC	\000.*.whitebit.com
```

回去看了一下大量測試的結果，注意到有 `\000` 前綴現象的，居然大多是用 Cloudflare 的服務，那看來這也許是跟 Cloudflare 特殊的實作方式有關！

再追一下，發現了這篇文章 [Economical With The Truth: Making DNSSEC Answers Cheap](https://blog.cloudflare.com/black-lies/)，裡面提到 NSEC 本來設計上的缺陷，包含 zone walk 的問題、資源消耗過多（每一次詢問需要回傳兩筆 NSEC 紀錄，區間跟 wildcard），還有 RFC4470 沒有解決的困難，例如還是需要回兩筆紀錄、且推薦的 epsilon function 回傳的資料過長但不查詢 zone file 的情況下又難以選擇端點。以 Cloudflare 每天需要簽署 569 億筆紀錄的服務來說，效能是極為重要的，那就把 RFC4470 的概念再進化、執行的更淋漓盡致吧！

趣味知識：RFC4470 又被暱稱 White Lies（白色的謊言），因為是出於善意而『欺騙』resolver，故意回答不存在的、虛構的端點。Cloudflare 自稱他們的解法為 Black Lies（黑色的謊言），就是為了利益（Cloudflare 的效能）而說謊的意思！

在 Cloudflare 的做法中，只要是不存在的網域都會回傳 `\000` 前綴的答案，所以才會出現：

```txt
whitebit.com.	NSEC	\000.whitebit.com
```

這樣做有幾個好處。第一，因為不是標記區間而是針對詢問的網域直接回答，所以不再需要回覆萬用字元的 NSEC 紀錄，也不需要多做一次線上簽署。

第二，整個紀錄大小小很多，省略了前面一卡車 `\255` 也不需要耗費 CPU 去隨機計算合適的端點。

第三，對於 Cloudflare 查詢資料庫來說更有效率，不過要更清楚地解釋這點，我們要先複習另一個 NSEC 紀錄的特點：NODATA。前一篇我們稍微提過，NSEC 記錄尾巴有一串紀錄類型的字串，代表了這個 NSEC 擁有者**有**的紀錄類型，所以假設你找 `crystal.cymetrics.com` 的 MX 紀錄但這個網域沒有，他可以回你 `crystal.cymetrics.com    	NSEC	huli.cymetrics.com  A NS RRSIG NSEC` 來表達存在的只有 `A NS RRSIG NSEC` 這四種而已。這種回覆就叫做 NODATA。對 Cloudflare 來說，為了證明『其中一筆紀錄不存在』還要去搜資料庫找出『所有存在的紀錄』實在是太不划算了，所以為了可以不用查資料庫，Cloudflare 決定 NODATA 的回覆就在 NSEC 記錄後面加上所有的紀錄類型，唯獨除了請求的那種。如此一來，不僅不用查資料庫也不會多洩漏任何資訊，Cloudflare 稱之為 DNS shotgun。範例如下，會看到唯獨沒有 MX：

```txt
crystal.cymetrics.com    	NSEC	huli.cymetrics.com  A WKS HINFO TXT AAAA LOC SRV CERT SSHFP IPSECKEY RRSIG NSEC TLSA HIP OPENPGPKEY SPF
```

Cloudflare 的做法並沒有違反現行的 RFC，所以不會有相容性的問題，而且這一套目前也已經被 Amazon Route53、NS1 等大型 DNS 供應商採用，看來未來可能會逐漸普遍，甚至 Cloudflare 也在推相應的 [Internet Draft](https://datatracker.ietf.org/doc/html/draft-valsorda-dnsop-black-lies) 希望 Black Lies 未來能變成正式規範。雖然目前還沒有 RFC，不過 [IETF DNS Operations Working Group](https://datatracker.ietf.org/meeting/111/materials/slides-111-dnsop-sessb-black-lies-ent-sentinel-01) 也有在會議中持續關注進展。


加入檢查 black / white lies 的完整版：

```python
def zone_walk(domain):
    doms = list()
    # zone 沒有用 DNSSEC 或 NSEC3, 不做 zone walk 
    ans = query_record(domain, "DNSKEY")
    if len(ans) == 0:
        print('[*] Not using DNSSEC, no zone walk possible!')
        return doms
    
    # zone 用 NSEC3, 不做 zone walk
    ans = query_record(domain, "NSEC3PARAM")
    if len(ans) > 0:
        print('[*] Using NSEC3, not vulnerable to zone walk! If you would like to traverse zone and crack hashes, use nsec3walker instead.')
        return doms

    # 符合 black lies, 不做 zone walk
    ans = query_record('.'.join(['ireallydontexist',domain]), "NSEC")
    if len(ans) != 0 and ans[0].split()[0].strip('.').startswith("\\000"):
        print('[*] Domain is using "Black lies" proposed by Cloudflare to block zone walking.')
        return doms

    doms = [domain]
    while True:
        ans = query_record(domain, "NSEC", timeout=10.0)    # setting this larger so walk doesn't break
        # zone walk 斷掉了？可能是網路 timeout 或是符合 white lies（NSEC 指向一個不存在的網域，所以下一個就找不到了）
        if len(ans) == 0:
            print('[*] NSEC chain broken! There may be a connection issue, or the domain may be following RFC4470, dubbed "White Lies", to prevent zone walking.')
            break
        nextdom = ans[0].split()[0].strip('.')
        if nextdom == doms[0]:
            print('[*] Finished zone walk')
            break
        else:
            doms.append(nextdom)
            domain = nextdom
    
    return doms

l = [] # 測試的 domain 清單
for d in l:
    print(d)
    print(zone_walk(d))
```

## 結論

本來只是在測試的時候觀察到特別的現象，沒想到深入一看發現有各種抵抗 zone walk 的實作。除了用 NSEC3 之外，用 RFC4470 White Lies 或 Cloudflare 的 Black Lies 都是常見的選項，還有其他獨特的方法，例如看到 DNSimple 要特別指定 NSEC3 才會給你 NSEC 紀錄（？），或是一些開源自架的服務也會有自己的實作（畢竟就算是遵循 RFC4470 也還是留有很多彈性）。

前一篇有提過，已經有開源工具 [ldns-walk](https://linux.die.net/man/1/ldns-walk) 或 [nsec3walker](https://dnscurve.org/nsec3walker.html) 可以幫你做 zone walk，不過其實自己簡單寫一個也是很容易的，有興趣的話也可以試試自動化大範圍掃，畢竟流量其實不大不太會被擋 XDDD

附上一點點數據：

| 統計 | 百大台灣企業 | 百大數位貨幣交易所 |
|----|----|----|
| No DNSSEC | 97 | 58 |
| NSEC3 | 3 | 1 |
| White Lies | 0 | 3 |
| Black Lies | 0 | 38 |

可見比起國外，台灣企業大多都沒有設置 DNSSEC，而使用 Black Lies 的數位貨幣交易所幾乎都是用 Cloudflare，市佔好高
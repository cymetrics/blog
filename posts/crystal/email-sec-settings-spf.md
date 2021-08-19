---
title: 關於 email security 的大小事 — 設定篇 SPF
author: crystal
date: 2021-07-14
tags: [Security]
layout: layouts/post.njk
image: /img/posts/crystal/email-sec-settings-spf/cover.jpg
---

<!-- summary -->
上一次我們深入瞭解了 email security 的原理與應用場景，這次來看看 SPF、DKIM、DMARC 該如何設置吧！
<!-- summary -->

請注意，這裡的『設定』並不是回答你『如何在 google 或是 Office365 設好這些紀錄』、『用 XX 服務結果信寄不到怎麼辦』，這種操作配置的教學文請參考官方文件，畢竟 email provider 千千百百家，各自可能有的問題更是難以彙整。

我想告訴你的『設定』是 SPF、DMARC 的 DNS 紀錄本身有哪些標籤，以及設置這些選項時可能不小心踩到哪些地雷，導致收信方的 email server 在驗證你的郵件時出現非預期地報錯，而判斷驗證失敗。另外，也會告訴你如果有多個子網域，或有使用第三方寄信服務時該怎麼辦。

總之，可以想成是回答你『我該怎麼理解這些紀錄』和『每個機制有哪些選項跟限制』，而不是針對單一 email provider 的教學文。

如果你還不太懂 SPF、DKIM、DMARC 是什麼，或是不清楚郵件傳遞過程中的各個角色與職責（MDA、MTA⋯⋯們），或是想了解更多範例與延伸議題，請看本系列其他篇：


有不懂或是想了解更多範例與延伸議題，請看本系列其他篇～
如果你還不太懂 SPF、DKIM、DMARC 👉 [關於 email security 的大小事 — 原理篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-theory)
如果你在找 DKIM、DMARC 的設定 👉 [關於 email security 的大小事 — 設定篇 DKIM、DMARC](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-dkimdmarc)
如果你想搭配設定範例 👉 [關於 email security 的大小事 — 範例篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-examples)
如果你想了解延伸議題 👉 [關於 email security 的大小事 — 延伸篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-extra)



## SPF

先來看看 SPF。SPF 紀錄的語法說複雜不複雜，但各種小細節常常讓人頭疼，一個很完整的語法介紹可以參考 [Dmarcian-SPF record syntax](https://dmarcian.com/spf-syntax-table)。

如果想配著真實的信件看，建議你可以用 [mxtoolbox](https://mxtoolbox.com/SuperTool.aspx) 之類的工具一邊查詢 SPF 紀錄，一邊點開信件原始內容看 SPF 驗證結果：

![](/img/posts/crystal/email-sec-settings-spf/spf-result.png)

這裡我們先講一下 SPF 驗證時會出現的幾種結果：

*   `Pass`：IP 於列表中，驗證成功。採取行為是：accept
*   `Fail`：IP 不在列表中，驗證失敗。採取行為是：reject
*   `SoftFail`：IP 不在列表中，驗證失敗，但不要直接 reject。採取行為是：accept but mark（標注失敗）
*   `Neutral`：不予置評，即使 IP 不在列表中也不視為失敗，視同 `None`。採取行為是：accept
*   `None`：沒有足夠資訊得出結論（例如未找到 SPF 紀錄）。採取行為是：accept
*   `PermError`：驗證過程出錯，例如格式錯誤的 SPF 紀錄。採取行為是：unspecified（未定義），交由收信方 email server 自行決定。
*   `TempError`：驗證過程出錯，但沒有 PermError 嚴重。採取行為可能是 accept 或暫時 reject，由收信方 email server 自行決定。

SPF 的小地雷就在於，很多種設置上的小失誤可能導致 PermError、TempError、或是其他削弱 SPF 安全性的結果。因為我們無法預期收信方 email server 會採取什麼行為，所以也無法確保送到收件人手上的信件都有受到 SPF 紀錄的保護。要是對方遇到 Error 一律採取 accept，或是乾脆選擇忽略這筆 SPF 紀錄，那不就形同虛設了嗎？

下面我們看看 SPF 紀錄中的標籤： 8 個機制（mechanism）跟 2 種修飾（modifier），以及他們可能踩到地雷的情形。所有的標籤（tag）與標籤值（tag value）中間都不能有空白。此外，至少在出現更新版本的 SPF spec之前，現階段 SPF 紀錄開頭必須是 `v=spf1`。

#[簡短的 SPF record（取自 維基百科）](/img/posts/crystal/email-sec-theory/spf.png)

以下我們稱信件的來源（也就是 `smtp.MailFrom`）為 sender-domain 或 sender-ip，標籤值為 target-domain 或 target-ip。

### Mechanisms

8 個 mechanism 為： `all, ip4, ip6, a, mx, ptr, exists, include`

SPF 紀錄驗證時是照著 mechanism 出現的順序比對的，比對結果為 match、 not-match、或 error 之一，一旦成功找到 match 或是發生 error 就會停下。

在每個 mechanism 前都可能帶有一個 qualifier 符號，為下列其一：

*   `pass(+)`：若對到 sender-ip，結果 pass（即白名單）。預設值，可以省略（ `+all` 同 `all`）
*   `neutral(?)`：None ，等同沒有 policy。
*   `softfail(~)`：若對到 sender-ip，結果 fail，仍要標注並接受。
*   `fail(-)`：若對到 sender-ip，結果 fail（即黑名單）。

##### all

語法為： `[qualifier]all`

必須在紀錄最末，是最後一個判斷條件。一般來說應設置最嚴謹的 `-all`，表示除了前述 mechanism 指定的 target IP 外一律拒絕（`fail(-)`），所以如果前面的 mechanism 都沒對到，最後就會失敗。

地雷：

*   缺少 `all`：`PermError`
*   `all` 後面的任何標籤均會被忽略
*   `?all, +all`：不管前面有沒有對到，都視為 pass。SPF 跟沒設一樣。

##### ip4, ip6

語法為：`[qualifier]ip4:target-ip[cidr-length]` 或 `[qualifier]ip6:target-ip[cidr-length]`

分別用 ipv4 與 ipv6 定義的 IP 列表，只要是 CIDR 表示法都可以，例如 `192.168.0.1/16`。斜線後的 prefix length 如果省略，會預設為 `/32`（ipv4）與 `/128`（ipv6）。

地雷：

*   不合法的 IP：`PermError`

##### a

語法為：`[qualifier]a:[target-domain][cidr-length]`

檢查 sender IP 是否在 target-domain 的 A 或 AAAA 紀錄中，即是否為 target-domain 所擁有的 IP。如果沒有寫 target-domain 就會默認為當前 SPF 紀錄的網域， `a` 等同 `a:sender-domain`。

##### mx

語法為：`[qualifier]mx:[target-domain][cidr-length]`

檢查 sender IP 是否在 target-domain 的 MX 紀錄中。如果沒有寫 target-domain 就會默認為當前 SPF 紀錄的網域， `mx` 等同 `mx:sender-domain`。

地雷：

*   若一個 MX 紀錄包含超過 10 個 A 或 AAAA 紀錄：`PermError`

##### ptr （已廢棄）

語法為：`[qualifier]ptr:[target-domain]`

進行 reverse DNS lookup，若得到的網域是 `smtp.MailFrom` 或其子網域，則 pass。此機制速度慢且會 .arpa name servers 的負擔，請勿使用。

地雷：

*   若一個 PTR 紀錄包含超過 10 個 A 或 AAAA 紀錄，只看前十個後面忽略

##### exists

語法為：`[qualifier]exists:target-domain`

若 target-domain 存在 A 紀錄，視為 pass。

##### include

語法為：`[qualifier]include:target-domain`

跟寫程式呼叫另一個函數的概念類似，會檢查 target-domain 的 SPF 紀錄並且一直遞迴查詢下去，直到比對過每一個 IP。但 include 不代表把對方的 SPF 紀錄 inline 插入自己的，而是跳到對方的 SPF 紀錄的 context 中比對，最後得到 match、 not-match、或 error 的結果。

在遞迴過程中，子紀錄的驗證結果對母紀錄的 include 機制的影響為：

*   `Pass`→ include 判定：match
*   `Fail, Softfail, Neutral`→ include 判定：not-match
*   `PermError, None`→ include 判定：`PermError`
*   `TempError`→ include 判定：`TempError`

include 機制適合用在核准外部（跨域）的 email provider，例如當我們使用第三方寄件服務時，就要把對方的 SPF 紀錄用 include 機制放到我們的SPF 紀錄。

### Modifiers

2 種修飾為： `redirect, exp`

##### redirect

語法為：`redirect:target-domain`

必須在紀錄最末，與 all 不可同時出現。若前面的 mechanism 驗證完畢但都沒有找到 match，就用 target-domain 的 SPF 紀錄取代自己的。與 include 的母子關係不同，這裡用 inline 概念插入，所以任何報錯視為當前 SPF 紀錄的 Error。

地雷：

*   若 target-domain 沒有 SPF 紀錄：`PermError`
*   `all` 與 `redirect` 只能出現一個，若紀錄中兩者同時出現則 `redirect` 會被忽略

##### exp

語法為：`exp:target-domain`

代表 explanation，若 SPF 紀錄驗證結果為 `Fail`，會返回 target-domain 的 TXT 紀錄內的字串。

地雷：

*   若在 include 的 target-domain 的 SPF 紀錄中找到 exp，會忽略（母子關係）；若在 redirect 的 target-domain 的 SPF 紀錄中找到 exp，則會忽略原紀錄的 exp（取代關係）

### 其他地雷：

*   DNS 回傳 NXDOMAIN（沒有 `smtp.MailFrom` 這個網域）：`None`
*   找到複數筆 SPF 紀錄：`PermError`
*   SPF 紀錄開頭不是 `v=spf1`：`None`
*   SPF 紀錄被設成 SPF 類型而不是 TXT 類型：SPF 類型作為 SPF 機制發展的過渡期使用，目前已廢棄，處理方式未定義
*   任何語法錯誤，例如 mechanism 或 modifier 拼錯字，或是中間多了空格等：`PermError`
*   DNS 查詢 timeout 、server failure 等除了 success 與 nxdomain 的結果：`TempError`
*   發生大於兩次 void lookup，也就是 DNS query 回傳空白結果（success 與 nxdomain）：`PermError`
*   涵括除了 `all, ip4, ip6, exp`之外的所有標籤，以及往下遞迴時需要的 DNS query，總計超過 10 次 DNS lookup：`PermError`
*   若 redirect 或 include 的網域有重複（例如 SPF 紀錄有：`include: a.com include:b.com` 但是 a.com 的 SPF 紀錄內已經有 `include:b.com`）或是 loop（a include b → b include c → c include a）的情況，不會報錯，但很可能會導致超過 10 次 DNS lookup
*   若驗證一筆 SPF 紀錄需要超過 20 秒：`TempError`
*   每個 modifier 在 SPF 紀錄只能各出現一次，若超過：`PermError`

### 多個子網域

如果你有多個會寄信的網域，就要為每一個分別設置 SPF 紀錄。如果它們是從同一個 email server 寄出去的，可以用 redirect 統一指向一筆紀錄，方便管理。

不寄信的網域（parked domain）請設置 `v=spf1 -all`。

### 第三方服務

如果你有使用第三方的寄件服務，例如 SendGrid，你可以在 SPF 紀錄中用 include 機制把第三方的 email server 涵蓋進來，例如 OneDegree 使用微軟 Outlook、MailChimp、FreshDesk、SendGrid 等服務：

```txt
v=spf1 include:spf.protection.outlook.com include:servers.mcsv.net include:email.freshdesk.com -all
```

眼尖的人可能會發現，上面的紀錄怎麼少了 `include:sendgrid.net`？

其實，你如果去查這幾個第三方服務的的 SPF 紀錄就會發現，FreshDesk 的 SPF 紀錄就已經有 `include:sendgrid.net` 這一行，因此我們就不用加啦！這樣也可以省下一筆 DNS lookup 的扣打，畢竟 10 次 DNS lookup 是很容易超過的。

這裡也順便回答一個非常常見的問題：
> 『超過 10 次 DNS lookup 怎麼辦』

只要你多用幾個第三方寄件服務，馬上就超過 10 次了，畢竟你 include 他算一次，他用到的 include、a、mx 等等也通通算你的！還不含你自己的一些 email server 呢！

解決這個問題有幾個撇步：

如果你有 lookup 到你自己的一些 email server，可以考慮用 ip4 ip6 直接 inline 插進來，例如：

```txt
// before  
mydom.com -> include:sub1.mydom.com mx:sub2.mydom.com include:a.com  
sub1.mydom.com(SPF) -> ip4:192.x.x.3 ip4:172.x.x.x/16  
sub2.mydom.com(MX) -> 192.x.126.5

//after  
mydom.com -> ip4:192.x.x.3 ip4:172.x.x.x/16 ip4:192.x.126.5 include:a.com
```

或者，可以考慮把這個寄信的 domain 拆成幾個不同功用的 subdomain 然後把第三方寄件服務也依據用途瓜分下去，這樣每個 domain 都有自己的 10 次扣打。例如：

```txt
// before  
mydomain.com -> include:a.com include:b.com include:c.com 

//after  
mydomain.com -> include:a.com   
customer.mydomain.com -> include:b.com   
partnership.mydomain.com -> include:c.com
```

如果你很不幸地用到了一個第三方服務，他自己的 SPF 紀錄就要用到快 10 次 lookup，那只能說….換一個吧？（或是聯繫對方看看他們有什麼建議啦）

## 結論

恭喜大家搞懂三劍客裡最難設定的 SPF 啦！你可以在網路上找到的 SPF 紀錄檢查器通常不會把我們討論的地雷全都檢查一次，因為實在是太麻煩啦QQ 推薦你可以多用幾種工具配著這篇仔細檢視一下你的 SPF 紀錄，然後跟著下一篇設好 DMARC 後，就可以在每日的彙整報告中看到 SPF 通過跟失敗的紀錄囉！

### Reference:

1.  [SPF RFC](https://datatracker.ietf.org/doc/html/rfc7208)
2.  [DKIM RFC](https://datatracker.ietf.org/doc/html/rfc6376)
3.  [DMARC RFC](https://datatracker.ietf.org/doc/html/rfc7489)
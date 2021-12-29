---
title: 關於 email security 的大小事 — 設定篇 DKIM、DMARC
author: crystal
date: 2021-07-15
tags: [Security, Email Security]
layout: zh-tw/layouts/post.njk
image: /img/posts/crystal/email-sec-settings-dkimdmarc/cover.jpg
---

<!-- summary -->
接續著前一篇，我們來講講 DKIM 跟 DMARC 的設定。
<!-- summary -->


老話一句，這裡的『設定』並不是回答你『如何在 google 或是 Office365 設好這些紀錄』、『用 XX 服務結果信寄不到怎麼辦』，這種操作配置的教學文請參考官方文件，畢竟 email provider 千千百百家，各自可能有的問題更是難以彙整。

我想告訴你的『設定』是 SPF、DMARC 的 DNS 紀錄本身有哪些標籤，以及設置這些選項時可能不小心踩到哪些地雷，導致收信方的 email server 在驗證你的郵件時出現非預期地報錯，而判斷驗證失敗。另外，也會告訴你如果有多個子網域，或有使用第三方寄信服務時該怎麼辦。

總之，可以想成是回答你『我該怎麼理解這些紀錄』和『每個機制有哪些選項跟限制』，而不是針對單一 email provider 的教學文。

有不懂或是想了解更多範例與延伸議題，請看本系列其他篇～
如果你還不太懂 SPF、DKIM、DMARC 👉 [關於 email security 的大小事 — 原理篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-theory)
如果你在找 SPF 的設定 👉 [關於 email security 的大小事 — 設定篇 SPF](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-spf)
如果你想搭配設定範例 👉 [關於 email security 的大小事 — 範例篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-examples)
如果你想了解延伸議題 👉 [關於 email security 的大小事 — 延伸篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-extra)

---

## DKIM

我們先從 DKIM 開始，因為對設置者來說，他是標籤彈性最小、可控選項最少的驗證機制，所以也不太容易出錯。

回顧我們在原理篇看到的 DKIM signature，裡面有非常多欄位，包含版本、加密法、時間戳、網域等等。舉例來說，當收信方的 email server 看到下圖這個 DKIM signature，就會用裡面的 `s=brisbane,d=example.net` 組合出 DKIM 公鑰發行的網域：`brisbane._domainkey.example.net`，再用找到的公鑰解密 `bh`（body hash） 來比對雜湊（hash），進而驗證信件真實性。

#[DKIM signature（取自 維基百科）](/img/posts/crystal/email-sec-theory/dkim-signature.png)

一般來說，你的 email provider 都會提供給你產生 DKIM 的工具，裡面的網域名稱、加密演算法等等都不能更改，可以配置的通常只有：

*   金鑰長度：1024 或是 2048 位元。
*   prefix selector：也就是欄位中的 `s`，會跟 `d` 一起用於 DNS 查詢，用來辨識不同的 DKIM 公鑰。這個值可以是任何字串，不過因為是用來組成發布 DKIM 紀錄的網域名，所以 `(s,d)` 必須是 unique 的。

設定完成後就把公鑰發布在 `<selector>._domainkey.<domain>` 這個網域下，以 onedegree 為例，存在如下的一筆 DKIM 紀錄：

#[OneDegree DKIM](/img/posts/crystal/email-sec-settings-dkimdmarc/onedegree-dkim.png)

根據 RFC，DKIM signature 產生於 Administrative Management Domains (ADMDs)，在信件的 creation 與 relay 均可能發生，也就是說一封信件可能是經過多次簽名的，例如我們之前提過的轉發（forwarding）就會保留原始信件的簽章並且加上中繼 email server 自己的的簽章。當信件內有多個 DKIM signature，每一個都會被驗證，不過只需要其中一個同時符合 verification 跟 alignment，DMARC 就會判定為 pass。

### 多個子網域

如果你有多個會寄信的網域，就要為每一個分別設置 DKIM，只要他們的 selector 不同即可。例如你設置了以下兩個網域：

*   `mydom.com`： `selector=happy, DNS at happy._domainkey.mydom.com`
*   `sub.mydom.com`： `selector=sad, DNS at sad._domainkey.sub.mydom.com`

那麼不同網域簽署寄出去的信會用各自的私鑰，驗證時也會查詢到對應的公鑰，一切順利。

### 第三方服務

如果你有使用第三方的寄件服務，例如 SendGrid，他們會為你創造一把 DKIM 公私鑰，用自己的網域（例如 `sendgrid.net`）發布公鑰，再給你一筆 CNAME 型別的 DKIM 紀錄：

`happy._domainkey.mydom.com CNAME s1.domainkey.uXXX.wlXXX.sendgrid.net`

這樣收信方要驗證你由 SendGrid 發出的信時，就會先查詢 `happy._domainkey.mydom.com`，然後被導到實際帶有公鑰的網域 `s1.domainkey.uXXX.wlXXX.sendgrid.net`。

---

## DMARC

最後是 DMARC 啦～ 跟 SPF 比起來，DMARC 雖然標籤也不少，但地雷少得多，而且寄送報告的功能也能方便我們 debug 驗證失敗的郵件到底是哪裡出了問題。

原理篇提過，DMARC 是建立在 SPF 與 DKIM 之上的大一統防線，所以當然是要先設好 SPF 與 DKIM 囉！那如果今天沒有把這兩個都設定好，難道 DMARC 就一定會 fail 嗎？

其實也不會，你只是無法享受到完整的保護而已。DMARC 只會以有設置的機制判斷，所以假設只有設 SPF，那 DMARC 就只會對 SPF 做驗證跟 alignment 檢查，DKIM 會被自動忽略，這封信雖然一樣會寄到使用者信箱，但就不保證信件內容的真實性了。

DMARC 運作流程可以用下面這張 RFC 裡定義的 flowchart 表示，重點注意紅色框框的部分。點點（…）代表 DNS query，星星（\*\*\*）代表有 data exchange，所以可以看到 DMARC 是先得到 SPF 與 DKIM 的結果，再跟 author domain 進行 DNS query 拿到 DMARC 紀錄，如果成功找到紀錄就配合 SPF 與 DKIM 的結果得出 DMARC 驗證的結論，最後把驗證結果交給 MDA 做信件的過濾。

#[Flowchart from RFC](/img/posts/crystal/email-sec-settings-dkimdmarc/flowchart.png)

DMARC 驗證結果也會在原始信件裡留下紀錄。下圖紅框的地方分別是 SPF 與 DKIM 的驗證加上 alignment 檢查的結果，最後的 compauth 則是 DMARC 本身的驗證結果。因為 SPF 與 DKIM 都是 pass，所以 DMARC 也是 pass。

另外，只要 SPF **或** DKIM 通過 alignment 檢查就可以，不用兩個都符合！

#[DMARC result](/img/posts/crystal/email-sec-settings-dkimdmarc/dmarc-result.png)

接下來進入設定的部分。

首先請注意，DMARC 設置的網域跟 SPF 不同，

> 如果你的網域是 `mydom.com`，那 DMARC 就是在 `_dmarc.mydom.com` 這個子網域下的一筆 TXT 紀錄，放在 `mydom.com` 是無效的！

值得補充的一點是，做 DNS query 的時候，如果沒在當前的網域找到 DMARC 紀錄，就會往上一層去找 organizational domain 的 DMARC 紀錄。所以假設你是用某個子網域（`mailing.mydom.com`）寄信，那當 `_dmarc.mailing.mydom.com` 沒有 DMARC 紀錄時，就會去抓 `_dmarc.mydom.com` 的，不過這時用的 policy 就會是 subdomain policy（請看下面的 `sp` 標籤）。這個特性允許我們更方便地設置跟監控 DMARC，不用特別為每個子網域重新設定一筆紀錄。

再來我們看看 DMARC 有哪些標籤吧！標籤與標籤值之間皆以一個等號（`=`）區隔，中間不可以有任何空白。如果在解析 DMARC 紀錄的時候發生語法錯誤，例如：錯字、不在定義內的未知標籤或標籤值、重複的標籤、大小寫錯誤等等，都會直接被忽略。也就是說，出錯的地方會被套用預設標籤值，而這個預設值通常是最寬鬆、保護效果最差的。

以下依據用途簡單分類了標籤，除了開頭必須是 `v=DMARC1` 並緊接唯一的必要標籤 `p` 之外，其他標籤都是 optional ，且順序是沒有規定的。

### 政策相關

##### p

語法為： `p=action`

即 policy，也就是當 DMARC 驗證結果為 fail 時該採取的行動（action）。不過，這個 action 在 RFC 定義裡只是建議收信方遵照寄信方的意志而非強制（SHOULD … adhere ），實際的 action 仍由 MDA 決定。

可能的標籤值為：

*   `reject`：指示於 SMTP 層做 rejection。可能是會回到 bounce address、回覆 SMTP client 一個 5XY error code（ex: 550）、或是回覆傳送成功但默默丟掉（discard）。
*   `quarantine`：指示收信方應將信件視為可疑（suspicious）。可能的處理方式包含：放到垃圾信件夾、集中到檢疫中心（quarantine center）等待管理員查看、送入信箱但加註某種標籤等等。
*   `none`：不指示任何 action。由收信方自由決定。

在設置上建議採用最嚴格的 `reject`，不過實務上為避免設定有誤而導致信件突然都寄不到，造成營運上的影響，許多 email provider 會建議第一次設定 DMARC 時先用 `none`，觀察幾天的 DMARC report 以及信件原始內容的驗證結果，再逐漸調整成 `quarantine` 跟 `reject`。

##### sp

語法為： `sp=action`

即 subdomain policy，概念與語法皆同上面的 `p`。使用場景如前面說過的，用子網域 `mailing.mydom.com` 寄信，但 `_dmarc.mailing.mydom.com` 沒有 DMARC 紀錄，這時會採用最上層 `_dmarc.mydom.com` 的紀錄（如果存在），且採用 subdomain policy 定義的 action。

如果沒有定義 `sp`，預設會跟 `p` 一樣。

##### pct

語法為： `pct=num`

即 percentage，就是要套用此 policy 的比例，概念上類似隨機 dropout 讓一部分的信件就算驗證結果是 fail 還是直接算他通過。因為 DMARC 可能導致信件突然都寄不到，所以為了不要讓這種 all-or-nothing 的特性導致大家不敢使用 DMARC，延伸出這種部分套用的機制，可以讓寄信方先實驗看看。不管信件是否因為 `pct` 機制而被保留，所有驗證 fail 的信件都會出現在彙整報告，方便寄信方 debug。

如果一封信因為 `pct` 機制而被保留，採取的 action 因 policy 而異，基本上是放寬一個等級。例如本來要 `quarantine` 的就變成 `none`，本來該 `reject` 的就變成 `quarantine`。

`num` 介於 0 到 100 之間，預設是 100，也就是全部套用。

### alignment 相關

##### aspf

語法為： `aspf=mode`

代表 alignment SPF，也就是在進行 SPF 的 alignment 檢查時採取的方式，預設為 `r`。

可能的標籤值為：

*   `r` (relaxed)：寬鬆的比對，`smtp.MailFrom` 與 `header.From` 只要 organizational domain 相同即可（同一個根網域）。
*   `s` (strict)：嚴格的比對，`smtp.MailFrom` 與 `header.From` 需完全相同。

##### adkim

語法為：`adkim=mode`

代表 alignment DKIM，也就是在進行 DKIM 的 alignment 檢查時採取的方式，預設為 `r`。

可能的標籤值為：

*   `r` (relaxed)：寬鬆的比對，DKIM signature 的 `d=` 與 `header.From` 只要 organizational domain 相同即可（同一個根網域）。
*   `s` (strict)：嚴格的比對，DKIM signature 的 `d=` 與 `header.From` 需完全相同。

### 報告相關

##### rua

語法為：`rua=addr1,addr2,addr3…`

指示彙整報告（aggregate report）要寄送的位置，值為一串由逗號（`,`）分隔的 DMARC URI。RFC 定義 DMARC URI 為 `mailto:emailaddress`，例如 `mailto:woohoo@gmail.com`，如果指定了不合法的郵件位置會被忽略。

不合法的 DMARC URI 地雷：

*   收信人網域沒有 MX 紀錄：例如指定 abc@no-mx.com，因為 no-mx.com 沒有 MX 紀錄，所以此信無法寄送。
*   收信地址中有逗號（`,`）或是驚嘆號（`!`）：會造成解析上錯誤而被忽略。如必要請記得做 escaping 或 quoting。
*   收信人網域沒有授權接收報告：如果收信人網域跟 DMARC 紀錄網域相同不會有這個問題，不過如果今天指定報告要寄送其他網域，則指定收信人網域需要在 `<dmarc domain>._report._dmarc.<reporting domain>` 發一筆 DMARC 紀錄來授權報告寄送。假設 DMARC 紀錄網域：sender.com，收報告地址為：report@thirdparty.com，則 thirdparty.com 要在 `sender.com._report._dmarc.thirdparty.com` 發一筆內容為 `v=DMARC1` 的 TXT 紀錄。這個機制的目的一來是為了防止有人故意用大量報告對第三方的收信人做垃圾信件攻擊（spamming），二來也是保護發行 DMARC 紀錄的網域不要讓過多資訊外流。豆知識：有些提供 DMARC reporting 的第三方服務（例如 dmarcanalyzer.com），就會設定 `*._report._dmarc.rep.dmarcanalyzer.com TXT "v=DMARC1;"` 允許接收所有報告哦！

彙整報告包含所有信件的 DMARC 驗證情況，不論成功還是失敗都會紀錄，內容包含採用的 DMARC 紀錄、SPF 與 DKIM 的結果、alignment 細節、最後的 policy 與實際執行的 action、還有驗證結果的統計數字等等。

##### ruf

語法為：`ruf=addr1,addr2,addr3…`

指示失敗報告（failure report）要寄送的位置，值為一串由逗號（`,`）分隔的 DMARC URI。語法與地雷皆同上。

失敗報告與彙整報告不同在於：

*   彙整報告是每日（或是其他指定的區間）寄送一份，但失敗報告是在 DMARC 驗證失敗時馬上通知。
*   失敗報告包含更詳細的資訊，例如原信件內容。
*   失敗報告用於鑑識，觸發條件可以用下面的 `fo` 更細微控制。

##### fo

語法為：`fo=0:1:d:s`

用來指示失敗報告的觸發機制，值為一串由冒號（`:`）分隔的標籤值（多選），預設為 `0`。若 DMARC 紀錄中沒有 `ruf`，`fo` 會被忽略。

標籤值為：

*   `0`：如果沒有任何一種驗證得出 pass，也就是當 SPF、DKIM、alignment 通通都失敗的時候。
*   `1`：如果有任何一種驗證**沒有**得出 pass，也就是當 SPF、DKIM、alignment 有至少其中一種失敗的時候。
*   `d`：如果 DKIM 驗證失敗（不管 alignment）就觸發。
*   `s`：如果 SPF 驗證失敗（不管 alignment）就觸發。

##### rf

語法為： `rf=afrf`

定義失敗報告的格式，目前只有 `afrf` 一種，同樣是預設值。

##### ri

語法為： `ri=sec`

收到彙整報告的區間，單位為秒，預設是 86400，也就是一天。你也可以設定每幾小時接收報告，不過為了避免造成收信方太大負擔，小於一天的報告區間採 best effort 寄送（白話文：我盡量啦）。

### 多個子網域

如果你有多個會寄信的網域，其實不需要為他們分別設置 DMARC 紀錄。我們上面提過的 `sp` 標籤就是為了讓你可以在根網域的 DMARC 紀錄指示子網域的 policy。

### 第三方服務

如果你在 SPF 跟 DKIM 有設好，第三方服務對 DMARC 的影響會在 alignment 的部分。我們說過， `smtp.MailFrom` 跟 `header.From` 可以不同，所以如果你透過 Sendgrid 等服務寄信，SPF 驗證會通過但是 alignment 就會失敗。不過好在 alignment 檢查只要 SPF 或 DKIM 通過就行了，所以回到前面介紹 DKIM 與第三方服務的部分，這裡用的是我們自己的 `d=` 網域，所以 alignment 就沒問題了。

另一種會出事的場景是轉發（forwarding），也就是有一個中繼 email server 要在不影響 authentication 的情況下傳遞原汁原味的信件。因為多了一個中間人，所以 SPF 會驗證失敗，而 DKIM 雖然會驗證成功，但在 alignment 檢查又會被擋下。這種多 hop 傳遞的情況在現實世界中是很常見的，但是 DMARC 的機制會使這些信件驗證失敗，因此延伸出了我們下一篇會再來聊聊的 ARC （Authentication Recieved Chain）機制。

---

## 結論

終於整理完繁瑣的各種細節了（撒花！）這兩篇基本上把 RFC 定義翻譯了一遍，不過因為這些機制都還不算太成熟，所以設定未來都還是可能變動的。

我自己在設定這些的時候是配合著原始信件內容跟彙整報告檢視三劍客的有效性跟正確性，建議大家可以測試的時候可以多寄到幾個不同的信箱（例如 gmail、outlook、hotmail、yahoo …）看看 action 的不同。如果要偽冒寄信的話可以用線上的 Emkei’s Fake Mailer 來檢視信件是否真的有被擋下來。

不過，即使是驗證全都 pass 的信件還是有可能進垃圾信或是被擋下的喔！因為 DMARC 只是 MDA 參考的其中一個 filter，其他因素，例如內容重複性太高或是有奇怪連結、圖片、檔案等等也是會導致信件被過濾的。畢竟可是有很多 email security 廠商在努力幫大家擋掉釣魚跟垃圾信呢 XDDD

關於 SPF、DKIM、DMARC 的原理與設置大致就到這，下一篇我們會來探討這些機制的不足、延伸的問題、和更多 email security 的小知識！

### Reference:

1.  [SPF RFC](https://datatracker.ietf.org/doc/html/rfc7208)
2.  [DKIM RFC](https://datatracker.ietf.org/doc/html/rfc6376)
3.  [DMARC RFC](https://datatracker.ietf.org/doc/html/rfc7489)
---
title: 關於 email security 的大小事 — 原理篇
author: crystal
date: 2021-07-02
tags: [Security, Email Security]
layout: zh-tw/layouts/post.njk
image: /img/posts/crystal/email-sec-theory/cover.jpg
---
<!-- summary -->
<!-- 大家可能常常在新聞上看到某某公司遭到釣魚信件攻擊，駭客『偽冒公司員工寄信』造成受害者上當的故事。不管是交出內部服務的帳號密碼，還是下載惡意軟體中毒，都是很嚴重的後果，讓我們來看看 email security 是什麼，又有哪些攻防機制吧！ -->
<!-- summary -->

大家可能常常在新聞上看到某某公司遭到釣魚信件攻擊，駭客『偽冒公司員工寄信』造成受害者上當的故事。不管是交出內部服務的帳號密碼，還是下載惡意軟體中毒，都是很嚴重的後果，所以常說資安最薄弱的一環就是人的意識啊（嘆。

但是釣魚信件那麼猖狂，難道就只能依靠受害者自己的意識嗎？撇除用相似的域名寄信，像是 g1thu6.com 或 app1e.com 的這種仔細觀察就能發現端倪的情況，如果寄信人的地址真的寫著 github.com 跟 apple.com，我要怎麼判斷是不是釣魚啊？再謹慎的人都沒輒吧？

為了讓寄件方負起一點責任，也讓收信方有驗證郵件的依據，於是出現了三種常見的驗證機制：SPF、DKIM、DMARC。但在講這三種設定前，我們首先要理解一封郵件從發信人寄出到收信人點閱中間經歷了哪些事。

---

## An Email’s Journey

想像一下，假設你要寄一封手寫的卡片給遠方的親友，你會怎麼做呢？

你可能會拿一張稿紙，在開頭先寫上『親愛的X：』，接著文情並茂地寫完內文，在結尾附註『愛你的 O』，說不定還會再加上當天的日期。然後，你可能會找一個乾淨的信封，在前面寫上親友的名字以及住址，在背面寫上自己的地址或是郵局信箱位置。最後，把信紙放進信封袋密封好、貼上郵票並投入信箱，等他經過郵差先生傳遞、最後落到對方的信箱裡靜靜躺著。

其實一封電子郵件的旅程也差不多如此。假設今天我要寄一封電子新年賀卡給爺爺會發生什麼事呢？我們用下面這張圖來說明。

#[Email’s journey （參考 <a href="https://afreshcloud.com/sysadmin/mail-terminology-mta-mua-msa-mda-smtp-dkim-spf-dmarc">Mail Terminology</a>）](/img/posts/crystal/email-sec-theory/journey.png [mail's journey])

首先，我會在網頁上登入我的 gmail ，此時『網頁版 gmail 』這個應用程式就扮演著圖左上角寫著 Mail User Agent（MUA）的角色，是使用者直接互動、操作的介面。當我寫好信之好按下寄出，MUA 就會把我寫的內文（body）前面加上一些 header，包含寄信人（`header.From`）、收件人（`header.To`）、`header.Reply-To`、`header.BCC`、`header.CC`、日期等等資訊。

如果你點開信件的原始資訊，會看到類似下面這一張圖的內容：

#[Header 的一小部分](/img/posts/crystal/email-sec-theory/header.png)

當 MUA 把信包裝好後，就會通過 SMTP（Simple Mail Transfer Protocol）這個協定進行身份驗證並把信包在一個信封袋（SMTP envelope）中交給 email server。這裡我用的是 gmail，以上圖來說黃色的 sender server 就是一台 gmail server。在 email server 中，首先會送到在 port 587 的 Mail Submission Agent（MSA），在這裡進行一些郵件審查與勘誤。審查的功能常用於確保符合 AD 設定的 policy，例如拒絕非同網域的收信地址、或是未經帳密驗證的寄件人等等。勘誤的部分則是會檢查是否缺少某些 header 欄位或是有格式不正確的地方。

確定信件準備好送出，就會送到跑在 port 25 上的 Mail Transfer Agent（MTA）這裡。MTA 就是郵差的角色，負責的工作是透過 DNS 查詢收信人網域的 MX 紀錄找到對應的 IP，然後傳送出去。需要注意的是，MTA 並不專指在 sender 或 receiver 端 email server 中運行的程式，他在概念上類似 router ，是負責找出下一個 email server 位置並實際傳輸（relay）的軟體。所以雖然上圖中直接把左邊 sender email server 指到右邊 receiver email server，但中間傳輸過程中是可能經過多個 MTA 的。另外，MSA 與 MTA 通常同時運作在同一台主機上，不過某些比較老的 email server 不一定有 MSA 這個角色，有可能是 MUA 直接把信送到 port 25 的 MTA （此時 MTA 兼負 MSA 的職責）。

前面說過，使用 SMTP 會把信包在一個信封袋（SMTP envelope）中，實際上也就是加上一些 SMTP 欄位的紀錄，例如 `smtp.HELO`、`smtp.MailFrom`、`smtp.RcptTo` 等等。所以經過 MSA 與 MTA 這些 relay 的信件都會被加上一些軌跡（trace），你可以在原始資訊中看見這些紀錄：

#[SMTP trace information](/img/posts/crystal/email-sec-theory/trace.png)

好不容易送到使用 outlook 的爺爺那邊的 Microsoft server，然後呢？

首先，MTA 收到信後一看，發現自己就是最終目的地，於是把信轉到同台主機上的 Mail Delivery Agent（MDA），又稱為 Local Delivery Agent（LDA）。MDA 的角色就像收到一大堆信件的社區管理中心，負責把信件分類好並塞到每個住戶的信箱裡，這裡說的信箱是在 email server 上的信件儲存空間 Message Store（MS）。同時，MDA 也會加上一筆 SMTP trace，並把信封袋上的 `smtp.MailFrom` 欄位放到 header 中的 `Return-Path` 欄位。

最後，當爺爺打開他的桌機版 outlook （MUA）準備收信時，MUA 就會使用 POP3 或是 IMAP 協定向 email server 上運行的 POP3 / IMAP server 進行身份驗證並要求存取信件，如果驗證成功就會從 MS 中下載我給爺爺的信，這樣爺爺就能在 outlook 的介面上看到我的賀卡啦～

#[Email’s journey （參考 <a href="https://afreshcloud.com/sysadmin/mail-terminology-mta-mua-msa-mda-smtp-dkim-spf-dmarc">Mail Terminology</a>）](/img/posts/crystal/email-sec-theory/journey.png [mail's journey])

至此我們配著圖稍微整理一下這趟旅程中的各個角色：

*   Mail **User** Agent（MUA）：俗稱的 email client，也就是使用者介面，能讓我們編輯、瀏覽、標記、分類信件等。軟體有：Gmail、Hotmail、Outlook、Thunderbird 等。
*   Mail **Submission** Agent（MSA）：寄出前將 MUA 送來的信進行審查與勘誤。不一定有專責軟體，有些 MTA 兼有 MSA 的功能。
*   Mail **Transfer** Agent（MTA）：負責信件的『路由』，有時又稱為 mail relay、mail exchanger、MX host 等。軟體有：Postfix、Exim、Sendmail、qmail、Postal、Cuttlefish 等。
*   Mail **Delivery** Agent（MDA）：將 MTA 傳來的信件放到 email server上的信箱儲存空間。軟體有：Cyrus IMAP、dovecot、fetchmail、sieve、courier-maildrop、getmail 等。
*   Message Store（MS）：儲存信件的地方，可能為遠端（remote）或本地端（local），也可能有多個共同運作。

---

## 這麼多欄位差在哪？

講到這裡，很多人會困惑到底前面說的信紙（`header.From, header.To`）與信封袋（`smtp.MailFrom, smtp.RcptTo`）上的欄位有何不同？不就都是寫著一樣的信箱位置嗎？

其實，信紙跟信封袋上的寄信人欄位是可以不同的！

在 SMTP 協議下，`smtp.MailFrom` 這個欄位其實有一個重要功能，就是指示 MTA 如果這封信寄送失敗的話，要退件到哪個地址去，所以又稱為 bounce address。一般來說如果是個人寄信的話，失敗當然就是直接回給寄件人，此時 `header.From = smtp.MailFrom`，不過如果是公司或是網站的 mailing list 這種自動化寄信給訂閱者的應用場景，有時會希望把傳送失敗的信統一集中到另一個信箱處理。另一種情境是，當信件會經過一個中繼 email server 然後被自動轉發（Forward）時，`header.From` 會是原始信件的寄件人，但 `smtp.MailFrom` 會是中繼 email server 一個專收報錯的信箱，畢竟你可不希望轉發錯誤被報錯到原始寄件人那兒啊！

> SMTP 欄位只有在以 SMTP 溝通的角色之間才會使用，我們在 MUA 介面上看到的寄信人等資料都是放在 header 中的。

你可以想像成，信紙是給收信人（爺爺）看的，但信封袋是給郵政人員（MxA）看的，所以信封袋上的註記當然都不會讓爺爺看到囉！

關於 email 的各種定義可以在 [Internet Mail Architecture](https://bbiw.net/specifications/draft-crocker-email-arch-03.html#Users) 詳細閱讀，這裡也附上 RFC 定義的欄位列表：

*   originator：指的是作者（author），在上面流程中就是寫信的我
*   relay：負責信件路由與傳送的郵差，通常指 MTA
*   source：在定義上為『負責確保信件有效（valid）再交給 relay 』的角色，即 MUA 與 MSA
*   mediator：指 user-level 的信件傳送，如 mailing list 這種自動轉發的中間人角色，或是 MDA 所支援的 aliasing 功能。與 MTA relay 機制不同。

#[Identity References（From: <a href="https://bbiw.net/specifications/draft-crocker-email-arch-03.html#Users">Internet Mail Architecture</a>）](/img/posts/crystal/email-sec-theory/identity-ref.png)

---

## 那攻擊是如何發生的？

討論攻擊前請記住，

> SMTP 對信件本身是沒有任何驗證機制的。

你只要可以用一組帳號密碼登入 SMTP server，寄信收信人欄位都任你填。SMTP authentication 只是為了保護 SMTP server 不要成為 open relay 讓任何人都能使用，並沒有保障信件本身的真實性。

回顧上面的流程，我們來討論三種情境、看看這些攻擊中的『信件』有何不同。

先假設

*   我使用的信箱是：goodboy@gmail.com
*   我的 email server 網域是：gmail.com
*   爺爺用的信箱是：grandpa@outlook.com
*   爺爺的 email server 網域是：outlook.com

因此我寄出的信件上，信紙（`header.From`）與信封袋（`smtp.MailFrom`）上都會寫著 goodboy@gmail.com。

### 情境一

今天我的月光族表弟想要模仿我寄信給爺爺跟他要零用錢，他可以自己架起一個 email server，然後偽造一封信紙（`header.From`）與信封袋（`smtp.MailFrom`）上均寫著 goodboy@gmail.com 的信件並寄出。爺爺的 email server 看到這封信不疑有他就送進爺爺的信箱裡，導致爺爺成功被騙，轉了一筆錢給表弟。單純從 SMTP 機制來看，outlook.com 眼中的信件寫著來自 gmail.com，那就姑且相信他！

為了防範這種假冒寄信人的攻擊，2014 年 4 月 RFC 7208 正式提出一套名為 **Sender Policy Framework（SPF）** 的電子郵件驗證機制。這個機制的原理就是要求每個網域發一筆 DNS 紀錄，其中記載著這個網域所授權的 email server 的 IP 位置，也就是

> SPF：昭告天下『這些 IP 位置是我信任且核可的信件來源』

當收件方 email server 要進行驗證時，MDA 就會去查詢 `smtp.MailFrom`這個網域的 DNS 紀錄，然後檢查此信件的來源 IP 是否在 SPF 紀錄中。

下圖是一筆合法的 SPF 紀錄，裡面表列了允許寄信的 IP 位置，並且用 -all 宣告『除了前列 IP 之外一律拒絕』。其實 SPF 有非常多種設定，我們下一篇再談。

#[SPF record（取自 維基百科）](/img/posts/crystal/email-sec-theory/spf.png)

你可以在信件的原始資訊裡看到 SPF 的驗證結果，收信方的 email server（protection.outlook.com）在確定 IP 為此 domain 的合法寄信人後，就會給出 PASS 的結果。

#[SPF 驗證結果](/img/posts/crystal/email-sec-theory/spf-result.png)

如果今天 gmail.com 設置了 SPF 紀錄，那爺爺的 email server 在驗證時就會發現表弟所用的自架 email server 沒有在列表裡找到對應的 IP ，因此判斷為驗證失敗，成功擋下這個詐騙攻擊。

### 情境二

表弟發現攻擊失敗，只好另尋他法。他靈光一閃，發現雖然不能假冒 gmail.com 寄信，那他可以攔截我寄給爺爺的信，然後把裡面的欄位跟資訊改掉，這樣就可以冒充我的身份又通過 SPF 驗證啦！於是表弟竄改我的信件，把內容改成零用錢請求，又成功騙到爺爺了。

為了防範情境二的這種攻擊，2011 年首次提出的 RFC 6376（後來又在 RFC 8301 與 RFC 8463 修訂）定義了 **DomainKeys Identified Mail（DKIM）** 這個機制。

> DKIM：使用數位簽章的概念來防止郵件偽造與竄改，透過公私鑰加密驗證的特性來確保訊息的完整與真實性。

寄信方的 email server 會產生一組公私鑰，公鑰會用 DNS 紀錄發佈出去讓收信方可以用來解密。在寄信時使用私鑰加密 header 的某些欄位與 body，並將產生的雜湊（hash）做為簽章附上，此簽章稱為 DKIM signature。要加密的欄位由 email server 指定，不過必須包含 `header.From`（否則寄件人的身份就沒有保障啦）。

收信的 email server 進行驗證時，如同 SPF，MDA 會去查詢寄信網域的 DNS 紀錄，找到對應的公鑰後解密簽章內容來比對是否一致。

#[公鑰（取自 維基百科）](/img/posts/crystal/email-sec-theory/dkim.png)

簽章如下圖所示，標籤中 `v` 為版本、`a` 代表加密方式。`d` `s` `q` 三者一起用來查詢公鑰，表示查詢域名為 `<selector>._domainkey.<domain>`（圖中就是 `brisbane._domainkey.example.net`）的 DNS TXT 紀錄。`h` 代表指定的header 欄位，加密後的結果會放在 `b`，而 `bh`（body hash）則是 body 本身經過雜湊後的結果。

#[DKIM signature（取自 維基百科）](/img/posts/crystal/email-sec-theory/dkim-signature.png)

如果今天 gmail.com 設置了 DKIM 紀錄，那爺爺的 email server 在驗證時就會發現表弟竄改完的信件跟數位簽章解密的結果不符，因此判斷為驗證失敗，爺爺再度逃脫表弟的暗算。

### 情境三

表弟拿不到零用錢，很是挫敗。於是他絞盡腦汁終於想到：既然我不能仿冒 gmail.com 也不能攔截真的信件，那我就自己架一個 email server、申請一個合法網域 cousin.com ，然後寄一封信紙（`header.From`）上寫 goodboy@gmail.com 的信給爺爺就好啦！雖然信封袋（`smtp.MailFrom`）上寫的是 cousin.com，但反正爺爺在 outlook 裡看到的也只有 `header.From`，他哪知道不是真的從 gmail.com 來的。而且，不管是 SPF 還是 DKIM 驗證的都是 `smtp.MailFrom` 的網域，我本來就是 cousin.com 又沒造假，休想擋我財路！

哎呀，表弟想的真有道理。

不過好在 2015 年 3 月時 RFC 7489 出現，提出了一個可以保護爺爺的方法，名為 **Domain-based Message Authentication, Reporting and Conformance（DMARC）**

> DMARC 結合了 SPF 與 DKIM，形成三人聯防，缺一不可，同時強化信紙與信封袋的一致性。

DMARC 主要有兩個功能，其一是指示了當 SPF 與 DKIM 驗證失敗時該採取的行為，稱為 policy；第二則是確保信紙與信封袋上標示的寄件人來自同一個網域（也就是比對`header.From`跟`smtp.MailFrom`），稱為 alignment。

#[DMARC record（取自 bbc.com 的紀錄）](/img/posts/crystal/email-sec-theory/dmarc.png)

以上面這個 DMARC 紀錄為例，必要的標籤為 `p`（policy），可能的值有：

*   `reject`：最嚴格的設定，表示 SPF 與 DKIM 驗證失敗的信一律回絕或直接捨棄
*   `quarantine`：隔離，實際處理方法因 email server 而異，可能是放在 email server 上的隔離區域等待視察（例如微軟的 email server 有 quarantine center），或是被歸類到垃圾郵件中並加註警戒標籤（例如 gmail 的處理方式）。
*   `none`：最寬鬆的設定，表示不做特別處理，僅是觀察（monitor），實際處理方法因 email server 而異，有可能進入一般信箱也可能歸類到垃圾郵件。

而定義 alignment 的標籤為 `aspf` 與 `adkim`，分別對應 SPF 與 DKIM。以 SPF 來說是比對 `header.From` 的網域與 `smtp.MailFrom` 的網域；以 DKIM 來說是比對 `header.From` 與 DKIM signature 中 `d` 標籤的網域（例如前面圖中藍色字體的 example.net）。

可能的值有：

*   `s`（strict）：嚴格檢查，比對的兩個網域必須完全
*   `r`（relaxed）：寬鬆檢查，比對的兩個網域只要 base domain 相同即可，亦即可為主網域與子網域的關係

DMARC 甚至很貼心的附贈回報功能，你可以在 DMARC 紀錄指定信箱，則收信方的 email server 會每天整理並寄送一份報告到這個信箱，告訴你昨天信件驗證的狀況，包含驗證失敗的信的 trace 資訊與驗證結果。

你也可以在每一封信的原始資訊中看見驗證結果：

#[DMARC 驗證結果](/img/posts/crystal/email-sec-theory/dmarc-result.png)

如果今天 gmail.com 設置了 SPF、DKIM、DMARC 紀錄，那爺爺的 email server 在驗證時就會發現雖然表弟的 SPF、DKIM 驗證通過了，但是`header.From`寫的 gmail.com 跟`smtp.MailFrom`還有 DKIM signature 中 `d` 標籤寫的 cousin.com 對不起來，因此判斷為驗證失敗，爺爺因此又平安度過了一天！

---

## 結論

讀到這裡，大家是否更加了解對 email security 有哪些威脅與防護機制了呢？我們從一封郵件的旅程介紹傳輸過程中的各種角色與職責，也透過三個情境讓大家認識 SPF、DKIM、DMARC 這些防護的用意與效果。有了這三劍客，我們就不用擔心信件被篡改、仿造、或是從未經授權的地方寄出了。近來 email security 意識抬頭，DMARC 也名列 Gartner 十大資安主題排行榜喔！

不過其實這些機制還有很多不足的地方，例如：中繼 email server 是可以冒充的嗎？是誰控制的？如果 `smtp.MailFrom` 跟 `header.From` 不同的時候（例如合理使用 forwarding 功能）不就完蛋了嗎？在沒有這些機制以前是如何防治釣魚的；有了三劍客以後還有哪些機制可以補強呢？

這些耐人尋味的問題，我們留待之後更深入探討。下一篇，我們先來看看三劍客到底如何設置，以及有哪些容易出錯的小地方～

附帶一提，為了讓使用者可以更輕易的從寄信人的頭貼辨識出是不是『正身』，有另一個叫做 BIMI 的機制是用來驗證頭貼的哦！不過目前 BIMI 還不是很普及，有興趣的朋友可以再去了解。

### References:

1.  [Internet Mail Architecture](https://bbiw.net/specifications/draft-crocker-email-arch-03.html#Users)
2.  [Mail terminology](https://afreshcloud.com/sysadmin/mail-terminology-mta-mua-msa-mda-smtp-dkim-spf-dmarc)
3.  [SPF RFC](https://datatracker.ietf.org/doc/html/rfc7208)
4.  [DKIM RFC](https://datatracker.ietf.org/doc/html/rfc6376#section-5)
5.  [DMARC RFC](https://datatracker.ietf.org/doc/html/rfc7489)
6.  [DMARC.org](https://dmarc.org/)
7.  [Gartner](https://www.gartner.com/smarterwithgartner/gartner-top-security-projects-for-2020-2021/)
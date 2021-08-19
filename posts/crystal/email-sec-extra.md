---
title: 關於 email security 的大小事 — 延伸篇
author: crystal
date: 2021-07-23
tags: [Security]
layout: layouts/post.njk
image: /img/posts/crystal/email-sec-extra/cover.jpg
---

<!-- summary -->
<!-- 隨著前幾篇 email security 的介紹，我陸陸續續收到了一些問題，在交流的過程中覺得有一些很重要或是很有趣的討論可以更延伸探討。以下採取 Q&A 的格式，記錄一些討論與延伸知識。 -->
<!-- summary -->

隨著前幾篇 email security 的介紹，我陸陸續續收到了一些問題，在交流的過程中覺得有一些很重要或是很有趣的討論可以更延伸探討。
不過因為原理篇跟設定篇希望可以聚焦在核心觀念上避免主題太發散，所以決定另外開一篇來聊聊這些東西。

篇幅上會採取 Q&A 的格式，記錄一些討論與延伸知識。若資訊有誤請不吝指正，也歡迎大家提問，讓這一串問答越來越齊全 XDDD

[**Q1: SPF DKIM DMARC 這些看起來都是 2014 左右才出現的，滿好奇在這之前是怎麼驗證的，還是其實完全沒驗證？**](#q1)

[**Q2: Forwarding 上一篇提到很多次，是什麼意思？跟按信件上面那個箭頭轉發信件一樣嗎？**](#q2)

[**Q3: 『中繼 email server 』也提到很多次耶，他是哪些情況會出現？有可能是任意 domain （就是跟收件者跟寄件者本身都沒什麼關係）嗎？**](#q3)

[**Q4: `smtp.MailFrom` 跟 `header.From` 可以不同，然後 alignment 又不過，那 DMARC 不就失敗嗎？**](#q4)

[**Q5: 承上，那之前提到的 ARC 怎麼解這個問題？**](#q5)

[**Q6: 常常看到 SPF 用 `~all` 而不是 `-all`，有什麼差？**](#q6)

一樣附上前幾篇的連結，建議看不懂的名詞可以回去參照原理篇：
[關於 email security 的大小事 — 原理篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-theory)

設定篇們：
[關於 email security 的大小事 — 設定篇 SPF](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-spf)
[關於 email security 的大小事 — 設定篇 DKIM、DMARC](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-dkimdmarc)
[關於 email security 的大小事 — 範例篇](https://tech-blog.cymetrics.io/posts/crystal/email-sec-examples)

---

## Q1: SPF DKIM DMARC 這些看起來都是 2014 左右才出現的，滿好奇在這之前是怎麼驗證的，還是其實完全沒驗證？{#q1}

SPF 與 DKIM 其實早在 2000 跟 2004 年左右就有在討論了，只是一直沒有訂出標準、更遑論普及，真正受到重視是在 2014 年左右，也是因為這樣才延伸出 DMARC 的。在此之前為了防範釣魚跟垃圾信件，往往都是用黑名單的方式，也就是把已經知道的某些惡意 IP 或是 mail server 列在一個黑名單裡面過濾掉。這跟現在過濾惡意 domain 的方法一樣，都是事後防範（reactive）。

---

## Q2: Forwarding 上一篇提到很多次，是什麼意思？跟按信件上面那個箭頭轉發信件一樣嗎？{#q2}

是也不是。

Forwarding 並不是在 RFC 裡定義明確的一個詞，而是我們用來泛指『轉發』這個動作的用語，負責 forwarding 的 mail server 就稱為 forwarding server 或是 **mediator**（中間人）。

技術上我會把 forwarding 狹義定義為：在信封袋上（SMTP envelope）更改收信人（`smtp.RcptTo`）但保留寄件人（`smtp.MailFrom`）的行為。與 forwarding 相對，連信封袋上的寄件人（`smtp.MailFrom`）都改寫的行為，就稱為 remailing。舉例來說，假設你有個住在國外且準備回國的朋友，又有個很想買但不外送台灣的精品包包，forwarding 就像是請朋友幫你下訂然後順便帶回來，包裹上寫的還是精品公司的名字；remailing 則是朋友收到包包後用跨國快遞寄回來，包裹上寫的是朋友的名字。

我們之前提過的 mailing list 就是一種 remailing，它的原理是由一個 mail server 維護一個負責接收信的 reflector 信箱跟訂閱者清單（subscribers），當你想要寄一封信給眾訂閱者時，可以用自己的信箱把信寄到 reflector，這樣就會觸發 mail server 把自己加到 `header.Reply-To` 跟 `smtp.MailFrom` ，再自動幫你把原信件轉發給所有訂閱者。有些 marketing email 會這麼做，或是你在一些學術討論串裡也會看到（其實就是 email 版本的聊天室）。這樣做的好處是可以自動化管理訂閱者清單、寄信人不用另外申請新的信箱、而且 mediator 可以視情況修改信件內容，例如在主旨加上標籤或是過濾文字。

回到主題，根據[維基百科](https://en.wikipedia.org/wiki/Email_forwarding)，粗略可以將 forwarding 分成 Server-based forwarding 跟 Client-based forwarding。

Client-based forwarding ，或稱 resending，又能分成自動和手動，自動的例子是有些會議軟體會允許受邀者修改時間或是會議內容等資訊，然後自動以主辦者的名義再次寄送或更新邀請給所有與會者，此時就會導致 `smtp.MailFrom` 跟 `header.From` 不相等。手動的部分就是一般人在 MUA 裡會用到的信件轉發，當我們手動按下轉發箭頭的時候，會把原信件 inline 嵌入到新信件裡，並完整保留附件以及 `header.From`、`header.Reply-To` 欄位。上述兩個例子中，其實寄件人（`smtp.MailFrom`）已經不是原本的寄件人了，所以比起 forwarding 這種行為更接近 remailing。

那 Server-based forwarding 是什麼呢？許多 mail server 提供一個功能，讓你可以任意創建信箱地址，然後連到你自己本來擁有的信箱，方便信件集中處理。這種情況又被稱作 re-addressing 或 email aliasing，也就是信箱別名，是一種非常常見的應用。

情境例如：為了讓客戶好辨認，你的公司（`candies.com`）為不同產品創建了多個客服信箱（`cookie@candies.com`、`chocolate@candies.com` 、`gummies@candies.com`），不過因為公司只有你一個客服，所以所有寄到這些信箱的信件其實都會被導到你的個人信箱，如 `jemmy88@gmail.com` 或是`jemmy01@outlook.com` 。 當然，要設定數個別名也行（你有新的客服夥伴一起處理信件啦），總之可以想成是創造一個統一對外的窗口，進來後再分發。早期的 sendmail 就是用一個檔案 `~/.forward` 來記錄這些一對多的 alias 關係再根據這些規則進行 forwarding。

或者，你讀大學的時候本來有個學校信箱，畢業之後想繼續維持這個校友地址，但學校並不想負擔信件儲存的成本，這時就能用別名的方式讓信箱地址依然存在，不過信件所有寄到校友信箱的郵件就會被 forward 到你的其他私人信箱。

不管哪個 aliasing 情境，信件本身（`header` 跟 `body`）跟信封袋上的寄件人（`smtp.MailFrom`）都是不變的。也就是說，收信人看到的內文都是原汁原味，點擊回覆的時候也是回給寄件人而不是中間 forwarding 的 mail server。雖然走過必留痕跡，forwarding 也會在原始信件中的 trace 被記錄下來，但就雙方 end user 溝通的角度而言，中間這層 forwarding 其實是隱形的。

---

## Q3:『中繼 email server 』也提到很多次耶，他是哪些情況會出現？有可能是任意 domain （就是跟收件者跟寄件者本身都沒什麼關係）嗎？{#q3}

這個問題的詳細回答可以看看上面的 Q2，『中繼 email server 』是我敘述中比較通俗的用語，指的是寄信方跟最終收信方中間的 hop，在 RFC 定義中較為正式的名字是 **mediator**，也就是中間人。

mediator 其實不能說是一台 server，而是『提供 reposting 的複合式角色』，它涵蓋了 MTA 的 relay 功能、MUA 的撰寫信件功能、以及 MDA 的地址查詢功能。mediator 也並非是固定的角色，例如一封信從 A 的 mail server 寄到 B 的 mail server，然後 B 再把信轉發到 C mail server，對 A 跟 B 而言這封信沒有經過任何 mediator，但對 C 而言 B 的 mail server 就扮演了 mediator 的角色。

回到問題，mediator 可以是外部、第三方的服務，所以當然可能是跟收件者寄件者無關的 domain。

---

## Q4: `smtp.MailFrom` 跟 `header.From` 可以不同，然後 alignment 又不過，那 DMARC 不就失敗嗎？{#q4}

是的！其實 DMARC 會失敗的情況非常多，甚至還出了一個 [RFC7960](https://datatracker.ietf.org/doc/html/rfc7960) （Interoperability Issues between Domain-based Message Authentication,  
 Reporting, and Conformance (DMARC) and Indirect Email Flows）討論呢！

Indirect Email Flows 就是間接的寄信方式，包含前面 forwarding 提過的 alias 跟 mailing list，還有很多有趣的案例：

*   當 MUA 嘗試以別人的身份寄信：有些新聞或是雜誌網站會有 “forward-to-friend” 功能，或是有些會有 “send-as” 功能。
*   有些 IoT 或嵌入式設備會用 hardcoded domain 寄信，或是以 device owner 身份寄信
*   有些 MTA 可能會修改信件內文的 encoding 或是 header 的欄位（例如日期格式），造成 DKIM 驗證錯誤
*   MDA 也可能會在過濾時使用一些修改信件的功能，例如使用 `add_header()` 跟 `delete_header()` 等函式

以上都是合理應用範圍但是 DMARC 不支援的情境，只要是有經過 mediator 轉達或是有修改到信件內容，要嘛驗證不過要嘛 alignment 不過，幾乎都會讓 DMARC 失敗。尤其大家如果都有好好設置成 `p=reject` 更是一點轉圜餘地都沒有了。

---

## Q5: 承上，那之前提到的 ARC 怎麼解這個問題？{#q5}

**ARC（Authenticated Received Chain）** 的宗旨就是為了解決 Indirect Email Flow 的問題，試圖加上更多驗證資訊讓本來準備丟掉 DMARC 失敗的信的 MDA 能重新考慮、通融一下。

ARC 在 2019 年才成為 RFC 上的文件，仍屬實驗性質（experimental），因此目前有實作與支援的廠商也不多，在我較熟知的範圍裡只有最大的 Gmail 跟 Microsoft Office 365。

### 原理

回想一下需要 ARC 的最大原因，就是因為經過 mediator 的過程中發生信件的修改更動或是來源不同，所以導致收信方認為自己拿到的『已經不是原本的信件』。但這樣多冤枉呀，信件經過 mediator 之前都是合法的，但最終是否能被收到卻只以收信方的 DMARC 驗證為主，這就像是你從台灣經過日本轉機到美國，美國海關卻打死認為你一定是日本人一樣荒謬啊！

所以追根究底，只要能夠證明『經過 mediator 前的原始信件』跟『mediator 更動的部分』都是合法的，那就沒有疑慮了吧？

因此 ARC 的運作方式，就是讓每一個 mediator 在經手信件時對信件做一次 DMARC 驗證，並將驗證結果、先前所有 hop 的 ARC 驗證結果、以及自己做的修改簽名，附在信封袋上作為擔保。每一個擔保的內容都接續著之前經過的 mediator 的擔保，因此會構成一條鏈（Authenticated Received **Chain**），假設鏈上的每個 mediator 都值得信任，那合理推論也可以相信他們所做的 DMARC 驗證結果吧！這樣當最後的終端收信 mail server 自己執行 DMARC 驗證失敗時，就可以透過 ARC 發現『啊，原來原始信件有通過 DMARC，只是中間經過了這些修改所以不一樣了呀』。

這個『附在信封袋上的擔保』就是 **ARC Set**，是包含下面三個 ARC header 的一組紀錄。

*   ARC-Authentication-Results (AAR)：『我做的 DMARC 跟 ARC 驗證』。紀錄此次 DMARC 驗證的結果以及先前每一組 ARC Set 驗證的結果。
*   ARC-Message-Signature (AMS)：『我更動的部分並署名』。類似 DKIM Signature 的簽章，內容包含原始信件的各種 header 跟 DKIM Signature，還有新增或是更動的 header。
*   ARC-Seal (AS)：『我核可信上所有的 ARC Set 並署名』。類似 DKIM Signature 的簽章，內容包含收到信件時已經紀錄的所有 ARC Set 以及剛剛新加的 AAR 跟 AMS。

ARC-Seal 的意義是什麼呢？大家可能有經驗，如果去銀行或是公家單位辦事情，在填文件的時候寫錯了，有需要塗改的地方或是新增的備註，會請你在新的資料上蓋自己的印章以茲證明。ARC-Seal 的概念就是在層層印章印上再押上自己的名字，以示『我核可了過去的這一串簽名，當然還有我自己的部分』。

### 來個範例

下面是一封原始信件的 ARC Set。所有的 header 都是用 stack 的方式紀錄，所以最先加的是紫色的 AAR ，再來是藍色的 AMS，最後是紅色的 AS。

#[ARC set from onedegree.hk to gmail](/img/posts/crystal/email-sec-extra/arc-set.png)

首先可以注意到的是，三個 header 中都由一樣的 `i` 標籤開始，這是一個類似 nonce、counter、或 ID 的數字，代表是第幾個經過的 mediator，從 1 開始累加。 所以假設我是收到上面這封信的 mediator，我要新增的 ARC Set 就都會標示 `i=2`。

再來分別看看各個 header。紫色的 AAR 就是一般的 DMARC 驗證結果，可以看到最後是 `pass`。藍色的 AMS 幾乎跟 DKIM Signature 一樣，淡藍色的框是新增的 header，最末是原始信件的 DKIM Signature。紅色的 AS 也類似類似 DKIM Signature，但只簽 ARC Set 所以沒有 `h`、`bh` 等標籤。

最重要的是 `cv` ，代表 **C**hain **V**alidation Status，也就是這條鏈的驗證結果。每一個 mediator 的 `cv`會根據前一個 mediator 紀錄的 `cv` 以及各個 ARC Set 的驗證結果決定。當一個 mediator 得出 fail 的結論，他就會停止演算法並標記 `cv=fail`，且加入的 AS 只會簽署當前新增的 ARC Set，等同打斷這條鏈並將發生錯誤的 ARC Set 視為唯一一組 ARC Set。此後的 mediator 一看到 `cv=fail` 就會停下不做任何驗證，也不會新增 ARC Set。

因為圖中是第一個 mediator（`i=1`）所以 `cv=none`，畢竟鏈正要開始當然沒有東西可以做 Validation。 另外這裡沒有標示，但是後續的 AAR 會有一個 `arc=` 的標籤，會根據先前每個 ARC Set 中的 AMS 跟 AS 做驗證，確保鏈的完整性沒有被破壞。

例如下圖（取自 RFC ）就是經過三個 mediator 的情況，只看螢光字的 `arc=`，你會發現 `i=2` 的 mediator 驗證了 `i=1` 的 AMS 跟 AS，然後 `i=3` 的 mediator 驗證了 `i=1,2` 的 AMS 跟 AS。

你可能會疑問，為什麼在 `i=3` 的 mediator 那裡有一個 `fail` 還是得出 `arc=pass` 的結論呢？

因為 `i=2` 的 mediator 對信件進行了修改，所以到 `i=3` 的 mediator 這裡時信件的 hash 已經不符合 `ams.1` 解密後的結果了。但是因為符合 `ams.2`，所以可以推論信件除了 `i=2` 的 mediator 之外沒有被其他人動過。既然前一個 `ams.2` 跟所有的 `as` 都過了，這條鏈是沒有問題的，給 `cv=pass`！

```text/11-13,31
ARC-Seal: i=3; a=rsa-sha256; cv=pass; d=clochette.example.org; 
    s=clochette; t=12345;b=CU87XzXlNlk5X/yW4l73UvPUcP9ivwYWxyBWc  
    VrRs7+HPx3K05nJhny2fvymbReAmOA9GTH/y+k9kEc59hAKVg==  
ARC-Message-Signature: i=3; a=rsa-sha256; c=relaxed/relaxed; d=  
    clochette.example.org; h=message-id:date:from:to:subject; s=  
    clochette; t=12345;bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZY  
    LQ=;b=o71vwyLsK+Wm4cOSlirXoRwzEvi0vqIjd/2/GkYFYlSd/GGfKzkAgPqx  
    fK7ccBMP7Zjb/mpeggswHjEMS8x5NQ==  
ARC-Authentication-Results: i=3; clochette.example.org; spf=fail  
    smtp.from=jqd@d1.example; dkim=fail (512-bit key)  
    header.i=@d1.example; dmarc=fail; 
    arc=pass (as.2.gmail.example=pass,  
    ams.2.gmail.example=pass, as.1.lists.example.org=pass,  
    ams.1.lists.example.org=fail (message has been altered))  
Authentication-Results: clochette.example.org; spf=fail  
    smtp.from=jqd@d1.example; dkim=fail (512-bit key)  
    header.i=@d1.example; dmarc=fail; 
    arc=pass (as.2.gmail.example=pass,  
    ams.2.gmail.example=pass, as.1.lists.example.org=pass,  
    ams.1.lists.example.org=fail (message has been altered))  
ARC-Seal: i=2; a=rsa-sha256; cv=pass; d=gmail.example; s=20120806;  
    t=12345; b=Zpukh/kJL4Q7Kv391FKwTepgS56dgHIcdhhJZjsalhqkFIQ  
    QAJ4T9BE8jjLXWpRNuh81yqnT1/jHn086RwezGw==  
ARC-Message-Signature: i=2; a=rsa-sha256; c=relaxed/relaxed; d=  
    gmail.example; h=message-id:date:from:to:subject;s=20120806;   
    t=12345; bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZYLQ=;  
    b=CVoG44cVZvoSs2mMig2wwqPaJ4OZS5XGMCegWqQs1wvRZJS894tJM0xO1  
    RJLgCPsBOxdA59WSqI9s9DfyKDfWg==  
ARC-Authentication-Results: i=2; gmail.example; spf=fail  
    smtp.from=jqd@d1.example; dkim=fail (512-bit key)  
    header.i=@example.org; dmarc=fail; 
    arc=pass (as.1.lists.example.org=pass, ams.1.lists.example.org=pass)  
ARC-Seal: i=1; a=rsa-sha256; cv=none; d=lists.example.org; s=dk-   
    lists; t=12345; b=TlCCKzgk3TrAa+G77gYYO8Fxk4q/Ml0biqduZJeOYh6+  
    0zhwQ8u/lHxLi21pxu347isLSuNtvIagIvAQna9a5A==  
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=  
    lists.example.org; h=message-id:date:from:to:subject; s=dk-    
    lists; t=12345; bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZYL  
    Q=; b=DsoD3n3hiwlrN1ma8IZQFgZx8EDO7Wah3hUjIEsYKuShRKYB4LwGUiKD5Y  
    yHgcIwGHhSc/4+ewYqHMWDnuFxiQ==  
ARC-Authentication-Results: i=1; lists.example.org; spf=pass  
    smtp.mfrom=jqd@d1.example; dkim=pass (512-bit key)  
    header.i=@d1.example; dmarc=pass
```

### 小結

雖然 ARC 用數位簽章的方式做擔保，看似解決了 Indirect Mail Flow 的問題，但他並不是萬靈丹。畢竟 ARC 只是提供更多資訊讓最終收信端可以看到中間『隱形的部分』，並不能保證每一個經過的 mediator 都是值得信任的。

再者，對 mail server 而言 ARC 只是參考指標（MAY … consult … ARC），無論結果如何，mail server 都可以只採用本身 DMARC 驗證的結果決定信件去留，並不一定要採納 ARC。

關於 ARC 的許多細節都還有待討論，未來也許會加入其他規範讓這個機制更加完整，更多資訊可以參考 [ARC-spec](http://arc-spec.org) 跟 [RFC8617](https://datatracker.ietf.org/doc/html/rfc8617)。

---

## Q6: 常常看到 SPF 用 `~all` 而不是 `-all`，有什麼差？{#q6}

前面在 SPF 設定篇提過有四種 qualifier，這邊貼過來一遍：

*   `pass(+)`：若對到 sender-ip，結果 pass（即白名單）。預設值，可以省略（ `+all` 同 `all`）
*   `neutral(?)`：None ，等同沒有 policy。
*   `softfail(~)`：若對到 sender-ip，結果 fail，仍要標注並接受。
*   `fail(-)`：若對到 sender-ip，結果 fail（即黑名單）。

其中，對 `all` 機制而言最常出現的是 `softfail(~all)` 跟 `fail(-all)`。單以 SPF 來說，這兩個的區別明顯就是指示收信的 mail server『雖然我們都是 fail，但請保留 softfail 的』。不過在有設定跟使用 DMARC 的情況下，最後 MDA 只會根據 DMARC 判定的 policy 來決定採取的行為，因為 `softfail` 跟 `fail` 都對 DMARC 給出了 fail 的結果，所以他們其實是等價的。只有在單獨使用 SPF 驗證的時候，`softfail` 跟 `fail` 的差別才會造成影響。

---

## References:

1.  [Email Forwarding — Wikipedia](https://en.wikipedia.org/wiki/Email_forwarding)
2.  [RFC7960](https://datatracker.ietf.org/doc/html/rfc7960#section-2)
3.  [RFC5598](https://datatracker.ietf.org/doc/html/rfc5598#section-5)
4.  [RFC8617](https://datatracker.ietf.org/doc/html/rfc8617)
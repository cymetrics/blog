---
title: XSS 從頭談起：歷史與由來
date: 2021-10-11
tags: [Security, Front-end]
author: huli
layout: zh-tw/layouts/post.njk
---

我以前有寫過一些關於 XSS 的文章，主要在談的是實作面的防範以及防禦的各個細節：

1. [防止 XSS 可能比想像中困難](https://tech-blog.cymetrics.io/posts/huli/prevent-xss-might-be-harder-than-you-thought/)
2. [淺談 XSS 攻擊與防禦的各個環節](https://tech-blog.cymetrics.io/posts/huli/xss-attack-and-defense/)

<!-- summary -->
這篇原本想寫的是 XSS 的基礎，就大家都聽過的那三種類別：Stored(Persistent)、Reflected(Non-Persistent) 以及 DOM-based XSS，但當我正要開始寫的時候，腦中突然浮現了幾個問題：「XSS 是什麼時候出現的？這三種類別又是什麼時候開始被分類的？」

因此，我花了點時間找了一些資料，這篇文章會跟大家談談 XSS 的歷史，讓我們一起更了解 XSS 的前世今生。
<!-- summary -->

## XSS 的誕生

從微軟的 MSDN blog 在 2009 年 12 月發佈的文章標題：[Happy 10th birthday Cross-Site Scripting!](https://web.archive.org/web/20100723152801/http://blogs.msdn.com/b/dross/archive/2009/12/15/happy-10th-birthday-cross-site-scripting.aspx) 中就可以看出 XSS（Cross-Site Scripting）這個名詞約莫是 1999 年 12 月誕生的，離現在已經 20 幾年了。

（下圖為上面連結的截圖）

![xss-history](/img/posts/huli/xss-history/xss-10years.png)

原文最後有這麼一段話：

> Let's hope that ten years from now we'll be celebrating the death, not the birth, of Cross-Site Scripting!

很遺憾的，2009 年的 10 年後，也就是 2019 年，XSS 依舊持續活躍著，在 2017 年的 OWASP top 10 排在第七名，2021 的版本則併入第三名 Injection 的類別。

而文中提到的：[CERT® Advisory CA-2000-02 Malicious HTML Tags Embedded in Client Web Requests](https://web.archive.org/web/20100516115740/http://www.cert.org/advisories/CA-2000-02.html)，可以讓我們一窺最早期 XSS 的面貌。底下就讓我們簡單看一下這個網頁的內容：

> A web site may inadvertently include malicious HTML tags or script in a dynamically generated page based on unvalidated input from untrustworthy sources. This can be a problem when a web server does not adequately ensure that generated pages are properly encoded to prevent unintended execution of scripts, and when input is not validated to prevent malicious HTML from being presented to the user.

在 Overview 的部分其實就把 XSS 的核心概念講得非常清楚了，server 沒有驗證輸入或是編碼，導致攻擊者可以插入一些惡意的 HTML 標籤或是 script。

> Malicious code provided by one client for another client
> 
> Sites that host discussion groups with web interfaces have long guarded against a vulnerability where one client embeds malicious HTML tags in a message intended for another client. For example, an attacker might post a message like `Hello message board. This is a message.<SCRIPT>malicious code</SCRIPT>This is the end of my message.`
> 
> When a victim with scripts enabled in their browser reads this message, the malicious code may be executed unexpectedly. Scripting tags that can be embedded in this way include `<SCRIPT`> `<OBJECT>`, `<APPLET>`, and `<EMBED>`.
> 
> When client-to-client communications are mediated by a server, site developers explicitly recognize that data input is untrustworthy when it is presented to other users. Most discussion group servers either will not accept such input or will encode/filter it before sending anything to other readers.

這一段則是後來被稱為「Stored XSS（也稱為 Persistent XSS）」的分類，假設有一個討論區可以讓人留言，一個惡意的攻擊者可以留這樣的內容：

``` html
Hello message board. This is a message.
<SCRIPT>malicious code</SCRIPT>
This is the end of my message.
```

當其他使用者看到這篇留言的時候，因為留言裡面有 `<script>` ，所以就會執行攻擊者所留下的 JavaScript 程式碼。

除了這個以外，`<object>`、`<applet>` 跟 `<embed>` 也都可以用來執行 JavaScript（話說 applet 這標籤應該已經沒用了，可參考：[Don’t break the Web：以 SmooshGate 以及 keygen 為例 ](https://blog.huli.tw/2019/11/26/dont-break-web-smooshgate-and-keygen/)）。

> Malicious code sent inadvertently by a client for itself
> 
> Many Internet web sites overlook the possibility that a client may send malicious data intended to be used only by itself. This is an easy mistake to make. After all, why would a user enter malicious code that only the user will see?
> 
> However, this situation may occur when the client relies on an untrustworthy source of information when submitting a request. For example, an attacker may construct a malicious link such as `<A HREF="http://example.com/comment.cgi? mycomment=<SCRIPT>malicious code</SCRIPT>"> Click here</A>`
> 
> When an unsuspecting user clicks on this link, the URL sent to example.co includes the malicious code. If the web server sends a page back to the user including the value of mycomment, the malicious code may be executed unexpectedly on the client. This example also applies to untrusted links followed in email or newsgroup messages.

這一段就很有趣了，標題是：「Malicious code sent inadvertently by a client for itself」，發送的內容基本上只有自己能看到。

例如說網址中 mycomment 這個參數會反映到畫面上，所以像是 `http://example.com/comment.cgi?mycomment=123`，畫面上面就會出現 123。

但只有自己能看到能做什麼呢？

因為是透過網址上的 query string 來傳遞資訊，因此可以產生這樣的一個連結：`http://example.com/comment.cgi?mycomment=<SCRIPT>malicious code</SCRIPT>`，接著再把這個連結傳給其他人，當其他人點了以後，畫面上就會出現 `<SCRIPT>malicious code</SCRIPT>`，照樣達成 XSS。

這就是 XSS 的另外一種分類：Reflected XSS，你的輸入會反映在畫面上。

而這兩種的差別在於 Stored XSS 就像它的名字一樣，XSS payload 是被保存住的，以討論區來說，文章是保存在資料庫中的，而 Reflected XSS 則不然。

以 PHP 為例，Reflected XSS 的程式碼可能會像這樣：

``` php
<?php
   $comment = $_GET['comment'];
?>
<div>
    <?= $comment ?>
</div>
```

把 GET 的參數直接反映在畫面上，所以每一次都必須透過 comment 這個參數把 payload 傳進去，否則不會觸發 XSS。

以上面提的「討論區」這個網站為例，Stored XSS 的破壞力應該是更強大的，因為只要點進去你這篇文章就會中招，可以想成你在 ptt 發了一篇文章，只要有鄉民點進來文章就會被攻擊，還滿容易觸發的。

但 Reflected XSS 就不太一樣了，這需要使用者點擊連結才會出事，像是你在 ptt 推文留了一個連結，鄉民要主動點那個連結才能觸發 XSS。

文中的其他部分也很有趣，例如說也有提到僅管把 JavaScript disabled，依然可以用 HTML 與 CSS 去竄改畫面等等，也有提到修補方式，在這邊：[Understanding Malicious Content Mitigation for Web Developers](https://web.archive.org/web/20100527204457/http://www.cert.org/tech_tips/malicious_code_mitigation.html)

修補方式除了我們熟悉的針對內容編碼以外，還有另一個是要「指定編碼方式」，這邊的編碼指的是 UTF-8 或是 ISO-8859-1 以及 big5 這種編碼。雖然說現在這個年代絕大部分網站都是 UTF-8 了，但早期其實不然。在以往瀏覽器還支援像是 UTF-7 這樣的編碼方式，就算不用一些特殊字元也可以達成 XSS：

``` html
<html>
<head><title>test page</title></head>
<body>
  +ADw-script+AD4-alert(1)+ADw-/script+AD4-
</body>
</html>
```

範例取自：[XSS 和字符集的那些事兒](https://wooyun.js.org/drops/XSS%E5%92%8C%E5%AD%97%E7%AC%A6%E9%9B%86%E7%9A%84%E9%82%A3%E4%BA%9B%E4%BA%8B%E5%84%BF.html)，裡面有提到更多這種類似的問題，但大多數問題應該都發生在比較早期的瀏覽器上面。

## 第三種 XSS 分類的誕生

有看過 XSS 文章的人都知道，最廣為人知的 XSS 分類大概就三種：

1. Stored XSS（Persistent XSS）
2. Reflected XSS（Non-Persistent XSS）
3. DOM-based XSS

再繼續往下之前，我先來問問看大家兩個問題。

第一個問題，假設現在我發了一篇文章，內容為 `<img src=x onerror=alert(1)>`，而顯示文章的頁面程式碼是這樣的：

``` html
<script>
  getPost({ id: 1}).then(post => {
    document.querySelector('.article').innerHTML = post.content
  })
</script>
```

因為用了 innerHTML 的緣故，所以就有了一個 XSS 漏洞，在這個狀況之下，我的留言確實有「保存」在資料庫，但也同時用了 DOM 去改變內容，那這個 XSS 應該被歸類在 Stored XSS，還是 DOM-based XSS？

第二個問題，假設網頁中有一段程式碼長這樣：

``` html
<script>
  document.querySelector(".search").innerHTML = decodeURIComponent(location.search)
</script>
```

這顯然可以透過 query string 製造出一個 XSS 漏洞，這個 XSS 確實反映了使用者的輸入，而且沒有被儲存在資料庫裡面，不過卻是用 DOM 去改變內容，那它應該是 Reflected XSS，還是 DOM-based XSS？

在繼續往下閱讀之前，大家可以先想一下上面這兩個問題。

先來講講我以前的答案，我之前是用下面的定義來分類這幾個的：

1. 我的 XSS payload（例如說 `<script>alert(1)</script>`）如果有存在資料庫，那就是 Stored XSS
2. 如果不是，那就看我的 payload 是直接從後端輸出，還是透過 DOM 去賦值，前者就是 Reflected，後者就是 DOM-based

後來我才發現這個分類方式是錯誤的，因為我被「stored」這個名詞誤導了，沒有意識到這背後的歷史背景。

這是什麼意思呢？在 1999 年 XSS 剛出來的時候，Ajax 還不存在（它是 2005 年才誕生的），所以前後端的資料交換應該都是透過表單送去 Server，並且直接把回應 render 出來。

換句話說，在 1999 年的時候，基本上沒有什麼操作是用 JavaScript 去更改畫面內容的，就算有，也是一些比較無關緊要的操作。但在 2021 年都不一樣了，在這個 SPA 盛行的年代，基本上都是透過 JavaScript 去呼叫 API，拿到資料以後再去更改畫面，後端只負責提供資料，前端靠著 JavaScript 來 render，這跟 20 年前完全不同。

XSS 的三種分類之中，前兩種 Stored 以及 Reflected 在 XSS 誕生之時就已經存在了，而第三種則晚了五年才出現（這邊的「出現」指的是有個名詞或分類來定義它，而不是指攻擊出現），出處應該是這一篇：[DOM Based Cross Site Scripting or XSS of the Third Kind](http://www.webappsec.org/projects/articles/071105.shtml)

文中的 Introduction 有這樣一個段落：

>  XSS is typically categorized into “non-persistent” and “persistent” (“reflected” and “stored” accordingly, as defined in [4]). “Non-persistent” means that the malicious (Javascript) payload is echoed by the server in an immediate response to an HTTP request from the victim. “Persistent” means that the payload is stored by the system, and may later be embedded by the vulnerable system in an HTML page provided to a victim.

重點是 Stored 跟 Reflected 這兩個分類都有一個前提：「payload 是由後端直接 render 的」，而這篇文章所提到的第三個分類 DOM-based，指的則是「payload 是由前端 render 出來的」，這就是第三種與前兩種的最大差異。

在判別 XSS 的時候，應該先確認的其實是「payload 是前端還是後端 render？」，如果是前端 render 出來，不論資料從哪裡來（從資料庫或是網址或任何地方都可以），就是 DOM-based XSS。如果是後端 render 出來，才去區分是 Stored 還是 Reflected。

因此，剛剛那兩個問題因為都是前端 render 的關係，都會被歸類在 DOM-based XSS。

上面的文章中就有舉一個類似的例子：

``` html
<HTML>
<TITLE>Welcome!</TITLE>
Hi
<SCRIPT>
var pos=document.URL.indexOf("name=")+5;
document.write(document.URL.substring(pos,document.URL.length));
</SCRIPT>
<BR>
Welcome to our system
…
</HTML>
```

在文章的註解中還特別提到了：

> The malicious payload was not embedded in the raw HTML page at any time (unlike the other flavors of XSS).

因為 payload 其實不存在於任何 HTML page（因為是後來才用 JavaScript 改變的），所以它不屬於 Stored 也不屬於 Reflected，是第三種新的類型的 XSS。

至於修補方式的話，由於是在前端用 JavaScript render，所以編碼的工作當然就是前端的開發者要負責，一個常見的方式是這樣（程式碼取自：[Sanitizing user input before adding it to the DOM in Javascript](https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript)）：

``` js
function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}
```

但有一點要特別注意，那就是並不是這樣就萬事👌👌了，XSS 的防禦比較麻煩的點是要針對不同情境做處理，如同 [OWASP: Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) 中有提到的，如果你的輸出是要放到 `<a href="">` 裡面的話，需要考慮到 `javascript:alert(1)` 這種形式的 payload，這時候上面的 sanitize function 就沒有用了。

## 結語

其實一開始會發現分錯，是因為在 [HITCON ZeroDay](https://zeroday.hitcon.org/) 平台上所回報的漏洞分類被改變，才讓我意識到自己對於這幾種的分法理解錯誤，在這邊也感謝負責審查的工作人員。

除了這幾種分法以外，其實也有其他種的分類方式，例如說使用者需要自己輸入 XSS payload 的 Self XSS，或者是利用 HTML 解析不一致而達成的 Mutation XSS 等等，其實都是 XSS 很有趣的應用，以後有機會再來跟大家分享。


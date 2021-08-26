---
title: 不識廬山真面目：Clickjacking 點擊劫持攻擊
date: 2021-08-26
tags: [Security, Front-end]
author: huli
layout: layouts/post.njk
---

## 前言

<!-- summary -->
在針對前端的各種攻擊手法之中，我覺得 clickjacking 是相當有趣的一個。它的中文翻譯通常翻成「點擊劫持」，實際上的意思是你以為點了 A 網頁的東西，其實卻是點到了 B 網頁，惡意網頁劫持了使用者的點擊，讓使用者點到意料之外的地方。
<!-- summary -->

只是一個點擊而已，這樣會有什麼危害嗎？

假設在背後的是一個銀行轉帳頁面，而且帳號跟金額都填好了，只要按一個按鈕就會轉錢出去，這樣的話危害就很大了（不過這通常不太可能啦，因為轉帳還需要輸入 OTP 之類的，這只是舉例）。

或是舉個更常見的例子，例如說有個乍看之下是取消訂閱電子報的頁面，於是你點了「確定取消」的按鈕，但其實底下藏著的是 Facebook 的按讚鈕，所以你不但沒有取消訂閱，還被騙了一個讚（因為劫持的目標是讚，所以又稱為 likejacking）。

這篇文章我會介紹 clickjacking 的攻擊原理、防禦方式以及實際案例，讓大家更了解這個攻擊手法。

## Clickjacking 攻擊原理

Clickjacking 的原理就是把兩個網頁疊在一起，透過 CSS 讓使用者看見的是 A 網頁，但點到的卻是 B 網頁。

以比較技術的講法來說，就是用 iframe 把 B 網頁嵌入然後設透明度 0.001，再用 CSS 把自己的內容疊上去，就大功告成了。

我覺得 clickjacking 直接看範例是最有趣的，因此做了一些簡單的範例。

底下這個範例可以先點擊「確定取消」的按鈕，然後再點「切換透明度」，就可以看到背後其實是修改個人資料的頁面以及刪除帳號的按鈕：

<iframe src="https://aszx87410.github.io/demo/clickjacking/" width="320" height="430"></iframe>

所以我以為我點了「確定取消」，但實際上點到的卻是「刪除帳號」，這就是 clickjacking。

上面的 iframe 如果打不開，可以去這邊玩：[clickjacking 範例](https://aszx87410.github.io/demo/clickjacking/)。

有些人可能會覺得這個範例太過簡單，實際應用中可能很少出現這種這麼簡單的攻擊，只要按一個按鈕而已，或許更多網站會更複雜一點，例如說要先輸入一個什麼東西？

底下這個範例以「更改 email」這個功能來設計 clickjacking，比起前一個範例是整個網頁蓋過去，這個範例刻意留下原網頁的 input，其他都用 CSS 蓋掉，按鈕的部分用 `pointer-events:none` 讓事件穿透。

看似是一個輸入 email 訂閱資訊的網頁，但按下確定之後卻跳出「修改 email 成功」，因為背後其實是個修改 email 的網頁：

<iframe src="https://aszx87410.github.io/demo/clickjacking/adv.html" width="340" height="450"></iframe>

上面的範例沒看到的話，可以去這邊玩：[進階 clickjacking 範例](https://aszx87410.github.io/demo/clickjacking/adv.html)。

除此之外，我也有在[最新的跨瀏覽器攻擊手法：Clickjacking](https://blog.miniasp.com/post/2008/10/11/The-latest-cross-browser-exploit-Clickjacking) 這篇裡面看到一個很有趣的範例：[假遊戲真劫持（YouTube 影片）](https://www.youtube.com/watch?v=gxyLbpldmuU)，看似是遊戲但其實只是為了讓你去點按鈕，超級有趣！

寫到這邊，幫 clickjacking 做個總結，這個攻擊手法大概就是：

1. 把目標網頁嵌入惡意網頁之中（透過 iframe 或其他類似標籤）
2. 在惡意網頁上用 CSS 把目標網頁蓋住，讓使用者看不見
3. 誘導使用者前往惡意網頁並且做出操作（輸入或點擊等等）
4. 觸發目標網頁行為，達成攻擊

因此實際上攻擊的難易度，取決於你的惡意網站設計得怎麼樣，以及目標網頁的原始行為需要多少互動。舉例來說，點擊按鈕就比輸入資訊要容易得多。

然後還要提醒一點，這種攻擊要達成，使用者要先在目標網站是登入狀態才行。只要能把目標網頁嵌入惡意網頁之中，就會有 clickjacking 的風險。

## Clickjacking 防禦方式

如同前面所述，只要能被其他網頁嵌入就會有風險，換句話說，如果沒辦法被嵌入，就不會有 clickjacking 的問題了，這就是解決 clickjacking 的方式。

一般來說點擊劫持的防禦方式可以分為兩種，一種是自己用 JavaScript 檢查，另一種是透過 response header 告知瀏覽器這個網頁是否能被嵌入。

### Frame busting

有一種叫做 frame busting 的方式，就是我前面提到的自己用 JavaScript 檢查，原理很簡單，程式碼也很簡單：

``` js
if (top !== self) {
  top.location = self.location
}
```

每一個網頁都有自己的 window object，而 `window.self` 指向的會是自己的 window，那 top 的話就是 top window，可以想成是這整個瀏覽器的「分頁」最上層的 window。

如果今天是被獨立開啟的網頁，那 top 跟 self 就會指向同一個 window，但如果今天網頁是被鑲在 iframe 裡面，top 指的就會是使用 iframe 的那個 window。

舉個例子好了，假設今天我在 localhost 有個 index.html，裡面寫著：

```html
<iframe src="https://example.com"></iframe>
<iframe src="https://onedegree.hk"></iframe>
```

那關係圖就會是這樣：

![window 關係圖](/img/posts/huli/clickjacking-intro/top.png)

綠色跟黃色分別是兩個以 iframe 載入的網頁，也就是兩個不同的 window，在這兩個網頁裡面如果存取 `top` 的話，就會是 `localhost/index.html` 的 window object。

所以透過 `if (top !== self)` 的檢查，就可以知道自己是不是被放在 iframe 裡面。如果是的話，就改變 top.location，把最上層的網頁導向其他地方。

聽起來很美好而且沒什麼問題，但其實會被 iframe 的 `sandbox` 屬性繞過。

iframe 可以設置一個屬性叫做 `sandbox`，代表這個 iframe 的功能受到限制，如果要把限制打開必須明確指定，可以指定的值包括：

1. allow-forms，允許提交表單
2. allow-scripts，允許執行 JS
3. allow-top-navigation，允許改變 top location
4. allow-popups，允許彈出視窗

（還有一大堆，詳情可參考 [MDN: iframe](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe)）

也就是說，如果我是這樣載入 iframe 的：

``` html
<iframe src="./busting.html" sandbox="allow-forms allow-scripts">
```

那就算 busting.html 有上面我說的那個防護也沒有用，因為 JavaScript 不會執行，所以那段 script 就不會跑到，但 user 還是可以正常 submit 表單。

於是就有人提出了更實用的方法，在現有基礎上做一些改良（程式碼取自：[Wikipedia - Framekiller](https://en.wikipedia.org/wiki/Framekiller)）：

``` html
<style>html{display:none;}</style>
<script>
   if (self == top) {
       document.documentElement.style.display = 'block'; 
   } else {
       top.location = self.location; 
   }
</script>
```

先把網頁整個藏起來，一定要執行 JS 才能開啟，所以用上面的 sandbox 阻止 script 執行的話，就只會看到一個空白的網頁；如果不用 sandbox 的話，JS 的檢查不會過，所以還是看到一片空白。

雖然說這樣可以做到比較完全的防禦，但也有缺點存在。這個缺點就是，如果使用者把 JS 功能關掉的話，他就什麼都看不到了。所以對於把 JS 功能關閉的使用者來說，體驗還滿差的。

clickjacking 早期出來的時候（2008 年）可能相關防禦還沒有這麼完全，所以只好用這些方案，但在現今 2021 年，瀏覽器已經支援了其他更好的方式來阻擋網頁被嵌入。

### X-Frame-Options

這個 HTTP response header 在 2009 年時首先由 IE8 實作，接著其他瀏覽器才跟上，在 2013 年時才變成了完整的 [RFC7034](https://www.rfc-editor.org/rfc/rfc7034.txt)。

這個 header 會有底下這三種值：

1. X-Frame-Options: DENY
2. X-Frame-Options: SAMEORIGIN
3. X-Frame-Options: ALLOW-FROM https://example.com/

第一種就是拒絕任何網頁把這個網頁嵌入，包含 `<iframe>`, `<frame>`, `<object>`, `<applet>`, `<embed>` 這些 tag 都不行。

第二個則是只有 same origin 的網頁可以，最後一個則是只允許特定的 origin 嵌入，除此之外其他的都不行（只能放一個值不能放列表，所以如果要多個 origin，要像 CORS header 那樣在 server 動態調整輸出）。

在 RFC 裡面還有特別提到最後兩種的判定方式可能跟你想的不一樣，每個瀏覽器的實作會有差異。

例如說有些瀏覽器可能只檢查「上一層」跟「最上層」，而不是每一層都檢查。這個「層」是什麼意思呢？因為 iframe 理論上可以有無限多層嘛，A 嵌入 B 嵌入 C 嵌入 D...

如果把這關係化為類似 html tag 的話，會長得像這樣：

```
<example.com/A.html>
  <attacker.com>
    <example.com/B.html>
        <example.com/target.html>
```

對於最內層的 target.html 來說，如果瀏覽器只檢查上一層（B.html）跟最上層（A.html）的話，那儘管設置成 `X-Frame-Options: SAMEORIGIN`，檢查還是會通過，因為這兩層確實是相同的 origin。但實際上，中間卻夾了一個惡意網頁在裡面，所以還是有被攻擊的風險。

除此之外 `X-Frame-Options` 還有第二個問題，就是 `ALLOW-FROM` 的支援度不好，可以參考底下來自 [caniuse](https://caniuse.com/?search=X-Frame-Options) 的表格，黃色的都是不支援 `ALLOW-FROM` 的：

![](/img/posts/huli/clickjacking-intro/caniuse.png)

`X-Frame-Options` 最前面的 `X` 說明了它比較像是一個過渡時期的東西，在未來新的瀏覽器當中，它的功能會被 CSP（Content Security Policy）給取代，並且把上面提到的問題解決。

### CSP: frame-ancestors

在之前的文章：[淺談 XSS 攻擊與防禦的各個環節](https://tech-blog.cymetrics.io/posts/huli/xss-attack-and-defense/)裡面我有稍微講了一下 CSP 這個東西，基本上就是告訴瀏覽器一些安全性相關的設置，其中有一個屬性是 `frame-ancestors`，設定起來會像這樣：

1. Content-Security-Policy: frame-ancestors 'none'
2. Content-Security-Policy: frame-ancestors 'self'
3. Content-Security-Policy: frame-ancestors https://a.example.com https://b.example.com

這三種剛好對應到了之前 X-Frame-Options 的三種：DENY, SAMEORIGIN 以及 ALLOW-FROM（但這次有支援多個 origin 了）。

先講一個可能會被搞混的地方，`frame-ancestors` 限制的行為跟 X-Frame-Options 一樣，都是「哪些網頁可以把我用 iframe 嵌入」，而另外一個 CSP 規則 `frame-src` 則是：「我這個網頁允許載入哪些來源的 iframe」。

例如說我在 index.html 設一個規則是 `frame-src: 'none'`，那 index.html 裡面用 `<iframe>` 載入任何網頁都會被擋下來，不管那個網頁有沒有設置任何東西。

再舉個例子，我的 index.html 設置成：`frame-src: https://example.com`，但是 example.com 也有設置：`frame-ancestors: 'none'`，那 index.html 還是沒有辦法用 iframe 把 example.com 載入，因為對方拒絕了。

總而言之，`frame-src` 是「跟我交往好嗎？」，`frame-ancestors` 則是對於這個請求的回答。我可以設置成 `frame-ancestors: 'none'`，代表任何人來跟我告白我都說不要。瀏覽器要成功顯示 iframe，要兩方都同意才行，只要其中一方不同意就會失敗。

另外，值得注意的是 frame-ancestors 是 CSP level2 才支援的規則，在 2014 年年底才漸漸開始被主流瀏覽器們所支援。

### 防禦總結

因為支援度的關係，所以建議 `X-Frame-Options` 跟 CSP 的 `frame-ancestors`一起使用，若是你的網頁不想被 iframe 載入，記得加上 HTTP response header：

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

若是只允許被 same origin 載入的話，設置成：

```
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self'
```

如果要用 allow list 指定允許的來源，則是：

```
X-Frame-Options: ALLOW-FROM https://example.com/
Content-Security-Policy: frame-ancestors https://example.com/
```

## 實際案例

接著我們來看一些實際的 clickjacking 案例，會對這個攻擊更有感覺一點。

### Yelp

美國最大的餐廳評論網站 Yelp 有幾個關於 clickjacking 的 report：

1. [ClickJacking on IMPORTANT Functions of Yelp](https://hackerone.com/reports/305128)
2. [CRITICAL-CLICKJACKING at Yelp Reservations Resulting in exposure of victim Private Data (Email info) + Victim Credit Card MissUse.](https://hackerone.com/reports/355859)

雖然說沒辦法達到奪取帳號這種很嚴重的攻擊，但還是可以造成一些危害，例如說自己註冊一間餐廳之後：

1. 幫使用者訂位，藉此偷到他們的 email
2. 幫使用者訂位，使用者要取消訂位的話就要付取消訂位的費用，造成錢財損失

對於看不爽的餐廳，也可以靠這方法去製造很多假的訂位，讓餐廳無從辨別（因為都是真的使用者來訂位）

### Twitter Periscope Clickjacking Vulnerability

原始報告：https://hackerone.com/reports/591432  
日期：2019 年 5 月

這個 bug 是因為相容性問題，網頁只設置了 `X-Frame-Options ALLOW-FROM` 而沒有設置 CSP，這樣的話其實沒什麼用，因為現在的瀏覽器都不支援 `ALLOW-FROM`。

解法很簡單，就是加上 CSP 的 frame-ancestors，讓現代瀏覽器也遵守這個規則。

### Highly wormable clickjacking in player card

原始報告：https://hackerone.com/reports/85624  
日期：2015 年 8 月

這個漏洞滿有趣的，運用了前面所提到的瀏覽器實作問題。這個案例是 twitter 已經有設置 `X-Frame-Options: SAMEORIGIN` 跟 `Content-Security-Policy: frame-ancestors 'self'`，但當時有些瀏覽器實作檢查時，只檢查 top window 是不是符合條件。

換句話說，如果是 twitter.com => attacker.com => twitter.com，就會通過檢查，所以還是可以被惡意網頁嵌入。

再加上這個漏洞發生在 twitter 的 timeline，所以可以達成蠕蟲的效果，clickjacking 之後就發推，然後就會有更多人看到，更多人發同樣的推文。

作者的 writeup 寫得很棒，但部落格掛掉了，這是存檔：[Google YOLO](http://web.archive.org/web/20190310161937/https://blog.innerht.ml/google-yolo/)

### [api.tumblr.com] Exploiting clickjacking vulnerability to trigger self DOM-based XSS

原始報告：https://hackerone.com/reports/953579
日期：2020 年 8 月

會特別挑這個案例，是因為它是攻擊鍊的串接！

在 XSS 漏洞中有一種叫做 self XSS，意思就是通常都要使用者自己做一些操作才會中招，所以影響十分有限，許多 program 也都不接受 self XSS 的漏洞。

而這份報告把 self XSS 跟 clickjacking 串連在一起，透過 clickjacking 的方式讓使用者去觸發 self XSS，串連攻擊鍊讓這個攻擊更容易被達成，可行性更高。

以上就是一些 clickjacking 相關的實際案例，值得注意的是有一些是因為相容性問題造成的 issue，而不是沒有設定，所以設定正確也是很重要的一件事。

## 無法防禦的 clickjacking？

clickjacking 防禦的方式說穿了就是不要讓別人可以嵌入你的網頁，但如果這個網頁的目的就是讓別人嵌入，那該怎麼辦？

例如說 Facebook widget，大家常看到的那些「讚」跟「分享」的按鈕，就是為了讓其他人可以用 iframe 嵌入的，這類型的 widget 該怎麼辦呢？

根據這兩篇：

1. [Clickjacking Attack on Facebook: How a Tiny Attribute Can Save the Corporation](https://www.netsparker.com/blog/web-security/clickjacking-attack-on-facebook-how-tiny-attribute-save-corporation/)
2. [Facebook like button click](https://stackoverflow.com/questions/61968091/facebook-like-button-click)

裡面得到的資訊，或許目前只能降低一點使用者體驗來換取安全性，例如說點了按鈕之後還會跳出一個 popup 讓你確認，對使用者來說多了一個點擊，但是也避免了 likejacking 的風險。

或是我猜可能也會根據網站的來源決定是否有這個行為，舉例來說在一些比較有信譽的網站，可能就不會跳出這個 popup。

我有做了一個簡單的 demo 網頁：https://aszx87410.github.io/demo/clickjacking/like.html

如果 likejacking 成功的話，點了按鈕之後會對 Facebook Developer Plugin 的粉專按讚（我自己實驗是有成功啦），大家可以試試看，按完以後可以按「顯示原始網頁」看看按鈕底下長什麼樣子，順便把讚收回來。

## 總結

比起以前瀏覽器支援度還沒有這麼完整的時代，現在已經幸福許多了，瀏覽器也實作了愈來愈多的安全性功能以及新的 response header，透過瀏覽器保護使用者避免惡意攻擊。

雖然說平均來講 clickjacking 的攻擊難易度、先備條件以及影響程度通常都比 XSS 或是 CSRF 之類的攻擊來得低，但依然是不可忽視的風險之一。

如果你的網頁沒有要讓別的網站嵌入，記得設置 `X-Frame-Options: DENY` 以及 `Content-Security-Policy: frame-ancestors 'none'`，告訴瀏覽器你的網頁不能被嵌入，藉此防止點擊劫持攻擊。

參考資料：

1. [TOPCLICKJACKING.md](https://github.com/reddelexc/hackerone-reports/blob/master/tops_by_bug_type/TOPCLICKJACKING.md)
2. [Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html#x-frame-options-header-types)
3. [CSP frame-ancestors](https://content-security-policy.com/frame-ancestors/)


---
title: 零基礎資安系列（三）-網站安全三本柱（Secure & SameSite & HttpOnly）
author: jo
date: 2021-05-28
tags: [Security,ZeroBased,cookie]
layout: zh-tw/layouts/post.njk
image: /img/posts/jo/zerobased-secure-samesite-httponly/cover.jpeg
---
<!-- summary -->
## 前言
> **保護 Cookie守衛網站安全的三本柱有不同的職責和能力**
> Secure 表示：我不會讓 Cookie去任何危險的地方！
> HttpOnly 表示：只要有我在的地方 _別想找到_ Cookie！
> SameSite 表示：所有和 Cookie 來源不同的請求都別想成功！
<!-- summary -->

## 釋例

今天要聊的這三種屬性，可以說是在網頁安全的防護上 CP 值最高的設定，想讓你了解瀏覽器為什麼需要這三種設定，而這三種屬性又為什麼會被稱為網站安全三本柱，他們擁有甚麼樣的功能和要如何進行設定，這些是我希望今天能帶給你的小知識，那麼話不多說，就讓我們繼續看下去。

### Secure

**Secure** 應該是屬於三本柱中最單純的一位，他的訴求很簡單，所有只要網站開頭不是 https 開頭的網站都沒有辦法獲得 Cookie 中的資訊，舉例來說：

![](/img/posts/jo/zerobased-secure-samesite-httponly/p1.png)

網站的 Cookie 儲存了5個值，無論是網站本身的配置錯誤讓你可以選擇使用 https 或 http 瀏覽，還是攻擊者把你重導向到他在網站子域建立的未加密的惡意 http 網址裡，基本上在 http 中網站能獲得的，只會剩下第一個 Secure 沒有打勾的值，因為 Secure 會阻止所有他有打勾的值出現在 http 中，最直觀的感受就是，當你不小心連接到 http 的頁面中的時候他會把你登出，因為他找不到可以證明你身分的那些 Cookie 的值，這個時候千萬別傻傻的再登入一次，因為在 http 中傳送的資料可都是未加密的阿！

### HttpOnly

而 **HttpOnly** 則可以說他是 XSS 之敵，如果有看過我的 [基礎第二篇 XSS 攻擊介紹](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting) 的朋友，可以發現在 XSS 攻擊中，網站會允許攻擊者在網站中植入惡意的 JavaScript 藉此竊取使用者的 Cookie ，舉例來說：

![](/img/posts/jo/zerobased-secure-samesite-httponly/p2.png)

網站的 Cookie 儲存了5個值，當攻擊者在有 XSS 攻擊漏洞中的網站植入惡意程式時，例如前端常用來查詢 Cookie 的 JavaScript 指令 document.cookie ，就是攻擊者最常使用的攻擊方式，攻擊者會在網站中執行 document.cookie 並將結果傳送給攻擊者，但如果我的網站中對敏感的 Cookie 值設定了 HttpOnly 會發生甚麼事？

攻擊者會發現即使網站有 XSS 漏洞，也成功的植入了惡意程式，但卻沒有將你受到 HttpOnly 保護的 Cookie 值傳送回來，為什麼會這樣呢？

原因是因為 HttpOnly 的功能就是拒絕與 JavaScript 共享 Cookie ，當 Cookie 中包含了設定 HttpOnly 的值之後，HttpOnly 會拒絕這個請求，藉此來保護 Cookie 不被不受信任的 JavaScript 存取，可以稱他為當之無愧的 XSS 之敵。

不過額外一提，並不是只要設置了 HttpOnly 之後，即使網站有 XSS 漏洞也可以高枕無憂，曾經碰過一個實例是當某網站搜尋的產品 ID 錯誤時，網站會將當下頁面的所有資訊紀錄在頁面上（包含 Cookie）方便工程師除錯，於是攻擊者便在網站中嵌入一個當使用者進入頁面時預設搜尋一個錯誤的產品 ID 並將整個當下頁面傳送給攻擊者的惡意程式，除了 Cookie 以外還附贈了伺服器版本和套件版本，直接就是一個資訊洩漏大禮包。

### SameSite

講到這邊可能有人會問，如果有 [XSS](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting) 之敵，那 CSRF 是不是也有？當然有！工程師也有同樣的疑問，於是 SameSite 這個 CSRF 之敵也出現了！

那這個最晚才誕生的瀏覽器安全屬性有甚麼特別之處，可以被稱為 CSRF 之敵？在我的 [資安零基礎系列第一篇 CSRF 攻擊介紹](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-request-forgery) 中，可以很清楚的了解到， CSRF 的特性在於攻擊者跨 Domain 向網站提出請求，而網站無條件信任 Cookie 而沒有再確認或以其他方式驗證，只知道這個 Request 帶著某個使用者的 Cookie，便接受了這個 Request ，卻不會去確認這個 Request 是不是由使用者自願發出的（ 就像是菜單上的桌號是你的，但不代表這個菜是你點的 ）。

那你一定會想，那如果只要不是我執行操作的這個 Domain 上發送的所有 Request ，網站都通通丟掉不接受不就好了（ 只要不是坐在店裡的人給老闆的菜單老闆都直接丟掉）？

沒錯！這就是 SameSite 這個屬性的特性，瀏覽器會檢查 Request 的來源是否與發布 Cookie 的來源相同。
如果不是，瀏覽器就不會在 Request 中包含Cookie，因此便可以從根本上 CSRF 的攻擊來阻止。

但即使如此， SameSite 其實還是有破綻，以自身經歷來說，曾經遇過一個網站設置了 SameSite 卻沒有設定 HttpOnly ，因此攻擊者只要在網站中嵌入一個讓使用者自己執行 document.cookie ，並將執行完成的結果送給攻擊者的惡意程式，於是攻擊者一樣可以拿到使用者所有的 Cookie 資料。

也許你會說，這個黑鍋 SameSite 不背，這是 HttpOnly 要負的責任，這樣說當然沒錯，因為三個屬性沒有共存的確會產生預期外的安全風險，不能說這是 SameSite 的錯，但 SameSite 還真有其他的弱點，如果設定的值是 Lax 的話，只要在網站導頁後的兩分鐘內，瀏覽器為了避免破壞到某些網站的登入流程和使用者體驗， SameSite 的設定會變成 none ，也就是沒設的意思。

![](/img/posts/jo/zerobased-secure-samesite-httponly/p3.png)

所以如果可以的話，建議除了設定 SameSite 以外，再加上 CSRF Token 會更有效的防範 CSRF 的攻擊。

## 實作三本柱

說了這麼多，想必到這邊你應該也對這三種瀏覽器的安全屬性有了一定的認識，有道是坐而言不如起而行，讀萬卷書不如行萬里路！

有點尷尬不過總而言之，來介紹實作！

### Secure & HttpOnly

### 第一步

確保自己的網站是 Https SSL ，否則你會發現你的網站一直在把使用者登出，相關設置可以參考官方文件 [How to Set Up SSL](https://docs.microsoft.com/zh-tw/iis/manage/configuring-security/how-to-set-up-ssl-on-iis)

### 第二步

設定Secure & HttpOnly有很多種方法，我這邊以 `ASP.NET` 來舉例，修改你的 `web.config`，新增：

```txt
<system.web>  
 <httpCookies httpOnlyCookies=”true” requireSSL=”true” />  
<system.web>

requireSSL=”true” 設定 Secure ，

httpOnlyCookies=”true” 設定 HttpOnly
```
這樣設定完後，就完成了 Secure & HttpOnly 的設定！

### SameSite

SameSite 的屬性可以進行三種設定

**Strict**：這是限制最嚴格的設定，會完全禁止第三方的 Cookie 請求，基本上只有在網域和 URL 中的網域相同，才會傳遞 Cookie 請求，舉例來說，當網站裡有一個 FB 連結時，點開連結，使用者必須要再登入一次 FB ，因為網站沒有傳送任何 FB 的 Cookie 。

這是三種設定中最嚴謹也最安全的設定，但也因此會讓使用者在網站的使用體驗上變得比較不方便，通常會使用於銀行或是購物網站等有金流交易的網站上。

設定的方法為在 Server 上進行設定

```txt
Set-Cookie: CookieName=CookieValue; SameSite=Strict;
```

**Lax**：而也因為了 Strict 的嚴格，所以有了 Lax 這個比較符合使用者使用體驗上的值產生， Lax 的要求同樣會限制大多數的第三方請求，但 Lax 會允許 Get 的請求，以表單來舉例：

![](/img/posts/jo/zerobased-secure-samesite-httponly/p4.png)

和 none 的全部允許與 Strict 的全部不允許來說， Lax 禁止了比較不安全的 POST 請求，卻又有一定的安全性，因此是 SameSite 目前在應用上較常出現的設定值，而2020年2月發布的 Chrome 80 以後皆是預設網站以 Lax 進行設定。

設定的方法為在 Server 上進行設定

```txt
Set-Cookie: CookieName=CookieValue; SameSite=Lax;
```

**None**：這個值顧名思義就是不限制 Cookie 傳送的意思，不過如果在網站上想要將 SameSite 的值設定為 None 的話，網站中的 Secure 必須要是開啟的， None 的設定才會生效，算是瀏覽器為了網站的安全性上做的一些小限制。

設定的方法為在 Server 上進行設定

```txt
Set-Cookie: widget\_session=abc123; SameSite=None; Secure
```

## 結論

在瀏覽器上這三種屬性的設定對工程師來說，成本不高但達成的效果卻不小，因此可以說是網站安全的入門經典款配置，不過也正我如前面所說，三個屬性沒有共存有可能會產生預期外的安全風險，所以如果可以的話，請盡可能的將這三種屬性都進行設定。

此外，值得注意的一點是 SameSite 的設定不只是在 Cookie 的送出上，其實也會影響到 Cookie 的寫入，如果需要在使用者的使用體驗上進行衡量的話，建議除非是銀行或是購物網站等有金流交易的網站，否則一般的網站其實只要設定 Lax 的值並搭配 CSRF Token 就已經擁有較高層級的 CSRF 攻擊防護了。

## 延伸閱讀

### 零基礎資安系列（一）-認識 CSRF（Cross Site Request Forgery ）

> [認識 CSRF（Cross Site Request Forgery）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-request-forgery)

### 零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）

> [認識 XSS（Cross-Site Scripting）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)

## 參考資料

### httpCookies Element

> [https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/ms228262(v=vs.100)?redirectedfrom=MSDN](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/ms228262%28v=vs.100%29?redirectedfrom=MSDN)


### How to Set Up SSL

> [https://docs.microsoft.com/zh-tw/iis/manage/configuring-security/how-to-set-up-ssl-on-iis](https://docs.microsoft.com/zh-tw/iis/manage/configuring-security/how-to-set-up-ssl-on-iis)

### Cookie 的 SameSite 屬性

> [https://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html](https://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html)

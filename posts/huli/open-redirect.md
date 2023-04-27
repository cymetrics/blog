---
title: 在做跳轉功能時應該注意的問題：Open Redirect
date: 2021-09-07
tags: [Security, Front-end, Back-end]
author: huli
description: 重新導向在網站中是個很常見的功能，但你有思考過這背後存在什麼樣的風險嗎？
layout: zh-tw/layouts/post.njk
canonical: https://blog.huli.tw/2021/09/26/what-is-open-redirect/
---

## 前言

<!-- summary -->
在許多網站中都有個很常見的功能，就是重新導向。

舉例來說，如果要觀看的頁面需要權限但是使用者還沒登入，就會先把使用者導去登入頁面，登入完之後再導回原本要去的頁面。
<!-- summary -->

例如說今天有個社群網站，想要看個人檔案的話需要登入，而小明的個人檔案網址是：`https://example.com/profile/ming`，那我身為一個訪客，點進去之後就會跳轉到登入頁面，並且帶上我原本要去的網址當作參數：
`https://example.com/login?redirect=https://example.com/profile/ming`

登入成功之後，網站就會根據 `redirect` 的值，把我導去原本要前往的頁面。

雖然看起來是個小功能，但其實背後有不少安全性的問題要考慮。

## 什麼是 open redirect？

Open redirect，中文通常翻作開放式重定向或是公開重定向之類的，但我自己喜歡翻成：「任意重新導向」，覺得比較貼近原意，就是可以重新導向到任意目的地。

以文章開頭的例子來說，攻擊者其實可以在 URL 上面帶任何值，例如說：`https://attacker.com`，這樣使用者在登入之後，就會跳轉到這個頁面。

像這個就是需要使用者操作（登入）才能觸發重新導向，但有些功能無需使用者操作，可能就有著重新導向的功能。以登入的這個例子來說，假設使用者已經登入了，那 `https://example.com/login?redirect=https://attacker.com` 這個連結點下去之後，系統偵測到已經登入，就會直接把使用者轉到 `https://attacker.com`。

這造成的結果是什麼呢？

使用者點了一個 example.com 的連結，卻在無意間被轉到 attacker.com 去。這種可以直接把使用者導到任意地方去的漏洞，就叫做 open redirect。

## Open redirect 能造成什麼問題？

一個最直覺能想到的攻擊方式，大概就是釣魚網站了。在講攻擊手法的時候，我覺得「情境」是一個滿重要的因素，有些看似沒什麼的攻擊，在搭配適當的情境之後，你會覺得「哇，好像滿容易成功的」。

在看得到網址的狀況下，你看到陌生的網址就會比較小心翼翼，因為你知道可能會是詐騙或是釣魚網站；但若是看到熟悉的網址，會放鬆一些戒心：

![](/img/posts/huli/open-redirect/chat.png)

圖上的網址最後那段其實是 https://attacker.com url encode 過的結果，所以使用者根本不會注意到後面那串，只會看到前面是由 facebookb.com 開頭，這邊我想強調的事情是「看到熟悉的網址，使用者會比較沒有戒心」。

但這樣子的情境，其實很類似的網址也可以達成差不多的事情（只是效力比較低），例如說 facebo0k.com 或是 myfacebook.com 之類的。

這時候可以再設想另外一個情境，就是有些網站當你點擊外部連結的時候，會提醒你說：「你要連到外部網站了喔，要小心喔」，這時候如果利用 open redirect 的話，網站可能就不會跳出提示（因為是同一個網域），使用者或許就在無意之間跳到了別的網站而不自知。

例如說今天有個論壇好了，有個地方有 open redirect 的漏洞，然後我在文章裡面放了一個連結，利用 open redirect 讓跳去外部網站的提示失效，而使用者點了連結之後會到「精心設計的釣魚網站」，介面長得一模一樣，但是跳出個要輸入帳號密碼的 popup 跟你說你的連線階段已過期，請重新登入。這時使用者就有比較高的機率會去輸入帳號密碼，因為沒有想到自己被跳轉到釣魚網站。

以上這些問題，都只是在討論 open redirect 「不跟其他漏洞結合」的狀況下，可以造成哪些危害，聽起來好像還好對吧？跟其他攻擊比起來似乎沒什麼，但是 open redirect 被低估的地方，其實是在它與其他漏洞的結合之後，可以發揮出的威力。

在繼續往下之前，我們必須先了解一下重新導向的實作，主要分為兩種：

1. 後端重新導向，透過 response header `Location`
2. 前端重新導向，可能透過 history.push 或是 window.open 以及 location 等等

第一種透過後端來做 redirect，是靠 server 回傳 `Location` 這個 header，瀏覽器就會把使用者導到相對應的地方去。實作上可能會像是這樣：

``` js
function handler(req, res) {
  res.setStatus(302)
  res.setHeader('Location: ' + req.query.redirect)
  return
}
```

而第二種由前端實作的就不太一樣了，一個常見的範例是直接把要去的地方 assign 給 `window.location` 做頁面跳轉：

``` js
const searchParams = new URLSearchParams(location.search)
window.location = searchParams.get('redirect')
```

或如果是 SPA 不想換頁的話，可能會直接用 `history.push` 或是框架內建的 router.push。

而無論是前端還是後端來做重新導向，光是實作方式都有各自的問題需要處理。

## 後端：CRLF injection

後端的重新導向中，會把傳過來的值塞到 `Location` 這個 response header 裡面。有些 server 或是 framework 如果沒有處理好的話，可以塞入換行字元，例如說把重新導向的網址設定為 `abc\ntest:123`，有可能 response 就變成：

```
HTTP/2 302 Found
Location: abc
test:123
```

那若是改成：`abc\n\n<script>alert(1)</script>`，response 就會變成：

```
HTTP/2 302 Found
Location: abc

<script>alert(1)</script>
....
```

藉由 CRLF injection 去改變 response body 的內容，但很遺憾似乎無法直接達成 XSS，因為瀏覽器看到 status code 是 301/302 時會忽略 response body，直接把使用者導去目標頁面。

我找到可以運作的資料都已經是四五年前的了：

1. [[stagecafrstore.starbucks.com] CRLF Injection, XSS](https://hackerone.com/reports/192667)
2. [[dev.twitter.com] XSS and Open Redirect](https://hackerone.com/reports/260744)

我記得我好像看過有篇文章在講這種情況應該怎麼辦，但我找很久都找不到，如果知道該怎麼繞過的請告訴我。

不過就算改變 response body 沒什麼用，改變其他的 header 也可能串聯其他攻擊，例如說 Set-Cookie，可以幫使用者設置任意 cookie，就有機會再串接 session fixation 或是 CSRF 之類的攻擊。

## 前端：XSS

如果是前端實作的重新導向，要特別注意的一個問題就是 XSS。

你可能會疑惑重新導向跟 XSS 有什麼關係，我們先來回顧一下前端重新導向的程式碼：

``` js
const searchParams = new URLSearchParams(location.search)
window.location = searchParams.get('redirect')
```

這樣會有什麼問題呢？

在 JS 裡面有個應該不少人看過，但可能比較少用的東西，叫做 JavaScript pseudo protocol，像是這樣：

```
<a href="javascript:alert(1)">click me</a>
```

點了那個 a 之後，會執行 JS 跳出一個 alert。而這招除了可以用在 href 以外，其實也可以用在 location 上面：

``` js
window.location = 'javascript:alert(1)'
```

打開你的瀏覽器開新分頁，然後在 devtool console 直接執行上面那一段，會發現 alert 真的跳出來了，而且以下幾種方式都會觸發：

``` js
window.location.href = 'javascript:alert(1)'
window.location.assign('javascript:alert(1)')
window.location.replace('javascript:alert(1)')
```

因此攻擊者只要把 redirect 的位置設置成 `javascript:xxx`，就可以執行任意程式碼，觸發 XSS。這個案例前端的朋友們一定要特別注意，因為直接把值 assign 給 location 是個很常見的實作方式。

底下直接帶大家看一個真實世界的案例，對象是之前在另一篇文章：[防止 XSS 可能比想像中困難](https://tech-blog.cymetrics.io/posts/huli/prevent-xss-might-be-harder-than-you-thought/)出現過的網站：[Matters News](https://matters.news/)。

這是他們的登入頁面：

![](/img/posts/huli/open-redirect/matters.png)

在點下登入之後，會呼叫一個叫做 `redirectToTarget` 的 function，而這個函式的程式碼是這樣：

``` js
/**
 * Redirect to "?target=" or fallback URL with page reload.
 *
 * (works on CSR)
 */
export const redirectToTarget = ({
  fallback = 'current',
}: {
  fallback?: 'homepage' | 'current'
} = {}) => {
  const fallbackTarget =
    fallback === 'homepage'
      ? `/` // FIXME: to purge cache
      : window.location.href
  const target = getTarget() || fallbackTarget

  window.location.href = decodeURIComponent(target)
}
```

在拿到 target 之後直接使用了：`window.location.href = decodeURIComponent(target)` 來做重新導向。而 `getTarget` 其實就是去 url query string 把 target 的值拿出來。所以如果登入的網址是：`https://matters.news/login?target=javascript:alert(1)`，在使用者按下登入並且成功之後，就會跳出一個 alert，觸發 XSS！

不僅如此，這個 XSS 一旦被觸發了，影響力非同小可，因為這是登入頁面，所以在這個頁面上執行的 XSS，可以直接抓取 input 的值，也就是偷到使用者的帳號密碼。如果要執行實際的攻擊，可以針對網站的使用者寄發釣魚信，在信中放入這個惡意連結讓使用者點擊，由於網址是正常的網址，點擊之後到的頁面也是真的網站的頁面，因此可信程度應該滿高的。

在使用者輸入帳號密碼並且登入之後，用 XSS 把帳號密碼偷走並把使用者導回首頁，就可以不留痕跡地偷走使用者帳號，達成帳號奪取。

修復方式是只允許 http/https 開頭的網址：

``` js
const fallbackTarget =
  fallback === 'homepage'
    ? `/` // FIXME: to purge cache
    : window.location.href
let target = decodeURIComponent(getTarget())

const isValidTarget = /^((http|https):\/\/)/.test(target)
if (!isValidTarget) {
  target = fallbackTarget
}

window.location.href = target || fallbackTarget
```

不過這樣其實是先把重新導向功能的 XSS 修掉而已，open redirect 的部分依舊存在，需要進一步對 domain 做檢查才能排除 open redirect。

再次提醒，這個漏洞滿多工程師都不會發現，因為不知道 `window.location.href` 可以放 `javascript:alert(1)` 這樣的網址來執行程式碼，如果大家有實作到重新導向的功能，記得注意一下這個問題。

## Open redirect 與其他漏洞的搭配

從上面兩個問題可以看出光是「實作重新導向」就可能會寫出有漏洞的程式碼，而接下來要談的是「重新導向」這個功能與其他漏洞的結合。有至少兩個類型的漏洞都有機會與 open redirect 結合，一個是 SSRF，另一個是 OAuth 的漏洞。

SSRF，全名為 Server-Side Request Forgery，通常翻作伺服器請求偽造，關於這個漏洞詳細的介紹跟攻擊未來可能再寫一篇跟大家介紹，我這邊先簡單講一下。

通常在內部的 Server，都不會讓外部直接存取到，對外可能只會有一台 proxy 把 request forward 到對應的主機。假設有一個服務的伺服器架構如下圖所示，背後有一台 Back-end Server 會去呼叫隱藏在內網中的 PDF service 產生 PDF 檔案：

![](/img/posts/huli/open-redirect/ssrf.png)

而這個 PDF service 限制網址只能是 https://example.com 開頭，避免有人傳入其他網址進來。這時如果某個 URL 有 open redirect 的漏洞，攻擊者就可以傳入：`https://example.com?redirect=http://127.0.0.1`，讓 PDF service 去造訪這個網址，而被轉址到 127.0.0.1，並且回傳它的內容。

這樣就叫做 SSRF，你透過內部的服務，成功發了一個 request 到外網進不去的 service，如此一來你就可以去看看內網還有什麼其他服務存在，例如說 Redis 或是 MySQL 等等，這些直接從外網都進不去，但透過 SSRF 就可以。或更簡單的方式是去看一些 cloud 相關的檔案，有些 cloud 服務只要存取 http://169.254.169.254 就會看到一些 metadata，有興趣可以看這邊：[Abusing SSRF in AWS EC2 environment](https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery#exploitation-in-cloud)。

所以透過 open redirect，可以繞過原本有做網址檢查的地方。

第二個會碰到的問題則是跟 OAuth 有關，在 OAuth 的流程中通常都會有一個 redirect_uri，接收授權完畢之後的一個 code，以 Facebook 為例的話是長這樣：

```
https://www.facebook.com/v11.0/dialog/oauth?
  client_id={app-id}
  &redirect_uri={"https://example.com/login"}
  &state={"{st=state123abc,ds=123456789}"}
```

使用者點擊網址後會跳到 Facebook，按下授權就會被導到 https://example.com/login 並且可以在網址中拿到 code 或是 token，接著就可以用這個搭配 client id 跟 client secret，拿到 auth token，並且用這個 auth token 代表使用者去跟 Facebook 拿取資料。

如果 redirect_uri 的保護沒有做好，攻擊者就可以把它換成其他值，例如說：`redirect_uri=https://huli.tw`，這樣使用者點擊授權以後，就會把驗證用的 code 傳到我的網站，而不是預期中的網站。

但一般來說 redirect_uri 都會限制 domain，所以沒那麼簡單就可以繞過。這時候就要請出 open redirect 登場了，如果網站有這個漏洞的話，就可以這樣：`redirect_uri=https://example.com?redirect=https://huli.tw`，如此一來就算符合 domain 限制，最後導向的地方依然是個外部網站，攻擊者一樣可以偷到驗證用的 code。

所以為了避免這類型的攻擊，Facebook 或 Google 這種大型服務在設置 App 的時候都會加強限制，redirect_uri 通常都會要求寫死，不讓你設置 wildcard，例如說我填 `https://example.com/auth`，就是真的只有這個網址可以過，其他不同 path 的網址都會失敗。但有些小公司沒有注意到這麼細，對於 redirect_uri 就沒有這麼多規範。

像是這種 OAuth 結合 open redirect 達成 account takeover（帳號奪取）的例子其實不少，例如說這個：[[cs.money] Open Redirect Leads to Account Takeover](https://hackerone.com/reports/905607)，或是 GitHub 其實也有過這類型的漏洞：[GitHub Gist - Account takeover via open redirect - $10,000 Bounty](https://devcraft.io/2020/10/19/github-gist-account-takeover.html)，而這個 Airbnb 的漏洞也很精彩：[Authentication bypass on Airbnb via OAuth tokens theft](https://www.arneswinnen.net/2017/06/authentication-bypass-on-airbnb-via-oauth-tokens-theft/)。

總結一下，open redirect 的用處除了讓使用者放鬆戒心來進行釣魚以外，另一個就是繞過有針對 domain 進行檢查的地方。上面講的 SSRF 跟 OAuth 這兩個漏洞之所以能跟它結合，就是因為可以用 open redirect 來繞過對 domain 的檢查。

## 那該怎麼防禦 open redirect？

如果想防止 open redirect，可想而知就是要對重新導向的網址進行檢查。這聽起來簡單，實作起來卻容易出現漏洞，例如說底下的例子是一段檢查 domain 的程式碼，根據取出的 hostname 比對是否含有 `cymetrics.io`，有的話就通過，目的是只有 cymetrics.io 跟它的 subdomain 可以通過：

``` js
const validDomain = 'cymetrics.io'
function validateDomain(url) {
  const host = new URL(url).hostname // 取出 hostname
  return host.includes(validDomain)
}

validateDomain('https://example.com') // false
validateDomain('https://cymetrics.io') // true
validateDomain('https://dev.cymetrics.io') // true
```

感覺好像沒什麼問題？除了 `cymetrics.io` 或是它的 subdomain 以外，應該不會有其他網域可以通過這檢查吧？

雖然看似如此，但其實有兩個方式可以繞過。這邊先假設 URL parsing 的方式不會有問題，一定會拿到 hostname，所以 `attacker.com?q=cymetrics.io` 這種方式是沒用的，hostname 會拿到 `attacker.com` 而已。

大家可以想一下有哪兩種可以繞過，在公佈答案之前，先來看下一個段落。
 
## Google 對於 open redirect 的看法

Google 在官方網站 [Bughunter University](https://sites.google.com/site/bughunteruniversity/nonvuln/open-redirect) 當中有明確提到一般的 open redirect 不會被視為安全性上的漏洞，除非能證明它可以跟其他漏洞結合在一起使用。

那是不是有人成功過呢？當然，底下我舉兩個例子。

第一個例子來自這篇文章：[Vulnerability in Hangouts Chat: from open redirect to code execution](https://blog.bentkowski.info/2018/07/vulnerability-in-hangouts-chat-aka-how.html)，對象是 Google Hangouts Chat 的 Electron App。

在那個 App 裡面如果網址是 `https://chat.google.com` 開頭的話，點擊網址就會直接在 Electron 裡面開啟網頁，而不是用瀏覽器去開。因此只要找到 `https://chat.google.com` 的 open redirect，就可以把使用者導去釣魚網站。而 Electron App 跟瀏覽器的差異之一就在於 Electron App 預設是不會有網址列的，所以使用者根本無從辨別這是不是釣魚網站。詳細的流程跟最後的 payload 可以參考原文，這個漏洞還可以進一步提升成 RCE（不過我不知道是怎麼做的就是了），價值 7500 USD。

第二個例子來自官方的文章：[Open redirects that matter](https://sites.google.com/site/bughunteruniversity/best-reports/openredirectsthatmatter)，這個案例也是超帥。

在 Google I/O 2015 的網站中有個功能是去抓 Picasa 的資料回來並 render 成 JSON，但因為有跨網域的問題，因此後端寫了一個簡單的 proxy 去拿資料，像這樣：`/api/v1/photoproxy?url=to`，而這個 proxy 會檢查 url 的開頭是否為 `https://picasaweb.google.com/data/feed/api`，如果不是的話就回傳錯誤。

所以作者的第一個目標就是找到 picasa 上的 open redirect，他最後找到的是這個網址：`https://picasaweb.google.com/bye?continue=`，只要把這個網址改成：`https://picasaweb.google.com/data/feed/api/../../bye`，就可以成功通過路徑的檢查，讓 server 認為這是一個合法的 URL。

但這還沒結束，因為 bye?continue= 這個 redirect 也會檢查參數，continue 必須是 `https://google.com` 開頭才可以。因此我們需要找到第二個 open redirect，這次是存在於 google.com 上面。而 google.com 有一個知名的 open redirect 是 AMP 用的，例如說 `https://www.google.com/amp/tech-blog.cymetrics.io`，就會連到 https://tech-blog.cymetrics.io （不過我剛嘗試了一下會先跳到中間頁，點擊確認後才會導向，應該是這功能有修正過了）。

結合這兩個 open redirect，就可以讓 proxy 去抓取我們指定的 url 的內容：

```
https://picasaweb.google.com/data/feed/api/../../../bye/?
continue=https%3A%2F%2Fwww.google.com%2Famp/
your-domain.example.com/path?querystring
```

可是抓了之後只會輸出成 JSON，有什麼用呢？後端的程式碼如下：

``` go
func servePhotosProxy(w http.ResponseWriter, r *http.Request) {
    c := newContext(r)
    if r.Method != "GET" {
        writeJSONError(c, w, http.StatusBadRequest, "invalid request method")
        return
    }
    url := r.FormValue("url")
    if !strings.HasPrefix(url, "https://picasaweb.google.com/data/feed/api") {
        writeJSONError(c, w, http.StatusBadRequest, "url parameter is missing or is an invalid endpoint")
        return
    }
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        writeJSONError(c, w, errStatus(err), err)
        return
    }


    res, err := httpClient(c).Do(req)
    if err != nil {
        writeJSONError(c, w, errStatus(err), err)
        return
    }


    defer res.Body.Close()
    w.Header().Set("Content-Type", "application/json;charset=utf-8")
    w.WriteHeader(res.StatusCode)
    io.Copy(w, res.Body)
}
```

因為有設置 content type，所以沒辦法用 MIME sniffing 去攻擊。簡單解釋一下 MIME sniffing，當你的 response 沒有設置 content type 的時候，瀏覽器就會自動去猜這是什麼內容，如果裡面含有 HTML 的話，那就會被當成是 HTML 網站來解析並且渲染。

而作者發現了另一個 bug，就是如果是 error 的話，並不會設置 content type，只有成功的時候會，所以可以故意回傳一個含有 HTML 的錯誤訊息，這樣被印在畫面時瀏覽器就會把這整份當成是 HTML，進而達成 XSS！詳細的流程跟介紹原文都寫得很清楚，很推薦大家去看一下原文。

以上就是兩個在 Google 中曾經被發現的 open redirect 串聯其他漏洞引起的攻擊，兩個都很有趣！

看完上面這些之後，我突然很好奇有哪些 Google 的 open redirect 是大家都知道的，於是我就 google 了：`known google open redirect`，找到底下幾個網站：

1. [How scammers abuse Google Search’s open redirect feature](https://nakedsecurity.sophos.com/2020/05/15/how-scammers-abuse-google-searchs-open-redirect-feature/)
2. [Google - Open Redirect](https://blog.sean-wright.com/google-open-redirect/)
3. [Google Bug that Makes Your Bank More Vulnerable to Phishing](https://www.threatmark.com/google-bug-that-makes-your-bank-more-vulnerable-to-phishing/)

如果只是一般的 https://www.google.com/url?q=http://tech-blog.cymetrics.io 的話，點進去只會跳到確認頁面，但如果後面加一個參數 usg 的話，就可以不經過確認直接重新導向，不信你點點看這個，會去 example.org：https://www.google.com/url?sa=t&url=http://example.org/&usg=AOvVaw1YigBkNF7L7D2x2Fl532mA

那這個 usg 是什麼呢？應該是網址經過某種 hash 過後的結果，但你不會知道怎麼算出來的。而要獲得這個 usg 其實也不難，你用 gmail 寄信給自己，信裡面要有你想導向的連結，接著再用 HTML basic view 來看，就會看到信中的連結變成了上面格式的重新導向！

像是這個，就是我們部落格的重新導向連結：https://www.google.com/url?q=https%3A%2F%2Ftech-blog.cymetrics.io&sa=D&sntz=1&usg=AFQjCNHyq6urHn6HLwj8RP09GANAlymZug

實測之後發現真的能不經過確認就跳轉，這個功能好像已經存在滿久了，未來如果有需要 google.com 的 open redirect 可以參考看看。

## 檢查 redirect 的 domain

好，接著講回剛剛問大家的兩種繞過方式，我再貼一次檢查 domain 的程式碼，讓大家回憶一下，接著就直接公布答案：

``` js
const validDomain = 'cymetrics.io'
function validateDomain(url) {
  const host = new URL(url).hostname // 取出 hostname
  return host.includes(validDomain)
}

validateDomain('https://example.com') // false
validateDomain('https://cymetrics.io') // true
validateDomain('https://dev.cymetrics.io') // true
```

這是在檢查 domain 時滿常會犯的錯誤，因為沒有考慮到以下兩種情形：

1. cymetrics.io.huli.tw
2. fakecymetrics.io

上面這兩種情形都符合條件，但卻不是我們想要的結果。

其實不只是檢查 domain，在做任何檢查的時候用 `includes` 或是 `contains` 直接去看整體是否包含某個字串都是一件比較危險的事情。最好的方式其實是設一個 allow list 並且要完全一致才通過，這樣是最嚴格的。但如果想要允許所有 subdomain 的話，可以這樣檢查：

``` js
const validDomain = 'cymetrics.io'
function validateDomain(url) {
  const host = new URL(url).hostname // 取出 hostname
  return host === validDomain || host.endsWith('.' + validDomain)
}
```

subdomain 的部分結尾要是 `.cymetrics.io`，所以一定會是 cymetrics.io 的 subdomain，而主要的 domain 也要完全符合才可以。不過這樣寫的話，如果某一個不相干的 subdomain 有 open redirect 的漏洞，這段就破功了。因此還是建議大家只把確定會 redirect 的 domain 放進去並且直接用 `===` 做檢查，避免這種狀況發生。

## 結語

重新導向是個很常見的功能，最常見的就是登入前點了某個連結之後轉到登入頁面，登入成功就會自動跳轉回去。在做這個功能時，如果是前端重新導向，再次提醒大家，要考慮到 `window.location = 'javascript:alert(1)'` 這樣會出事，請確認重新導向的 URL 是合法的 URL 再做動作。另外，也要確認檢查 domain 時有考慮到可能會被繞過的狀況，盡可能用最嚴謹的方式去處理。

以上就是對 open redirect 的介紹，希望對大家有幫助，有什麼疑問或是寫錯的地方都可以在下面留言跟我討論。

參考資料：

1. [The real impact of an Open Redirect vulnerability](https://blog.detectify.com/2019/05/16/the-real-impact-of-an-open-redirect/)
2. [Intigriti: Open Redirect](https://blog.intigriti.com/hackademy/open-redirect/)
3. [Misconfigured OAuth leading to Account Takeover](https://gauravnarwani.com/misconfigured-oauth-to-account-takeover/)
4. [Open Redirect Vulnerability](https://s0cket7.com/open-redirect-vulnerability/)
5. [GitHub Gist - Account takeover via open redirect - $10,000 Bounty](https://devcraft.io/2020/10/19/github-gist-account-takeover.html)
6. [OAuth to Account takeover](https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover)


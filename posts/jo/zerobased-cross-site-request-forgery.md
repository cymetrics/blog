---
title: 零基礎資安系列（一）-認識 CSRF（Cross Site Request Forgery）
author: jo
date: 2021-05-26
tags: [Security,ZeroBased,CSRF]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-cross-site-request-forgery/cover.jpeg
---
<!-- summary -->
## 前言
> 陌生人＝ **Hacker** 菜單 ＝ **Request**
> 桌號＝ **cookie 註1** 老闆＝ **web server** 你 ＝ **User**
>
>想像你到一家餐廳吃飯，陌生人拿了一張有你桌號的菜單點餐之後給老闆，結果老闆問也不問便收了菜單並將帳記到了你的身上，這就是 CSRF 的基礎概念。
<!-- summary -->

## 釋例
CSRF ( Cross Site Request Forgery )，翻成中文叫做**跨站請求偽造**，其實字面上把他猜成拆開成請求偽造和跨站之後就蠻好理解的，怎麼說呢？ 我以前言的例子來說明一下**跨站請求偽造是怎麼一回事**

先講請求偽造，請求偽造的意思很好理解，指的是陌生人拿了一張有你桌號的菜單點自己想點的餐之後給老闆這件事（ Hacker 用帶著你 cookie 的 Request 送給 web server ），那至於跨站跨在哪裡呢？

跨在陌生人在你不知情的情況下把有你桌號的菜單送給了老闆，所以跨過了本該知情的你（送出的人不同，所以送出 Request 的 Domain 註2) 也會不同），CSRF 的本質在於 web server 無條件信任 cookie 而沒有再確認或以其他方式驗證（ 等於老闆問也不問無條件相信菜單上的桌號，也不看是誰送的），因此只能保證這個Request 發自某個 User ，卻不能保證請求本身是 User 自願發出的（ 等於菜單上的桌號是你的，但不代表這個菜是你點的 ）。

## CSRF 攻擊流程

用簡單的圖帶你看一下 Hacker 的犯案過程

![](/img/posts/jo/zerobased-cross-site-request-forgery/p1.png)

1.  User 訪問並登入 A 網站
2.  User 獲得 Cookie 並存至 User 瀏覽器
3.  User 在未登出 A 網站的情況下瀏覽 B 網站，接著 Hacker 以 B 網站的 Domain 以 A 網站給 User 的 Cookie 對 A 網站發送請求，如果 A 網站沒發現的話就 GG 了。

＊Ｂ網站會在自身的網站中加入含 A 網站 Domain 的 Javascript ，例如：上方圖中的 **A/pay?to=B** ，這裡的 A 就是指 A 網站 Domain ，然後去執行 Pay 這個動作給 B ，這個攻擊的破綻就是剛剛前言例子中提到的，送出資料的Domain 不同，另外，貼心小提醒，在惡意網站中就算只是滑鼠移過圖片也可能會執行惡意的 Javascript 千萬不要覺得我都不點就沒事。

通常 Hacker 發現網站有漏洞時，都會以金流及竊取隱私資料為主要攻擊面向，畢竟 Hacker 除了做興趣也是要吃飯，因此當網站在設計關於金流及隱私資料的架構時需要特別小心，

## Hacker實際利用CSRF漏洞案例

![](/img/posts/jo/zerobased-cross-site-request-forgery/p2.png)
**photo by https://www.ithome.com.tw/news/139205**

這個新聞是經典的 XSS 與 CSRF 聯動的漏洞， Hacker 在注入 XSS 之後，只要造訪被注入 XSS 頁面的是主辦單位， Hacker 可利用 CSRF 漏洞把自己的角色變更為協辦單位，而獲得可以存取社團所有功能的權限，包括利用程式變更主辦單位 PayPal 帳號的電子郵件，這表示之後這個社團舉辦的各種活動所收取的款項，都會流落到 Hacker 所指定的帳號中，而且因為電子郵件被變更，所以主辦單位也不會收到任何的郵件通知。

＊如果是對 XSS 不了解的朋友，歡迎看我的第二篇文章喔 XD

### 達成 CSRF 攻擊流程三要素

1.  有一個可以觸發惡意腳本的動作
2.  只以單一條件驗證網站身份，例如：只驗證 cookie 或 token
3.  沒有驗證或是驗證的參數可以預測（固定的 cookie ）

## 如何防範 CSRF

防範 CSRF 的重點在於打破 CSRF 攻擊流程三要素，

1.  增加所有敏感動作的驗證方式，例如：金流、提交個資 等…多加一道驗證碼的機制
2.  增加無法預測的參數，常見且有效的防範方式例如：**CSRF token (在頁面的 form 或是 custom header 裡面放一個 token 並要求 client request 要夾帶這個 token )**

## 實作 CSRF Token 邏輯

**建立**：在 User 打開網頁時，Server 會根據 User 的身份生成一個 Token ，將 Token 存放在頁面中（通常生成的基礎是 User 名稱加上隨機亂數或是時間戳記的加密組合，另外需要注意的是 Token 需要額外放置，不能依然存放在 Cookie 中，不然一樣會被整包帶走 ，建議是存在 Server 的 Session中）。

**傳送請求**：之後只要有添加 Token 的頁面在提交請求時，都需要加上這個Token ，請求才會被允許，通常對於GET請求，Token會附在請求的網址之後，這樣 URL 會變成   `http://url?csrftoken=tokenvalue`而 POST 請求則會在 form 的最後加上：    
```txt
<input type=「hidden」 name=「csrftoken」 value=「tokenvalue」/>`
```
把Token以參數的形式加入請求了。



**驗證**：當 User 發送當有請求的 Token 給 Server 時，Server 為了要確定 Token 的時間有效性和正確性，會先解密 Token，對比加密過後的 User 名稱和當時的隨機亂數及時間戳記，如果加密的資料一致而且時間戳記沒有過期，Server 就會驗證通過，確認 Token 是有效的。

## 總結

除了加上 CSRF Token 及多重驗證的防範方式以外，為避免 CSRF 風險，建議在每階段架構和設計時，使用經過審查的套件或框架。 使用諸如 owasp csrfguard 之類的反 CSRF 套件可以降低網頁 CSRF 的風險。

之後會再另開文章說明 CSRF 的兄弟 XSS 與網頁安全三本柱 Secure 、 samsite 、 httponly 他們之間不得不說的故事。

## 名詞解釋

**註1**：cookie：用來記錄User在網站上的操作及憑證，大多數電商網站，如PChome等都會使用 cookie 來紀錄網頁上的的操作資訊，常見的是紀錄購物車、會員登入或瀏覽紀錄、停留時間等，讓Web可以識別用戶的身分，User登入過後，可以無需再次登入就可以直接進行操作，。

**註2**：domain：指的是網域名稱，簡單來說就是網站的地址，就如同住家地址一般，寄信的時候可以讓對方知道信是從哪裡寄來的。

熱騰騰的XSS文章出爐啦～

## 延伸閱讀

### 零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）

> [認識 XSS(Cross-Site Scripting](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)

## 參考資料

> [https://blog.techbridge.cc/2017/02/25/csrf-introduction/](https://blog.techbridge.cc/2017/02/25/csrf-introduction/)

> [https://kknews.cc/zh-tw/tech/veqpbna.html](https://kknews.cc/zh-tw/tech/veqpbna.html)

> [https://zh.wikipedia.org/wiki/跨站請求偽造](https://zh.wikipedia.org/wiki/%E8%B7%A8%E7%AB%99%E8%AF%B7%E6%B1%82%E4%BC%AA%E9%80%A0)

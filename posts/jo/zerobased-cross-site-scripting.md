---
title: 零基礎資安系列（二）-認識 XSS（Cross-Site Scripting）
author: jo
date: 2021-05-27
tags: [Security,ZeroBased,XSS]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-cross-site-scripting/cover.jpeg
---
<!-- summary -->
## 前言
> 你＝**User** 陌生人＝**Hacker** 菜單＝**Request** 桌號＝**cookie** 老闆＝**web server**
> 
> 想像你到一家餐廳吃飯，陌生人在有你桌號的菜單備註寫上無敵大辣，接著你沒有發現便直接把菜單送給老闆，然後老闆就送來了一份加了無敵大辣的餐點 ，這就是 XSS 的基礎概念。
<!-- summary -->

## 釋例

以前言的範例來做說明，當網頁在進行 browser render **註1**的時候（老闆收到菜單開始做菜），使用者**輸入的欄位**或是**沒有被驗證的參數**就被嵌入在網頁的程式碼（菜單）裡面，如果這段輸入包含惡意程式（被備註無敵大辣）就會導致使用者瀏覽這個頁面的時候觸發這段惡意程式，導致 XSS 風險的發生。

## XSS攻擊流程

![](/img/posts/jo/zerobased-cross-site-scripting/p1.png)

1.  Hacker 在受害網站注入 XSS 漏洞
2.  透過社交工程手法傳送惡意 URL 給 User
3.  當 User 點擊 URL 便會把自己的資料（cookie）藉由受害網站傳回給 Hacker

## XSS三大種類

### 反射型 XSS （Reflected）

*   最常見的 XSS 攻擊類型，通常是將惡意程式會藏在網址列裡，放在 GET 參數傳遞，範例如下：

```txt
http://www.example.com/upload.asp?id=<script>alert(1);</script>
```

*   這種手法要能夠成功攻擊，需要使用社交工程釣魚的技巧，使 User 點擊URL 攻擊才會生效。
*   因為 URL 通常看起來很詭異，所以 Hacker 通常會使用短網址或 HTML Encoder 註2的方式嘗試欺騙 User。

### DOM 型 XSS

*   這種手法和反射型 XSS一樣，都需要使用社交工程釣魚的技巧，使 User 點擊 URL 攻擊才會生效。
*   Hacker 在 URL 輸入 DOM **註3** 物件，把物件嵌入網頁程式碼，範例：

```txt
<img src=# onerror=”alert(123)”>
```

### 儲存型 XSS ( Stored )

*   與前兩種手法不同的是此種攻擊手法不需要使用社交工程釣魚的技巧，也能使 User 受到攻擊
*   攻擊的方式是 Hacker 將 Javascript 儲存在伺服器的資料庫中，進而引起使 User 遭受攻擊。
*   最常見的例子就是將 Javascript 注入留言板，當下一位 User 瀏覽網頁時，網頁會載入留言板的 Javascript 進而使 User 受到攻擊，範例如下：

```txt
我是壞人！ <script>alert(1);</script>
```

然後當 User 瀏覽網頁的時候，就會因為網頁先載入了當下頁面的惡意程式，於是 User 的頁面就會跳出一個 1 的 alert，以此類推， Hacker 在這裡如果輸入讓 User 傳送 cookie 或是其他惡意程式行為，網頁也會完全照做！

**執得一提的是，在三種XSS攻擊中，DOM 型 XSS 和另外兩種 XSS 的區別是 DOM 型 XSS 攻擊中，提取和執行惡意程式都是由 Browser 端完成，屬於前端 JavaScript 的安全漏洞，而其他兩種 XSS 都是因為伺服器而產生的安全風險。**

## 駭客實際利用XSS漏洞案例

![](/img/posts/jo/zerobased-cross-site-scripting/p2.png)
**photo by https://www.ithome.com.tw/news/139205**

與上期一樣的實際案例，以這個風險來做一個接續的說明，這個風險除了 CSRF 以外，也有儲存型 XSS 的風險，會允許駭客將惡意程式貼到討論區中，而當 User 以瀏覽器造訪頁面時，網頁便會在背景執行程式，卻看不到程式碼。

上期的 CSRF 就是預設主辦單位中了此類型的儲存型 XSS 的風險後，被 XSS 中的惡意程式竊取了權限，進而導致了 CSRF 的風險，使 Hacker 能夠以主辦單位的權限執行操作。

## 防範XSS的準則

1.  做好欄位輸入的驗證與檢查，不論是前後端都應假設輸入是惡意且不可信任的，例如：URL、檔案上傳、表單欄位、留言板等。

2.  文法與語意：應確認每個網頁表單輸入欄位是否為合理的資料類型與內容，例如：年齡的欄位在文法上應只接受0–9的數字，而語意上應確認此數字介於 0–120。

3.  像上述所說明的任何輸入和其他難以定義文法的自由格式，都應該要經過編碼成為純字符串來處理，防止內容被當作程式碼執行，許多程式框架都有提供內建的編碼函式庫，可以依自己的慣用語言程式查找並多加利用。

4.  絕對不要將使用者的輸入放入 註解、屬性名稱、標籤名稱 等，因為這些位置都能將字符串作為程式碼運行  
    另外，於伺服器上可作以下設定增強**瀏覽器**的防護：  
    •對 cookie 設定 HttpOnly 的屬性，確保程式碼沒有存取權  
    •設定內容安全策略（CSP）的標頭，明確定義允許瀏覽器在該頁面上加載的內容來源，涵蓋的類型包括 JavaScriptCSS、HTML框架、字體、圖片和可嵌入對象，例如 Java applet、ActiveX等。

## 名詞解釋

**註1**：Browser Render：瀏覽器渲染（ browser render ）是將 URL 對應的各種資源，通過瀏覽器的渲染引擎進行解析，輸出視覺化的影象，渲染引擎包括像是 HTML 直譯器、佈局（ layout ）、CSS 直譯器和 JavaScript 引擎。

**註2**：HTML Encoder：這是為了避免特殊符號造成的顯示問題，以及避免HTML 將 URL 中的特殊符號視為語法而產生的編碼，範例如下：

```txt
<script>alert(1);</script> 
```
會被轉換成
```txt
%3Cscript%3Ealert(1)%3B%3C%2Fscript%3E
```

但在這裡 Hacker 會反其道而行故意將要輸入在 URL 的特殊符號先轉換成 HTML Encoder 輸入，讓 WebSever 解析成特殊符號，進而進行 XSS 攻擊。

**註3**：DOM：DOM 全名為 Document Object Model，是用來描述 HTML 文件的表示法，可以使用 JavaScript 來動態產生完整的網頁，而不必透過伺服器，簡單來說就是把一份 HTML 文件中的各種標籤及文字、圖片等，都定義成一個個網頁物件，而這些物件最終會成為一個樹狀結構，範例如下：

![](/img/posts/jo/zerobased-cross-site-scripting/p3.png)

## 總結

講完了 CSRF 和 XSS 這對兄弟，接著下一篇會說明網頁安全三本柱 Secure 、 samsite 、 Httponly 他們之間不得不說的故事，再之後會提到關於內容安全策略（CSP）和跨域資源共用（CORS）與網頁安全的關係。

## 延伸閱讀

### 零基礎資安系列（一）- 認識 CSRF（Cross Site Request Forgery）

> [認識 CSRF(Cross Site Request Forgery )](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-request-forgery)

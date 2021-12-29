---
title: 防止 XSS 可能比想像中困難
date: 2021-05-15
tags: [Security, Front-end]
author: huli
layout: zh-tw/layouts/post.njk
---

## 前言

如果你不知道什麼是 XSS（Cross-site Scripting），簡單來說就是駭客可以在你的網站上面執行 JavaScript 的程式碼。既然可以執行，那就有可能可以把使用者的 token 偷走，假造使用者的身份登入，就算偷不走 token，也可以竄改頁面內容，或是把使用者導到釣魚網站等等。

要防止 XSS，就必須阻止駭客在網站上面執行程式碼，而防禦的方式有很多，例如說可以透過 CSP（Content-Security-Policy）這個 HTTP response header 防止 inline script 的執行或是限制可以載入 script 的 domain，也可以用 [Trusted Types](https://web.dev/trusted-types/) 防止一些潛在的攻擊以及指定規則，或是使用一些過濾 XSS 的 library，例如說 [DOMPurify](https://github.com/cure53/DOMPurify) 以及 [js-xss](https://github.com/leizongmin/js-xss)。

但是用了這些就能沒事了嗎？是也不是。

如果使用正確那當然沒有問題，但若是有用可是設定錯誤的話，還是有可能存在 XSS 的漏洞。

<!-- summary -->
前陣子我剛從公司內轉到一個做資安的團隊 [Cymetrics](https://cymetrics.io/zh-tw)，在對一些網站做研究的時候發現了一個現成的案例，因此這篇就以這個現成的案例來說明怎樣叫做錯誤的設定，而這個設定又會帶來什麼樣的影響。
<!-- summary -->

## 錯誤的設定，意料之外的結果

[Matters News](https://matters.news/) 是一個去中心化的寫作社群平台，而且所有的程式碼都有[開源](https://github.com/thematters)！

像是這種部落格平台，我最喜歡看的是他們怎麼處理內容的過濾，秉持著好奇跟研究的心態，可以來看看他們在文章跟評論的部分是怎麼做的。

Server 過濾的程式碼在這邊：[matters-server/src/common/utils/xss.ts](https://github.com/thematters/matters-server/blob/bf49f129eb63acaab707609f6a12fced7aaf0f4c/src/common/utils/xss.ts)：

``` js
import xss from 'xss'

const CUSTOM_WHITE_LISTS = {
  a: [...(xss.whiteList.a || []), 'class'],
  figure: [],
  figcaption: [],
  source: ['src', 'type'],
  iframe: ['src', 'frameborder', 'allowfullscreen', 'sandbox'],
}

const onIgnoreTagAttr = (tag: string, name: string, value: string) => {
  /**
   * Allow attributes of whitelist tags start with "data-" or "class"
   *
   * @see https://github.com/leizongmin/js-xss#allow-attributes-of-whitelist-tags-start-with-data-
   */
  if (name.substr(0, 5) === 'data-' || name.substr(0, 5) === 'class') {
    // escape its value using built-in escapeAttrValue function
    return name + '="' + xss.escapeAttrValue(value) + '"'
  }
}

const ignoreTagProcessor = (
  tag: string,
  html: string,
  options: { [key: string]: any }
) => {
  if (tag === 'input' || tag === 'textarea') {
    return ''
  }
}

const xssOptions = {
  whiteList: { ...xss.whiteList, ...CUSTOM_WHITE_LISTS },
  onIgnoreTagAttr,
  onIgnoreTag: ignoreTagProcessor,
}
const customXSS = new xss.FilterXSS(xssOptions)

export const sanitize = (string: string) => customXSS.process(string)
```

這邊比較值得注意的是這一段：

``` js
const CUSTOM_WHITE_LISTS = {
  a: [...(xss.whiteList.a || []), 'class'],
  figure: [],
  figcaption: [],
  source: ['src', 'type'],
  iframe: ['src', 'frameborder', 'allowfullscreen', 'sandbox'],
}
```

這一段就是允許被使用的 tag 跟屬性，而屬性的內容也會被過濾。例如說雖然允許 iframe 跟 src 屬性，但是 `<iframe src="javascript:alert(1)">` 是行不通的，因為這種 `javascript:` 開頭的 src 會被過濾掉。

只看 server side 的沒有用，還需要看 client side 那邊是怎麼 render 的。

對於文章的顯示是這樣的：[src/views/ArticleDetail/Content/index.tsx](https://github.com/thematters/matters-web/blob/0349fd87cc4737ff9509ec5eae2c2d4bda9de057/src/views/ArticleDetail/Content/index.tsx)）

``` js
<>
  <div
    className={classNames({ 'u-content': true, translating })}
    dangerouslySetInnerHTML={{
      __html: optimizeEmbed(translation || article.content),
    }}
    onClick={captureClicks}
    ref={contentContainer}
  />

  <style jsx>{styles}</style>
</>
```

Matters 的前端使用的是 React，在 React 裡面所 render 的東西預設都已經 escape 過了，所以基本上不會有 XSS 的洞。但有時候我們不想要它過濾，例如說文章內容，我們可能會需要一些 tag 可以 render 成 HTML，這時候就可以用 `dangerouslySetInnerHTML`，傳入這個的東西會直接以 innerHTML 的方式 render 出來，不會被過濾。

所以一般來說都會採用 js-xss + dangerouslySetInnerHTML 這樣的做法，確保 render 的內容儘管是 HTML，但不會被 XSS。

這邊在傳入 dangerouslySetInnerHTML 之前先過了一個叫做 optimizeEmbed 的函式，可以繼續往下追，看到 [src/common/utils/text.ts](https://github.com/thematters/matters-web/blob/0349fd87cc4737ff9509ec5eae2c2d4bda9de057/src/common/utils/text.ts#L89)：

``` js
export const optimizeEmbed = (content: string) => {
  return content
    .replace(/\<iframe /g, '<iframe loading="lazy"')
    .replace(
      /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g,
      (match, src, offset) => {
        return /* html */ `
      <picture>
        <source
          type="image/webp"
          media="(min-width: 768px)"
          srcSet=${toSizedImageURL({ url: src, size: '1080w', ext: 'webp' })}
          onerror="this.srcset='${src}'"
        />
        <source
          media="(min-width: 768px)"
          srcSet=${toSizedImageURL({ url: src, size: '1080w' })}
          onerror="this.srcset='${src}'"
        />
        <source
          type="image/webp"
          srcSet=${toSizedImageURL({ url: src, size: '540w', ext: 'webp' })}
        />
        <img
          src=${src}
          srcSet=${toSizedImageURL({ url: src, size: '540w' })}
          loading="lazy"
        />
      </picture>
    `
      }
    )
}
```

這邊採用 RegExp 把 img src 拿出來，然後用字串拼接的方式直接拼成 HTML，再往下看 [toSizedImageURL](https://github.com/thematters/matters-web/blob/0349fd87cc4737ff9509ec5eae2c2d4bda9de057/src/common/utils/url.ts#L49)：

``` js
export const toSizedImageURL = ({ url, size, ext }: ToSizedImageURLProps) => {
  const assetDomain = process.env.NEXT_PUBLIC_ASSET_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ASSET_DOMAIN}`
    : ''
  const isOutsideLink = url.indexOf(assetDomain) < 0
  const isGIF = /gif/i.test(url)

  if (!assetDomain || isOutsideLink || isGIF) {
    return url
  }

  const key = url.replace(assetDomain, ``)
  const extedUrl = changeExt({ key, ext })
  const prefix = size ? '/' + PROCESSED_PREFIX + '/' + size : ''

  return assetDomain + prefix + extedUrl
}
```

只要 domain 是 assets 的 domain 並符合其他條件，就會經過一些字串處理之後回傳。

看到這邊，就大致上了解整個文章的 render 過程了。

會在 server side 用 js-xss 這套 library 進行過濾，在 client side 這邊則是用 dangerouslySetInnerHTML 來 render，其中會先對 img tag 做一些處理，把 img 改成用 picture + source 的方式針對不同解析度或是螢幕尺寸載入不同的圖片。

以上就是這個網站 render 文章的整個過程，再繼續往下看之前你可以想一下，有沒有什麼地方有問題？

== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  
== 防雷分隔 ==  

## 第一個問題：錯誤的屬性過濾

你有發現這邊的過濾有問題嗎？

``` js
const CUSTOM_WHITE_LISTS = {
  a: [...(xss.whiteList.a || []), 'class'],
  figure: [],
  figcaption: [],
  source: ['src', 'type'],
  iframe: ['src', 'frameborder', 'allowfullscreen', 'sandbox'],
}
```

開放 iframe 應該是因為要讓使用者可以嵌入 YouTube 影片之類的東西，但問題是這個網站並沒有用 CSP 指定合法的 domain，因此這邊的 src 可以隨意亂填，我可以自己做一個網站然後用 iframe 嵌入。如果網頁內容設計得好，看起來就會是這個網站本身的一部分：

![](https://i.imgur.com/rivVdiC.png)

以上只是隨便填的一個範例，主要是讓大家看個感覺，如果真的有心想攻擊的話可以弄得更精緻，內容更吸引人。

如果只是這樣的話，攻擊能否成功取決與內容是否能夠取信於使用者。但其實可以做到的不只這樣，大家知道在 iframe 裡面是可以操控外面的網站嗎？

cross origin 的 window 之間能存取的東西有限，唯一能夠改變的是 `location` 這個東西，意思就是我們可以在 iframe 裡面，把嵌入你的網站重新導向：

``` html
<script>
  top.location = 'https://google.com'
</script>
```

這樣做的話，我就可以把整個網站重新導向到任何地方，一個最簡單能想到的應用就是重新導向到釣魚網站。這樣的釣魚網站成功機率是比較高的，因為使用者可能根本沒有意識到他被重新導向到其他網站了。

其實瀏覽器針對這樣的重新導向是有防禦的，上面的程式碼會出現錯誤：

> Unsafe attempt to initiate navigation for frame with origin 'https://matters.news' from frame with URL 'https://53469602917d.ngrok.io/'. The frame attempting navigation is targeting its top-level window, but is neither same-origin with its target nor has it received a user gesture. See https://www.chromestatus.com/features/5851021045661696.

> Uncaught DOMException: Failed to set the 'href' property on 'Location': The current window does not have permission to navigate the target frame to 'https://google.com'

因為不是 same origin，所以會阻止 iframe 對 top level window 做導向。

但是呢！這個東西是可以繞過的，會運用到 sandbox 這個屬性。這個屬性其實就是在指定嵌入的 iframe 有什麼權限，所以只要改成：`<iframe sandbox="allow-top-navigation allow-scripts allow-same-origin" src=example.com></iframe>`，就可以成功對 top level window 重新導向，把整個網站給導走。

這個漏洞在 [GitLab](https://ruvlol.medium.com/1000-for-open-redirect-via-unknown-technique-675f5815e38a) 與 [codimd](https://github.com/hackmdio/codimd/issues/1263) 都有出現過。

這邊的修正方式有幾個，第一個是可以先把 sandbox 這個屬性拿掉，讓這個屬性不能被使用。如果真的有地方需要用到的話，就需要檢查裡面的值，把比較危險的 `allow-top-navigation` 給拿掉。

再來的話也可以限制 iframe src 的位置，可以在不同層面做掉，例如說在程式碼裡面自己過濾 src，只允許特定 domain，或者是用 [CSP:frame-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-src) 讓瀏覽器把這些不符合的 domain 自己擋掉。

## 第二個問題：未過濾的 HTML

第一個問題能造成最大的危險大概就是重新導向了（codimd 那一篇是說在 Safari 可以做出 XSS 啦，只是我做不出來 QQ），但是除了這個之外，還有一個更大的問題，那就是這邊：

``` js
<>
  <div
    className={classNames({ 'u-content': true, translating })}
    dangerouslySetInnerHTML={{
      __html: optimizeEmbed(translation || article.content),
    }}
    onClick={captureClicks}
    ref={contentContainer}
  />

  <style jsx>{styles}</style>
</>
```

`article.content` 是經過 js-xss 過濾後的 HTML 字串，所以是安全的，但這邊經過了一個 `optimizeEmbed` 去做自訂的轉換，在過濾以後還去改變內容其實是一件比較危險的事，因為如果處理的過程有疏忽，就會造成 XSS 的漏洞。

在轉換裡面有一段程式碼為：

``` html
<source
  type="image/webp"
  media="(min-width: 768px)"
  srcSet=${toSizedImageURL({ url: src, size: '1080w', ext: 'webp' })}
  onerror="this.srcset='${src}'"
/>
```

仔細看這段程式碼，如果 `${toSizedImageURL({ url: src, size: '1080w', ext: 'webp' })}` 或是 `src` 我們可以控制的話，就有機會能夠改變屬性的內容，或者是新增屬性上去。

我原本想插入一個惡意的 src 讓 onerror 變成 `onerror="this.srcset='test';alert(1)"` 之類的程式碼，但我後來發現 picture 底下的 source 的 onerror 事件好像是無效的，就算 srcset 有錯也不會觸發，所以是沒用的。

因此我就把焦點轉向 srcSet 以及插入新的屬性，這邊可以用 `onanimationstart` 這個屬性，在 animation 開始時會觸發的一個事件，而 animation 的名字可以去 CSS 裡面找，很幸運地找到了一個 keyframe 叫做`spinning`。

因此如果 img src 為：`https://assets.matters.news/processed/1080w/embed/test style=animation-name:spinning onanimationstart=console.log(1337)`

結合後的程式碼就是：

``` html
<source
  type="image/webp"
  media="(min-width: 768px)"   
  srcSet=https://assets.matters.news/processed/1080w/embed/test 
  style=animation-name:spinning 
  onanimationstart=console.log(1337)
  onerror="this.srcset='${src}'"
/>
```

如此一來，就製造了一個 XSS 的漏洞：

![](https://i.imgur.com/nyugLUH.png)
![](https://i.imgur.com/iYLI0ku.png)

修補方式也有幾個：

1. 新增 CSP header 阻止 inline script 的執行（這比較難做到，因為可能會跟現有東西牴觸，需要較多時間處理）
2. 過濾傳進來的 img url（如果過濾不好一樣有風險）
3. 先改變 HTML，才去呼叫 js-xss 幫你濾掉不該存在的屬性

## 總結

我們找到了兩個漏洞：

1. 透過 `<iframe>` 把使用者導到任意位置
2. 透過 `<source>` 執行文章頁面的 XSS 攻擊

那實際上到底可以做到什麼樣的攻擊呢？

可以先用第二個漏洞發表一篇有 XSS 攻擊的文章，再寫一個機器人去所有文章底下留言，利用 `<iframe>` 把使用者導到具有 XSS 的文章。如此一來，只要使用者點擊任何一篇文章都會被攻擊到。

不過網站本身其他地方的防禦做得不錯，儘管有 XSS 但 Cookie 是 HttpOnly 的所以偷不走，修改密碼是用寄信的所以也沒辦法修改密碼，似乎沒辦法做到真的太嚴重的事情。

許多過濾 XSS 的 library 本身是安全的（雖然有些時候其實還是會被發現[漏洞](https://portswigger.net/research/bypassing-dompurify-again-with-mutation-xss)），但使用 library 的人可能忽略了一些設定或者是額外做了一些事情，導致最後產生出來的 HTML 依然是不安全的。

在處理與使用者輸入相關的地方時，應該對於每一個環節都重新檢視一遍，看看是否有疏忽的地方。

CSP 的 header 也建議設定一下，至少在真的被 XSS 時還有最後一道防線擋住。雖然說 CSP 有些規則也可以被繞過，但至少比什麼都沒有好。

Matters 有自己的 [Bug Bounty Program](https://github.com/thematters/developer-resource/blob/master/SECURITY.md)，只要找到能證明危害的漏洞都有獎金可以拿，這篇找到的 XSS 漏洞被歸類在 High，價值 150 元美金。他們團隊相信開源能惠及技術人員，也能讓網站更安全，因此希望大家知道這個計畫的存在。

最後，感謝 Matters 團隊快速的回覆以及處理，也感謝 Cymetrics 的同事們。

時間軸：

* 2021–05–07 回報漏洞
* 2021–05–12 收到 Matters 團隊確認信，正在修補漏洞
* 2021–05–12 詢問修補完是否能發表文章，獲得許可
* 2021–05–13 修復完成


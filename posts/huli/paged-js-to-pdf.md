---
title: 用 Paged.js 做出適合印成 PDF 的 HTML 網頁
date: 2018-09-30
tags: [Front-end, JavaScript]
author: huli
layout: layouts/post.njk
image: https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg
---
<!-- summary -->
## 前言

之前在公司內接到了一個需求，需要產生出一份 PDF 格式的報告。想要產一份 PDF 有很多種做法，例如說可以先用 Word 做，做完之後再轉成 PDF。但我聽到這需求時，最先出現的想法就是寫成網頁，然後再利用列印功能轉成 PDF。

我在前公司的時候看過一個用 JS 來產生 PDF 的專案，是用 [PDFKit](https://pdfkit.org/) 來做，自由度極高，但我覺得滿難維護的。原因是用這一套的話，就有點像是把 PDF 畫出來，你要指定 (x,y) 座標去畫東西，可能改一個小地方，就要改很多行程式碼。

那時候我想說怎麼不直接用最簡單的 HTML + CSS 就好，切好版之後再轉成 PDF，如果不想手動轉，也可以透過 headless chrome 去轉，因為是網頁的關係所以應該滿好維護的。而且排版的話因為是用 HTML 跟 CSS，應該會比用畫的簡單許多才對。

直到我後來接觸到網頁轉 PDF，才發現事情不像我想的這麼簡單。

<!-- summary -->
<!-- more -->

## 目標

先讓大家知道一下最後需要產生的報告長什麼樣子是很重要的，因為這樣才能評估每一項技術是否能達成這個需求。

底下先大概講一下我預期中要達到的功能，也就是報告最後的長相。

第一，要有一個封面頁，不能有頁首頁尾跟頁碼，而且內容要置中。

第二，要可以自訂每一頁的頁首跟頁碼格式，還要可以設定頁尾，像這樣：

![](https://static.coderbridge.com/img/aszx87410/fb7f9b13e57943d1a576f38545fc09b3.png)

第三，表格的地方如果跨頁，要自動重複顯示 table head：

![](https://static.coderbridge.com/img/aszx87410/7dfbc8b6f4af4b18b4a1bf391126d18b.png)

或大家也可以直接看看最後 PDF 長什麼樣子：https://aszx87410.github.io/demo/print/print_demo.pdf

知道目標之後，就可以來研究一下該怎麼達成這些功能。

## HTML 網頁轉 PDF - 利用原生功能 @media print

因為對這一塊不熟，所以先 Google 了一些中文文章來看，包括：

1. [CSS - 網頁列印與樣式](https://ithelp.ithome.com.tw/articles/10232006)
2. [其實Css的內心還住著一位Print](https://ithelp.ithome.com.tw/articles/10198913)
3. [原來前端網頁列印，不是只要 window.print() 就好了](https://medium.com/unalai/%E5%8E%9F%E4%BE%86%E5%89%8D%E7%AB%AF%E7%B6%B2%E9%A0%81%E5%88%97%E5%8D%B0-%E4%B8%8D%E6%98%AF%E5%8F%AA%E8%A6%81-window-print-%E5%B0%B1%E5%A5%BD%E4%BA%86-7af44cacf43e)
4. [@media print 你是誰？](https://tsengbatty.medium.com/media-print-%E4%BD%A0%E6%98%AF%E8%AA%B0-ae093fab85b8)
5. [關於 @media print 的二三事..](https://kakadodo.github.io/2018/03/13/css-media-print-setting/)
6. [透過 CSS 列印(print) 設定網頁列印時的樣式](https://penghuachen.github.io/2020/12/10/%E9%80%8F%E9%81%8E-CSS-%E5%88%97%E5%8D%B0-print-%E8%A8%AD%E5%AE%9A%E7%B6%B2%E9%A0%81%E5%88%97%E5%8D%B0%E6%99%82%E7%9A%84%E6%A8%A3%E5%BC%8F/)

重點大概就是利用 CSS `@media print` 去做設定，然後可以設置什麼時候換頁，以及記得勾選一些設定才能把背景顯示出來。

我自己稍微嘗試了一下這些做法，發現這些可以處理基本的需求，但如果需求再複雜一點就沒辦法了。

舉例來說，如果我想自訂每一頁的頁首頁尾，該怎麼辦？每一頁的頁首跟頁尾都有可能不一樣。如果我事先可以規劃多少內容一頁的話，或許還有機會解決，但如果不行呢？例如說我有一個很長的列表，我根本不知道會有幾頁，那該怎麼做？

關於頁首頁尾，我有找到這篇：[The Ultimate Print HTML Template with Header & Footer](https://medium.com/@Idan_Co/the-ultimate-print-html-template-with-header-footer-568f415f6d2a) 確實有幫助，但沒辦法解決頁碼的問題。

上面的這些做法，頁碼就是靠著列印時勾選瀏覽器預設的頁碼，然後標題就是網頁的標題或是網址，這些樣式我該怎麼客製化？例如說我想把頁碼換位置，做得到嗎？

後來我在網路上搜尋過一輪，發現這些似乎不是原生 CSS 可以解決的狀況。於是我把方向轉成：「先用 HTML 印出沒有頁碼的 PDF，再從後端加工處理」。因為已經有 PDF 了，所以自然而然也可以知道有幾頁，那就可以用開頭說的 PDFKit 或是其他 library 加上去了。意思就是先轉成 PDF，再加工，需要有兩道程序。

我還找到了一套 [WeasyPrint](https://github.com/Kozea/WeasyPrint/tree/master)，看起來好像也可以自訂頁首頁尾跟頁碼，不過依然不是理想中的解決方案。

正當我開始覺得：「這些只用前端網頁的話好像做不到」的時候，救星出現了。

## Paged.js，網頁列印排版的最佳解決方案

[Paged.js](https://www.pagedjs.org/) 對自己的介紹是：

> Paged.js is a free and open source JavaScript library that paginates content in the browser to create PDF output from any HTML content. This means you can design works for print (eg. books) using HTML and CSS!

> Paged.js follows the Paged Media standards published by the W3C (ie the Paged Media Module, and the Generated Content for Paged Media Module). In effect Paged.js acts as a polyfill for the CSS modules to print content using features that are not yet natively supported by browsers.

簡單來說呢，Paged.js 是一個開源的 JavaScript library，用來幫助你列印出 PDF。而嚴格來說它其實有很多的部分是 polyfill。事實上，W3C 已經有一些負責列印相關的 CSS 屬性，可是還處於草稿的階段，因此瀏覽器也還沒實作，所以需要靠著 Paged.js 來 polyfill。

先給大家看一下用 Paged.js 可以做到的成果是什麼：

1. demo 網站：https://aszx87410.github.io/demo/print/print.html
2. 產生出的 PDF：https://aszx87410.github.io/demo/print/print_demo.pdf

如果想要學習 Paged.js 的使用，我非常推薦去看官方文件，因為功能都寫在上面了，這篇文章只是想讓大家知道一下有這個解法，因此不會講得太多。底下就簡單講一下我想要的每個功能是怎麼實作出來的。

這些功能其實用圖片跟文字有點難解釋，因為我建議稍微看過之後，直接去看上面附的 demo 網站的 source code，我覺得會比較容易理解。

## 自訂每個頁面

原生的 CSS 好像只能統一對頁面調整，但是 Paged.js 支援針對各種頁面，比如說：

``` js
@page {
  size: A4;
  margin-top: 20mm;
  margin-bottom: 20mm;
  margin-left: 20mm;
  margin-right: 20mm;
  padding-top: 2rem;
}

@page:nth(1) {
  padding-top: 0;
}
```

我先針對所有頁面統一調整 margin 跟 padding，但是對第一頁取消 padding-top，因為第一頁是封面所以不需要 padding。

如果不想用頁數來做 selector，也可以直接幫頁面取名，像是這樣：

``` html
<div class="page-cover">
    ...
</div>
```

``` css
.page-cover {
  page: coverPage;
}

@page coverPage {
  padding-top: 0;
}
```

這樣做的話，就可以針對特定類型的頁面去做頁面樣式的控制。

## 自訂頁首及頁尾

Paged.js 會自動幫你把內容分頁，然後幫你把每一頁都加上預設的排版與 CSS 等等，而經過改造後的每一頁都會長這樣（圖片取自於官網）：

![](https://static.coderbridge.com/img/aszx87410/ab3c1b0e5274433f92d00c50f4213428.png)

Page area 是你的內容，而其他地方都是區塊的名稱，你可以用 CSS 來決定這些區塊要放什麼，舉例來說：

```  css
@page {
  @top-center {
    content: "hello";
  }
}
```

這樣寫的話，在每個頁面的中間上方都會出現：`hello` 這個字。

因此可以透過這樣子的 CSS，非常輕易就達成自訂頁首以及頁尾這個功能。不過這只是最基本的而已，精彩的還在後面。

很多時候只有文字是不夠的，我們還想要加一些樣式，或甚至是圖片。再者，每一頁的頁首跟頁尾都有可能不同，有可能這一頁的標題我想叫做 A，下一頁叫做 B，這樣怎麼辦呢？

在 Paged.js 裡面有個概念叫做：running headers/footers，可以利用這個概念來達成動態的頁首以及頁尾。

剛剛的 CSS 本來 content 都會是固定的，現在可以改一下：

``` css
@page {
  @top-center {
    content: element(title);
  }
}
```

這樣寫的話，中間的內容就會是叫做 title 的 element。那這個 element 又是什麼呢？一樣用 CSS 指定即可：

``` css
.title {
  position: running(title);
  color: white;
  font-size: 1.25rem;
}
```

這邊有個大家應該沒看過的 position 值，叫做 `running(title)`，意思就是要把 `.title` 這個元素設定成 running title，對應到了剛剛的 `element(title)`。

因此只要把每一頁的 title 都放在 HTML 裡面，就會自動去抓它的內容，然後放在你想放置的位置。

``` html
<div class="page">
    <div class="title">這是第一頁標題</div>
    第一頁內容
</div>
<div class="page">
    <div class="title">這是第二頁標題</div>
    第二頁內容
</div>
```

上面的那兩個 title class 的 div，就不會出現在文件的內容中，而是會被拉到 top center 那個位置。而 title 的內容也會隨著頁面而變，是個超級方便的功能！

範例中的頁尾則是這樣做的：

``` css
@page {
  @bottom-left {
    content: element(footer);
  }
}

.footer {
  position: running(footer);
  font-size: 1rem;
  color: #999;
  border-top: 2px solid #ccc;
}
```

``` html
<div class="footer">
  <p>本文件僅供教學使用，請勿用於商業之用途</p>
</div>
```

除了內容可以客製以外，那幾格的樣式也可以。例如說範例中我把整個 header 的背景顏色都變了，因為這幾個格子其實都有預設的 class，因此可以透過 CSS 來做：

``` css
.pagedjs_page:not([data-page-number="1"]) .pagedjs_margin-top-left-corner-holder,
.pagedjs_page:not([data-page-number="1"]) .pagedjs_margin-top,
.pagedjs_page:not([data-page-number="1"]) .pagedjs_margin-top-right-corner-holder {
  background: #658db4;
  outline: 2px #658db4;
}
```

這邊前面會加上 `.pagedjs_page:not([data-page-number="1"])` 是因為第一頁我不想動到，所以用這個 selector 排除了第一頁。而那個 outline 是因為我發現有時候好像 header 會有一條白色，猜測可能是 render 的問題，所以想說看能不能硬把它蓋掉：

![](https://static.coderbridge.com/img/aszx87410/1809c0aa81244436a0676d8f121e34d6.png)

## 自訂頁碼

關於頁碼的部分，Paged.js 提供了兩個 CSS counter 可以使用：`counter(page)` 與 `counter(pages)`。

如果想跟範例一樣在右上角加上頁數，就可以這樣寫：

``` css
@page {
  @top-right {
    color: white;
    content: "第 " counter(page) " 頁，共 " counter(pages) " 頁";
  }
}
```

這樣就可以做到在任意地方加上頁碼了！而且可以自訂格式，如果要調整樣式的話也可以直接調整。

## Table head 自動延續

其實有關於 table head 會自動延續這個功能，使用原生的 HTML table 標籤時就有了。只是 Paged.js 可能處理上有一些問題，所以這功能就不見了。

但要加回來也不難，我有找到一段簡單的程式碼可以解掉這個問題，來源：[Repeat table header on subsequent pages](https://gitlab.pagedmedia.org/tools/pagedjs/issues/84#note_535)

``` html
<script>
  // @see: https://gitlab.pagedmedia.org/tools/pagedjs/issues/84#note_535
  class RepeatingTableHeaders extends Paged.Handler {
    constructor(chunker, polisher, caller) {
      super(chunker, polisher, caller);
    }

    afterPageLayout(pageElement, page, breakToken, chunker) {
      // Find all split table elements
      let tables = pageElement.querySelectorAll("table[data-split-from]");

      tables.forEach((table) => {
        // Get the reference UUID of the node
        let ref = table.dataset.ref;
        // Find the node in the original source
        let sourceTable = chunker.source.querySelector("[data-ref='" + ref + "']");
        // Find if there is a header
        let header = sourceTable.querySelector("thead");
        if (header) {
          // Clone the header element
          let clonedHeader = header.cloneNode(true);
          // Insert the header at the start of the split table
          table.insertBefore(clonedHeader, table.firstChild);
        }
      });

    }
  }

  Paged.registerHandlers(RepeatingTableHeaders);
</script>
```

HTML 的部分記得用 table 來做就好，像這樣：

``` html
<table>
  <thead>
    <tr>
      <th>網址</th>
      <th>文章名稱</th>
      <th>瀏覽次數</th>
      <th>跳出率</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>blog.huli.tw</td>
      <td>CORS 完全手冊（一）：為什麼會發生 CORS 錯誤？</td>
      <td>34532</td>
      <td>52.3%</td>
    </tr>
  </tbody>
</table>
```

## 結語

以上幾個示範程式碼都滿短的，而且大多數都是 CSS，用這套之前還真的沒想過可以透過 CSS 來調整這麼多東西。

我自己用過 Paged.js 這套以後十分滿意，是我目前認為純前端做 HTML 轉 PDF 版型的最佳方案，原因之一就是我前面說的，除了它之外，我沒有找到其它套件可以支援自訂頁首頁尾以及頁碼等等。這套用起來真的很驚艷，因為我想解決的需求，它都有提供解決方案，而且用起來其實還滿好用的。

唯一美中不足的地方大概就是上面有些截圖會看到的那個大概 1px 的白線，我猜應該是瀏覽器 render 的時候有一些問題之類的，或搞不好也跟 PDF viewer 什麼的有關。但那個如果真的想蓋掉應該不是難事，最麻煩頂多就是硬畫一條線上去蓋住。

我自己需要的功能都放在範例裡面了，想看完整範例程式碼的話我放在這邊：https://github.com/aszx87410/demo/blob/master/print/print.html

想要其他更多功能的話，可以參考 Paged.js 的文件跟官網：https://www.pagedjs.org/

這篇推薦給所有跟我有類似需求的人，希望 Paged.js 也可以解決你們的問題。或如果你有知道哪些純前端的套件比 Paged.js 更好用的，也可以推薦給我。


# Cymetrics 技術部落格

## 開發

```
npm install
npm run watch
``` 

## 部署

只要把 code push 之後就會自動透過 Netlify 進行部署。

## 該如何新增作者？

每一個作者都會有個 unique 的 key 來識別，這邊假設 key 是 peter。

1. 把個人大頭貼放到 `img/authors` 裡面
2. 打開 `_data/metadata.json`，在 `authors` 陣列裡面新增一個 object，格式可參考其他物件，key 是 `peter`
3. 在 `posts/` 資料夾底下新增 `peter` 資料夾，並複製其他資料夾的 `index.njk`，內容會是作者的個人頁面，可自由客製化
4. 在 `img/posts` 資料夾底下新增 `peter` 資料夾，文章的圖片可以放到這裡面

## 該如何發文？

一樣假設作者的 key 是 `peter`

1. 把 repo clone 下來
2. 在 `posts/peter` 裡面新增 markdown 檔案，開頭 frontmatter 格式請參考下面
3. 完成之後 commit + push 就會觸發部署流程，大約五分鐘後可以在 production 上看到改動

## 文章 frontmatter 格式

```
title: 用 Paged.js 做出適合印成 PDF 的 HTML 網頁 // 標題
date: 2018-09-30 // 發文日期
tags: [Front-end, JavaScript] // 標籤
author: huli // 作者 key
layout: layouts/post.njk // 這固定不變
```

## 摘要功能
使用一對 `<!-- summary -->` 可以選擇將一部分內容顯示在摘要區中。

```
<!-- summary -->
Hi，這是 ErrorBaker 技術共筆部落格，由一群希望藉由共筆部落格督促自己寫文章的人們組成。
<!-- summary -->

部落格的主題以 web 前後端主題居多，但其實只要是跟技術有關的主題都有可能出現。
```

如果想要顯示的摘要的內容不在文章裡面，可以使用 comment 指定：

```
<!-- summary -->
<!-- 我是會吸引人點進文章，但沒有整段出現在文章裡的摘要 -->
<!-- summary -->
```

使用 comment 指定的摘要支援 HTML，例如`<code>`等。 結尾的 `-->` 目前不可省略。

另外，`<!-- summary -->` 和 comment 標籤中的半形空白是必須的。

## 如何客製化？

### 模板

`_includes` 裡面都是 layout 相關的東西，請注意可能會牽一髮動全身，裡面主要會是各個頁面的 template。

### 樣式

css/main.css 所有的樣式都在裡面，有新增的都放在最下面

## 參考資源

1. [Eleventy Documentation](https://www.11ty.dev/docs/collections/)
2. [Nunjucks 文件](https://mozilla.github.io/nunjucks/templating.html)

fork from [error-baker-blog](https://github.com/Lidemy/error-baker-blog)

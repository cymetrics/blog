# Cymetrics 技術部落格

網址：https://tech-blog.cymetrics.io/

## 開發

```
npm install
npm run watch
``` 

## 部署

只要把 code push 之後就會自動透過 GitHub actions 部署到 GitHub Pages。

## 產生臉書預覽圖

請執行以下指令，第一個參數帶你的作者 id，第二個帶文章檔名

```
npm run og-image -- "huli" "how-i-hacked-glints-and-your-resume"
```

英文請在最後面加上 "en"
```
npm run og-image -- "huli" "how-i-hacked-glints-and-your-resume" "en"
```

跑完之後，可以在 `og-image-generator/cover.png` 找到你的圖片

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
layout: zh-tw/layouts/post.njk // 這固定不變
image: /img/posts/huli/test/cover.png // 選填，會當作預覽圖
description: 這是一篇關於 Paged.js 的文章 // 選填
```

## 摘要功能
使用一對 `<!-- summary -->` 可以選擇將一部分內容顯示在摘要區中。

```
<!-- summary -->
應該有許多人都跟小明一樣，有過類似的疑惑。把舊密碼寄給我不是很好嗎，幹嘛強迫我換密碼？

這一個看似簡單的問題，背後其實藏了許多資訊安全相關的概念，就讓我們慢慢尋找問題的答案，順便學習一些基本的資安知識吧！
<!-- summary -->

這邊不會出現在摘要裡面
```

如果想要顯示的摘要的內容不在文章裡面，可以使用 comment 指定：

```
<!-- summary -->
<!-- 我是會吸引人點進文章，但沒有整段出現在文章裡的摘要 -->
<!-- summary -->
```

使用 comment 指定的摘要支援 HTML，例如`<code>`等。 結尾的 `-->` 目前不可省略。

另外，`<!-- summary -->` 和 comment 標籤中的半形空白是必須的。

## 多語系支援

目前支援兩個語系：中文跟英文

礙於原先沒有語系又不能做轉址，預設語系即為中文，英文的檔案都放置於 `en` 資料夾以及 `_includes/en` 裡面，要修改的時候必須兩份一起修改

英文文章請發表於 `en/posts/` 裡面，發表文章與中文相同


## 如何客製化？

### 模板

`_includes` 裡面都是 layout 相關的東西，請注意可能會牽一髮動全身，裡面主要會是各個頁面的 template。

### 樣式

css/main.css 所有的樣式都在裡面，有新增的都放在最下面

## 參考資源

1. [Eleventy Documentation](https://www.11ty.dev/docs/collections/)
2. [Nunjucks 文件](https://mozilla.github.io/nunjucks/templating.html)

此專案根據 [error-baker-blog](https://github.com/Lidemy/error-baker-blog) 以及 [eleventy-high-performance-blog](https://github.com/google/eleventy-high-performance-blog) 改寫而來


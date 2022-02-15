---
title: 關於我在 Glints 找到的高風險漏洞
date: 2022-02-08
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
description: 在 2021 年 7 月時我們發現了求職平台 Glints 的四個漏洞，可以讓攻擊者偷走平台上所有求職者的履歷，這篇記錄了漏洞發現的經過以及後續回報的狀況
image: /img/posts/huli/how-i-hacked-glints-and-your-resume/cover.png
---

<!-- summary -->
<!-- 在 2021 年 7 月時我們發現了求職平台 Glints 的四個漏洞，可以讓攻擊者偷走平台上所有求職者的履歷，這篇記錄了漏洞發現的經過以及後續回報的狀況 -->
<!-- summary -->

<div data-nosnippet>
2022-02-10 更新：修正標題為「關於我在 Glints 找到的高風險漏洞」，原標題是「我怎麼從 Glints 手中偷走你的履歷」
</div>

Glints 是一間總部位於新加坡的求職平台，2021 年年初的時候才剛拿到 [6.5 億新台幣](https://www.inside.com.tw/article/23099-glints-c-round)的投資，在台灣也有團隊負責徵才相關事項。

在 2021 年 7 月時我發現 Glints 有一個 [bug bounty program](https://security.glints.com/)，於是花了一些時間研究一下 Glints 的服務，最後找到了四個漏洞並且回報給了 Glints，這些漏洞可以造成的影響包括：

1. 查看平台上每一個職缺的所有應徵者資料，包括應徵者的姓名、電話、生日、履歷以及 email
2. 查看平台上所有 recruiter 的個人資料，包括姓名、職稱、所在的團隊以及 email

簡單來說，若是被有心人士利用這些漏洞，那基本上所有應徵者的個人資訊都會外洩。

接著，就讓我們來看看這些漏洞。

附註：文章所提及的漏洞在回報給 Glints 之後都已經修復。

## 1. 瀏覽職缺申請的權限控管不當，導致使用者資訊洩露

Glints 這個平台的使用者基本上分成兩種：雇主跟求職者，以目前來說任何人都可以直接在上面開一個雇主的帳號，只是職缺發布時還是會需要經由系統或人工審核，才會正式公開。

雇主有個後台可以管理職缺跟來應徵的求職者：

![portal](/img/posts/huli/how-i-hacked-glints-and-your-resume/p1-applications.png)

而查看應徵者資訊的 API URL 是這樣：`/api/recruiterats/jobApplications?where={"JobId":"55e137a1-f96e-4720-9b08-7eb2749e1557"}`

API 返回的部分資訊長這樣：

``` json
{
    "candidate": {
        "id": "44007523-f7a8-411d-b2c4-57c68a976534",
        "profilePic": "6f14ffc62f3f53d8dcb22a4bfc1da6c8.png",
        "firstName": "Peter",
        "lastName": "劉",
        "email": "abc123@yopmail.com",
        "phone": "+886-999999999",
        "resume": "cc042b7400c444619adedf79a9c1daf3.pdf",
        "salaryExpectation": null,
        "currencyCode": null,
        "recentJob": {
            "title": "工程師"
        },
        "lastSeen": "2021-07-22T01:58:14.859Z",
        "country": "Taiwan",
        "city": "Taipei"
    }
}
```

可以看到裡面有應徵者的姓名、電子郵件、電話跟履歷檔案名稱。

這時候我做了一件大家都會做的事情，就是把 JobId 換成別間公司的職缺，而 API 照常返回了資料：

![idor](/img/posts/huli/how-i-hacked-glints-and-your-resume/p2-idor.png)

那我們要怎麼拿到其他職缺的 JobId 呢？很簡單，因為這都是公開的。只要去到給求職者的網頁，就可以直接在 API 或是網址上看到職缺的 ID，像這樣：https://glints.com/tw/opportunities/jobs/consultant/55e137a1-f96e-4720-9b08-7eb2749e1557

假設我是攻擊者，就可以寫個腳本透過自動化的方式把 Glints 上所有職缺的 ID 都抓下來，然後再利用上面這個漏洞，就能抓到 Glints 上所有開放的職缺的應徵者資訊。

### 修補方式

後來 Glints 修正了這個 API，實作了 JobId 的檢查，確認使用者對於 JobId 所屬的公司有存取權限才回傳資料。

## 2. 應徵者資訊 RSS 的權限控管不當，導致使用者資訊洩露

Glints 提供了一個職缺應徵者的 RSS feed，方便雇主串接 Slack 或其他服務，就能看到某個職缺最新的應徵者資訊：

![rss](/img/posts/huli/how-i-hacked-glints-and-your-resume/p3-rss.png)

回傳的資訊有應徵者的姓名、電子郵件跟履歷，內容大概是這樣：

![rss content](/img/posts/huli/how-i-hacked-glints-and-your-resume/p4-rss-content.png)

而 RSS 的網址長這樣：`https://employers.glints.com/api/feed/jobs/{RSS_ID}/approved-candidates?UserId={companyOwnerId}`

需要這個職缺專屬的 RSS ID 跟所屬公司的管理員 ID 才能正確打開 RSS 的連結，而管理員 ID 很容易可以取得，因為公司資訊都是公開的，所以從 Glints 的公司頁面中可以直接看到公司管理員的 User ID，但是 RSS ID 要怎麼取得呢？

我發現有個拿公司底下職缺的 API 網址如下：`https://employers.glints.tw/api/companies/03638b7f-2da0-4b68-9e92-1be9350600ba/jobs?where={"status":"open"}&include=jobSalaries,Groups,City,Country`

從 API response、傳進去的參數跟欄位的命名這三點中，我推測背後用的應該是 [Sequelize](https://sequelize.org/) 這一套 Node.js 的 ORM，為什麼我會知道呢？因為我也用過這一套，像是 where 的規則跟 `include` 這個名稱，都是 Sequelize 的操作方式。

於是，我猜測後端有可能是直接把 query string 整個 object 丟進去 Sequelize 做處理，不過試了一下之後發現好像不是，還是有一些限制，但至少我新加的一個參數：attributes 有效！

attributes 這個參數在 Sequelize 裡面是決定回傳值要有哪些欄位，例如說 `attributes=id`，那回傳的資料裡面就只會有 ID，因此我在 attributes 裡面放上了 `rssId`，結果 response 裡面就真的出現這個欄位了：

![rss-id](/img/posts/huli/how-i-hacked-glints-and-your-resume/p5-rss-id.png)

因此，我們可以透過這個方式取得任意職缺的 RSS ID，那既然有了 RSS ID 跟公司管理員的 ID，跟上一個漏洞一樣，我們可以自動化去跑，就可以透過 RSS feed 來取得所有職缺的應徵者資訊。

### 修補方式

因為這個功能使用率極低，所以後來 Glints 直接把這功能拔掉了。

## 3. 使用者資訊洩露

前兩個漏洞都是從雇主那端才能利用的漏洞，而這一個則是任何人都可以利用。

當你在 Glints 求職平台註冊一個帳號以後，你會有一個 User ID 以及公開的個人頁面，像是這樣：https://glints.com/tw/profile/public/44007523-f7a8-411d-b2c4-57c68a976534

![public page](/img/posts/huli/how-i-hacked-glints-and-your-resume/p6-page.png)

網址列上的那一串 `44007523-f7a8-411d-b2c4-57c68a976534` 就是我的 User ID。

而有另外一個 API 也可以拿到使用者的公開資訊：https://glints.com/api/publicProfiles/44007523-f7a8-411d-b2c4-57c68a976534

![profile api](/img/posts/huli/how-i-hacked-glints-and-your-resume/p7-profile-api.png)

可以看出在 API 的回傳資訊中，已經有特別過濾掉具有敏感資訊的欄位，像是手機以及 email 等等，但卻有一個欄位忘記過濾掉，叫做 resume。這個欄位存的會是一個檔案名稱，像是這樣：`badf34128adefqcxsq.pdf`，而 Glints 上的履歷都放在同一個地方，網址的規則是： https://glints-dashboard.s3.ap-southeast-1.amazonaws.com/resume/xxxxx.pdf

換句話說，只要知道履歷的檔名，就可以拿到履歷的內容。因此，我只要知道某個使用者的 ID，我就可以透過上面的 API 拿到他的履歷檔名，再透過固定規則拿到履歷的檔案，而通常履歷上都會有 email 以及電話等等的資訊（有些甚至還有地址）。

可是，我們要怎麼知道使用者的 ID 呢？

有幾個方式，第一個是 Glints 在有些國家有論壇的功能，在論壇就可以透過 API 直接看到那些發文跟回文的人的 ID，第二個方式則是 Google。

因為個人頁面的網址規則都是一樣的，所以只要 google：`inurl:profile/public site:glints.com`，就能找到一大串的搜尋結果，就可以從網址中取得 User ID，並且透過 ID 拿到他們的履歷。

![google hacking](/img/posts/huli/how-i-hacked-glints-and-your-resume/p8-google.png)

### 修補方式

Glints 修改了 API 的回傳值，隱藏了 resume 欄位

## 4. 招募人員資料洩漏

上面幾個漏洞都是跟一般使用者有關的，我們來看看一個不一樣的。

除了 Glints 的主站以外，我也針對了 Glints 去做子網域的掃描，找到了一個頁面：https://superpowered.glints.com/

![website](/img/posts/huli/how-i-hacked-glints-and-your-resume/p9-website.png)

這頁面需要特定的 Google 帳號才能登入，看起來沒什麼機會，但我們可以從 JS 檔案裡面去尋找一些線索！通常這些檔案都是 minified 過的所以不好看懂，但我們可以直接用關鍵字搜尋，去找找看有沒有我們感興趣的資訊，我下的關鍵字是：`query`

![search query](/img/posts/huli/how-i-hacked-glints-and-your-resume/p10-query.png)

從關鍵字搜尋中，可以找到一個 GrapgQL 的 query 叫做 `findRecruiters`，而參數的部分也可以從程式碼中得知，或是也可以利用 error message 去慢慢試出來，整個 API 長這樣：

``` json
query {
    findRecruiters(input:{}) {
        id,
        email,
        role,
        displayName,
        fullName,
        jobTitle,
        jobStatus

        team {
            labels
        }
    }
}
```

從 JS 中找到了 API URL 跟 query 的格式，打了這個 API 之後，發現並沒有鎖權限。

從 response 中我們可以得到每一個招募人員的姓名、職稱、所屬的團隊以及 email：

![response](/img/posts/huli/how-i-hacked-glints-and-your-resume/p11-response.png)

### 修補方式

Glints 增加了權限控制，確保訪客無法取得相關資訊。

## 結語

這次在 Glints 發現的漏洞皆為權限控管相關的問題，當權限沒有管理好的時候，就很容易可以取得其他人的資訊。特別是對 Glints 這種求職平台來說，使用者的個人資訊價值比較高，因為履歷上通常都會有電話、姓名、email 或甚至是地址，有許多的個資都在上面。

也因為如此，這次發現的四個漏洞的嚴重程度都被評為「高」，一個的獎金是 400 SGD，總共是 1600 SGD，折合台幣約 32000 元。

最後，附上這次回報的時間軸：

* `2021-07-09` 第一次漏洞回報
* `2021-07-09` Glints 回信說正在調查漏洞
* `2021-07-13` Glints 回信確認漏洞存在，修復中
* `2021-07-14` 第二次漏洞回報
* `2021-07-20` Glints 回信確認所有我回報的漏洞的狀態，一個已修復，其他還在修
* `2021-08-18` 我第一次寫信去確認漏洞的最新狀況，無回應
* `2021-08-31` 我第二次寫信去確認漏洞的最新狀況，無回應
* `2021-09-09` 我第三次寫信去確認漏洞的最新狀況，無回應
* `2021-09-20` 我在他們的 GitHub repo 上開 issue 詢問 bug bounty program 是否還存在，無回應
* `2021-10-04` Glints 回信說他們在確認中，隔天會告訴我詳細狀況
* `2021-10-20` 上一封信之後無下文，因此我再次寄信詢問狀況
* `2021-10-26` 因距離漏洞回報已三個多月仍未修復且未告知修補狀況，我在個人社群平台上呼籲有用這服務的朋友們可以把個資刪掉以免外洩，隔天得到 co-founder 回應會盡快處理
* `2021-10-27` Glints 詢問我收款相關資訊
* `2021-11-11` 我確認收到其中一個漏洞的獎金，寫信詢問其他漏洞的狀況
* `2021-11-11` Glints 回信確認漏洞皆已修復
* `2021-12-07` 收到已修復漏洞的獎金
---
title: "政府投標必備：如何有效運用資安報告"
date: 2023-10-30
author: "ava"
tags: [Product]
layout: zh-tw/layouts/post.njk
---

![](/img/posts/ava/workflow.process/procurement.png)

## 前言：
<!-- summary -->
在當專案經理的這些時間裡，除了透過專案進行觀察到一些台灣企業對「資安」的看法與痛點之外，近期也有不少「[政府採購預算需單獨編列資安費](https://www.ithome.com.tw/news/158882) 」的新聞出現，內容重點大致分為三個：資安預算「獨立」、禁用陸資廠牌產品、陸資廠商不能參與標案，同時，政府也針對以往資安廠商投標的困境，做了制度上的改善，像是採用最有利標時不訂底價，及「創意」取代「回饋」項目，作為評選廠商的區隔。從這些政府的改變當中，不難看出資訊安全在台灣的重視程度是愈來愈高了。
<!-- summary -->
以目前接觸的客戶來看，大致上可以分為兩種類型，第一種被第三方（泛指客戶、合作夥伴、合作廠商、招標商）要求需檢視並提供企業或所交付之產品的資安概況的廠商; 第二種：廠商本身對資安的重視。我們目前碰到的客戶還是以前者為大宗，因此也就不免俗的會碰到客戶提出類似的問題：你們的檢測報告可以拿去投政府標案嗎？可以拿去合規嗎？有參考ISO27001這類的規定嗎？初期的訪談階段也會很常聽到：政府說要做，今年要開始編列預算了。已經一級一級壓下來了，現在輪到我們了。

## 政府投標背景
政府標案存在的原因，是因為政府本身也有資源有限的狀況，因此會需要委託民間的專業，來幫政府完成任務。想要被政府“委託”，就會需要經過一系列的流程，包含領標、投標、開標、決標、履約與驗收。這當中投標者會需要準備很多說明文件，甚至是簡報來向政府證明自己有能力接下政府的委託。

## 資安報告的基本概念
一個基本的資安報告通常會有幾個元素：
1. 基本的測試資訊：包含測試的標的、檢測的日期、檢測等地或分數，一些基本資訊列出
2. 風險細節描述：包含風險名稱、風險等級、風險說明、修補方式、以及資訊來源，主要是針對風險本身做描述與分類，讓使用者可以更快速理解風險本身，同時也可以評估修補的優先級順序。
3. 方法論：主要講述風險的評分或規劃是參考什麼樣的準則，給予使用者進一步的了解。

這些元素可以說是一個資安報告的雛形，更多的元素可能則是來自使用者或市場的反饋。以 Cymetrics 自身來說的話，主要的銷售市場還是以台灣居多，因此我們加入了普遍企業最為在意的「合規指標」，當然除了與客戶證實我們的測項都是基於 MITRE ATT&CK 之外，更能讓客戶快速了解自己如果要通過特定合規指標的話，還需要做哪些加強。

## 合規又是什麼？
「合規」就是要合乎規範，那為什麼合規如此重要呢？規範通常是一個通行的準則、一個認可的標準，就像法規一樣，是普遍大眾遵循的守則。因此，如果你合乎某某國際規範的話，基本上就代表你被普遍大家所依循的標準背書了。這樣聽起來好像還好，但實際上「合規」這件事的影響不單單只是這樣。延伸來看，它對你的企業信譽、海外市場、股東與投資人、風險管理等都有所影響。

如果今天A企業想推行海外市場並與當地B企業合作時，該如何向B企業證實自己家的東西具有安全性是很重要的，畢竟如果兩家企業之間任一遭受到攻擊，將有機會連帶影響到另外一間企業。因此，拿出一份能夠證實其合規的資安報告，會讓你的企業與合作夥伴之間多一份信任。當然，我們不能夠只單憑一份資安報告用個好幾十年來證實安全性。在資安世界中，最重要的其實是持續與定期性的監控與檢測，如果做不到持續這件事，那再好的資安檢測也沒辦法防止你被攻擊。

## 選擇適用的資安報告
在選擇適用的資安報告時，知道自己需要什麼才是最重要的。你會需要釐清獲得這份資安報告的目的是什麼？是為了向客戶或合作夥伴證實自己的安全性程度？還是你需要的是符合某一份標案的要求？目的性不同，都會影響到抉擇廠商時的考量，不同的投標項目又有分別看重的要點。舉例來說，政府依照[資通安全管理法](https://www.acw.org.tw/Match/Default.aspx?subID=38)，將公家機關分為A、B、C、D及E級，每一等級所要求的資安檢測頻率都不相同，有些可能是每半年一次，有些則是兩年一次。

最常見的就是當要交付軟體系統的時候，政府或企業客戶通常會要求廠商出示一份弱點掃描（或我們常說的網掃）報告，確認該系統的安全性，且漏洞皆已修復的依據。如果預算許可，還有可能會要求提供更深入的滲透測試報告。這邊會建議選擇一間業界普遍都有在使用的檢測廠商，或是選擇一間有上[政府共同供應契約的廠商](https://www.spo.org.tw/%E4%B8%8B%E8%BC%89%E5%B0%88%E5%8D%80/%E6%A8%99%E6%A1%88%E8%B3%87%E6%96%99%E4%B8%8B%E8%BC%89/%E6%B1%BA%E6%A8%99%E8%B3%87%E6%96%99/)。這兩種選擇的共同特點，是能夠確保他有經過一定程度的認可。

另外提一下，Cymetrics 的服務都有上到共同供應契約上！不論是市面上常見的弱點掃描亦或是滲透測試，都是我們服務的範圍。一般的滲透所需要花費的時間較長，但因為我們前期會投入自動化的工具協助進行第一階段的資訊探查，第二階段的人工攻擊就可以提升我們檢測的速度，因此檢測所需的時間就會較短，也因為工具的探查，我們可以縮短初測與複測之間的檢測落差。

## 資安報告的應用策略
投標時，通常會附上很多與標案相關的資訊文件，不論這個標案涉及到哪一個面向，我們都建議一併附上專案的服務檢測資訊。一來是能夠證實自己在資訊安全這塊的重視與安全度，二來是能夠提高彼此之間合作的信任度。

就像在相親時你只能透過見面的當下來認識你眼前的人，你對他的認識其實很有限，但如果這時他能夠拿出OO協會的會員證，告訴你我是OO協會的榮譽會員，那這時你應該會有一定程度的心安，至少可以確定他不是出來詐騙的。資安報告就像會員證，告訴對方你做過什麼檢測來驗證你的安全性與重視程度。當然，就像前面提到的，資安檢測是一個持續檢測與監控的循環，攻擊永遠都在更新與進步。

## 結論
江湖在走，資安檢測要有。不管你要不要投政府標案或任何標案，資安檢測都應該要確實執行，不光是為了自身企業的安全性，更是增加企業業務合作的可能，多給自己加一層保障與優勢，這是雙贏。投標的話就更不用說了，加上資安檢測報告已經快變成普遍的現象，已經不是你有你贏，而是你沒有你掰。必須再再再三強調，資安檢測不是一次性就好，真正的核心精神是持續性的檢測，才能達到最大化功效。

## 參考資料：

1. [【政府採購標案超入門】 什麼是政府標案？政府標案流程是什麼？](https://lichengyin.medium.com/%E6%94%BF%E5%BA%9C%E6%8E%A1%E8%B3%BC%E6%A8%99%E6%A1%88%E8%B6%85%E5%85%A5%E9%96%80-%E4%BB%80%E9%BA%BC%E6%98%AF%E6%94%BF%E5%BA%9C%E6%A8%99%E6%A1%88-%E6%94%BF%E5%BA%9C%E6%A8%99%E6%A1%88%E6%B5%81%E7%A8%8B%E6%98%AF%E4%BB%80%E9%BA%BC-739671ad956a)
2. [數位產業署軟體採購辦公室決標資料](https://www.spo.org.tw/%E4%B8%8B%E8%BC%89%E5%B0%88%E5%8D%80/%E6%A8%99%E6%A1%88%E8%B3%87%E6%96%99%E4%B8%8B%E8%BC%89/%E6%B1%BA%E6%A8%99%E8%B3%87%E6%96%99/)
3. [資通安全管理辦法懶人包](https://www.acw.org.tw/Match/Default.aspx?subID=38)
4. [政院拍板 政府採購預算單獨編列資安費用](https://news.ltn.com.tw/news/politics/breakingnews/4449249)
5. [政府資服採購作業指引9月公布，開始明定標案需獨立編列資安預算](https://www.ithome.com.tw/news/158882)
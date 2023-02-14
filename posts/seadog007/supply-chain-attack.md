---
title: Supply Chain Attack — 供應鏈攻擊是什麼？
date: 2023-02-14
tags: [Security]
author: seadog007
layout: zh-tw/layouts/post.njk
image: /img/posts/seadog007/supply-chain-attack/cover.png
---

<!-- summary -->
什麼是供應鏈攻擊，會出現在哪邊？我們又該如何防範呢？讓我們透過實際案例一起來看看程式開發流程中有可能會發生的攻擊，或者是哪些環節會有被供應鏈攻擊的可能吧！
<!-- summary -->

## 供應鏈攻擊 (Supply Chain Attack)
供應鏈攻擊，顧名思義就是通過攻擊一個組織的供應鏈來獲得該組織的敏感訊息，那什麼可能是你供應鏈的一部分呢？

- 假如你是作為一間公司的話：你的合作廠商、使用的軟體的供應商（Office、Adobe、ERP）、任何有可能接觸到你公司系統的組織（SI）、程式開發時使用的套件庫（npm、pip）
- 假如你是作為一個個人的話：使用的軟體的供應商（Office、Adobe、ERP）、程式開發時使用的套件庫（npm、pip）

根據資安木桶理論，整個系統內最脆弱的一部分，將會決定整個系統的安全性，對大公司而言，常常最弱的一部分並不是公司內部的系統，而是外部較無法控管的部分。

![](/img/posts/seadog007/supply-chain-attack/bucket.png)

我們以軟體公司與個人程式開發者最常用到的程式套件庫舉例，程式開發者撰寫程式時不可能一個程式從到到尾都用自己寫的程式碼，所以基本上都會引用別人所先寫好的程式碼片段，來避免再次重寫別人已經寫過相同功能的程式碼，也就是工程師所說再造輪子的情況發生。以 Python 開發來說，我們通常會用 pip 這個套件管理工具來安裝別人已經寫好的套件，而這其中其實存在不小風險，只要任一被引用的套件一但被攻擊者篡改，就可以影響很大的範圍。以 pip package matplotlib 為例，畫出來的套件引用樹的會像下圖這樣

![](/img/posts/seadog007/supply-chain-attack/matplotlib_dep_tree.png)
（pip package matplotlib 的依賴套件樹）

只要底下任一個套件被 Compremise 了，假設說是 six 好了，這時候任何利用 matplotlib 這個套件來畫圖的 Python 腳本，執行的電腦都有極大的機率被執行惡意指令碼？

## 套件管理系統的供應鏈攻擊 — 以 pip 為例
而套件相關的攻擊也有其他的攻擊方法，以 pip 這個工具為例子，公司內部常常有私有的 Repository（在 pip 這工具中叫 Index），或者是開發流程中可能會用到外部廠商的私人 Index，又或者是公開套件的 Beta 版所使用的 Beta Index
我們可以利用 pip 所設計有缺陷的機制，來覆蓋過這些私有 Index 的內容，將惡意軟體透過官方 Index 安裝至開發者電腦上
pip 這個工具可以自訂所謂的 Index，也就是私有的 Index，抓取套件的地方。但因為 pip 套件管理工具預設會先使用官方的 Index，當同個套件名稱同時出現在 Private Index 與 Official Index 時，會先抓取較新的套件。
藉由此機制我們若知道企業內部使用的套件名稱，我們則可以在官方 index 上架一個相同名稱但版本號較高的套件，來將惡意軟體植入至企業內部。

在這範例中，企業內部有一個自己的私有 Index (pip.seadog007.me)
上面有一個放一個套件叫 seadog007-pack，其內容為
![](/img/posts/seadog007/supply-chain-attack/demo_1.png)


當今天開發者想要使用這個名叫 seadog007-pack 的私有套件時
可以在 ~/.pip/pip.conf 中加入這個私有 Repository
![](/img/posts/seadog007/supply-chain-attack/demo_2.png)

即可利用 pip 將此套件安裝起來（可觀察此處安裝的為 0.0.1 版）
![](/img/posts/seadog007/supply-chain-attack/demo_3.png)

並測試使用
![](/img/posts/seadog007/supply-chain-attack/demo_4.png)

但假使今天攻擊者知道了企業內部使用的這個套件名稱（seadog007-pack）
攻擊者可以在 pip 官方的 Repostory (pypi.org) 放置一個同樣名稱但版本較高的套件
![](/img/posts/seadog007/supply-chain-attack/demo_5.png)

如此一來當今天有人安裝 seadog007-pack 這個套件包時，安裝到的則會是新版1.0.0 的版本
![](/img/posts/seadog007/supply-chain-attack/demo_6.png)

而這個惡意套件包內容為
![](/img/posts/seadog007/supply-chain-attack/demo_7.png)

當開發者引入這個套件包時，就有可能遭受到攻擊
![](/img/posts/seadog007/supply-chain-attack/demo_8.png)

## 真實發生過的例子
套件攻擊相關的供應鏈攻擊也層出不窮，從比較無害的阿里集團 JS 網頁開發套件 AntDesign 聖誕節彩蛋
[程序员怒了！阿里 Antd 圣诞彩蛋害我被离职了！](https://zhuanlan.zhihu.com/p/53262709)

到比較具有傷害性的 Pytorch Nightly 的開發版本遭利用
[Compromised PyTorch-nightly dependency chain between December 25th and December 30th, 2022.
](https://pytorch.org/blog/compromised-nightly-dependency/)

而其他針對大公司的供應鏈攻擊也不少，例如美國軟體大廠 SolarWinds 也曾遭受到供應鏈攻擊
[SolarWinds attack explained: And why it was so hard to detect](https://www.csoonline.com/article/3601508/solarwinds-supply-chain-attack-explained-why-organizations-were-not-prepared.html)

供應鏈攻擊在我們生活中其實相對並沒有那麼容易防範，畢竟誰也不會想到，電腦買來內建的更新軟體，也有可能因為供應商（電腦製造商）被駭，某一天推送包含惡意程式的更新包進到你電腦。
[ASUS Software Updates Used for Supply Chain Attacks](https://symantec-enterprise-blogs.security.com/blogs/threat-intelligence/asus-supply-chain-attack)

如果今天是微軟被駭，利用 Windows 更新推送惡意軟體呢？那影響範圍要如何掌握與控制呢？

## 總結
因較有規模的廠商在近幾年已越來越注重自己公司的資安，甚至有資安相關的部門，這也讓直接攻擊廠商變得較難以實行。越來越多的駭客團體逐漸轉向針對廠商的供應鏈發動攻擊。但也有越來越多公司逐漸注意到這類型的弱點，進而逐步加入對軟體供應商的資安限制等。現在也有越來越多的假冒套件，利用套件名稱內容易打錯的字來植入到套件樹中，這些都可以透過定期檢視套件樹或導入 SSDLC 開發流程等方式來降低此類風險。部分類型的供應鏈攻擊問題也可以透過定期曝險與滲透測試來儘早發現並進行修復。有任何資安方面相關的問題都歡迎留言討論，或者直接聯繫 [Cymetrics](https://cymetrics.io/zh-tw/) 尋求相關協助。

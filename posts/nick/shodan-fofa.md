---
title: "駭客起手式 : Shodan & Fofa"
date: 2021-06-28
tags: [Security,Shodan,Fofa]
author: nick
layout: layouts/post.njk
image: /img/posts/nick/shodan-fofa/1__umABiDO1c0UaI8MmhaatgA.png
---

## 前言

處於資訊爆炸時代，遇到問題的第一步通常就是去 Google 一下，駭客們當然也是這樣想，不過除了 Google Hacking 以外駭客有更專門的搜尋引擎。

本文會先簡單介紹一下駭客常用的搜尋引擎，重點則放在實際案例說明與分享，看一下免費用戶可以做到什麼程度的攻擊，最後討論一下如何避免被找到，打不過駭客難道還躲不起 ?

## 工具介紹

提到駭客搜尋引擎，有資安背景的朋友第一個會想到的就是大名鼎鼎的 Shodan，但本文除了介紹老牌的 Shodan 之外還要介紹另一個後起之秀 Fofa，就像我們覺得 IE 或 Safari 不順手的時候就會改用 Chrome 或 Firefox一樣，駭客也會嘗試用不同的方法來找到攻擊目標。

![](/img/posts/nick/shodan-fofa/1__gX36EdhP1jdHBn6tWpMG7g.png)

### 1. 簡介
Shodan 是聯網裝置的搜尋引擎，從網站主機到各種 IOT 設備都可以在上面找到，背後有無數台爬蟲伺服器 24 小時在收集全世界的資料，雖然這個網站的初衷是讓使用者檢查自己的設備或服務是否暴露在外網，但駭客們利用搜尋規則從 Shodan 的資料庫中快速找出有弱點的設備並攻擊，攻擊能影響範圍直接提升到了世界級，所以稱 Shodan 為最危險的搜尋引擎一點也不過分。
    
### 2. 搜尋規則 :
規則分為 10 大類，最常用的是 General，其他類別是針對特定領域的搜尋，而且有些需要付費會員才可使用，後面會舉一些實際應用的例子。

![](/img/posts/nick/shodan-fofa/1__q9RtyVHUj4IJ4uivxn5NNw.png)

![](/img/posts/nick/shodan-fofa/1__xrdSmu1pLtoImh3Ab____fCg.png)

### 1. 簡介 :
Fofa 是中國資安廠商白帽匯推出的搜尋引擎，擁有不遜於 Shodan 的龐大資料庫，能夠快速進行聯網裝置匹配，進行漏洞影響範圍分析、應用分佈統計、應用流行度等。
### 2. 搜尋規則 :
這邊為了方便之後進行比較，用了類似 Shodan 的方式來將 Fofa 的規則分類，也可看出 Fofa 將重點放在網站相關的搜尋，而且多了一些分析用的規則，像是時間限制、數量統計等，一樣有部分規則付費用戶才能使用。

![](/img/posts/nick/shodan-fofa/1__zlEjdhzf6j30K4MS1PqQLA.png)

## 實例分享

這邊會先分享幾種真實的攻擊案例，讓大家體驗一下當駭客的感覺，同時比較一下兩種工具找到的結果數量，然後再分享幾種各工具特有的查詢案例，請注意過程中請避免蓄意破壞，造成的影響一律自行承擔。

### 案例 1 : 檔案分享伺服器 (FTP)

#### 駭客 :

硬碟空間不夠了，拿別人的來頂一下，順便丟個後門上去。

#### 說明 :

ASUS 型號為 RT-AC66U 的路由器有支援 FTP Server 的功能，問題出在於該 設備開放匿名登入，而且匿名使用者竟然有上傳與下載的權限，所以只要找到後誰都可以使用，駭客還可以藉此打進內網，攻擊有連到該台路由器上的設備。

#### 搜尋條件 :

1.  Port : 21
2.  回應內容包含 : RT-AC66R
3.  回應內容排除 : 530 (排除禁用匿名登入的設備)

#### Shodan : 11 筆結果

![](/img/posts/nick/shodan-fofa/1__2CX2MOE5o2IXsXP9D__R__aA.png)

#### Fofa : 33 筆結果

![](/img/posts/nick/shodan-fofa/1__KOu4aEsUhDrMC43U6C4Zww.png)

#### 驗證 : 連接到 Shodan 搜索結果中的 FTP Server

![](/img/posts/nick/shodan-fofa/1__fn__pwtV47j3h44FFR__v47Q.png)

### 案例 2 : 遠端控制 (Telnet)

#### 駭客 :

用自己的電腦幹大事怕被發現，那用別人的不就好了。

#### 說明 :

有台型號 p750(沒查出是誰家的)的設備開啟了 Telnet Server，登入不需要帳密而且一進去就有 Root 權限，對駭客來說根本是送分題。

#### 搜尋條件 :

1.  Port : 23
2.  回應內容包含 : p750
3.  回應內容包含 : root@

#### Shodan : 11 筆結果

![](/img/posts/nick/shodan-fofa/1__SO9q00Z9x5c1FI__IgBS7ng.png)

#### Fofa : 89 筆結果

![](/img/posts/nick/shodan-fofa/1__NGGLiD__gKlvmcKbLktDl4w.png)

#### 驗證 : 連接到 Fofa 搜索結果中的 Telnet Server

![](/img/posts/nick/shodan-fofa/1__myf23vGvuE0YRKFXRs3EFA.png)

### 案例 3 : 網路攝影機

#### 駭客 :

我無聊想看看別人在幹嘛。

#### 說明 :

webcamXP 是整合了 HTTP 網頁伺服器功能的 WebCam 網路攝影機伺服器軟體，藉由它，您可以將網路攝影機所拍攝的內容即時分享給網路上的任何人，包含駭客，另外這類型的搜尋加上地區條件時會有奇效。

#### 搜尋條件 :

1.  Server : webcamXP 5
2.  回應內容不包含 : 360 (排除 honeypot(註1) 中的回應內容)

#### Shodan : 239 筆結果

![](/img/posts/nick/shodan-fofa/1__lLn3bhqi4v4wl20CHRHw__g.png)

#### Fofa : 1718 筆結果 (950個設備)

![](/img/posts/nick/shodan-fofa/1__HwqfAOCXyAhnA83xUkUSeQ.png)

#### 驗證 : 從 Fofa 的結果中找一個台灣的網路攝影機

(在防疫時期後面的朋友到碧潭玩還不戴口罩，I got you !)

![](/img/posts/nick/shodan-fofa/1__8ESIlmgyrF5ijsMHOO76kA.png)

### 案例 4 : 遠端控制 (Windows RDP)

#### 駭客 :

我想找人幫我挖礦，而且電腦有顯卡才挖的快。

#### 說明 :

這項測試用到了 Shodan 獨有的功能 Screenshot，故案例中只包含 Shodan 的結果。RDP(Remote Desktop Protocol) 是 Windows 內建的遠端控制功能，特點之一是會把登入過的使用者帳號顯示出來，這大幅降低了駭客暴力破解難度，配合這個特點增加規則也更好找出容易破解的目標，下圖為典型案例，而且有畫面的話有顯示卡的機會也比較高。

![](/img/posts/nick/shodan-fofa/1__sfSazc0IKRr__N7za6sQy5g.png)

#### 搜尋條件 :

1.  Port: 3389
2.  has\_screenshot : true

#### Shodan : 1039052 筆結果

![](/img/posts/nick/shodan-fofa/1__NfjZ8g1tEIzc__CCnxBYytg.png)

### 案例 5: 遠端控制 (Windows RDP)

#### 駭客 :

我想找人幫我挖礦，而且我只要最新的電腦。

#### 說明 :

這項測試用到 Fofa 獨有的功能 After 跟邏輯判斷式，故案例中只包含 Fofa 的結果。這結果除了拿來攻擊之外也可以用於分析，從結果可以知道今年多了多少台開啟遠端功能的 Windows。

#### 搜尋條件 :

1.  Port : 3389
2.  After : 2021–01–01
3.  回應內容包含 : Windows 10 或 Windows Server 2012

#### Fofa : 4438635 筆結果

![](/img/posts/nick/shodan-fofa/1__hIcAaYG7rpWfkLzwdI9Xfg.png)

## 總結

雖然案例中只介紹到一小部份的搜尋規則，但可以從這些案例知道搜尋引擎的影響力，這邊整理幾個防範方法與要注意的地方。

#### 如何避免從 Shodan 或 Fofa 被找到 ?

1.  家用網路請避免使用固定 IP，固定IP等於是有個固定門牌，駭客想要攻擊也比較容易找到你，尤其是用搜尋引擎。
2.  有遠端服務需求的朋友避免使用帳密登入，盡量選擇憑證或公私鑰。
3.  網站建議架在雲端主機，像是 AWS 或 GCP 等，躲在大公司的保護傘下。
4.  Shodan 和 Fofa 的更新都不是即時的，所以不管是新服務上線或是防護措施更新一週後都要再次到搜尋引擎上確認是否會被找到。

#### Shodan 或 Fofa 使用上要注意的地方 ?

1.  不管在 Shodan 或 Fofa 免費用戶每天的搜尋量上限都不高，測試過程中很容易超標導致無法繼續使用，所以平常使用時多加一些過濾條件，不只能提升準確度還可以避免太快到達上限，萬一還是超出額度話就只好建立一個新帳號才能繼續使用。
2.  Shodan 的搜尋方式網路上有很多範例可以參考，官方也有整理一些最常被使用的搜尋方式在 Explore 頁面([https://www.shodan.io/explore](https://www.shodan.io/explore))，不知道從何下手時不妨先看看別人怎麼找。
3.  Fofa 有跟 Google 類似的搜尋預測功能，可輸入較短的關鍵字後看看有沒有推薦的查詢方式，目標還不精確時非常實用。
4.  Fofa 的搜索結果中包含網站所以有些不同的結果是來自同一個 IP，建議計算數量時以獨立 IP 為準(Shodan 也是以 IP 數量來計算結果數)，通常 Fofa 找到的 IP 數量比 Shodan 多，Shodan 找不到問題時可以試試 Fofa。
5.  在搜尋結果常常會出現一個不太明顯的提醒，告訴你這個目標可能是honeypots，這時候注意不要連過去，很可能受到反擊或資訊竊取，最好從回應內容中找出與一般設備的差別，新增規則來過濾掉這些無用資訊。

![](/img/posts/nick/shodan-fofa/1____8dp4s__lb__bhrc__TYXey6A.png)

如果對這類型技術有興趣的話記得幫忙拍手與分享，數量夠多，之後會再加開一篇分享更進階的用法與付費用戶才有的強大功能，有任何資安方面相關的問題都歡迎留言討論，或者直接到 Cymetrics 尋求協助。

### 名詞解釋

> 註 1 : 蜜罐 (honeypots)通常偽裝成看似有利用價值的[網路](https://zh.wikipedia.org/wiki/%E7%B6%B2%E8%B7%AF "網路")、資料、[電腦](https://zh.wikipedia.org/wiki/%E9%9B%BB%E8%85%A6 "電腦")系統，並故意設定了 弱點，用來吸引[駭客](https://zh.wikipedia.org/wiki/%E9%A7%AD%E5%AE%A2 "駭客")攻擊。由於蜜罐事實上並未對網路提供任何有價值的服務，所以任何對蜜罐的嘗試都是可疑的。蜜罐中還可能裝有監控軟體，用以監視駭客入侵後的舉動。

### 參考資料

> [https://www.shodan.io/](https://www.shodan.io/)  
> [https://fofa.so/](https://fofa.so/)
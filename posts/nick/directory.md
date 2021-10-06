---
title: 秒懂 Directory Traversal(目錄遍歷)
date: 2021-10-05
tags: [Directory Traversal, Path Traversal, Security, Directory]
author: nick
layout: layouts/post.njk
---

![](/img/posts/nick/directory/d1.jpg)

## 前言
<!-- summary -->
當你把錢藏在垃圾桶，結果錢被清潔人員撿走，就只能怪自己把錢藏錯地方，或者沒有把垃圾桶上鎖，雖然上鎖只是開玩笑，但這個悲劇的原理跟目錄遍歷非常接近。
<!-- summary -->
</br>

## Directory Traversal 怎麼發生 ?

Directory Traversal (也被稱為 Path Traversal) 弱點是網站讓駭客有機會跨目錄或檔案讀取資料，藉此取得伺服器上非公開的檔案，如果發生了這類問題，其問題的嚴重程度與外流了那些檔案有較大的關聯，檔案中包含越多敏感資訊這問題就越嚴重，就像把錢全藏在垃圾桶一但被偷就完了。
</br>

![](/img/posts/nick/directory/d2.jpg)

</br>

上圖是一個經典的 Directory Traversal 攻擊
* 正常行為: https://www.test.com/?page=page.php
* 攻擊行為: https://www.test.com/?page=../../../passwd

駭客藉由「`../`」可以呼叫上一層目錄的特性，讓網站從呼叫頁面改成呼叫檔案，這時候駭客就可以直接看到檔案的內容。


## 範例

Directory traversal 的攻擊原理相對單純，依路徑的讀取方式可以分成 2 類，這邊用知名靶站 DVWA 各做一個簡單的示範，模擬駭客嘗試去讀取 Linux 系統存放登入資訊的檔案 (passwd)(註1)。

### 0. 正常流程

在攻擊之前必須先了解正常流程，正常狀況下這個頁面會去讀取 file1.php 來顯示。

輸入參數 : `page=file1.php`

![](/img/posts/nick/directory/d3.jpg)

### 1. 絕對路徑

如果你已經知道攻擊對象的系統與目錄結構，可以用絕對路徑直接去讀取目標檔案 (/etc/passwd)。

輸入參數 : `page=/etc/passwd`

![](/img/posts/nick/directory/d4.jpg)


### 2. 相對路徑

利用 `../` 可以跳回前一層目錄的特性，反覆嘗試讀取網站其他目錄的資料。

輸入參數 : `page=../../../../../../../../../../../../etc/passwd`

![](/img/posts/nick/directory/d5.jpg)

</br>

## Directory Traversal 會發生在哪 ?

網站上只要有輸入的地方都有機會發生 Directory Traversal，但下面列出較常發生的位置並提供一個實際的發生的案例作為參考。

### 1. URL

最常見的一種，就像前述的範例藉由更改 URL 進行攻擊，利用讀取特定頁面的功能來讀取檔案。

* 產品名稱: Tomcat
* 實際案例: https://www.rapid7.com/db/vulnerabilities/http-tomcat-directory-traversal/

</br>

![](/img/posts/nick/directory/d6.jpg)

</br>

### 2. HTML 表單 (form)

較常出現在上傳與下載的功能，下載功能可能導致不開放檔案被下載，上傳功能則可以藉由跨越目錄覆蓋伺服器上原本的其他檔案，能衍生非常多種類的攻擊。

* 產品名稱: Joomla
* 實際案例: https://nvd.nist.gov/vuln/detail/CVE-2020-9364

</br>

![](/img/posts/nick/directory/d7.jpg)

</br>

### 3. HTTP Header 欄位

最常被忽略的一種攻擊，網站從 Header 讀取參數的時候讀到惡意資訊，但攻擊者較不容易藉此得到回傳資料，通常要搭配其他弱點來攻擊。

* 產品名稱: Jenkins
* 實際案例: https://support.ixiacom.com/strikes/exploits/webapp/traversal/cve_2018_1999002_jenkins_accept_language_header_directory_traversal.xml
https://nvd.nist.gov/vuln/detail/CVE-2018-1999002

</br>

![](/img/posts/nick/directory/d8.jpg)

</br>

## 總結
Directory Traversal 的防範方式跟保護敏感檔案的方法非常接近，以防止資料外流為主。

___

**解決方案（一） :  權限控管**

正確的設定目錄底下的權限，當駭客透過 Directory Traversal 存取檔案時，存取到沒有權限的目錄時，便無法顯示。要特別注意把網站跑起來的時候不能用太高權限的帳號，像是 root，否則權限控管很可能形同虛設。

___

**解決方案（二） :  輸入驗證**

檢查特定危險字串，包含「`../`」、「`..\`」、「`..`」的輸入都要被過濾掉，除此之外還要過濾掉特殊符號「`%`」，因為駭客可以藉由 URI 解碼來繞過驗證( ex.「`%2e%2e%2f`」 等同於 「`../`」)，而且為了預防駭客找到新的繞過方法，最好禁用未使用的符號。

___

**解決方案（三） :  安全性設定**

確認架站工具本身有沒有 Directory Traversal 弱點，如果有弱點儘早升級到最新或安全的版本，如果不能立刻升級應該關閉有該弱點的功能，或者使用安全性套件做把關，如果是已上線的產品為了穩定性不願意動網站伺服器的設定，就盡量落實前兩個解決方案。

___

文章為快速說明原理所以挑了一些簡單易懂的攻擊來示範，實際上還有更多進階的攻擊手法，如果閱覽數量夠多，之後會再加開一篇分享一些更進階的用法與經典案例，有任何資安方面相關的問題都歡迎留言討論，或者直接到 [Cymetrics](https://cymetrics.io/) 尋求協助。

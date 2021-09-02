---
title: "資安規範實戰篇 : OWASP + CWE"
date: 2021-08-23
tags: [Security,Owasp,CWE,Top 10, Top 25]
author: nick
layout: layouts/post.njk
image: /img/posts/nick/owasp-cwe/owasp_1.jpg
---
![](/img/posts/nick/owasp-cwe/owasp_1.jpg)


## 前言

<!-- summary -->
沒有人希望自己的網站被攻擊，但工程師想做好資安防護就像廚師想燒出一桌好菜，剛開始想參考食譜來做菜，發現食譜種類好多，同一道菜有好各式各樣的做法，到底該怎麼選怎麼做才對 ?

選擇太多會讓開發人員一陣混亂，本文的目標就是整理 2 個由名國際組織整理出來對資安漏洞的排名與分類，然後藉由靶站來示範如何利用這些資料，快速的找網站可能的漏洞與修補建議。
<!-- summary -->

## 有那些資安規範 ?
要先看懂食譜才有辦法做菜 ! 所以這邊介紹 2 組由知名國際組織整理出來的常見資安問題排名，然後利用知名靶站 DVWA(註1) 來示範如何利用這些資訊，達到快速找出網站常見問題的目的。

### OWASP TOP 10（Open Web Application Security Project）

+ **簡介**:
藉由社群的力量蒐集各種網頁安全漏洞，歸納出容易攻擊的弱點，定期彙整出前 10 大資安問題，更新頻率較高（2~4 年）。
+ **命名方式**:
排名 + 發布年份 + 漏洞名稱
 ex. A1:2017-Injection （2017 年排名第 1 的漏洞為注入問題）
+ **使用範例**:
  1. **選擇要檢查的問題**:
  到 Owap Top 10 (https://owasp.org/www-project-top-ten/)點選要查詢的類型，這邊選排名第一的 Injection 問題為當範例。![](/img/posts/nick/owasp-cwe/owasp_2.jpg)
  
  2. **找出問題發生特徵**:
  點進去找一下問題可能發生在哪裡，或是如何分辨問題，範例中從 Attack Vectors 的敘述得知 Injection 類型的問題只要在有輸入的地方都有可能發生。![](/img/posts/nick/owasp-cwe/owasp_3.jpg)
  
  3. **找出可能的問題點**:
  到自己的網站找出所有可疑的地方，範例中是 DVWA 準備好的 SQL Injection 弱點輸入位置，該位置原本的功能是輸入 ID 編號來查詢用戶資料，實際上測試的時候應該要把全部的問題點都找出來。![](/img/posts/nick/owasp-cwe/owasp_4.jpg)

  4. **測試是否真的有弱點**:
  對輸入點進行測試來驗證是否真的有弱點(如果對該弱點不熟悉的話可以參考 Owasp 中的 Example Attack Scenarios 欄位)，範例中是靶站準備好的 SQL Injection 弱點，攻擊方法是選自 Owasp 的 Example 中利用 SQL 語法的 OR 來導出所有資料。
  4-1. Owasp 提供的 Injection 弱點範例![](/img/posts/nick/owasp-cwe/owasp_5.jpg)
  4-2. DVWA Injection 弱點攻擊測試![](/img/posts/nick/owasp-cwe/owasp_6_2.jpg)

  5. **嘗試修復發現的問題**:
  參考 Owasp 中 How to Prevent 欄位提供的建議進行修復。![](/img/posts/nick/owasp-cwe/owasp_7.jpg)

### CWE / SANS TOP 25 （Common Weakness Enumeration）

+ 簡介:
由國際組織 MITRE 主導，透過對 SANS 與其他資安專家進行訪談調查來制定通用缺陷列表，彙整為前 25 大資安問題，更新頻率較低（8 年）。
+ 命名方式:
發現順序 + 漏洞名稱
 ex. CWE-79 Cross-site Scripting (XSS)
（2021 年排名第 2 的漏洞為跨站腳本，排名需查表）
+ **使用範例**:
  1. **選擇要檢查的問題**:
  到 CWE Top 25 (https://cwe.mitre.org/top25/archive/2020/2020_cwe_top25.html)點選要查找的問題，這邊以排名第一的 Cross-site Scripting 問題為例。![](/img/posts/nick/owasp-cwe/owasp_8.jpg)
  
  2. **找出問題發生特徵**:
  從敘述中找出關於問題發生點的資訊![](/img/posts/nick/owasp-cwe/owasp_9.jpg)
  
  3. **找出所有可能的問題點**:
  到自己的網站找出所有可疑的地方，範例中是 DVWA 準備好的 XSS 弱點輸入位置，該位置原本的功能是將輸入文字顯示出來，實際上測試的時候應該要把全部的問題點都找出來。![](/img/posts/nick/owasp-cwe/owasp_10.jpg)

  4. **逐個測試是否真的有弱點**:
  對輸入點進行測試來驗證是否真的有弱點(如果對該弱點不熟悉的話可以參考 CWE 中的 Demonstrative Examples 欄位)，範例中是靶站準備好的 XSS 弱點，攻擊方法是參考 CWE 的 Example 中利用 JS 語法的 Alert 來彈出視窗，但這邊進行深入一點的攻擊藉由彈出視窗的機會導出較敏感的 Cookie 資訊。
  4-1. CWE 提供的 XSS 弱點範例![](/img/posts/nick/owasp-cwe/owasp_11.jpg)
  4-2. 輸入下列 script 進行攻擊測試
  `<script>alert(document.cookie)</script>`![](/img/posts/nick/owasp-cwe/owasp_12.jpg)
  4-3. 攻擊結果![](/img/posts/nick/owasp-cwe/owasp_13.jpg)

  5. **嘗試修復發現的問題**:
  參考 CWE 中 Potential Mitigations 欄位中的建議進行修復。
![](/img/posts/nick/owasp-cwe/owasp_14.jpg)


## 有問題先找誰 ?
OWASP 跟 CWE，重視效率的開發者可能覺得 Owasp Top 10 選了前 10 常見的問題，先解決這 10 個問題才是 CP 值最高的做法，實際上並非如此，原因就藏在這張 Owasp Top 10 與 CWE Top 25 的對照表中。

![](/img/posts/nick/owasp-cwe/owasp_15.jpg)

從這張圖可以明顯看出來雖然 Owasp Top 10 項目較少，但它每一個項目的範圍較大，換句話說處理 Owasp 不會比 CWE 快多少，實際上含蓋的範圍大小是差不多的，當今天你做資安檢測不是為了來自業主的合規需求時，選擇那一個規範優其實是由目的來決定的。

當使用者擔心自己的網站有資安問題，想要解決掉問題的時候會推薦先找 CWE ，因為它的項目分的比較細，說明與解決方案比起 Owasp 比來更具有針對性，所以藉由這些說明解決問題的機率也更高，這邊用兩種規範排名都很高的 Injection 舉個例子，開發者肯定知道自己的網站有沒有用到資料庫，假設有用到的話就要特別注意網站有沒有 SQL Injection 問題，當要藉由這些資安規範來解決問題時，查詢 [CWE-89 SQL Injection](https://cwe.mitre.org/data/definitions/89.html) 裡面的資料會比起 [Owasp A1:2017-Injection](https://owasp.org/www-project-top-ten/2017/A1_2017-Injection) 更有效率。


當使用者要評估一個不一定是自己的網站到底安不安全，則會建議先用 Owasp，一樣用 Injection 來舉一個例子，當你今天發現別人開發的網站上有一個輸入欄位沒有進行任何檢查，可以輸入所有種號的特殊符號，但你不確定後面用的是哪種技術或套件，這時候 [Owasp A1:2017-Injection](https://owasp.org/www-project-top-ten/2017/A1_2017-Injection) 就有關於 Injection 的整體評估和分析後面可能用了哪些套件會導致問題發生，而 CWE 的話還要想辦法做進一步測試才能確定屬於那一個類型。


## 總結
分享一下對於網站開發人員建議的資安檢視步驟，與各類標準使用時機。

**1. 確認開發工具與套件版本 : CVE**
在開發之前請先去到 CVE Details 查一下用到的工具或套件是否已有弱點，用了有弱點的套件或工具開發高機率導致網站先天不良，如果非用不可則需要把弱點藏好或避開有弱點的功能。

**2. 避開常見弱點 : OWASP TOP 10, CWE TOP 25**
從開始開發到完成這個階段特別要注意避開常見的資安問題，畢竟資安要做到完美成本過高，一般網站很難做到 100 分，但解決常見弱點能大幅的增加駭客攻擊成本，你家的鎖只要比鄰居家的鎖更好，小偷就不喜歡到你家偷東西，沒有人願意把時間在難搞的目標上，駭客也是一樣。

**3. 安全性測試(模擬攻擊） : ATT&CK**
不管是處理完弱點或建立好防護後都需要一個驗證的機制，模擬一下駭客的攻擊是否會成功，避免做了白工卻不自知，這時候最好的方法是交給第三方的資安廠商來做測試，不只有專業的資安人員為你服務，也能避免測試時球員兼裁判的問題，但礙於成本考量或者網站屬於不可公開的內部系統，就推薦參考 ATT&CK 來自行建立一個較全面的測試，降低前述問題帶來的影響。

本文主要介紹的內容與第 2 項避開常見弱點有比較直接的關係，這部份是與開發最相關也是影響最大的一部分，之後有機會在分享有關第 1 項與第 3 項中用到的其他類型資安規範。

## 參考資料
> https://owasp.org/
> https://cwe.mitre.org/
> https://cve.mitre.org/
> https://www.cvedetails.com/
> https://attack.mitre.org/

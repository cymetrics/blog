---
title: 零基礎資安系列（四）-認識注入攻擊（ Injection Attack）
author: jo
date: 2021-05-29
tags: [Security,ZeroBased,injection]
layout: layouts/post.njk
image: /img/posts/jo/zerobased-injectionattack/cover.jpeg
---
<!-- summary -->
## 前言
>想像今天有個路人突然出現在你面前，拿著一管針筒不由分說的就要往你身上戳，相信正常人的第一反應要嘛拔腿就跑要嘛阻止他，但如果今天你沒想到會有這種狀況，不小心讓他注入成功會發生甚麼事？雖然有很多種可能，但相信我，那一定不會是甚麼好事。

今天想和大家聊聊常出現在網頁安全風險榜單上的常客，**注入攻擊（ Injection Attack）**，聊聊這種風險到底是如何的危險，居然可以長年高居風險榜單的前三甲，如果我們的網站真的不幸被注入成功了，會導致甚麼樣的後果？如果真的這麼可怕的話，我們有沒有甚麼辦法可以阻止這種攻擊呢？在看完今天的文章之後，其實你會發現，原來這些攻擊離我們這麼近。
<!-- summary -->

![](/img/posts/jo/zerobased-injectionattack/p1.png)
**photo by https://www.informationsecurity.com.tw/article/article_detail.aspx?aid=8827**

注入攻擊並不僅僅是指大家耳熟能詳，針對資料庫相關網頁應用程式/服務攻擊的 SQL Injection，其中也包括了植入惡意 shell 指令到網站主機作業系統的 Command Injection ，甚至之前曾介紹過的 XSS 攻擊也是屬於注入攻擊的一種。

也因此，我想藉由這個機會跟大家介紹在 Injection 中比較容易被攻擊者發現並利用的兩種 Injection ： SQL Injection ＆ Command Injection

（如果對 [XSS 攻擊](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting) 有興趣的小夥伴可以看我之前的 XSS 介紹文章喔）

### 常見的攻擊策略

先說常見的攻擊策略，這應該是所有 Injection 都通用的，而針對 Injection 攻擊策略大致分為兩種 ，一種是所謂的盲注攻擊（ Blindfolded Injection），相當於攻擊者直接在大街上拿著針筒對你進行衝鋒，優點是不需要太多的準備和成本，只要無腦對網站塞入常見的注入範本就可以，不過也因為如此，所以成功機率偏低，畢竟大街上拿著針筒衝鋒被阻止的機率實在是有夠高的啦。

第二種的話，攻擊者會藉由網站的錯誤訊息及意外洩漏的系統資訊，對網站進行針對式的注入，而這種攻擊策略其實通俗點的說法就是預謀殺人，藉由調查受害者的公司和住家以及上下班路線，接著埋伏拿著針筒對受害者進行注射，聽起來成功率就比第一種高多了，對吧？不過也因為這樣，所以攻擊者必須要耗費成本對網站進行資料收集，再把資料進行分析之後設計針對式的注入樣本，攻擊者才能進行攻擊，非常的耗費時間。

不過根據我自身的經驗，其實目前的攻擊者通常是採取綜合式的攻擊策略，先用 Open Source 的弱點掃描工具對許多目標網站進行掃描，接著針對防禦最不完整的幾個網站進行盲注攻擊，再依據結果挑選成功可能性最高的目標網站進行針對性的攻擊設計，就像是拿著針筒對路上的每個人進行衝鋒，看起來反應最慢或是最沒反應的那幾個人，就會成為攻擊者的目標。

而攻擊者利用注入攻擊的目的可以大致分類為三種，提權、獲取敏感資料、竄改資料，接下來我會在介紹攻擊的同時向大家說明當攻擊者達成以上三種任一目的時可能會產生的安全風險。

### 常見的攻擊介紹

#### SQL Injection

SQL Injection 應該是屬於 Injection 界中無人不知無人不曉的名人了，以一個最常見的 SQL Injection 範本來舉例說明，當一個網站有帳號密碼必須輸入時，攻擊者在帳號／密碼的欄位輸入 admin／ admin 接著系統提示，密碼錯誤，於是攻擊者可以得知，有 admin 這個帳號，但是密碼錯誤，於是攻擊者便在密碼的欄位嘗試輸入 `”password’ OR ‘1’=’1"` ，如果這個網站的資料庫語法是 `UserList.Password = ‘Password’` 而且沒有限制輸入的話，整串驗證會變成 `UserList.Password = ‘password’ OR ‘1’=’1'` ，也就是說 ”Password”被當成了某個空白或者不重要的字串，而1 = 1 是 True 邏輯又是成立的，於是當帳號和密碼都是 True 的時候，會發生甚麼事呢？沒錯！攻擊者就可以以 admin 的權限登入網站為所欲為！

如果以更生活化的例子來說明， SQL Injection 的原理其實就像是 PTT 的簽名檔裡常看到的扭曲意義推文一樣，舉例來說：

![](/img/posts/jo/zerobased-injectionattack/p2.png)
**photo by https://www.ptt.cc/bbs/joke/M.1418702977.A.BEF.html**

同樣的，攻擊者也是變更了資料庫中語法的意義，讓資料庫輸出了攻擊者想看到的結果，進而達成目的，除了可能造成剛剛說明的提權，導致攻擊者獲得 admin 權限以外， SQL Injection 也可能造成資料庫資料表中的資料外洩，例如企業及個人機密資料、帳戶資料、密碼等，甚至使攻擊者竄改網站，在網站加入惡意連結、惡意程式使企業商譽遭到破壞。

#### Command Injection

雖然 Command Injection 相較於 SQL Injection 並沒有那麼有名氣，但他造成的風險卻完全不遑多讓， Command Injection 簡單來說就是當攻擊者的惡意輸入被誤認為作業系統指令時就會發生指令注入，舉例來說，某網站的查詢欄位可以查詢資料，而攻擊者為了驗證網站是不是屬於 Linux 的系統，於是故意在查詢的內容中加上 ; 並輸入指令 pwd ，由於Linux可以利用分號來同時提交多個不同的指令，再加上 pwd 指令是可以用來顯示目前所在目錄

![](/img/posts/jo/zerobased-injectionattack/p3.jpeg)
![](/img/posts/jo/zerobased-injectionattack/p4.jpeg)
**photo by http://www.cc.ntu.edu.tw/chinese/epaper/0039/20161220_3905.html**

當上面的範例能夠確認指令被成功執行之後，對攻擊者的限制就只剩下攻擊者的想像力夠不夠了，例如攻擊者可以列出所有 Server 的目錄，查詢有價值的敏感資料，開放 Server 的服務，使 Server 變成攻擊者的跳板，放入勒索軟體或是後門等，為所欲為。

### 防範 Injection 的準則

相信以上的說明有讓各位小夥伴更加了解 Injection 到底是甚麼樣的攻擊以及 Injection 究竟可以造成甚麼樣的危害，那現在就讓我們來聊聊要怎麼樣才能不被針筒戳到。

1\. 使用正則表達式過濾使用者的輸入值以及包含在參數中的惡意程式，把輸入值中所有的單引號全部更改為雙引號，確保資料的輸入無論是有意或無意都不會因此被網站視為程式輸入。

2\. 限制輸入的字元格式不包含特殊符號，並確認欄位的合理輸入長度，例如出生年月日的欄位沒有必要開放到20個字元以上。

3\. 把系統及資料的使用者帳號權限最小權限化，避免攻擊者萬一獲取了某一個使用者的權限就等於獲得了可以讀寫的所有權限。

4\. 不要將系統或資料庫錯誤顯示於網頁之上，盡量避免透漏 Server 及資料庫的系統或是版本，以防自身網站成了攻擊者針對的目標。

### 總結

**Injection** 會這麼猖獗的原因在於要控制網站中每一個欄位的輸入以及 Server 和資料庫的系統或是版本是不是最新的，因為很有可能因為網站更新導致新增的欄位沒有設定驗證，或是 Server 和資料庫的系統及版本出現漏洞沒有即時更新，加上不同程式語言有不同輸入和檢查，加上 Injection 攻擊的成本不高，使得相關的攻擊層出不窮，因此，除了以上的四種方法以外，建議網站在合理的預算下進行定期的網站檢測，除了可以預防 Injection 以外，也能發現許多開發者非預期的風險發生。

### 延伸閱讀

#### 零基礎資安系列（二）- 認識 XSS（Cross-Site Scripting）

> [認識 XSS（Cross-Site Scripting）](https://tech-blog.cymetrics.io/jo/zerobased-cross-site-scripting)

### 參考資料

#### SQL注入

> [https://zh.wikipedia.org/wiki/SQL注入](https://zh.wikipedia.org/wiki/SQL%E6%B3%A8%E5%85%A5)

#### Command Injection運作原理與解說

> [http://www.cc.ntu.edu.tw/chinese/epaper/0039/20161220\_3905.html](http://www.cc.ntu.edu.tw/chinese/epaper/0039/20161220_3905.html)

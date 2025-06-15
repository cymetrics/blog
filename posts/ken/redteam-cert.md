---
title: "紅隊勇者的證照冒險攻略"
date: 2025-06-13
tags: []
author: ken
layout: zh-tw/layouts/post.njk
image: /img/posts/ken/redteam-cert/cover.png
---

<!-- summary -->

很高興可以在 [CYBERSEC 2025 臺灣資安大會](https://cybersec.ithome.com.tw/2025/session-page/3477) 分享一些自己考證照及學習的心路歷程。紅隊是模擬真實攻擊者行為的團隊，目標是在測試公司企業的防禦系統會不會被輕易入侵，幫助發現防守上的漏洞，提早修補，評估公司企業在實際遭受攻擊時的應對能力。像是 Cymetrics 提供的外部曝險、弱點掃描、滲透測試、紅隊演練，甚至是社交工程演練，這些都包含在紅隊的測試手法與範圍中。

紅隊平常除了通靈，常常需要從意想不到的角度切入，找出不一樣的攻擊路徑和漏洞，還需要具備什麼條件呢？沒錯，就是證照！在紅隊演練招標說明文件中，通常都會明確列出檢測人員應該具備哪些證照。而在紅隊演練作業參考指引裡，也能看到像是 CPENT、CPSA 或是 OSCP 等等，這些證照被列為必要資格。

<!-- summary -->

Reference：[紅隊演練作業參考指引v1.0_1121231](https://download.nics.nat.gov.tw/api/v4/file-service/UploadFile/Common_Standards/%E8%AD%98%E5%88%A5/%E7%B4%85%E9%9A%8A%E6%BC%94%E7%B7%B4%E4%BD%9C%E6%A5%AD%E5%8F%83%E8%80%83%E6%8C%87%E5%BC%95v1.0_1121231.zip)

![image](/img/posts/ken/redteam-cert/1.png)

![image](/img/posts/ken/redteam-cert/2.png)

另外，在數發部公告的資通安全專業證照清單 (1140124修正) 中，目前被歸類在「技術類」的證照總共有 89 張。那問題來了：這麼多證照，哪些是真的值得花時間去考？又有哪些雖然沒被列在清單裡，但其實也很有挑戰的價值呢？

![image](/img/posts/ken/redteam-cert/3.png)

首先看到 [Security Certification Roadmap](https://pauljerimy.com/security-certification-roadmap/)，這裡面根據不同領域做分類。截至 2024/07/31，總共統計了 481 張資安相關的國際證照。那我們今天會把重點放在「Penetration Testing」這個欄位，也就是滲透測試相關的證照上。這個 Roadmap 是按照難易度來做排序的，也就是說排在越上面的證照，相較起來會比較難取得。

這邊我挑了幾張比較知名的證照當作範例來說明。在入門等級的部分，像是 EC-Council 的 CEH、CREST 的 CPSA，還有 CompTIA 的 PenTest+，這幾張都是目前市場上知名度比較高、入門門檻也相對友善的證照。


![image](/img/posts/ken/redteam-cert/4.jpg)

接下來到了技術小成的階段，就會看到像是 EC-Council 的 LPT Master，或者說 CPENT。這兩張其實是同一個考科，只是通過成績達到 90% 以上，EC-Council 會另外加發 LPT Master 這張證照。另外還有國外知名度比較高的 GIAC GPEN，以及現在在台灣越來越多人持有的 OSCP，這幾張都是在這個階段很具代表性的證照。

![image](/img/posts/ken/redteam-cert/5.jpg)

那如果技術已經精熟到一個程度，通常不意外，身上就會開始出現 Offensive Security 的高階系列證照，往 OSCE3 邁進，也就是包含 OSWE、OSEP 和 OSED 這三張證照的組合。

![image](/img/posts/ken/redteam-cert/6.jpg)


以目前台灣的就業市場和標案需求來看，在技術類的資安證照方面，大家在思考要考哪些證照時，不外乎都是在 EC-Council 跟 OffSec 這兩家之間做選擇。所以我就不會花太多時間介紹 EC-Council 和 OffSec 的證照。不是說這兩家不好，會去考的人自然就會去考，大家也都很熟了。我反而比較想跟大家分享的是，還有哪些比較冷門、但其實很值得學習或挑戰的證照。

接下來，本篇將介紹一些不錯的證照及學習資源。


- [eLearnSecurity](#eLearnSecurity)
- [The SecOps Group](#The-SecOps-Group)
- [TCM Security](#TCM-Security)
- [CyberWarFare Labs](#CyberWarFare-Labs)
- [Altered-Security](#Altered-Security)
- [Hack The Box](#Hack-The-Box)
- [TryHackMe](#TryHackMe)
- [Virtual Hacking Labs](#Virtual-Hacking-Labs)
- [Mossé Cyber Security Institute](#Mossé-Cyber-Security-Institute)
- [HackTricks](#HackTricks)
- [WiFiChallenge Lab](#WiFiChallenge-Lab)
- [Web Security Academy](#Web-Security-Academy)


## eLearnSecurity

> https://security.ine.com/


| 證照 | eJPT |
| -------- | -------- | 
| 難易度     |   ⭐️    | 
| 推薦指數     |   👍👍    | 
| 價錢     |   299 $USD   | 


eLearnSecurity 推薦 eJPT，就是在 CEH 之後，非常適合作為下一步挑戰的入門實作證照。原本這張證照的課程是免費的，但現在要透過 INE 的訂閱方案才能學習，課程名稱是 Penetration Testing Student (PTS)。他們提供的教材裡面就包含靶機和練習環境，整個學習流程算是蠻完整的。

考試總共有 35 題，時間是 48 小時，只要在時間內達到 70% 的分數就算通過。題目主要是針對漏洞的識別與利用，沒有工具使用上的限制。整體來說，有兩天的時間可以慢慢打，壓力不會太大，對新手來說是一張很適合練手的實作證照。


## The SecOps Group

> https://secops.group/

| 證照 | CNPen |
| -------- | -------- | 
| 難易度     |   ⭐️    | 
| 推薦指數     |   👍👍    | 
| 價錢     |   250 £GBP   | 

除了 eJPT 以外，入門證照還有另外一個選擇，就是 SOG 推出的 CNPen。這張證照被歸類在 Intermediate Level。SOG 比較特別，沒有提供正式課程或教材，只有說明考試內容會考什麼。但官方有提供 mock exam 可以做練習，透過簡易的模擬考抓一下實際考試的感覺。

CNPen 的考試時間是 4 小時，總共有 15 題，只要拿到 60% 以上的成績就會通過。不過這邊要特別注意一點，題目會根據難易度給出不同的配分，所以不是答對多少題就會通過。考試是連環題組題的設計，基本上在同一個題組裡，要解完前面的題目，才有辦法往後繼續解。那沒考過也沒關係，官方有提供一次免費的重考機會。如果第一次就通過考試，也可以選擇再考一次，看看能不能取得更高的成績。

另外 Intermediate Level 的 Certified Red Teamer (CRTeamer) 及 Expert Level 的 Certified Active Directory Pentesting eXpert (C-ADPenX)，這兩張蠻適合當作進階一點的選項，但一樣沒有提供正式課程或教材。


## TCM Security

> https://tcm-sec.com/

| 證照 | PNPT |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍👍    | 
| 價錢     |   499 $USD   | 

看完入門證照後，接著要來看進階一點的選項，也就是時常跟CPENT 還有 OSCP 做比較的 PNPT。TCM Sscurity 對軍警、醫護、學生等職業有提供八折的優惠。如果剛好遇到黑色星期五，可以把提供的折扣跟黑色星期五促銷優惠合併做使用。所以是上述職業的話，可以把握機會取得折扣碼。

PNPT 的考試時間為 5 天，沒考過的話也有一次重考的機會。在考試結束後，還會給 2 天的時間來撰寫報告，相較於 CPENT 在回答題目的問題，還有 OSCP 在敘述如何拿到 flag，PNPT 的報告就是一個很完整的滲透測試報告，說明從這 5 天找到的可利用漏洞，並按照風險等級排序給予修補建議，以及解釋如何拿到 Domain Admin 的完整攻擊鏈。最後還需要 15 分鐘的線上報告，全部完成後才算通過考試。

我覺得整體考試的難度不算高，不需要用到太多深入的滲透技術。AD 的橫向移動和繞過技巧也相對簡單。更多時候，需要的是 OSINT 的能力。往往太過急於打到下一台機器，會忽略掉許多可利用的重要資訊。如果要學習如何完整的寫一份滲透報告及解釋弱點風險給客戶聽的話，那 PNPT 相較於其他證照，會是一個不錯的選擇。


## CyberWarFare Labs

> https://cyberwarfare.live/

| 證照 | CRTA |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️    | 
| 推薦指數     |   👍👍👍    | 
| 價錢     |   99 $USD   | 

接著，身為紅隊成員，怎麼可以不會打 AD 呢。第一張要介紹的 AD 相關實作證照，就是 CyberWarFare Labs 推出的 CRTA，這是一張紅隊入門證照。原價是 99 塊美金，但它時常在促銷特價，不要當購買原價的大盤子。完成訂單後，有 30 天的 Lab 可以做使用，然後會拿到一個 PDF 檔教材和一個工具包，課程內容是可以終身存取的。

從 2025/06/04 後，CRTA 的考試時間從 24 小時變更為 6 小時，這部分要特別注意一下。這張證照對於想學習 AD 攻擊手法的新手來說，還蠻有幫助的。而且要在 30 天內看完教材、完成 Lab，並通過考試，整體難度不高。可以清楚的了解 AD 基礎知識，像是認識網域、帳號提權，還有 Kerberoasting 以及如何透過金銀票券攻擊完整控制網域。


## Altered Security

> https://www.alteredsecurity.com/

| 證照 | CRTP |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍👍👍    | 
| 價錢     |   249 $USD   | 

接下來要介紹的是知名度比較高的 CRTP。從官網的介紹可以看出，CRTP 是適合初學者的紅隊證照之一。可以學習並了解多種 Windows 和 AD 攻擊概念。課程內容涵蓋得相當全面，像是 AD 枚舉、提權、基於 Kerberos 的攻擊、ACL 問題、SQL Server 信任關係、甚至還有防禦技術與繞過方法。

我覺得，這張證照對於做內網滲透跟紅隊演練的案子來說，非常有幫助，特別是能夠系統性地學習 PowerShell 指令與 AD 基礎知識。而且，只要能把課程內容裡的 40 題 Lab 都解出來，考試基本上就不會有太大的問題。我自己是在 Kali 跟 Windows 兩種環境下都把 Lab 解過一遍，測試看看不同的工具與攻擊手法是不是都能成功。同時，也驗證自己是不是真正理解教材內容。

CRTP 的考試時間為 24 小時，總共會有 6 台機器，一開始會提供一組帳號密碼用來登入第 1 台初始機器。簡單來說，除了第 1 台機器需要題權外，還需要打下 5 台機器，才算是完成挑戰。另外，考試結束後，還有 48 小時的時間可以來撰寫報告，時間上來說算是非常的充裕。


除了證照本身之外，Altered Security 其實還有提供一個叫做 Red Labs 的平台。這個平台裡面有 100 台靶機可以免費做使用，對於想加強 AD 攻擊技巧的人來說，算是一個蠻佛心的資源。而且喜歡收藏 Badge 的人，這個平台肯定不能錯過。針對每個不同 Learning Path 還有連續完成天數等等，會頒發不同的Badge。目前總共有 17 種 badge可以收藏。

另外，Altered Security 還有提供兩個免費的 Azure 紅隊學習教材，對於想入門學習 Azure 攻擊技巧的人來說，這是一個非常不錯的起點。主要是完全免費，不用錢，有興趣的人可以體驗看看。



## Mossé Cyber Security Institute

> https://www.mosse-institute.com/

| 證照 | MRT |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍    | 
| 價錢     |   699 $USD   | 

接下來要介紹的是 MCSI，他們推出了很多不同主題的線上認證課程，其中有一門是針對紅隊設計的，叫做 MRT。這門課程會教你怎麼撰寫針對 Windows 的惡意程式，還有如何從 Initial Access到維持權限等等，算是蠻完整的內容。有一個比較特別的點是，MRT 課程被分成 6 個不同的 level，只要完成每一個level 的要求後，就可以獲得相對應的證書，在學習的過程中就能累積實戰成果。

這邊有幾個練習的範例可以參考，最入門的，像是如何寫一個可以在 Windows 上執行的 TCP Reverse-Shell。更進階一點的挑戰，會像是如何寫一個惡意程式，可以關掉 Windows Defender、BitLocker、Error Reporting，還有本機防火牆。那再更難一點的話，就會像是自己寫一個可以轉發連線的工具。


## HackTricks 

> https://training.hacktricks.xyz/

| 證照 | ARTA、ARTE |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍👍👍    | 
| 價錢     |   359 €EUR, 1099 €EUR   | 

有在打滲透的人，應該多少都有去 HackTricks 查看 cheat sheet 的經驗吧。不管是在打 Wi-Fi、Web 還是不同 Port Number 的 Network Services。HackTricks 上面幾乎都有相對應的攻擊技巧可以參考，算是一個滲透過程中非常實用的工具書。

現在雲端服務那麼厲害，很多公司企業都有在使用雲服務。所以在滲透測試或紅隊演練的過程中，針對雲端服務的攻擊，其實也是蠻常見的場景。Hacktricks Training 這邊就有針對三大雲平台 AWS、GCP 和 Azure，各推出了兩張雲端滲透的證照。那命名也很淺顯易懂，AWS 的開頭是 A、GCP 是 G，Azure 就是 AZ 開頭，很好記也很好分類。這兩種證照分別是 RTA 和 RTE 系列。

所有 RTA 的教材內容都包含在 RTE 裡面，RTA 只要完成課程內容和Lab，就會取得結業證書。而 RTE 系列，在課程的最後會有一個考試，考過了就可以拿到證照。


## WiFiChallenge Lab

> https://lab.wifichallenge.com/

| 證照 | CWP |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️    | 
| 推薦指數     |   👍👍👍    | 
| 價錢     |   99 $USD   | 

在紅隊演練中，其實也常常會遇到打 Wi-Fi 的需求，Wifichallege lab 就是一個很好學習跟練習的免費平台。有考過 OSWP (PEN-210) 的人，肯定對 Wifichallege 不陌生。它涵蓋了像是 OPN、OWE、WEP、PSK、MGT 和 SAE等等不同的情境，可以有系統地練習各種 Wi-Fi 攻擊手法。

除了 Lab 之外，WiFiChallenge 也有推出自己的 Wi-Fi 證照，叫做 CWP。完整的課程加考試價格是 199 美金，如果想直接挑戰考試的話，也可以單獨購買考試券，價格為 99 美金。

考試時間為 6 個小時，需要從 5 個 AP 裡破解至少 4 個，才算通過考試。我自己是覺得 CWP 的 CP 值其實比 OSWP 還要高，不僅價格比較便宜，而且內容也更豐富。


## Web Security Academy

> https://portswigger.net/web-security

| 證照 | BSCP |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍👍    | 
| 價錢     |   99 $USD   | 

前面講了這麼多，但身為紅隊從業人員，怎麼可以不會打 Web 呢？有用過 Burp Suite 的人，肯定都知道 PortSwigger。他們推出的 Web Security Academy，就是一個很好打下web攻擊基礎的平台。平台針對不同的攻擊手法，像是 XSS、SQLi、SSRF、CSRF 等等，都有對應的學習路徑可以跟著走，每個主題都有理論說明，再搭配著 Lab 練習，很適合一步步學習 Web 攻擊的技巧。

除了教學資源之外，PortSwigger 其實也有推出自己的官方證照，叫做 BSCP。考試費用是 99 美金，相較於其他家證照的價格，還算是蠻親民的選擇。不過考這張證照有個前提條件，就是要有 Burp Suite 專業版，如果你沒有 Pro 版，是沒辦法參加考試的，這點要特別注意。



## Hack The Box

> https://www.hackthebox.com/

| 證照 | CPTS、CAPE |
| -------- | -------- | 
| 難易度     |   ⭐️⭐️⭐️⭐️    | 
| 推薦指數     |   👍👍👍👍    | 
| 價錢     |   490 $USD, 1260 $USD   | 

Hack The Box，我相信大家一定都不陌生，不過這裡我不是要分享一般的靶機，而是 HTB 推出的 Pro Labs。Pro Labs 提供了許多針對 AD 環境設計的實戰練習，每個 Lab 裡面都會有多台機器，還有flag需要取得。

另外，每當完成一個 Pro Lab 後，不只會拿到一張官方結業證書，還可以獲得 40 個 CPE 學分，這對需要維護其他家證照的人來說也很實用。以目前每個月 49 美金 的價格，對於想強化 AD 實戰能力的人來說，是個還不錯的投資選擇。

如果你覺得只拿結業證書還不夠，那也沒關係。HTB 除了 Pro Labs 之外，也推出了自己的證照，目前總共有五張。特別值得關注的是 CPTS 和 CAPE。不是說其他幾張不重要，而是這兩張對於紅隊從業人員來說，可以優先選擇。

像是 CPTS，它已經被納入數發部最新公告的資通安全專業證照清單中。而 CAPE 則是 HTB 最近新推出的 AD 攻擊相關證照，可以說是 CPTS 的進階版本。對於想往紅隊發展來說，這兩張都會是不錯的選擇。


## TryHackMe

> https://tryhackme.com/

介紹完 HTB，怎麼能不提 TryHackMe 呢！TryHackMe 上面有一個專門針對紅隊主題的課程路徑，叫做 Red Teaming Training，非常適合用來打基礎、學習攻擊手法。這個 Learning Path 是由好幾個模組組成，從 Initial Access、提權、內網橫向移動，一路到 AD 攻擊，內容算是蠻完整的。

另外，只要完成這個 learning path ，也會獲得一張官方的結業證書，對於剛接觸紅隊的人來說，算是一個很不錯的學習起點。


## Virtual Hacking Labs

> https://www.virtualhackinglabs.com/

VHL 提供的環境很豐富，裡面有 Windows、Linux、Android 主機，還有 Web Server、Mail Server、Router 等等，可以練習的東西非常多元。每台機器都有不同的難易度，完成的數量和挑戰的等級會對應到不同的完成證明。

最入門的 Basic，需要成功拿下至少 20 台實驗室機器的管理員權限。進階證書則需要在 至少 10 台 Advanced+ 的機器上取得管理員權限，而且其中至少兩台機器要手動利用漏洞，不可以使用 Metasploit 或其他自動化工具。

另外，如果想要挑戰 AD 的話，VHL 也有提供 PRO LAB，需要成功拿下至少 10 台主機和兩個網段的網路實驗室，難度相對更高。

VHL 不管哪一個等級，都需要繳交一份完整的報告，詳細記錄怎麼取得管理員權限，還有怎麼取得 flag 的資訊。我覺得 VHL 是一個很好練習寫報告的平台，而且完成挑戰會提供相對應的證書，可以說是一舉兩得。


## 總結

![image](/img/posts/ken/redteam-cert/7.png)

對於資安新手來說，在入門階段，除了基本的程式能力之外，EC-Council 的 CEH 通常會是很多人選擇的第一張證照。除了 CEH 之外，像是 eJPT 跟 CNPen 這兩張也都是不錯的選擇，價格也相對便宜。如果對 AD 攻擊技巧有興趣的話，也可以考慮 CWL 的 CRTA 作為敲門磚。

接著有點實力跟技術後，想要從事滲透測試或紅隊演練工作的話，OSCP 就會是很好的目標。也有很多人一開始就會選擇直接考 OSCP，但如果覺得自己還沒做好準備，前面提到的那幾張入門證照，其實都很適合建立自信跟打好基礎。當然，想要成為紅隊從業人員，光拿到 OSCP 還是還不夠的，這只是一個開始。Wi-Fi、AD、Web、雲端這幾塊都是不可或缺的技能，可以透過像是 WiFiChallenge、Altered Security、Web Security Academy 還有 HackTricks 的雲端課程來做補強。

而到了更進階的階段，目標就會更明確，例如往 OSCE3 邁進。另外，像是考完 CRTP 後，也可以繼續挑戰 CRTE、CRTM 等等，把 AD 的攻擊技巧再往上做推進，同時，也可以完成多個 HTB 的 Pro Labs，讓實戰技巧越練越純熟。總結來說，我覺得在資安這條路上，就是不斷學習、持續努力，讓自己越來越強。


最後，我想說的是，資安證照這麼多，我真的需要嗎？對我來說，最重要的，不是拿到多少證照、打過多少靶機，而是能不能在學習的過程中持續進步，真正學到不一樣的知識、技巧與攻擊手法。




有任何資安方面相關的問題都歡迎留言討論，或者直接聯繫 [Cymetrics](https://cymetrics.io/) 尋求相關協助。

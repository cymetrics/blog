---
title: "Project D 左握方向盤；右打 Carplay"
date: 2025-06-04
tags: []
author: zet
layout: zh-tw/layouts/post.njk
image: /img/posts/zet/carplay-dongle-hacking/cover.png
---

<!-- summary -->

許多汽車車載系統提供 Apple CarPlay 與 Android Auto 的服務介接，無論是透過有線連接或是無線連接，它們的主要目的是在駕駛時，提供用戶更方便的使用行動裝置介面，同時提升駕駛的專注度與安全性。

市面上有許多無線轉接 CarPlay 的產品。透過實體連接線插入 Dongle，這類設備可以將有線 CarPlay 轉換至無線模式，將 iOS 裝置的畫面同步到車載系統螢幕。然而這樣的設備有可能存在資訊安全弱點，並增加了車載資訊安全的攻擊面。

<!-- summary -->

![](/img/posts/zet/carplay-dongle-hacking/BJ8lvgUMex.png)


![](/img/posts/zet/carplay-dongle-hacking/H1obW_dzxe.png)


這樣的設備是如何實現功能呢？Dongle 的運作原理是模擬成一部 iPhone，因此車載系統可以透過 Apple 的專屬 iAP2 協議與 Dongle 通訊。而同時，Dongle 也扮演著「無線車載接口」的角色，接收來自手機的 Wi-Fi 信號並進行配對及溝通。此外，建議了解 Apple 在 WWDC 2017 公布的詳細技術資料，可以參考以下連結： https://developer.apple.com/videos/play/wwdc2017/717/

![](/img/posts/zet/carplay-dongle-hacking/S117wl8zgg.png)


再配對環節中，因為 Dongle 沒有螢幕，也沒有間接使用車機螢幕，並採用 Just Work 的藍牙方式連線，有藍牙 MiTM 的風險。在手機的網路介面中我們也可以看到其中因為 iAP2 協定所帶入的 Dongle 無線網路 Access Point 名稱與密碼。

![](/img/posts/zet/carplay-dongle-hacking/Bk8frudGel.png)


事實上，可以使用工具如 [pwnagotchi](https://pwnagotchi.org/) 這樣的小工具，或側錄 Wi-Fi 交握封包的方式，獲得某些車廠的無線連線 Handshake。透過暴力破解的手段，有機會取得系統的明文密碼並連線至設備，這樣便會增加攻擊面。

# 設備與服務資訊搜集

當我們已經獲得了設備無線 AP 的 SSID 與密碼後，可以使用電腦連入，更方便的進行資訊收集。接著，我們可能會好奇以下問題：

- Dongle 的系統架構是什麼？
- 是否暴露了可攻擊的服務？
- 有沒有辦法實現任意指令執行（RCE）？

![](/img/posts/zet/carplay-dongle-hacking/SJ_OvOufxe.png)


例如可以直接使用 Nmap 作服務的探測，之後發現了在 80 port 端口提供的 HTTP 服務存在設定頁面，並且有一些系統相關資訊與韌體更新的功能。

```
PORT      STATE SERVICE          VERSION
80/tcp    open  http             BusyBox httpd 1.13
8299/tcp  open  unknown
38185/tcp open  unknown
38187/tcp open  unknown
38188/tcp open  unknown
38189/tcp open  unknown
38190/tcp open  unknown
38301/tcp open  H.323-gatekeeper CompTek AquaGateKeeper
38302/tcp open  unknown
50721/tcp open  rtsp
|_rtsp-methods: ERROR: Script execution failed (use -d to debug fingerprint-strings:
|   FourOhFourRequest, GetRequest, HTTPOptions:
|     HTTP/1.1 200 OK
|     Server: AirTunes/566.25.21
|   RTSPRequest:
|     RTSP/1.0 200 OK
|     Server: AirTunes/566.25.21
|   SIPOptions:
|     RTSP/1.0 200 OK
|     Server: AirTunes/566.25.21
|_    CSeq: 42 OPTIONS

```

利用 Burp Suite 跟網頁應用程式互動以後，成功拿到了連向外部伺服器的韌體下載位置，我們就可以把 PROD 跟測試版本的韌體下載下來分析了！


用 HEX 十六進制編輯器打開以後，有個特別的關鍵字先吸引了我們的注意，`update.swu` 擁有特別的副檔名，可以先快速的找到相關框架的官方文件 [SWUpdate: software update for embedded system](https://sbabic.github.io/swupdate/swupdate.html)。

![](/img/posts/zet/carplay-dongle-hacking/HkSsO_OGex.png)


可以快速的了解到 `.swu` 其中的檔案內容包含：

1. a scriptable sw-description file with meta information about the images or files to be installed
1. the image files or archives to be installed
1. the sw-description signature sw-description.sig (when the signing feature is enabled)
1. scripts to be run before or after installation (optional)


所以我們可以理解 SWUpdate 是一個嵌入式 Linux 系統的安全軟體更新解決方案，提供更新與 Rollback 機制。因為檔案先經過了 cpio 的封裝 我們可以利用 cpio 相關工具把檔案解開，接下來使用韌體分析工具 [Binwalk](https://github.com/ReFirmLabs/binwalk) 來解開 image 更新韌體檔。

> CPIO（Copy-In/Copy-Out）是一種用於檔案打包與存檔的檔案格式，最初設計於 UNIX 系統中，用於備份、打包及解壓縮檔案。與此格式密切相關的是 cpio 工具，它可以將多個檔案封裝成單一的 CPIO 存檔檔案，或從存檔檔案中提取內容。CPIO 格式在某些場景仍被廣泛使用，特別是在 Linux 和 UNIX 系統中，例如 Kernel 相關的初始化檔案和 RPM 軟體包的底層格式。


![](/img/posts/zet/carplay-dongle-hacking/S1Qtn_dMee.png)

其中最重要的應用程式，都放在 `app` 與 `ota` 資料夾中，因為是使用 CGI 的方式執行後端的功能操作，第一反應是先逆向看看 Web APP 有沒有存在一些好打的弱點，例如 Buffer Overflow、Command Injection 之類的，可以比較好達成 RCE，但是在經過一段時間的逆向在分析在 CGI 部分並沒有看到明顯的漏洞。

那有沒有其他的方式可以拿 Shell，獲取得系統控制權？有線上更新功能，我們把目標轉向此功能。透過嘗試做 Hijack 攻擊，把更新的檔案置換，或塞入具有後門程式的韌體。不過這樣的攻擊有一些前提，要可以重新打包正確的檔案格式，而且系統有做驗證的話就必須繞過驗證機制。

# 韌體重新打包

經過上述的嘗試後我們把目標轉向上傳客製化韌體來達成 RCE，那就先來試試看重包 Firmware 吧。

在重新打包韌體之前，我們必須要分析正確的韌體檔案格式與架構，在最前面的 Header 可以很容易猜測這是一種 HASH format，經過驗證，確認這是後面夾帶檔案的 MD5 HASH。再後面一段可以看到 CPIO Header。

![image](/img/posts/zet/carplay-dongle-hacking/S1OxOfUGxg.png)


在 CPIO 封裝的檔案中，又存在 SquashFS 檔案結構、Kernel、Meta file 等檔案。在了解韌體檔案的層層封裝後，我們就跟跟著相同的邏輯與順序，把客制化的後門程式與其他檔案層層封裝回去，打包成跟正版韌體一樣的檔案結構。

> SquashFS 是一種高效的開源檔案系統格式，主要用於將檔案和目錄壓縮成 Read-Only 存放的檔案系統。它的設計目的是以高壓縮比減少硬碟空間使用，同時提供快速的讀取性能。這種檔案系統常見於嵌入式系統、Live CD/DVD、平台以及其他需要 Read-Only 檔案系統的場景。SquashFS 支援多種壓縮演算法（如 gzip、xz、lzma 等），以極高的效率將檔案壓縮至最小大小。用於多種操作系統，包括 Linux、OpenWrt 等。


![image](/img/posts/zet/carplay-dongle-hacking/rJK-jzUfgl.png)


# 是電影中會出現的畫面嗎

在最後的階段，我們希望可以透過在有效的無線訊號距離內可以遠端更新設備的韌體，並控制整個設備。就像我們常見的電影劇情，在行車追逐的過程中，透過駭客技術，在遠端入侵汽車系統並控制。

![image](/img/posts/zet/carplay-dongle-hacking/B15q_eLMge.png)

透過先前的逆向工程，我們觀察了上傳韌體的機制，可以知道系統在驗證上傳後的韌體有哪些驗證機制，將對應的 Signature 擺放在正確的位置，基本上就可以通過韌體的檢查機制。但是有怎樣的方法可以上傳韌體？

![image](/img/posts/zet/carplay-dongle-hacking/HyEOdl8Mee.png)

上傳韌體其中有不少方法，我們可以直接呼叫 Web Server 上的網頁 JavaScirpt Function 帶入參數，指定要下載惡意韌體的位置。或是我們也可以透過 DNS Hijacking 竄改 Domain 指向的 IP 位置，達成 Server Spoofing 的攻擊，讓終端設備(行動裝置)連向惡意的伺服器位置，下載客製化的韌體檔案，並再利用本身更新機制，介由 Wi-Fi 上傳至 Dongle 更新系統。


DNS Hijacking 可以透過自己架設的 Domain Name System (DNS) Server 來達成，像是 [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) 又或是 [NextDNS](https://nextdns.io/) Cloud 服務。修改指定 Domain 要導向的 IP 位置，讓終端設備設定特定的 DNS Server，待連線時將會導向我們的惡意伺服器。

![](/img/posts/zet/carplay-dongle-hacking/rys8OgLMge.png)

惡意更新伺服器的部分，我們可以透過簡單的 Python Web Application Framework 架設惡意伺服器，其中 URL Path 的部分，可以透過先前的逆向工程，或是攔截封包得知。在伺服器上把網頁的 Route 路徑與相對應的檔案擺放好，我們就可以等待 Client 來溝通，獲取相對應的 JSON 描述文件跟韌體檔案。

![](/img/posts/zet/carplay-dongle-hacking/H18H_lUMel.png)

較為簡單的方式也可以直接透過與 Dongle Web Server 互動，利用 POST Method 上傳韌體檔案。不過可能需要注意格式的問題，因為 CGI 與背後驗證 binary 的機制關係，所以 Web Request 資料中間有多一個空白或換行就很容易驗證失敗。

# 攻擊鏈的串連

透過上述發現的一些資安問題，我們可以把這些問題串連起來：

1. Hardcoded Weak Wi-Fi Password
2. Firmware not Encrypted & Expose System Setting Pages
3. Weak System Update Validation

首先先透過預設的脆弱 Wi-Fi 密碼連接到設備。接下來透過逆向工程所得知的更新韌體檔案結構，重組包含後門程式客製化韌體，並透過暴露的管理介面上傳惡意的韌體更新檔。最後因為設備的完整性驗證機制的不足，透過理解正確的韌體格式與後端邏輯，可以順利的走完整個更新流程。

**最終可以達成在只要在有效的無線訊號範圍內，我們就可以控制 Dongle 設備，取得系統設備權限，並執行任制程式碼。我們甚至可以更改設備的開機畫面，顯示特定的 Logo 與圖片。例如以下，為真實更改的範例，每當設備啟動時皆會出現以下圖示。**


![](/img/posts/zet/carplay-dongle-hacking/B1qgyzUfxx.png)


# 如何增加產品安全性

針對以上風險的類型，有哪些防禦機制是我們可以使用，增加系統攻擊與成本與緩解弱的措施？可以參考以下機制：

- 增加 Bluetooth Secure Simple Pairing (SSP) 配對安全性
- 避免使用統一的預設密碼
- 加密韌體檔案、更新驗證檔案簽章
- 更新伺服器啟用 Client CA 憑證的驗證功能

對於藍牙的配對安全，我們盡可能的去實作 Numeric Comparison 還有 Passkey Entry 的配對方法，可以有效的防禦中間人 Man-in-the-middle (MITM) 攻擊。

預設的密碼我們可以搭配硬體的一些特徵，雖然是相同的設備，但是產出不一至的預設密碼，並且在使用者初始化設定後強制修改裝置密碼。

加密韌體檔案、更新驗證檔案簽章。像是文章中提到的 SWUpdate 其實就提供了加密韌體檔案的方法利用 OpenSSL 創建加密的 Key 用於加密映像檔，詳細可以參考 [SWUpdate: Symmetrically Encrypted Update Images](https://sbabic.github.io/swupdate/encrypted_images.html)。在韌體更新的環節，我們也可以透過驗證檔案的簽章與 HASH 值來確保檔案的正確性，詳細方法一樣可以參考 [SWUpdate: Combining signing sw-description with hash verification](https://sbabic.github.io/swupdate/signed_images.html#combining-signing-sw-description-with-hash-verification) 中的實作細節，作為安全開發的參考。

防止 Server Spoofing 的行為發生，我們可以在更新伺服器上面設定，要求上來連線的 Client 必須攜帶憑證，並且做驗證。預計讓只有憑證的設備可以與更新伺服器做溝通，下載最新的韌體檔案，以增加攻擊的成本與難度。



# 還有更多類似的攻擊嗎？

在今年 2025 有關於汽車相關安全所舉辦的弱點挖掘競賽，由 Zero Day Initiative (ZDI) 所舉辦。其中提供設備廠商包含 Sony、Alpine、Pioneer、Kenwood、Tesla、Ubiquiti 等公司，參與的設備涵蓋以下分類：

- 車載娛樂系統 In-Vehicle Infotainment (IVI) Systems
- 電動車充電相關設備 Electric Vehicle Chargers Category
- 車用作業系統 Operating Systems


其中有許多有趣的弱點，例如透過插入 USB 就可以獲得車載娛樂系統 In-Vehicle Infotainment (IVI) Systems 的系統權限，執行任意指令。假如結合有無線訊號的弱點，是有機會可以達成任意指令執行 Remote Code Execution (RCE) 控制整台車用系統的。更多的活動弱點可以參考以下連結：

- www.zerodayinitiative.com/blog/2025/1/21/pwn2own-automotive-2025-day-one-results
- www.zerodayinitiative.com/blog/2025/1/22/pwn2own-automotive-2025-day-two-results
- www.zerodayinitiative.com/blog/2025/1/23/pwn2own-automotive-2025-day-three-and-final-results


![](/img/posts/zet/carplay-dongle-hacking/S141OlUfle.png)
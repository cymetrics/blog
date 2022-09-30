---
title: "網站弱點修補: ModSecurity"
date: 2022-09-30
tags: [Security,WAF,Web]
author: nick
layout: zh-tw/layouts/post.njk
image: /img/posts/nick/cyberlab_1/1.jpg
---

![](/img/posts/nick/cyberlab_1/1.jpg)

## 前言
<!-- summary -->
假設網站在弱掃或滲透之後找到一堆問題，而且問題數量偏多，想一次性解決大量問題的話，幫網站加一層保護來過濾攻擊是很有效的解決方式，這邊要介紹的就是 ModSecurity 這套開源 WAF 的使用方法。
<!-- summary -->
使用 ModSecurity 還有另外一個好處，就是架 WAF 從外部解決問題，可以在不動到網站程式碼的狀況下修復問題，這在你並非網站開發者或不熟悉原始碼時都非常有用，很適合到處救火的資安工程師。

本文同時為 CYBERSEC 2022 臺灣資安大會課程內容的一部分 (Lab 2)

**CyberLAB :**
問題找到了，然後呢 ? 弱掃與滲透之後如何有效的降低風險
https://cyber.ithome.com.tw/2022/lab-page/810

![](/img/posts/nick/cyberlab_1/2.png)

___

## 簡介

### 1. ModSecurity
![](/img/posts/nick/cyberlab_1/3.png)

ModSecurity 是一个開源且跨平台的WAF，它可以檢測所有送到伺服器的請求以及來從伺服器送出的回應，但我們想要修復漏洞擋掉攻擊行為的話，重點會放在檢測請求這塊。


### 2. DVWA
![](/img/posts/nick/cyberlab_1/4.png)

DVWA 是由 PHP/MySQL 架在 Apache 伺服器上的網站，上面有設計好不同的漏洞，還有攻擊的難易度設定可以調整。

這邊為驗證 ModSecurity 的有效性選了 DVWA 靶站作為我們要保護的網站，當 DVWA 安全性等級調到最低時，就可以從中找出數 10 種設計好的漏洞，可用來快速驗證 WAF 保護有沒有生效，下列的攻擊 payload 就是一個 XSS 的經典攻擊案例。

`<script>alert(document.cookie)</script>`

該攻擊可以把 cookie 用 alert 顯示出來，常見的攻擊會把這段 cookie 傳送到攻擊者的設備，然後攻擊者就有機會登入你曾經進過的網站，該弱點可以在 DVWA 的 XSS (Reflected)頁面實作如下圖。

![](/img/posts/nick/cyberlab_1/5.png)

### 3. OWASP ModSecurity Core Rule Set (CRS)

![](/img/posts/nick/cyberlab_1/6.png)

CRS 是 OWASP 社群維護的 ModSecurity 規則，強度高而且更新頻繁，幾乎每週都會更新，強烈建議用 CRS 取代 ModSecurity 預設規則，但高安全性所帶來的缺點是網站用了不安全的功能會被阻斷，常見像是檔案處理與郵件相關。

___

## 安裝流程

實作過程中與 LAB 環境有關的資料都可以在這邊找到
https://github.com/cymetrics/cyberlab2022

#### 0. 架設網站

**實務上你要保護的是自己的網站，在自己的環境就可跳過架設網站的步驟。**

建立 Docker 環境，該環境是以 Ubuntu 為基底
```
docker run -v $(pwd)/mount:/tmp/mount -p 80:80 -it zet235/cyberlab2022:dvwa /bin/bash
```

執行啟動腳本，腳本中包含建立資料庫與啟動網站伺服器 Apache
```
/tmp/start.sh
```

#### 1. 安裝 ModSecurity

**這邊列出安裝 ModSecurity 並啟用防護的詳細步驟**

安裝前更新一下

```bash
apt update
```

安裝需要的 lib

```bash
apt install -y libapache2-mod-security2
```

切換到安裝目錄

```bash
cd /etc/modsecurity
```

複製推薦設定檔

```bash
cp modsecurity.conf-recommended modsecurity.conf
```

修改設定檔案 `modsecurity.conf`

```bash
vim modsecurity.conf
```

SecRuleEngine 設定從 DetectOnly 改成 On

```
SecRuleEngine On
```

#### 2. 更新 CRS 規則


實務上不建議靠指令下載舊版，應該直接到 github 下載最新版
```
wget https://github.com/coreruleset/coreruleset/archive/refs/tags/v3.3.4.tar.gz
```

解壓下載檔案
```
tar -zxvf v3.3.4.tar.gz
```

複製規則檔
```
cp -r ./coreruleset-3.3.4/rules /usr/share/modsecurity-crs/rules
```

___

## 自訂規則

前面有提過 CRS 規則的缺點，遇到問題的時後還是要學會自己寫規則，下面示範的規則目的是擋掉經典 XSS 攻擊:



![](/img/posts/nick/cyberlab_1/7.png)


白話翻譯一下這條規則的話就是當請求的內容中有`<script>`的話，不要把請求往後送，直接回應 HTTP 狀態碼 404

#### 1. 寫入規則

**這邊介紹一下寫入自訂規則的流程**

新增設定檔

```bash
vim /usr/share/modsecurity-crs/rules/REQUEST-1001-DEMO.conf
```

在新增的 `REQUEST-1001-DEMO.conf` 寫入

```
SecRule ARGS "@rx <script>" "id:00123,deny,status:404"
```

修改設定檔案 `security2.conf`

```bash
vim /etc/apache2/mods-enabled/security2.conf
```

把自建的規則加入清單

```
IncludeOptional /usr/share/modsecurity-crs/rules/REQUEST-1001-DEMO.conf
```

為驗證自建規則的效果，暫時註解掉預設規則

```
# IncludeOptional /usr/share/modsecurity-crs/*.load
```

成功寫入規則後重啟網站，接著用 XSS 攻擊任意輸入欄位我們預期會看到這個畫面

下圖示範是對 DVWA 的 XSS (Reflected) 頁面的輸入欄位送出 `<scrpit>alert(1)</scrpit>`

![](/img/posts/nick/cyberlab_1/8.png)

#### 2. 移除版本資訊
**如果要完美解決就要修改 Apache 的安全性設定**

修改設定檔案 `security.conf`

```bash
vim /etc/apache2/conf-enabled/security.conf
```

ServerSignature 改成 `off` ServerTokens 改成 `Prod`

```
ServerSignature Off
ServerTokens Prod
```

完成後再重啟網站，接著用 XSS 攻擊我們預期會看到這個畫面

下圖示範一樣是對 DVWA 的 XSS (Reflected) 頁面的輸入欄位送出 `<scrpit>alert(1)`

![](/img/posts/nick/cyberlab_1/9.png)

___


## 總結


ModSecurity 功能非常強大，但優缺點一樣明顯，優點是安全性很高，如果你願意花時間維護，常常更新 CRS 規則，不用花大錢就能擋掉最新的攻擊，缺點就是一些可能被攻擊的正常功能也會被禁用，如果網站必須用到這類功能，就需要學會自己寫規則，來取代掉原本過於嚴格的 CRS 規則，但這就相對考驗資安意識與開發能力了，我們今天介紹重點放在整個架設流程，規則僅說明一小部分，想看詳細規則這裡 (http://www.modsecurity.cn/chm/) 有詳細的中文介紹。

另外要注意的是 ModSecurity 雖然可以跨平台使用，但最初是針對 Apache 設計的，雖然還是可以裝在 Nginx 等其他網頁伺服器上，但網路上有不少人回報過一些小 bug，遇到兼容性問題時，還比較建議是用 proxy server 的方式來解決，這樣不管你用哪種網頁伺服器都不受影響，而且在 proxy server 上架 WAF 還有分擔惡意流量的作用，降低攻擊對伺服器的影響。

前面為快速說明原理挑了一些簡單易懂的攻擊來示範，實際上還有更多更進階的用法，如果閱覽數量夠多，之後會再加開一篇分享一些更進階的用法與經典案例，有任何資安方面相關的問題都歡迎留言討論，或者直接到 Cymetrics 尋求協助。


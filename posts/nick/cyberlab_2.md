---
title: "網站弱點修補: NAXSI"
date: 2022-11-04
tags: [Security,WAF,Web]
author: nick
layout: zh-tw/layouts/post.njk
image: /img/posts/nick/cyberlab_2/1.png
---

![](/img/posts/nick/cyberlab_2/1.png)

## 前言
<!-- summary -->
假設網站在弱掃或滲透之後找到一堆問題，而且問題數量偏多，想一次性解決大量問題的話，幫網站加一層保護來過濾攻擊是很有效的解決方式，這邊要介紹的就是 NAXSI 這套開源 WAF 的使用方法。
<!-- summary -->
文中除了介紹 WAF 之外還會配合 proxy server 一起使用，讓 WAF 像外掛式的濾水器一樣濾掉流量裡面的雜質。


本文同時為 CYBERSEC 2022 臺灣資安大會課程內容的一部分 (Lab 3)

**CyberLAB :**
問題找到了，然後呢 ? 弱掃與滲透之後如何有效的降低風險
https://cyber.ithome.com.tw/2022/lab-page/810

![](/img/posts/nick/cyberlab_2/2.png)

___

## 簡介

### 1. NAXSI
![](/img/posts/nick/cyberlab_2/3.png)



NAXSI 名稱是來自 Nginx Anti XSS & SQL Injection，從名稱就能清楚知道這是一款綁定在 Nginx 上的 WAF，或者可以說是 Nginx 第三方模組，主要的功能是在防範惡意的 Payload ，像是 XSS 與 Injection 這類的攻擊，雖然 NAXSI 檢測的範圍比起傳統 WAF 較小，但設定簡單又占用較少的系統資源，使它成為是一款相當受歡迎的開源 WAF 套件。


### 2. DVWA
![](/img/posts/nick/cyberlab_2/4.png)

DVWA 是由 PHP/MySQL 架在 Apache 伺服器上的網站，上面有設計好不同的漏洞，還有攻擊的難易度設定可以調整。

這邊為驗證 NAXSI 的有效性選了 DVWA 靶站作為我們要保護的網站，當 DVWA 安全性等級調到最低時，就可以從中找出數 10 種設計好的漏洞，可用來快速驗證 WAF 保護有沒有生效，下列的攻擊 payload 就是一個 XSS 的經典攻擊案例。

`<script>alert(document.cookie)</script>`

該攻擊可以把 cookie 用 alert 顯示出來，常見的攻擊會把這段 cookie 傳送到攻擊者的設備，然後攻擊者就有機會登入你曾經進過的網站，該弱點可以在 DVWA 的 XSS (Reflected)頁面實作如下圖，但測試之前需要把安全等級調到最低，DVWA 裡面的高安全等級網頁寫得相當嚴謹，用於示範如何從內部防範攻擊。

![](/img/posts/nick/cyberlab_2/5.png)

___

## 安裝流程

實作過程中與 LAB 環境有關的資料都可以在這邊找到
https://github.com/cymetrics/cyberlab2022

#### 0. 架設網站 (DVWA)

**實務上你要保護的是自己的網站，此步驟可以跳過，這邊使用 Docker 來快速建立測試環境，方便測試與練習。**

建立 Docker 環境，該環境是以 Ubuntu 為基底
```
docker run -v $(pwd)/mount:/tmp/mount -p 80:80 -it zet235/cyberlab2022:dvwa /bin/bash
```

執行啟動腳本，腳本中包含建立資料庫與啟動網站伺服器 Apache
```
/tmp/start.sh
```

#### 1. 安裝 Nginx + NAXSI
**這邊列出在 Nginx 上裝 NAXSI 並啟用防護的詳細步驟，兩者需要一起安裝**


建立安裝目錄，之後要下載比較多檔案

```bash
mkdir /tmp/nginx_naxsi && cd /tmp/nginx_naxsi
```

因為要在安裝時導入 naxsi，所以需要下載安裝檔

```bash
wget http://nginx.org/download/nginx-1.21.6.tar.gz
```

解壓 nginx

```bash
tar -xvzf nginx-1.21.6.tar.gz
```

下載 naxsi

```bash
wget https://github.com/nbs-system/naxsi/archive/refs/tags/1.3.zip -O naxsi-1.3.zip
```

解壓 naxsi

```bash
unzip naxsi-1.3.zip
```

安裝 lib 前更新一下

```bash
apt update
```

安裝需要的 lib

```bash
apt install -y libpcre3-dev libssl-dev unzip build-essential daemon libxml2-dev libxslt1-dev libgd-dev libgeoip-dev
```

切換到 nginx 目錄

```bash
cd /tmp/nginx_naxsi/nginx-1.21.6
```

安裝設定，指令較長複製時要注意

```bash
./configure --with-cc-opt='-g -O2 -fdebug-prefix-map=/build/nginx-RFWPEB/nginx-1.21.6=. -fstack-protector-strong -Wformat -Werror=format-security -fPIC -Wdate-time -D_FORTIFY_SOURCE=2' --with-ld-opt='-Wl,-Bsymbolic-functions -Wl,-z,relro -Wl,-z,now -fPIC' --add-module=../naxsi-1.3/naxsi_src/ --sbin-path=/usr/sbin/nginx --prefix=/usr/share/nginx --conf-path=/etc/nginx/nginx.conf --http-log-path=/var/log/nginx/access.log --error-log-path=/var/log/nginx/error.log --lock-path=/var/lock/nginx.lock --pid-path=/run/nginx.pid --modules-path=/usr/lib/nginx/modules --http-client-body-temp-path=/var/lib/nginx/body --http-fastcgi-temp-path=/var/lib/nginx/fastcgi --http-proxy-temp-path=/var/lib/nginx/proxy --http-scgi-temp-path=/var/lib/nginx/scgi --http-uwsgi-temp-path=/var/lib/nginx/uwsgi --with-debug --with-pcre-jit --with-http_ssl_module --with-http_stub_status_module --with-http_realip_module --with-http_auth_request_module --with-http_v2_module --with-http_dav_module --with-http_slice_module --with-threads --with-http_addition_module --with-http_geoip_module=dynamic --with-http_gunzip_module --with-http_gzip_static_module --with-http_image_filter_module=dynamic --with-http_sub_module --with-http_xslt_module=dynamic --with-stream=dynamic --with-stream_ssl_module --with-stream_ssl_preread_module --with-mail=dynamic --with-mail_ssl_module
```

開始安裝
```bash
make && make install
```

缺少這兩個資料夾執行時有機會噴錯，提前建好
```bash
mkdir /var/lib/nginx/ && mkdir /var/lib/nginx/body
```

#### 2. 設置核心規則
**核心規則用來判斷這次收到的封包可以得幾分，分數越高風險越高**

複製預設的核心規則到安裝位置

```bash
cp /tmp/nginx_naxsi/naxsi-1.3/naxsi_config/naxsi_core.rules /etc/nginx/naxsi_core.rules
```

#### 3. 設置基本規則

**基本規則用來決定幾分以上算是惡意行為，以及對應的處理方式**

新增基本規則
```bash
vim /etc/nginx/naxsi.rules
```

寫入基本規則到 `naxsi.rules`
```
 SecRulesEnabled;
 DeniedUrl "/error.html";

 ## Check for all the rules
 CheckRule "$SQL >= 8" BLOCK;
 CheckRule "$RFI >= 8" BLOCK;
 CheckRule "$TRAVERSAL >= 4" BLOCK;
 CheckRule "$EVADE >= 4" BLOCK;
 CheckRule "$XSS >= 8" BLOCK;
```

#### 3. 建立錯誤頁面
**預設規則中判斷為攻擊時會將當前使用者連到指定頁面，這邊我們寫一個簡單靜態頁面來測試**

新增錯誤頁 `error.html`
```
vim /var/www/html/error.html
```

在新增的 `error.html` 寫入

```html
<html>
<head>
<title>Blocked By NAXSI</title>
</head>
<body>
<div style="text-align: center">
<h1>Malicious Request</h1><hr><p>This Request Has Been Blocked By NAXSI.</p>
</div>
</body>
</html>
```

#### 4. 設定 proxy server (apache)

**讓 apache 接收來自 Nginx 的封包**

修改 `000-default.conf`
```bash

/etc/apache2/sites-available/000-default.conf
```

VirtualHost 改為 8080

```
VirtualHost *:8080
```

修改 ports.conf

```
vim /etc/apache2/ports.conf
```

Listen 改為 `8080`

```
Listen 8080
```

#### 5. 設定 proxy server (nginx)

**設定 Nginx 將經過 NAXSI 過濾的封包轉送給 Apache**

```
vim /etc/nginx/nginx.conf
```

nginx.conf

```
    server {
        location / {
            # root   html;
            # index  index.html index.htm;
            include /etc/nginx/naxsi.rules;
            proxy_pass http://127.0.0.1:8080;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
    }}
```

#### 6. 測試安裝是否成功

**先確認 DVWA 網站原本功能是否正常，在測試受到 XSS 攻擊時有沒有出現我們寫好的錯誤頁面**

![](https://i.imgur.com/6jVOQlY.png)

___

## 自建規則

### 1. 核心規則

核心規則是來給收到的 request 打分數，先說明規則的寫法，在補充一下如何新增規則

下圖是一條簡單的 XSS 規則，簡單講這條規則就是當 request 的內容中有 `<script>` 的話，request 在 XSS 項目的分數為 8 分

![](/img/posts/nick/cyberlab_2/6.png)

修改 `naxsi_core.rules` 規則來新增這條規則

```
vim /etc/nginx/naxsi_core.rules
```

把上述規則加進去，如果要驗證效果可以先註解掉其他規則

```
MainRule "msg:demo" "rx:<script>" "mz:ARGS" "s:$XSS:8" id:00123;
```

### 2. 檢查規則

基本規則是用來決定核心規則的分數達標後要進行的處理，如果在你的網站常常發生誤報，可以到這邊調高達標分數，下方為規則範本

```
SecRulesEnabled;

DeniedUrl "/error.html";

## Check Naxsi rules
CheckRule "$SQL >= 8" BLOCK;
CheckRule "$RFI >= 8" BLOCK;
CheckRule "$TRAVERSAL >= 4" BLOCK;
CheckRule "$EVADE >= 4" BLOCK;
CheckRule "$XSS >= 8" BLOCK;
```

**SecRulesEnabled:** 啟用規則

**DeniedUrl:** Block 後導到此頁面

**CheckRule:** 設定分數類型與達標後的行為


修改 `naxsi.rules` 規則來調整規則

```bash
vim /etc/nginx/naxsi.rules
```

修改 XSS 的分數上限為 90

```
CheckRule "$XSS >= 90" BLOCK;
```

可搭配一條分數為 100 的 XSS 基本規則來驗證是否生效
```
MainRule "msg:demo" "rx:<script>" "mz:ARGS" "s:$XSS:100" id:00123;
```

#### 基本規則

基本規則通常用作白名單排除功能，讓一些確定安全的功能通過檢查

```
BasicRule wl:1000 "mz:$URL:/search"
```

**wl:1000**: wl(White List) 白名單，後面的 1000 是這條規則的編號


**mz:$URL:/search**: mz(Match Zone) 規則針對的對象，範例中檢查的是 URL 中有沒有包含 search

___

## 總結

NAXSI 設定簡單防護力不差，而且簡單這個優點也代表容易配合網站進行調整，如果你用的是常見的架站工具像是 Wordpress 或 Drupal 可以直接參考別人寫好的規則 (https://github.com/nbs-system/naxsi-rules)，雖然有只能裝在 Nginx 上的缺點，但是可以透過 Proxy Server 解決，架另外一台伺服器還可以分擔一些負載。

前面為快速說明原理挑了一些簡單易懂的攻擊來示範，實際上還有更多更進階的用法，如果閱覽數量夠多，之後會再加開一篇分享一些更進階的用法與經典案例，有任何資安方面相關的問題都歡迎留言討論，或者直接到 Cymetrics 尋求協助。

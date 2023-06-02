---
title: 那些隱藏在 CDN 中的危險：為什麼 CDN 可能沒有你想的那麼安全
date: 2023-06-02
tags: [Security]
author: seadog007
layout: zh-tw/layouts/post.njk
image: /img/posts/seadog007/dangers-in-cdn/cover.png
---

<!-- summary -->
內容分發網絡 (CDN) 是現代網際網路占比相當重要的一個部分，它為全世界的使用者提供快速可靠的連結與與網路資源。但是，儘管 CDN 提供了許多好處，它們也會引入許多人可能不知道的新的安全風險。本文中將探討 CDN 的隱藏危險，並探討為什麼 CDN 可能不像你想像的那麼安全。透過簡單介紹 CDN 可能引入的各種漏洞，探討如何保護自己和您的企業免受這些威脅。本文可幫助您更好地了解 CDN 所涉及的潛在風險及其如何緩解這些風險。
<!-- summary -->

## CDN 是什麼？
CDN 英文全稱為 Content Delivery Network 或者 Content Distribution Network，中譯為內容分發網路

對於 CDN 的介紹，其實不少公司都寫得蠻詳細的，像是做 CDN 起家的大廠 Cloudflare 就有做過詳細的介紹
- [什麼是 CDN？](https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/)

在這邊要簡單介紹一下，CDN 基本上就是一組放在不同地方的 Server，這些 Server 提供附近的使用者存取相關網頁，藉此來達到多種不同的功能。
![](/img/posts/seadog007/dangers-in-cdn/cdn_cf.png)
(Source: [Cloudflare Blog](https://www.cloudflare.com/zh-tw/learning/cdn/what-is-a-cdn/))

### 為什麼要用 CDN
「用自己的伺服器直接讓使用者連線不行嗎？為什麼我們會需要使用 CDN？」
你可能會這樣想，但實際上因為 CDN 業者所擁有的資源與提供的不同功能，所以使用 CDN 在較大型的網站上已經變為常態。
![](/img/posts/seadog007/dangers-in-cdn/cdn_benifit.png)

舉例來說，因為 CDN 廠商所放置的伺服器與網路節點存在世界各地，最主要的功能就是可以幫購買 CDN 服務的用戶節省原伺服器的頻寬，同個地區的使用者存取同一靜態資源，可以經由 CDN 的暫存，就不用再連回原本伺服器，節省原站頻寬。並可以接收來自該區域的 DDoS 流量，做第一層的阻擋。

CDN 因為站點分佈廣，所以也可以提供相對應地區的使用者較低的連線延遲，改善連線速度。

CDN 也大多會提供 HTTPS Reverse Proxy 的服務，將原本沒有 HTTPS 的服務加上 HTTPS 作保護。

有些 CDN 甚至提供 WAF / IP 規則等的保護，可以保護後面的主機不受惡意攻擊。也可以起到避免攻擊者拿到原站 IP 的作用。

### CDN 是怎麼運作的呢？
剛剛說了，CDN 其實就是一組在世界各地的伺服器，當使用者連往這些伺服器時，這些 CDN 伺服器會將請求轉發回原站。畫成圖的話看起來應該會長這樣。
![](/img/posts/seadog007/dangers-in-cdn/cdn_work.png)


## CDN 所帶來的風險
使用 CDN 並不是沒有風險，畢竟在網站資訊到達使用者手上前還經過了 CDN 的伺服器，這些 CDN 可能會提供一些額外的功能。當網站設定有誤時，可能就會導致一些安全風險的產生。如：
- 錯誤的 IP 紀錄方式
- 無效的 Cache 機制
- 意想不到的傳輸協定
- 繞過阻擋清單
- Domain 聲譽影響

當然還有更多由 CDN 帶來的風險，但礙於篇幅限制這邊就只舉例這五個。

### 1. 錯誤的 IP 紀錄方式
一般 HTTP 伺服器紀錄 IP 位置的方式，是利用 TCP Socket 的 Src IP 欄位來記錄位置的。
但如果今天是由 CDN 轉發來的請求，因為 CDN 伺服器會成為客戶端向原站進行請求，所以 Src IP 會是 CDN 伺服器的回源 IP。進而造成原站伺服器紀錄到錯的 IP，導致之後的鑑識調查/事件應變/稽核相關流程發生問題。
![](/img/posts/seadog007/dangers-in-cdn/ip_wrong.png)

為了解決這個問題，CDN 廠商通常會在轉發的 HTTP 請求中塞入特定 HTTP Header 來將實際客戶端的 IP 告訴原站伺服器
![](/img/posts/seadog007/dangers-in-cdn/ip_http_header.png)

如上圖的 CDN 伺服器就是在轉發的請求中利用 Real-IP 這個 Header 來告訴原站伺服器真正客戶端的位置。

這些預設的 HTTP Header Name 其實如果有用過的話都會知道，也較少人會去更改，如：
- Cloudflare: CF-Connecting-IP
- Akamai: True-Client-IP
- Cloudfront: CloudFront-Viewer-Address
- Fastly: Fastly-Client-IP

但這個 HTTP Header 也有可能被攻擊者濫用，攻擊者如果知道原站伺服器的位置的話（如利用掃描全網等方式獲得），可以直接向原站伺服器傳送帶有特定 HTTP Header 的請求，藉此來達到偽冒 IP 的效果，造成錯誤紀錄。甚至 Bypass 相關 ACL 設定。
![](/img/posts/seadog007/dangers-in-cdn/ip_log_attack.png)

#### 解法
對於這個情況其實有兩種解決方法
- 只 Rewrite CDN 過來的請求
- 直接封鎖非 CDN 伺服器來的所有請求

1. 只 Rewrite CDN 伺服器送過來的請求的話，就會像下圖這樣，都記錄到正確的 IP。這種解法的缺點是，若非常見 Reverse Proxy (如：Nginx、Apache) 負責紀錄相關 IP 的話，會較難實作與設定
![](/img/posts/seadog007/dangers-in-cdn/ip_log_partial.png)

2. 直接封鎖非 CDN 來的請求，這種方式在設定上較快速與較好實作，也不用擔心兩種不同的情況
![](/img/posts/seadog007/dangers-in-cdn/ip_deny.png)


### 2. 無效的 Cache 機制
CDN 大多都會提供暫存機制，來讓原站不會一直收到重複的請求浪費流量，但若錯誤設定 Cache 機制的話也可能會帶來安全性風險。如：
- 被惡意植入前端後門
- 洩漏使用者資料

#### 為什麼這會發生？
CDN 判斷一個資源要被暫存與否，通常是利用副檔名或者伺服器所回傳的 MIME Type 來判斷。像是 Cloudflare 就是純利用副檔名進行判斷。
![](/img/posts/seadog007/dangers-in-cdn/cf_default_cache.png)

如果你的 CDN 只使用了副檔名進行判斷依據，可能會導致以下的情況發生，`/test.css?v=1` 與 `/test.css?v=2` 在原站上可能是不同的東西，但在經過 CDN 之後回傳了相同的結果。

CDN 通常會有相關的設定可以做更改，來決定應該依照哪些特徵（HTTP Path/Query）來判定這個是不是同個資源。

#### Case Study - ChatGPT
ChatGPT 伺服器因為不正確的 Rewrite 了 HTTP Path，導致 `/session` 與 `/session/test.css` 都會指向同一個 API。
![](/img/posts/seadog007/dangers-in-cdn/chatgpt_tweet.png)

但因 ChatGPT 使用剛剛所說的利用副檔名判斷是否應該快取的 Cloudflare，所以 `/session/test.css` 的這個請求會被 CDN 快取。這時候攻擊者可以做以下的事：
1. 傳送 `chat.openai.com/api/auth/session/aaa.css` 的連結給被害人（或是直接亂撒讓別人點）
2. 當有人點了這個連結後，CDN 伺服器就會把回傳結果暫存起來
3. 攻擊者此時就可以存取這個連結來獲得其他人的 ChatGPT Access Token

![](/img/posts/seadog007/dangers-in-cdn/chatgpt_hit.jpg)
(Source: [https://twitter.com/naglinagli/status/1639351113571868673](https://twitter.com/naglinagli/status/1639351113571868673))

#### 解法
- 好好設定 Cache 相關的設定
    - 很難
    - 檢查以下設定是否在 CDN 跟原站上都一致
        - URL rewrites
        - Parameter
- 利用套件設定 HTTP 的 Cache-Control Header，讓不該被暫存的東西不要被 CDN 暫存

### 3. 意想不到的傳輸協定
CDN 通常會幫你啟用一些你想不到，較新世代的傳輸協定，如：HTTP/2、HTTP/3、QUIC、IPv6 等。

這邊以 IPv6 為例，通常 CDN 會幫你啟用 IPv4 + IPv6 Dual Stack，讓使用兩種不同 IP 協定的人都可以連上你的網站。下圖為 Akamai Site Accelerator 的設定
![](/img/posts/seadog007/dangers-in-cdn/akamai_v6.png)

但也有 CDN 是預設開啟且無法關閉的，如 Cloudflare
![](/img/posts/seadog007/dangers-in-cdn/cf_v6.png)

這樣可能導致應用程式發生未預期的錯誤，或者是相關 ACL 遭繞過。

#### Case Study - Popcat
如果不知道 [Popcat](https://popcat.click/) 是什麼的人，這邊稍微做個簡單介紹。Popcat 是個點擊類型的遊戲，這個遊戲會把玩家的點擊次數彙整往 API 送，並加進 IP 所屬國家的排行榜。

- Popcat 分為兩個部分
    - 前端
        - 30 秒把前端總共點擊的次數回傳給 API
    - API
        - 一次請求只能包含 800 個點擊
        - 30 秒內同個 IP 只能有一個 HTTP 請求

我們的目的很明顯就是要拿到一堆 IP 來快速刷榜。但遊戲設計者在設計之初沒有考慮到 IPv6 這個協議，大概率可能是因為他原站主機只有 IPv4 的支援。在遊戲設計者使用 Cloudflare 後，我們可以看到這個站實際上是有 AAAA (IPv6) 的 DNS 紀錄的，也就是說我們可以利用 IPv6 來連到這個站。
![](/img/posts/seadog007/dangers-in-cdn/popcat_v6.png)

我們可以用以下幾種方式來獲得一大把的 IPv6 位置
- With Own v6 Allocation
- ISPs provided IPv6 Address
- 4in6 Tunnel

More Details: https://hackmd.io/@seadog007/popcat

#### 解法
CDN 引入 IPv6 相關的風險有兩種解法
- 禁用 CDN 的 IPv6 功能
- 想辦法讓原站應用程式支援
    - 非自行開發的系統可能會成為難點

### 4. 繞過阻擋清單
CDN 通常會多種多樣的內建阻擋清單，來提供一些合規或者是簡易防火牆的功能。
如 Akamai 內建的 List，有分為 IP 與 GEO 兩種類型
![](/img/posts/seadog007/dangers-in-cdn/akamai_bl.png)

又如 Cloudflare 內建的 Geo Firewall Policy，或者是付費版的 IP List
![](/img/posts/seadog007/dangers-in-cdn/cf_rule.png)

![](/img/posts/seadog007/dangers-in-cdn/cf_bl.png)

這些功能可能可以在不同場景中幫助到網站營運者，如為了合規需求所需的 ITAR, OFAC 地區清單，或者是因為地區法規可以提供的色情內容有所差別，也有些遊戲業者因為地區分潤需求利用此方式限制遊戲可以存取 API 的地區。

但是如果稍微研究一下，其實不難發現不同 CDN 廠商實作 GeoIP 的方式有所不同：如 Cloudflare 是使用 Maxmind 的 DB 來做 IP 的國家判斷，而 Akamai 是爬 IRRDB 到最下層來判斷這個 IP（相當於 whois）。

這會造成什麼問題呢？我們可以利用不同方式假冒 IP 位置的地區，讓他跟 IP 實際使用區域不一致，進而繞過相關設定，我們也可以搭配本篇前述所說的 IPv6 問題，以極低成本讓攻擊者繞過網站所設定的 ACL。

#### Demo - Akamai
1. 我們要先拿一段 >/48 的 IPv6，如這邊使用了 `2a0f:5707:ffa4::/46` 這段 IP
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_1.png)

2. 建立一個 More specific 的 whois 資料，其中 Country 欄位可以自行填寫
像這邊是建立了一個 /48 的 IP 段
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_2.png)

Country: KP 指定說這段 IP 歸屬地是 DPRK
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_3.png)

3. 這時候我們如果利用這段 IP 連往使用 IRRDB 作為 GeoIP 來源的 CDN（如 Akamai），就可以繞過相關阻擋規則
這邊也可以用 Akamai 所提供的工具做 IP Geo 檢查
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_4.png)

以此類推，我們也可以建立其他國家的 IP 段，像日本的段我們就可以用來打日本遊戲，而不用擔心使用 VPN 被阻擋等問題。
![](/img/posts/seadog007/dangers-in-cdn/demo_v6_5.png)

#### Demo - Cloudflare
如果是使用外部 GeoIP DB 的 CDN 廠商如 Cloudflare，我們可以從外部 DB 下手
我們知道 Cloudflare 用的 GeoIP DB 是 Maxmind，這時候我們可以發現 Maxmind 有提供 GeoIP 修正的表單可以填寫
https://www.maxmind.com/en/geoip-location-correction

惡意攻擊者也可以利用這種方式來將指定 IP 修正至其他國家，來繞過 Geo 類型的阻擋清單。

#### 解法
- 比較各家 CDN 所使用的 GeoIP 實作方式
- 不要太過度相信 CDN Geo 相關規則所阻擋完剩下的請求
    - 可能用了 VPN、跳板等
    - 原生 IP 地址就是被改過的

### 5. Domain 聲譽影響
要暸解這個弱點，首先我們要先了解 HTTPS 跟 HTTP Reverse Proxy 運作的原理。
首先，CDN 伺服器可能一個 IP 就負責成千上萬個網站，所以這些網站的使用者都會連往同一台伺服器，CDN 伺服器勢必要判斷使用者想去哪。

HTTP Reverse Proxy（CDN 也是種 Reverse Proxy）利用的是 HTTP Header 中的 Host 欄位來做判斷，看使用者想連往哪個網站。

HTTPS 因為有 SSL/TLS 在前面做保護，所以在 SSL/TLS 握手完之前，Reverse Proxy 沒辦法看到 HTTP 的 Header，這時候怎麼判斷使用者想連往哪個網站呢？因應這個問題所以 Reverse Proxy 使用了 SSL/TLS Handshake 中的 Server Name Indication (SNI) 欄位來做判斷。

這也是我們可以使用 `-H Host` 的方式指定要連往哪個 HTTP 站點
`curl -H 'Host: www.example.com' http://<ip>`

但 HTTPS 站點就不能透過指定 HTTP Header 來連到（除非是該 IP 的 Default Server）
`curl -H ‘Host: www.example.com’ https://<ip>`

我們必須透過 curl 的 --resolve 參數來做到這件事
`curl --resolve www.example.com:443:<ip> https://www.example.com`

許多防火牆對於 HTTPS 流量，用來判斷的依據也是 SNI
那如果今天這兩個欄位不一致會發生什麼事？我們用 SNI A 配上 HTTP Host B，如果今天 CDN Server 使用的是 SNI Prefer Forwarding 的話，就單純只看 SNI 來決定要把請求轉發給哪個原站，這時候如果原站沒有再做一次其他轉發的話，基本上是沒有問題的

但如果今天 CDN 使用的是 Host Prefer Forwarding，這時候，你用 SNI A 連到的站，會看到 B 網站的內容，這時候可能就會有攻擊情況產生。
![](/img/posts/seadog007/dangers-in-cdn/fw_table.png)

因為這個問題已存在一段時間，有些 CDN 已針對此問題做出相對應的修復，在 SNI 跟 Host Header 不一致的情況下，各家 CDN 的回應大概像是這樣：
- Cloudflare: 403
- Cloudfront: 403
- Akamai: 503 or 400
- Fastly: Host Prefer Forwarding

像 Fastly 沒有做好相關的阻擋及防範，我們可以利用這個方式來達成稱為 Domain Fronting 的攻擊。在更糟的情況下，如果 CDN 在加入 Domain 時沒有檢查 Domain 的擁有權，我們可以加入任意名稱的 Domain 來做轉發，這樣在有 SSL Inspection 的環境中，同樣也可以繞過相關偵測。

舉例來說，我們可以加入叫做 there-is-no-way.this.exist.com 的 Domain 進入 Fastly，而在當有 SSL Inspection 的環境中瀏覽時，看到的 HTTP Header 就會是這個 Domain。
![](/img/posts/seadog007/dangers-in-cdn/fastly_1.png)

#### Demo
我們先在 Fastly 上加入了一個 `www.president.gov.tw` 的 Domain，且我們知道 `bbc.com` 是用了 Fastly 的服務，這時候我們可以 curl 來存取這個網站。
![](/img/posts/seadog007/dangers-in-cdn/fastly_2.png)

這時候各種檢查機制看起來會長的像是這樣
- SSL Inspection：www.president.gov.tw
- SNI Inspection：bbc.com
- IP Firewall：151.101.64.81 (AS54113 / Fastly, Inc.)
- 內容：103.147.22.128:80（跟上面都沒關係）

會發現這個內容實際上的位置，因為利用了 CDN 隱藏原站 IP 的特性，並不存在客戶端任何檢查機制可以看到的範圍，這也導致惡意攻擊更難被識別與阻擋。

#### Case Study – China APT
中國 APT 曾用 pypi.python.org 來做 fronting domain，這時候各種客戶端的阻擋機制看起來會是這樣的：
- DNS：Query for pypi.python.org
- IP Based Firewall：Connect for Fastly （151.xxx.xxx.xxx）
- SNI Check：pypi.python.org

幾乎各種檢查機制都會被繞過，以下是事件相關的 Cobalt Strike Beacon Profile
![](/img/posts/seadog007/dangers-in-cdn/china_apt.png)
(Source: [Hiding in Plain Sight: Obscuring C2s by Abusing CDN Services](https://teamt5.org/en/posts/hiding-in-plain-sight-obscuring-c2s-by-abusing-cdn-services/))


#### 影響
這個問題會對 Domain 聲譽造成影響，如 bbc.com，在 Virustotal 上的相關結果是長這樣的。Domain 聲譽遭受影響可能導致 Email 被拒收或部分使用者連不上。
![](/img/posts/seadog007/dangers-in-cdn/bbc_virus.png)

#### 解法
對於這種問題，基本上 CDN 使用者可以做的有限，只能好好挑選 CDN 廠牌，又或者試著說服他們修復這個問題。

## 總結
看完這篇文章，你覺得使用 CDN 很糟糕嗎？當然這場演講、這篇文章並不是要叫大家不要用 CDN，在大多數的時候，使用 CDN 能帶來的好處遠遠大於使用 CDN 的缺點。

CDN 提供了網站管理者更多的保護，但 CDN 使用者還是需要確認 CDN 所提供的最佳實作方式（Best Practices Guide），並比較不同的 CDN 廠商。最後，不要過度相信 CDN 所提供的功能，這些功能有可能會導致原始網站運作不正常或出現弱點。

有任何資安方面相關的問題都歡迎留言討論，或者直接聯繫 [Cymetrics](https://cymetrics.io/zh-tw/) 尋求相關協助。

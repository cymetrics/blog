---
title: 關於 email security 的大小事 — 範例篇
author: crystal
date: 2021-07-16
tags: [Security]
layout: layouts/post.njk
image: /img/posts/crystal/email-sec-examples/cover.jpg
---

<!-- summary -->
有鑒於大家了解了 SPF、DKIM、DMARC 設置上的原理與地雷後，對於如何設置可能還是霧颯颯，因此決定再推出範例篇讓大家看一些實際的紀錄以及設置方式。希望可以讓大家輕鬆做好 email security！
<!-- summary -->

以下有不懂的標籤可以參照設定篇：
SPF 的設定 👉 [關於 email security 的大小事 — 設定篇 SPF](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-spf)
DKIM、DMARC 的設定 👉 [關於 email security 的大小事 — 設定篇 DKIM、DMARC](https://tech-blog.cymetrics.io/posts/crystal/email-sec-settings-dkimdmarc)

以下主要以 [mxtoolbox](https://mxtoolbox.com/SuperTool.aspx?run=toolpage) 作為紀錄查詢工具。

---

## SPF

在設定 SPF 時最重要的就是知道『有哪些寄信的網域』。我們用幾種情境舉例：

### 情境一：只有自家網域

首先，你需要知道自己有哪些 mail server 。

這時你有下面幾種選項：

**mail server 與寄信 domain 相同(IP 同)**，允許 IP 就是此 domain 的 IP：

```txt
v=spf1 a -all
```

**mail server 與寄信 domain 相同(IP 不同)**，允許 IP 就是 mail server 的 IP：

```txt
v=spf1 mx -all
```

**mail server 與寄信 domain 不同，或是有多台 mail server**，需一一列出：

```txt
v=spf1 mx:mail-server-1 mx:mail-server-2 mx:mail-server-3 -all
```

**已經有別的寄信 domain 設置好 SPF** ，例如 google 自己是 email provider 又同時提供 email hosting，以下為 gmail.com 的 SPF 紀錄：

```txt
v=spf1 redirect=_spf.google.com
```

建議如果想省下 DNS query 的扣打，可以考慮 **展開成 `ip4` `ip6` 機制**，例如以下為 MailChimp（servers.mcsv.net）的 SPF 紀錄：

```txt
v=spf1 ip4:205.201.128.0/20 ip4:198.2.128.0/18 ip4:148.105.8.0/21 -all
```

### 情境二：使用雲端或是第三方網域

當你使用第三方網域寄信，就必須把他們的 mail server 也放到自己的 SPF 紀錄中，一般而言他們都已經有設好 SPF 紀錄了，所以你只要用 `include` 機制就可以涵蓋。請去查詢他們設置 SPF 的 domain 然後加到紀錄中：

```txt
v=spf1 include:third-1 include:third-2 include:third-3 -all
```

_\*\*\*文末附上最近整理的常見第三方 SPF domain\*\*\*_

以 OneDegree 為例，我們使用的 hosting provider 為 Microsoft Office365，第三方服務為： SendGrid、MailChimp、FreshDesk。去網站上查一下或是在服務的 portal 裡應該就能輕鬆找到設置 SPF 的 domain，例如下圖是 MailChimp 的文件：

![](/img/posts/crystal/email-sec-examples/mailchimp.png)

資料收集完成，就能初步建構出我們的 SPF 紀錄：

```txt
v=spf1 include:spf.protection.outlook.com include:sendgrid.net include:servers.mcsv.net include:email.freshdesk.com -all
```

再來就是優化的部分，你可以去 [mxtoolbox](https://mxtoolbox.com/SuperTool.aspx?run=toolpage) 逐一查詢以上 include 的這些紀錄，會發現 email.freshdesk.com 已經包含了 sendgrid.net ，也就是說其實我們自己的紀錄中已經重複 include 了，造成一次多餘的 DNS query。

![](/img/posts/crystal/email-sec-examples/mxtoolbox.png)

排除重複的部分，我們就能得到最終的 SPF 紀錄：

```txt
v=spf1 include:spf.protection.outlook.com include:servers.mcsv.net include:email.freshdesk.com -all
```

### 情境三：同時使用自家網域跟第三方網域

這應該是最常見的情況了。只要結合上面的兩個情境就行，一般來說會把自家的 `a` `mx` 放前面，`include` 的放後面，不過這也沒有規定，純粹閱讀方便就是了。

要特別注意的是，如果你有用到 `redirect` 記得要放最後，因為 `redirect` 是一種 modifier，也就是前面的 mechanism 都沒有 match 才會執行，相對的，跳到 `redirect` 的 SPF 紀錄之後，就會以那筆 SPF 紀錄為主，本來在 `redirect` 後面的東西都會被忽略。所以如果要用就要長這樣：

```txt
v=spf1 mx include:spf.protection.outlook.com include:sendgrid.net redirect:_spf.PROVIDERSERVER.COM
```

### 發布紀錄

建構好 SPF 紀錄後請在你的 DNS 裡以 TXT 類型發布出去，等待幾分鐘應該就可以在 mxtoolbox 上查詢到了。使用雲端 hosting provider服務請一樣參考官方文件：[Gsuite](https://support.google.com/a/answer/10684623?hl=en&ref_topic=10685331)、[Office365](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/set-up-spf-in-office-365-to-help-prevent-spoofing?view=o365-worldwide#create-or-update-your-spf-txt-record)、[Amazon SES](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html)。

---

## DKIM

DKIM 不同於 SPF 在於，一筆 SPF 紀錄就代表了一個寄信 domain，因此你有幾個會寄信的 domain 就要有幾筆 SPF 紀錄，但是 DKIM 是一個 domain 可以有很多筆的，只要各個 mail server 使用的 selector 都不同就好。

### 情境一：自架的 email server

可以用這個 [DKIM generator](https://dmarcly.com/tools/dkim-record-generator) 來產生公私鑰，請把私鑰放入 mail server 設定中保管好，然後把公鑰從 DNS 發布出去。

### 情境二：雲端 hosting provider

如果你使用的是雲端 hosting provider 的服務，例如用 Microsoft Office365 或是 Gsuite，那麼 DKIM 的設定已經內建了幾乎不用你做。如果你想用自己的key pair 也可以，跟著教學設定：[Gsuite](https://support.google.com/a/answer/174126)、[Office365](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide)、[Amazon SES](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-dkim-easy-setup-domain.html) 就可以了，他還會幫你發布到 DNS。

### 情境三：第三方服務

如果是其他第三方服務（marketing email 等等），做法往往是請你發一筆 CNAME 紀錄指到由第三方服務實際創造並發布的公鑰，這樣就可以由第三方服務統一管理公私鑰，你也不用擔心 DKIM 沒發好。

舉例來說，如果是用 SendGrid，完成 “Settings/Sender Authentication/Authenticate Your Domain” 的流程後會來到這一頁：

#[from <a href="https://dmarcly.com/blog/how-to-set-up-spf-and-dkim-for-sendgrid">DMARCLY tutorial</a>](/img/posts/crystal/email-sec-examples/dmarcly.png)

你就照著發在 DNS 就好，如下：

```txt
//我們發布的
s1._domainkey.example.com CNAME s1.domainkey.uXXX.wlXXX.sendgrid.net

//sendgrid 發布的
s1.domainkey.uXXX.wlXXX.sendgrid.net TXT "v=DKIM1; k=rsa;...."
```

---

## DMARC

以下皆建議採最嚴格的設置，若擔心使用 `p=reject` 會太過嚴苛造成困擾請至少使用 `p=quarantine`。

以下範例請把 `rua` 跟 `ruf` 中的 `xx` 換成自己的信箱。可以在寄信網域中設定一個專門接收報告的信箱（例如 OneDegree 就創立了一個 `dmarc.reporting@onedegree.hk`），或是如果有使用第三方的 DMARC reporting 功能（例如 dmarcanalyzer.com）就換成他們提供的信箱。

如果決定把報告寄到其他網域的話，務必注意收信人網域有沒有授權接收報告。根據 RFC 規範，收信人網域需要在 `<dmarc domain>._report._dmarc.<reporting domain>` 發一筆 DMARC 紀錄來授權報告寄送。假設 DMARC 紀錄網域：sender.com，收報告地址為：report@thirdparty.com，則 thirdparty.com 要在 `sender.com._report._dmarc.thirdparty.com` 發一筆內容為 `v=DMARC1` 的 TXT 紀錄。這個機制的目的一來是為了防止有人故意用大量報告對第三方的收信人做垃圾信件攻擊（spamming），二來也是保護發行 DMARC 紀錄的網域不要讓過多資訊外流。

豆知識：前面提到的 dmarcanalyzer.com，就是設定接收所有報告哦！`*._report._dmarc.rep.dmarcanalyzer.com TXT "v=DMARC1;"`

另外，如果你是第一次設定，建議 `p=reject` 先改成 `p=none` 防止信件突然都被擋掉。請確認每日的彙整報告結果符合預期，並搭配手動檢查原始信件看看不同收信 mail server 效果如何，等實驗了一陣子都沒問題，再逐漸改成更嚴格的 `p=quarantine` ，穩定後使用 `p=reject`。

### 情境一：實驗中

如果你還在實驗階段，不希望所有的信都被擋下，可以用寬鬆一點的 policy 或是低一點的 percentage 讓部分信件通過驗證：

```txt
// lax policy  
v=DMARC1 p=none rua=mailto:xx ruf=mailto:xx

// lower percentage of policy application  
v=DMARC1 p=quarantine pct=20 rua=mailto:xx ruf=mailto:xx
```

### 情境二：沒有子網域

如果寄信網域只有一個，或是沒有多個子網域共用 DMARC 紀錄：

```txt
v=DMARC1 p=reject aspf=s adkim=s rua=mailto:xx ruf=mailto:xx
```

### 情境三：子網域共用 DMARC

如果 DMARC 紀錄涵蓋多個子網域：

```txt
v=DMARC1 p=reject rua=mailto:xx ruf=mailto:xx
```

如果你想為子網域設定寬鬆一點的 policy，也可以用 `sp`

```txt
v=DMARC1 p=reject sp=quarantine rua=mailto:xx ruf=mailto:xx
```

### 發布紀錄

請在你的 DNS 裡以 TXT 類型發布到 `_dmarc.<yourdomain>` 這個網域，應該一樣幾分鐘就可以在 mxtoolbox 上查詢到了。如果有把報告寄到其他網域，也請確定有發布授權紀錄。

### 不寄信的網域

上面講了會寄信的網域該如何設置，那不寄信的網域怎麼辦呢？畢竟什麼都沒設置的話，駭客用這些子網域寄信就能躲過驗證啊！

很簡單，明文禁止所有信件就好。如果有很多個不寄信的網域的話，也可以用 CNAME 的方式指到一筆紀錄，方便管理。

```txt
# SPF
record: v=spf1 -all  
DNS: parked.mydom.com TXT "v=spf1 -all"

# DKIM
record: v=DKIM1; p=  
DNS: \*.\_domainkey.parked.mydom.com TXT "v=DKIM1; p="

# DMARC
record: v=DMARC1; p=reject; rua=mailto:xx; ruf=mailto:xx  
## DNS for one parked domain:  
_dmarc.parked.mydom.com TXT "v=DMARC1; p=reject; rua=mailto:xx; ruf=mailto:xx"

## DNS for many parked domains:   
_dmarc.parked1.mydom.com CNAME _dmarc.parkeddoms.mydom.com  
_dmarc.parked2.mydom.com CNAME _dmarc.parkeddoms.mydom.com  
_dmarc.parked3.mydom.com CNAME _dmarc.parkeddoms.mydom.com  
_dmarc.parkeddoms.mydom.com TXT "v=DMARC1; p=reject; rua=mailto:xx; ruf=mailto:xx"
```

---

### Resources

*   [DMARCLY: Setting up SPF, DKIM, DMARC for Office365](https://dmarcly.com/blog/how-to-set-up-dmarc-dkim-and-spf-in-office-365-o365-the-complete-implementation-guide)
*   [DMARCLY: Setting up SPF, DKIM for Amazon SES](https://dmarcly.com/blog/how-to-set-up-spf-and-dkim-for-amazon-ses)
*   [DMARCLY: Setting up SPF, DKIM, DMARC for Gsuite](https://dmarcly.com/blog/spf-dkim-dmarc-set-up-guide-for-g-suite-gmail-for-business)

**SPF domains for common third party services:**

| Service | SPF | Lookups |
| ------- | -------- | ------- |
| Google | `_spf.google.com` | 4 |
| Microsoft (Office 365) | `spf.protection.outlook.com` | 2 |
| Amazon SES | `amazonses.com` | 1 |
| MailChimp| `servers.mcsv.net` | 1 |
| SendGrid | `sendgrid.net` | 2 |
| FreshDesk | `email.freshdesk.com` | 7 (includes sendgrid) |
| Mandrill | `spf.mandrillapp.com` | 1 |
| Mailgun | `mailgun.org` | 3 |
| Mimecast | `_netblocks.mimecast.com` | 6 |
| Postmark | `spf.mtasv.net` | 1 |
| HelpScout | `helpscoutemail.com` | 1 |
| Qualtrics | `_spf.qualtrics.com` | 1 |
| SparkPost | `sparkpostmail.com` | 2 |
| Zoho | `zoho.com` | 1 |
| Salesforce | `_spf.salesforce.com` | 2 |
| Zendesk | `mail.zendesk.com` | 1 |
| ConstantContact | `spf.constantcontact.com` | 1 |
| Sendinblue | `sendinblue.com` | 9 (includes google and zendesk)| 
| MailerLite | `_spf.mlsend.com` | 1 |
| Keap | `infusionmail.com` | 2 |
| Sendpulse | `mxsmtp.sendpulse.com` | 1 |
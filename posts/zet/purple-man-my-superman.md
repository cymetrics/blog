---
title: "遊走紅隊與藍隊：Purple man 我的超人"
date: 2023-07-18
# tags: [RedTeam, BuleTeam, YARA]
author: zet
layout: zh-tw/layouts/post.njk
image: img/posts/zet/purple-man-my-superman/cover.png
---

<!-- summary -->
很高興 2023 年 5 月可以在 [CYBERSEC 2023 臺灣資安大會](https://cyber.ithome.com.tw/2023/session-page/1819) 分享一些平常在關注或是有趣的東西。紅藍對抗隨時都在發生，紅隊利用新穎的漏洞與手法進行攻擊，藍隊可以使用各種機制與防護中斷攻擊。本篇將介紹一些好用的技巧與工具。
<!-- summary -->

# 實驗環境架設

不管是紅隊或是藍隊，都有架設 Lab 的需求。不僅可以測試攻擊留下的痕跡，亦或是重現威脅來研究並加強偵測。除了對虛擬機器狀態進行快照（Snapshot）外，還沒有其他更好的方式？


## AutomatedLab

[AutomatedLab](https://automatedlab.org/en/latest/) 是一個可以在 Hyper-V 和 Azure 上使用的工具，並支援多種服務。自動化的建置可以大幅減少我們設置 Lab 的時間。

AutomatedLab 支援的服務包括：

* Windows 7, 2008 R2, 8 / 8.1 and 2012 / 2012 R2, 10 / 2016, 2019, 2022
* SQL Server 2008, 2008R2, 2012, 2014, 2016, 2017, 2019 more
* Visual Studio 2012, 2013, 2015, 2017 more
* Team Foundation Services 2015+
* Azure DevOps more
* Exchange 2013, 2016, 2019
* SharePoint 2013, 2016, 2019
...
...


我們可以利用很簡單的 powershell script 來建立 **Windows DC 伺服器** + **Exchange 伺服器** + **加入網域的 Endpoint Client**，並指定虛擬機器的資源

```powershell
New-LabDefinition -Name LabEx2013 -DefaultVirtualizationEngine HyperV
$PSDefaultParameterValues = @{
    'Add-LabMachineDefinition:DomainName' = 'contoso.com'
    'Add-LabMachineDefinition:OperatingSystem' = 'Windows Server 2012 R2 Datacenter (Server with a GUI)'
}
Add-LabMachineDefinition -Name Ex2013DC1 -Roles RootDC -Memory 1GB
$role = Get-LabPostInstallationActivity -CustomRole Exchange2013 -Properties @{ OrganizationName = 'Test1' }
Add-LabMachineDefinition -Name Ex2013EX1 -Memory 4GB -PostInstallationActivity $role
Add-LabMachineDefinition -Name Ex2013Client1 -OperatingSystem 'Windows 10 Pro' -Memory 1GB
Install-Lab
Show-LabDeploymentSummary -Detailed

```

## DetectionLab

[DetectionLab](https://github.com/clong/DetectionLab) 是另一個選項。與 AutomatedLab 不同的是，DetectionLab 並未提供多樣化的服務供客戶進行自定義安裝，而是使用固定的四台機器組成的架構。然而，儘管如此，DetectionLab 安裝了許多實用的工具，這些包括：

* Microsoft Advanced Threat Analytics
* Splunk
* Osquery + Fleet
* Sysmon
* Zeek
* Splunk

![](/img/posts/zet/purple-man-my-superman/detection-lab.png)


其中一個值得特別提及的工具是 **Microsoft Advanced Threat Analytics (ATA)**。許多 Microsoft Defender 的內部網路偵測機制先前在 ATA 中有實作。例如 Password spraying（密碼噴射攻擊）、Pass-The-Hash、和 Pass-The-Ticket 這些內網攻擊，我們都可以重現並驗證是否能被偵測。

對於紅隊而言，可以先利用 DetectionLab 來觀察，透過 Sysmon、Zeek、ATA 等工具來預先了解可能的攻擊痕跡，並嘗試減少其可見性。另一方面，藍隊可以利用 Splunk 和 Sysmon 等工具進行威脅狩獵（Threat Hunting）的訓練，透過熟悉各種事件發生時的日誌（Log）資料，之後就能快速銜接並調查未來可能發生的相似攻擊。

# 資訊安全工具整合

企業內部會使用 SecDevOps 或 DevSecOps 把資安融入到開發流程當中，利用 CI/CD pipeline 去自動化完成。在這裡的概念會比較像是 [osmedeus](https://github.com/j3ssie/osmedeus) 工具 "flow Engine for Offensive Security" 其中的 [workflow](https://github.com/osmedeus/osmedeus-workflow)。我們可以利用 CI/CD 來達成，從最新掃描工具的安裝部署到各個階段的掃描都可以自己來客製化。


![](/img/posts/zet/purple-man-my-superman/osmedeus.png)

例如流程可以依序如下：

1. 安裝最新的工具
    * 利用 Git clone
    * 利用 Curl
2. 主機與 URL 列舉
    * subfinder
    * httpx
3. 分析與爬蟲
    * [katana](https://github.com/projectdiscovery/katana)
4. 掃描
    * ZAP Proxy
    * Nessus
    * BurpSuite
5. 通知
    * Telegram bot
    * Slack bot


我們可以透過命令安裝最新的工具，然後進行模擬（Emulation）以收集各種資料。情蒐到的資料丟進去爬蟲或是 Filter，再利用簡單粗暴的弱點掃描工具做最基本的檢查。最後可以把掃描的 log 與結果丟到通訊軟體中通知掃描完成。只要設計好 CI 流程，掃描內容跟工具都可以高度客製化。

最怕就是在滲透測試進行了長時間後，發現有基本的弱點其實是掃目錄就可以找到的，卻在初期被忽略，進而浪費了大量時間。固定且完整的自動化流程可以幫助我們節省時間並發現更多資訊，提升我們的工作效率和準確性。

![](/img/posts/zet/purple-man-my-superman/drone.png)

這邊是用 Drone CI 當作範例，新增相關環境變數以後就可以開始自動掃描，其中可以保存掃描記錄也可以自動通知掃描完成。

# 紅隊與藍隊技術

## Tunneling ([T1572](https://attack.mitre.org/techniques/T1572/))

> 可以用於隱藏真實 IP ;穿透與橋接內部網路


在滲透測試過程中，我們通常不希望公開暴露我們的 Public IP，或是某些防護牆阻擋關係，因此可以透過 Ngrok 進行檔案和 Shell 的傳輸。另外在真實的 APT（Advanced Persistent Threat）攻擊行動中，我們也可以看到其他內網穿透的做法，比如使用 SoftEther 服務將受害者的電腦與攻擊者的電腦網路連接起來，這樣攻擊者就能方便地控制並持續管理受害者的電腦。然而，這裡我們主要想要介紹的是兩個較特別的服務，分別是 Cloudflared 和 Tailscale。


Cloudflared 是 Cloudflare 提供的跨平台 command-line tunnel client，可用於結合自家的服務 [Zero Trust Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)。


![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnel.png)


我們可以在受害電腦上面執行 Cloudflared Tunnel agent，讓受害電腦作為**代理**進而存取內部網路。在 Cloudflare 設定介面中增加想要 pass through 的內網資源，其中網頁設定介面上支援 CIDR 表示。接下來在 Split Tunnels 功能中將預設內部網路的設定拿掉。以上都完成我們就可以透過 [Cloudflare WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/) 直接存取內部網路資源。

![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnels-setting.png)

![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnels-setting-2.png)

另外 Tailscale 與 Headscale 基於 WireGuard 協定，在上面多加了自己的應用，應用情境比較像是會有一個 VPN Hub，而各個 Client 可以連上來組成一個虛擬內網，通過 [NATs (Network Address Translators)](https://tailscale.com/blog/how-nat-traversal-works/) 來互相溝通。類似的服務還有像是 ZeroTier，最終可以組成一個駭客的虛擬大內網，方便駭客控制內網端主機，而不受防火牆的影響。

![](/img/posts/zet/purple-man-my-superman/tailscale.png)

**防禦與狩獵：**

我們可以利用 [YARA](https://github.com/VirusTotal/yara) 和 [SIGMA](https://github.com/SigmaHQ/sigma) 這兩種規則語言來掃描進程（Process）和內存（Memory），藉此實現基於特徵（Pattern-based）的檢測機制來強化防禦能力。這些規則的設定可以參考 Mandiant 對於偵測 VPN 的部落格分享：[Burrowing your way into VPNs, Proxies, and Tunnels](https://www.mandiant.com/resources/blog/burrowing-your-way-into-vpns)。


```
rule M_Hunting_Linux_VPNEngine_GenericSoftEther_1
{
    meta:
        author = "Mandiant"
        description = "Rule looks for SoftEther generic terms in samples."
    strings:
        $domain = "update-check.softether-network.net" ascii fullword
        $keepalive = "keepalive.softether.org"
        $vpn = "SoftEther Corporation" ascii fullword
    condition:
        filesize < 10MB and uint32(0) == 0x464c457f and all of them
}
```

## Lateral Movement ([TA0109](https://attack.mitre.org/tactics/TA0109/))


在內網滲透拿到 HASH 或是 Ticket 後想要執行命令控制其他電腦，通常會利用 PsExec, SMBExec, Atexec 但是這些方式很有可能被偵測到。這邊我們可以利用 Impacket 來客製化自己的內網移動工具。

觀察 Impacket 官方透過 SMB 的命令執行工具 [Github: Impacket examples smbexec.py](https://github.com/fortra/impacket/blob/b5dab2df5e187b81d481dbbd513ea7fe1978d76a/examples/smbexec.py#L187)，其中可以魔改一下 `self.__output` 檔案上傳位置，`self.__pwsh` powershell 執行的命令 ，這些特徵都是容易被識別與偵測的，因此我們可以利用其他系統 API 或是方式達成一樣的功能，利用改變流程與特徵的方式減少被偵測的機會。


以下命令執行的方式就容易被當作規則識別，**固定的系統路徑 + 亂數的 `.bat` 檔案 + base64 編碼的內容**，我們可以修改路徑與執行方式來繞過偵測。


```python
def execute_remote(self, data, shell_type='cmd'):
    if shell_type == 'powershell':
        data = '$ProgressPreference="SilentlyContinue";' + data
        data = self.__pwsh + b64encode(data.encode('utf-16le')).decode()

    batchFile = '%SYSTEMROOT%\\' + ''.join([random.choice(string.ascii_letters) for _ in range(8)]) + '.bat'

    command = self.__shell + 'echo ' + data + ' ^> ' + self.__output + ' 2^>^&1 > ' + batchFile + ' & ' + \
              self.__shell + batchFile

    if self.__mode == 'SERVER':
        command += ' & ' + self.__copyBack
    command += ' & ' + 'del ' + batchFile
```

另外 CrackMapExec 工具支援多種協定, Credentials, Kerberos 可以結合 BloodHound，組成模組化功能並用於列舉、密碼破解、命令執行。底層基於 Impacket 在 Linux 上面進行攻擊十分方便，其中作者成立了 [Porchetta Industries - *The* central platform to support the developers of Open Source Infosec tools](https://github.com/Porchetta-Industries)，支持開源的安全工具，概念很棒。


**防禦與狩獵：**

建置告警系統，當某些登入事件發生時會進行紀錄並通知，例如重要的 Server 若有登入也可以發送通知到 Slack 等內部通訊軟體。另外在內部網路進行流量與封包 Mirror，再丟入網路分析工具，部分內網攻擊與嘗試的 error code 就有機會被偵測到。

還可以建立 HoneyShare, HoneyUser，設置陷阱，誘使攻擊者在進到內網時通常從容易的下手。建立沒有密碼的共享資料夾、偽高權限的帳號並使用弱密碼，假如有人存取資料與登入可以進行紀錄與通知，我們就有機會抓到攻擊行為並即時阻斷。


## Evasion ([TA0103](https://attack.mitre.org/tactics/TA0103/)) & Command-and-Control ([TA0101](https://attack.mitre.org/tactics/TA0101/))

防護軟體主要的偵測可以分為：

* Pattern-based
* Behavior-based
* Indicators of Compromise (IOCs)

Pattern-based 利用固定的一些字串、URL、演算法的 Hexadecimal 作為特徵。

行為特徵 (Behavior-based) 比較像是 Web server process 開了一個 shell process 其中的命令行包含某些特別字串，這種多種行為組合成有順序性、相依性的奇特行為來作為判斷。

最後 IOC 常見的是利用 IP / URL 作為黑名單。其實對於攻擊者來說**只要時間足夠任何防護軟體都可以被繞過**。

在控制主機的後門程式中必然包含許多繞過技術，才可以在層層監控的防護機制下隱蔽的工作，其中包含：

* Unhook
* Indirect syscalls
* Run PowerShell without Powershell.exe
* Disable AMSI, ETW, Event Log


現在擁有多樣化的 Loader 與 Packer，大幅減少繞過防護軟體的時間，甚至有 SaaS 服務。攻擊者也可以利用多種語言來撰寫編譯惡意程式，我們可以用 Offensive 作為開頭加上程式語言名稱去 Github 搜索。例如 [OffensiveNim](https://github.com/byt3bl33d3r/OffensiveNim) 其中就包含執行 shellcode、patch process memory、呼叫 syscall 等範例程式碼。

Interpreter 的概念也可以結合至惡意程式中，最小化惡意程式 Loader，把模組化的功能切分開，需要的時候再下載載入執行。可以利用像是 Lua 或是 .NET Assemblies 來實作。golang 中的 [yaegi](https://github.com/traefik/yaegi) lib 也滿有趣的，可以在 golang 中執行 golang 範例如下：


```go
package main

import (
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

func main() {
	i := interp.New(interp.Options{})

	i.Use(stdlib.Symbols)

	_, err := i.Eval(`import "fmt"`)
	if err != nil {
		panic(err)
	}

	_, err = i.Eval(`fmt.Println("Hello Yaegi")`)
	if err != nil {
		panic(err)
	}
}
```

其實很多技巧與細節都是想要達到防止分析 (Anti-Forensics) 的概念。


**防禦與狩獵：**

除了先前的 YARA 與 Sigma 外，我們還可以利用各種廠商提供的 Event Query Language。搭配 Timeline Explorer 或是免費的掃描程式來幫我們偵測惡意程式。例如我們可以看 elastic 的 [detection-rules](https://github.com/elastic/detection-rules/tree/main/rules)，學習惡意程式的執行行為與特徵。

在端點上可以簡單使用 [Timeline Explorer](https://ericzimmerman.github.io/#!index.md) + [Yamato-Security/hayabusa](https://github.com/Yamato-Security/hayabusa) 來做跨電腦的 Eventlog 分析，利用時間排序來分析彙整各台電腦上的高風險事件。Nextron Systems 也有開源與免費的掃描程式 [Loki](https://github.com/Neo23x0/Loki), [Thor Lite](https://www.nextron-systems.com/thor-lite/) 可以幫忙偵測端點上的威脅。

![](/img/posts/zet/purple-man-my-superman/timeline-explorer.png)

![](/img/posts/zet/purple-man-my-superman/thor-lite.png)

# 給藍隊的一些小建議


1. 定期資產盤點，了解網路範圍邊界。不要等出事了以後不知道受害主機在哪邊。
2. 可以聯網的裝置，盡可能的更新上 patch 包括 Router, Switch, IoT, Printer, Endpoint等。
3. 架設 Log Server，Log 盡量搜集完整 包含 Firewall, Endpoint, Server。有 Log 才有調查事件的本錢。
4. 定期弱點掃描與滲透測試，並透過 DevSecOps 規劃。將資訊安全標準提升並融入日常操作中。
5. 訂閱公司產品的弱點通報以及相關情報資訊，以便了解相關攻擊手法和知識。

對於**藍隊**而言，"紅隊"是用來驗證和發現問題的工具。應定期與信任的服務提供商合作，找出並解決問題，進一步提升攻擊的成本。


# 學習與增進

主要可以利用 RSS 訂閱來達成，分類整理訂閱的項目，在閱讀過程中覺得不懂的地方去查資料又或者再找更不錯的資源來訂閱。例如找到 Github 某個專案不錯，可以去訂閱作者與他所在職的公司 Blog 等。這邊分享一些訂閱來源：

* 漏洞可以從 TVN, Exploit Database, ZDI 訂閱
* 業界的資訊可以從 ATT&CK Evaluations program 中的廠商 Tech Blog 訂閱
* 加入 Reddit, 論壇, Youtube 社群軟體討論

也有很多不錯的線上課程資源，可以參考：
* [SEKTOR7](https://institute.sektor7.net/)
* [Pentester Academy](https://www.pentesteracademy.com/)
* [Zero-Point Security Courses](https://www.zeropointsecurity.co.uk/)


最後附上過程中搜集的一些鏈結跟資源，並利用 [markmap](https://markmap.js.org/) 整理成的 [Mind map](mind-map.html)

![](/img/posts/zet/purple-man-my-superman/mind-map.png)


# Reference
* A blueprint for evading industry leading endpoint protection in 2022 - https://vanmieghem.io/blueprint-for-evading-edr-in-2022/
* MITRE ATT&CK GALLIUM Group - https://attack.mitre.org/groups/G0093/
* psexec 原理分析和实现 - https://paper.seebug.org/2056/
* Anti-Forensics - https://github.com/ashemery/Anti-Forensics
* WarCon V - Modern Initial Access and Evasion Tactics
* bigb0sss/RedTeam-OffensiveSecurity - https://github.com/bigb0sss/RedTeam-OffensiveSecurity
* tkmru/awesome-edr-bypass - https://github.com/tkmru/awesome-edr-bypass
* snovvcrash Pentester's Promiscuous Notebook - https://ppn.snovvcrash.rocks/

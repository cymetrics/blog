---
title: "Walking around between Red Team and Blue Team - Purple Man, My Superman"
date: 2023-07-18
# tags: [RedTeam, BuleTeam, YARA]
author: zet
layout: en/layouts/post.njk
image: img/posts/zet/purple-man-my-superman/cover_en.png
---

<!-- summary -->
I'm glad that I can share some interesting insights that I've been following daily at [CYBERSEC 2023 Taiwan](https://cyber.ithome.com.tw/2023/session-page/1819). Red-Blue confrontation happens all the time. Red team uses new vulnerabilities and techniques to attack, while Blue team can use various mechanisms and protection to interrupt the attack. This article will introduce some useful tips and tools.

<!-- summary -->

# LAB Environment Setup

Whether you're a red team or a blue team, there's always a need for a Lab. Not only can they test the traces of an attack, but they can also reproduce the threat to study and enhance detection. Is there a better way to do this than taking a snapshot of the state of a virtual machine?


## AutomatedLab

[AutomatedLab](https://automatedlab.org/en/latest/) is a tool that can be used on Hyper-V and Azure and supports multiple services. The automated setup can greatly reduce the time we spend setting up the Lab.

Services supported by AutomatedLab include:
```
Windows 7, 2008 R2, 8 / 8.1 and 2012 / 2012 R2, 10 / 2016, 2019, 2022
SQL Server 2008, 2008R2, 2012, 2014, 2016, 2017, 2019 more
Visual Studio 2012, 2013, 2015, 2017 more
Team Foundation Services 2015+
Azure DevOps more
Exchange 2013, 2016, 2019
SharePoint 2013, 2016, 2019
...
...
```

We can easily set up an Endpoint Client for a Windows DC Server, Exchange Server, and domain-joined endpoint by utilizing a straightforward PowerShell script. This script allows us to specify the required resources for the Virtual Machines (VMs).


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

[DetectionLab](https://github.com/clong/DetectionLab) is another option. Unlike AutomatedLab, DetectionLab does not offer a wide variety of services for customers to customize their installations, but rather uses a fixed architecture of four machines. However, DetectionLab comes with a number of useful tools, these include:

* Microsoft Advanced Threat Analytics
* Splunk
* Osquery + Fleet
* Sysmon
* Zeek
* Splunk


![](/img/posts/zet/purple-man-my-superman/detection-lab.png)


One tool worth mentioning is Microsoft Advanced Threat Analytics (ATA). Many of the internal network detection mechanisms of Microsoft Defender were formerly integrated into ATA. It allows for the reproduction and verification of intranet attacks, such as Password Spraying, Pass-The-Hash, and Pass-The-Ticket, to ensure their detection.

For the red team, DetectionLab can be utilized to observe, and tools such as Sysmon, Zeek, and ATA can be used to understand possible attack traces in advance and try to reduce their visibility. On the other hand, the blue team can use tools such as Splunk and Sysmon to conduct Threat Hunting training, and by familiarizing themselves with the log data of various events, they can then quickly connect and investigate similar attacks that may occur in the future.

# Information Security Tools Integration

Enterprises use SecDevOps or DevSecOps to integrate security into the development process and automate it using the CI/CD pipeline. The concept here is more like [osmedeus](https://github.com/j3ssie/osmedeus) tool [workflow](https://github.com/osmedeus/osmedeus-workflow) "flow Engine for Offensive Security". We can leverage CI/CD to accomplish this, encompassing the installation and deployment of the latest versions of scanning tools, as well as customizing the various stages of scanning according to our requirements.


![](/img/posts/zet/purple-man-my-superman/osmedeus.png)

For example, the process can be sequenced as follows:

1. Install the latest tools
    * Utilize Git clone
    * Utilize Curl
2. Host and URL listing
    * subfinder
    * httpx
3. Analyzing and Crawling
    * [katana](https://github.com/projectdiscovery/katana)
4. Scanning
    * ZAP Proxy
    * Nessus
    * BurpSuite
5. Notifications
    * Telegram bot
    * Slack bot


We can streamline the process by installing the latest tools through commands and conducting emulations to gather comprehensive data. This data is then fed into a crawler or filter, followed by a straightforward and robust vulnerability scanning tool for basic checks. Finally, the scanning log and results are integrated into communication software to signal the completion of scanning. A well-designed CI process allows for highly customized scanning content and tools.

The greatest concern is discovering fundamental weaknesses during extended penetration testing that could have been easily identified through catalog scanning but were overlooked at the initial stage, leading to significant time wastage. Implementing a fixed and comprehensive automation process can help us save time, uncover more information, and enhance our efficiency and accuracy.

![](/img/posts/zet/purple-man-my-superman/drone.png)

Here is an example using Drone CI. After adding the relevant environment variables, the automated scanning process can be initiated. It allows for saving scan logs and automatic notifications upon completion of the scan.


# Red and Blue Team Technology

## Tunneling ([T1572](https://attack.mitre.org/techniques/T1572/))

> Can be used to hide real IP, penetrate and bridge internal network.


During penetration testing, we usually don't want to expose our public IP, or firewall blocking mechanism, so we can use Ngrok to transfer files and shells. In real APT (Advanced Persistent Threat) attacks, we can also see other intranet penetration practices, such as using the SoftEther service to connect the victim's computer to the attacker's computer network, so that the attacker can easily take control of the victim's computers and keep them under constant management. However, here we would like to focus on two specific services, Cloudflared and Tailscale.


Cloudflared is a cross-platform command-line Tunnel client offered by Cloudflare, designed to complement, and work in conjunction with its own services, [Zero Trust Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).


![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnel.png)


We can run the Cloudflared Tunnel agent on the victim's computer to allow the victim computer to act as a **proxy** to access the internal network. Add the intranet resources you want to pass through in the Cloudflare settings interface, which supports CIDR representation in the web settings interface. Next, remove the default intranet setting in the Split Tunnels function. With all the above done, we can access the intranet resources directly through [Cloudflare WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/).

![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnels-setting.png)

![](/img/posts/zet/purple-man-my-superman/cloudflare-tunnels-setting-2.png)


In addition, Tailscale and Headscale have developed their own applications based on the WireGuard protocol. The application scenario is like having a VPN Hub where each client can connect, creating a virtual intranet that enables communication amongst themselves. This communication is facilitated through Network Address Translators ([NATs](https://tailscale.com/blog/how-nat-traversal-works/)) to establish seamless connectivity.

Similar services, such as ZeroTier, can eventually form a hacker's virtual intranet, allowing the hacker to take control of the intranet hosts without being affected by firewalls.

![](/img/posts/zet/purple-man-my-superman/tailscale.png)

**Defense & Hunting:**

We can utilize [YARA](https://github.com/VirusTotal/yara) and [SIGMA](https://github.com/SigmaHQ/sigma) to scan the process and memory to cover a pattern-based detection mechanism to strengthen the defense capability. Pattern-based detection mechanisms are implemented to strengthen the defense capability. The setup of these rules can be found in Mandiant's blog post on detecting VPNs: [Burrowing your way into VPNs, Proxies, and Tunnels](https://www.mandiant.com/resources/blog/burrowing-your-way-into-vpns).


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


If you want to execute commands and control other computers after getting a HASH or Ticket from an intranet infiltration, you usually use PsExec, SMBExec, Atexec, but these tools are very likely to be detected. Here we can use Impacket to customize our own intranet mobility tool.

Check out Impacket's official SMB command execution tool [Github: Impacket examples smbexec.py](https://github.com/fortra/impacket/blob/b5dab2df5e187b81d481dbbd513ea7fe1978d76a/examples/smbexec.py#L187), in which you can modify the `self.__output` file upload location and `self.__pwsh` powershell command. These pattern are easily recognized and detected, so we can use other system APIs or methods to achieve the same functionality, and reduce the chance of detection by changing processes and features.


The following commands are executed in a way that is easily recognized as a rule, **fixed system path + random `.bat` file + base64 encoded content**, we can modify the path and execution method to bypass detection.


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

In addition, the CrackMapExec tool supports multiple protocols, Credentials, Kerberos can be combined with BloodHound to form modular functionality and used for listing, password cracking, command execution. The Impacket-based attack on Linux, at its core, is remarkably user-friendly. Furthermore, the authors have established [Porchetta Industries](https://github.com/Porchetta-Industries), a central platform aimed at supporting developers of Open Source Infosec tools—a commendable and valuable initiative.

**Defense & Hunting:**

Set up an alarm system to record and notify when certain login events occur, for example, if an important server logs in, it can also send a notification to internal communication software such as Slack. In addition, if you perform traffic and packet mirroring on your internal network and throw in a network analysis tool, some of the error codes from internal attacks and attempts may be detected.

You can also create HoneyShare, HoneyUser, and set up traps to lure attackers, when they were in the intranet, they always pick the easy one to attack. Create shared folders without passwords, fake accounts with high privileges and use weak passwords, if someone accesses the data and logs in, it can be logged and notified, and we have a chance to catch the attack and block it immediately.


## Evasion ([TA0103](https://attack.mitre.org/tactics/TA0103/)) & Command-and-Control ([TA0101](https://attack.mitre.org/tactics/TA0101/))

The main detections of the defense software can be divided into:

* Pattern-based
* Behavior-based
* Indicators of Compromise (IOCs)

Pattern-based uses fixed strings, URLs, and Hexadecimal as features.

Behavior-based is like a web server process that opens a shell process in which the command line contains some special strings, and this kind of multiple behaviors are combined to form a peculiar behavior that is sequential and dependent to be used as a judgment.

Lastly, Indicator of Compromise (IOC) often involves utilizing IP/URL blacklists. In reality, **given enough time, attackers can bypass any protective software**.

There are many bypass techniques that must be included in the backdoor program of the controlling host in order to work covertly under the layers of surveillance and protection mechanisms, including:
* Unhook
* Indirect syscalls
* Run PowerShell without Powershell.exe
* Disable AMSI, ETW, Event Log


There are now a wide variety of Loaders and Packers that dramatically reduce the amount of time it takes to bypass protection software, and there are even SaaS services available. Attackers can also write malware in multiple languages, we can use the keyword "Offensive" at the beginning and add the language name of the program to Github search. For example, [OffensiveNim](https://github.com/byt3bl33d3r/OffensiveNim) contains sample code to run shellcode, patch process memory, call syscall, and so on.

The concept of an Interpreter can also be incorporated into malware, by minimizing the malware loader, splitting up the modular functionality, and then downloading and loading it for execution when needed. This can be implemented using Lua or .NET Assemblies. The [yaegi](https://github.com/traefik/yaegi) lib in golang is also interesting, and can be used to run golang samples in golang as follows:


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

In fact, many of the techniques and details are aimed at achieving the concept of "Anti-Forensics".


**Defense & Hunting:**

In addition to YARA and Sigma, we can also utilize the Event Query Language provided by EDR vendors, with Timeline Explorer or free scanners to help us detect malware. For example, we can look at elastic's [detection-rules](https://github.com/elastic/detection-rules/tree/main/rules) to learn malware behavior.

On the endpoint, we can simply use [Timeline Explorer](https://ericzimmerman.github.io/#!index.md) + [Yamato-Security/hayabusa](https://github.com/Yamato-Security/hayabusa) for cross-computer Eventlog analysis, which uses temporal ordering to analyze and aggregate high-risk events across computers. Nextron Systems also has open-source and free scanning programs [Loki](https://github.com/Neo23x0/Loki), [Thor Lite](https://www.nextron-systems.com/thor-lite/) to help detect threats on endpoints.

![](/img/posts/zet/purple-man-my-superman/timeline-explorer.png)

![](/img/posts/zet/purple-man-my-superman/thor-lite.png)


# A few tips for the blue team


1. Regularly conduct asset inventory and familiarize yourself with the network boundaries. Avoid waiting for incidents to occur without knowing the locations of the affected hosts.
2. Keep all devices connected to the network up to date with the latest patches, including routers, switches, IoT devices, printers, and endpoints.
3. Establish a Log Server to record as much data as possible, including logs from firewalls, endpoints, and servers. Utilize these logs for incident investigation.
4. Implement regular vulnerability scanning, penetration testing, and DevSecOps planning. Elevate information security standards and integrate them into daily operations.
5. Stay subscribed to product vulnerability notifications and related intelligence to stay informed about relevant attack techniques and knowledge.


For the Blue Team, use a "Red Team" to validate and identify vulnerabilities. Collaborate with a trusted service provider regularly to identify and resolve issues, thus increasing the cost of potential attacks.

# Learning and Improvement

You can subscribe news, techs, and RSS feeds to achieve, and categorize these subscription items. Google the information or find more valuable resources when you don't understand the concept or meaning during the learning process.For example, if you find a nice Github project, you can subscribe to the blog of the author and the company he works for. Here are some of the subscription sources:

* Vulnerabilities can be subscribed from TVN, Exploit Database, ZDI.
* Industry information can be found in the ATT&CK Evaluations program on the vendor's Tech Blog.
* Join Reddit, forums, Youtube community software discussions.

There are also many good online course resources available:
* [SEKTOR7](https://institute.sektor7.net/)
* [Pentester Academy](https://www.pentesteracademy.com/)
* [Zero-Point Security Courses](https://www.zeropointsecurity.co.uk/)


Finally, here are some links and resources collected during the process, and organized into a [Mind map](mind-map.html) using [markmap](https://markmap.js.org/).

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

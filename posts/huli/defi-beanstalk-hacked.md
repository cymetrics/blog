---
title: DeFi 穩定幣 Beanstalk 遭受攻擊事件分析
date: 2023-03-01
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/defi-beanstalk-hacked/cover.png
---

## 事件簡介

<!-- summary -->2022 年 4 月 17 日，一個去中心化的演算法穩定幣協議 Beanstalk 遭受攻擊，駭客偷走了大約 7700 萬美金的資產，也使得原本應該是 1 塊美元的穩定幣 BEAN 一度下跌至 0.063 美元。<!-- summary -->

![twitter](/img/posts/huli/defi-beanstalk-hacked/p1.png)

來源：[推特](https://twitter.com/BeanstalkFarms/status/1515700678454390785)

## 漏洞分析

Beanstalk 除了是一個去中心化的穩定幣協議以外，也帶有去中心化的治理功能，任何人都可以透過存入 BEAN 或其他相關的 token（例如說 Curve 的 BEAN3CRV-f LP token 等等）來拿到另一個叫做 Stalk 的代幣，這個代幣就等於選票，有足夠的選票（0.1%）就可以提案，提案之後投票表決，拿到一半以上的選票就會通過，然後自動執行提案。

這邊的「提案」指的是一個叫做 [propose](https://github.com/BeanstalkFarms/Beanstalk/blob/e9f49910e287e7a7afaa6db8f536b7194728b0af/protocol/contracts/farm/facets/GovernanceFacet/GovernanceFacet.sol#L35) 的智慧合約方法，你可以提供智慧合約的地址跟要呼叫的參數，一旦提案通過，就會透過 `commit` 方法自動執行這個合約。

而這個機制在設計的時候應該就有考慮到被惡意利用的可能性，因此有個門檻是至少要投票七天才能執行結果，所以照理來說如果有惡意提案，應該早在七天之內就被發現了。

不過，還有另外一個功能叫做 `emergencyCommit`，給一些緊急的狀況使用，只要票數門檻超過 2/3，就可以不用等七天，等一天就好。

所以，如果能做到以上兩點：

1. 在一天前先發布惡意提案，而且不被發覺
2. 獲得 2/3 以上的選票

就可以在 Beanstalk 上執行任何你想要的操作，例如說把池子裡面的錢全都轉走。

## 攻擊分析

在 2022 年 4 月 16 日早上 8:38，攻擊者從 Uniswap 上換了 20 萬顆的 BEAN：https://etherscan.io/tx/0xfdd9acbc3fae083d572a2b178c8ca74a63915841a8af572a10d0055dbe91d219

接著他把這 20 萬顆 BEAN 存到合約中，拿到了一定數量的 Stalk，同時也獲得了提案權：https://etherscan.io/tx/0xf5a698984485d01e09744e8d7b8ca15cd29aa430a0137349c8c9e19e60c0bb9d

獲得提案權以後，他一次提了兩個案子，編號分別為 BIP-18 以及 BIP-19，BIP-18 提供的合約地址為 [0xe5ecf73603d98a0128f05ed30506ac7a663dbb69](https://etherscan.io/address/0xe5ecf73603d98a0128f05ed30506ac7a663dbb69#code)，而 BIP-19 提供的合約地址為 [0x259a2795624b8a17bc7eb312a94504ad0f615d1e](https://etherscan.io/address/0x259a2795624b8a17bc7eb312a94504ad0f615d1e#code)

BIP-19 關聯的是一份要援助烏克蘭的合約，會把 25 萬顆 BEAN 轉到烏克蘭的帳戶底下：

![BIP-19](/img/posts/huli/defi-beanstalk-hacked/p2.png)


可以看到攻擊者為了魚目混珠，還特地將合約程式碼的檔名改叫 `InitBip18.sol`，試圖想讓其他人把這兩份提案搞混。

而 BIP-18 關聯的就是最後攻擊者執行的惡意合約，合約內容就是把錢轉到攻擊者的地址去：

![BIP-18](/img/posts/huli/defi-beanstalk-hacked/p3.png)

這邊值得關注的點是 BIP-18 中包含的合約地址 `0xe5ecf73603d98a0128f05ed30506ac7a663dbb69`，建立時間是在 2022 年 4 月 17，也就是真正的攻擊發起之後。也就是說，在提出 BIP-18 的時候，這個地址是空的，因此也沒有人知道這個裡面會是什麼。

因此，攻擊者在一天前就知道自己事後部署的合約地址是什麼，這是怎麼做到的呢？

在部署合約的時候有一個 [CREATE2](https://docs.openzeppelin.com/cli/2.8/deploying-with-create2#create2) 的操作可以用，可以事先決定好合約要部署到的位置，攻擊者就是利用了這個 opcode 做到的。

在萬事俱備以後，真正的攻擊在一天後（因為前面講過的，提案最短要過一天後才能執行）開始，攻擊者在 4 月 17 日 12:24 時建立了攻擊合約 [0x79224bC0bf70EC34F0ef56ed8251619499a59dEf](https://etherscan.io/address/0x79224bc0bf70ec34f0ef56ed8251619499a59def)，同時也部署了 BIP-18 惡意合約，接著在交易 [0xcd314668aaa9bbfebaf1a0bd2b6553d01dd58899c508d4729fa7311dc5d33ad7](https://etherscan.io/tx/0xcd314668aaa9bbfebaf1a0bd2b6553d01dd58899c508d4729fa7311dc5d33ad7) 中透過閃電貸從 Aave 中借到總價值十億美金的 DAI、USDC 跟 USDT，接著用了這些代幣去各種流動池如 Uniswap 以及 Curve 上面換取 BEAN 或是相關的 LP token，換到足夠的量以後，再拿去換成擁有投票權的 Stalk，最後投票並且執行提案：

![proposal](/img/posts/huli/defi-beanstalk-hacked/p4.png)

詳細交易過程可以參考：https://ethtx.info/mainnet/0xcd314668aaa9bbfebaf1a0bd2b6553d01dd58899c508d4729fa7311dc5d33ad7/

執行提案以後獲得 3600 萬的 BEAN 以及其他 LP token，拿去池子換回原本代幣，經過一系列換來換去以後，最後把閃電貸資金還回去，連帶獲利 24830 顆的 WETH。

## 修補建議

最安全的方式當然是把「執行提案」這件事放到線下，不再透過智慧合約自動執行。但這樣就失去了原本去中心化的精神，讓執行提案的權力掌握在開發團隊當中。

若是依然要在線上執行，對於執行提案這件事情必須要更嚴謹地去做把關，例如說投票通過之後一定要等 3 天或更久才能執行提案之類的，不要讓提案能夠馬上被執行，才能爭取時間，提早發現惡意提案。

## 總結

在幣圈利用閃電貸獲取大額資金之後，透過操縱價格來套利或是利用漏洞已經是很常見的攻擊手法了，有許多項目方也意識到此類風險，有特別對這一塊做出防護。但除了操縱價格本身，像是 Beanstalk 這種去中心化的治理模型也有可能因為治理代幣被大量操控而出現問題，往後若是要實作這種去中心化的自動治理合約，記得要特別留意此類風險。


參考資料：

1. [The Beanstalk $BEAN Exploit](259a2795624b8a17bc7eb312a94504ad0f615d1e) 推薦閱讀
2. [Beanstalk Governance Exploit](https://bean.money/blog/beanstalk-governance-exploit)
3. [Twitter @kelvinfichter](https://twitter.com/kelvinfichter/status/1515735674703470595)
4. [Twitter PeckShield Inc.](https://twitter.com/peckshield/status/1515680335769456640)
5. [Twitter @FrankResearcher](https://twitter.com/FrankResearcher/status/1515693895887294466)
6. [Beanstalk losses $181 million: the Governance Attack using a Flash Loan](https://blog.defiyield.app/beanstalk-losses-181-million-the-governance-attack-using-a-flash-loan-7459174dfa8e)
7. https://github.com/BeanstalkFarms/Beanstalk-Governance-Proposals/blob/master/bip/bip-18-exploit.md
8. [慢雾：Beanstalk 攻击事件的主要原因是社区投票和执行提案之间未设置时间间隔](https://www.defidaonews.com/article/6744030)
9. [简析 DeFi 稳定币协议 Beanstalk 被盗过亿美元过程：闪电贷结合治理的新型攻击方式](https://foresightnews.pro/article/detail/2339)
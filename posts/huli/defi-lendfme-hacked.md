---
title: 去中心化借貸平台 Lendf.Me 攻擊分析
date: 2023-04-20
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/defi-lendfme-hacked/cover.png
---

## 事件簡介

<!-- summary -->2020 年 4 月 19 日，去中心化的借貸平台 Lendf.Me 遭到攻擊，損失大約 2500 萬美元<!-- summary -->：

![p1](/img/posts/huli/defi-lendfme-hacked/p1.png)

來源：[Medium](https://medium.com/@mindao.yang/update-on-lendf-me-ee83f4380b70)

## 漏洞分析

本次事件的主要是利用 ERC777 的 `tokensToSend` 的 hook 函數進行重入攻擊，ERC777 相對於 ERC20 多了 `tokensToSend` 與 `tokensReceived` 的 hook 函數，token 發送者可以透過 `setInterfaceImplementer` 註冊一個包含 `tokensToSend` 方法的合約，當 token 由發送者送出時會就調用 `tokensToSend` 函數，這個設計讓發送者可以利用這個機制統一控制 token 的轉移。

Lendf.Me 為一個借貸平台，其中 `MoneyMarket` 為存款（supply）與提款（withdraw）的主要合約，存款與提款流程如下圖所表示：

![p2](/img/posts/huli/defi-lendfme-hacked/p2.png)

攻擊者利用 `tokensToSend` hook 函數調用 `withdraw`，導致錯誤的餘額被更新至合約。

如下圖所示，按照箭頭的執行順序會發現在 `withdraw` 最後更新完用戶餘額後回到 `supply` 又更新了一次餘額 但這次的更新的餘額卻是 `withdraw` 之前所取得的餘額：

![p3](/img/posts/huli/defi-lendfme-hacked/p3.png)

## 攻擊分析

攻擊者地址為 [0xa9bf70a420d364e923c74448d9d817d3f2a77822](https://etherscan.io/address/0xa9bf70a420d364e923c74448d9d817d3f2a77822)，在 4 月 19 日 12:43:52 建立了 [0x538359785a8d5ab1a741a0ba94f26a800759d91d](https://etherscan.io/address/0x538359785a8d5ab1a741a0ba94f26a800759d91d) 攻擊合約，接著展開一系列的攻擊。

以 [0xae7d664bdfcc54220df4f18d339005c6faf6e62c9ca79c56387bc0389274363b](https://etherscan.io/tx/0xae7d664bdfcc54220df4f18d339005c6faf6e62c9ca79c56387bc0389274363b) 為例，可以看到它存了 0.002 顆 imBTC，卻取了 0.004 出來：

![p4](/img/posts/huli/defi-lendfme-hacked/p4.png)

就這樣不斷存入再以兩倍取出，過了約 12 分鐘後，在交易 [0x111aef012df47efb97202d0a60780ec082125639936dcbd56b27551ce05c4214](https://etherscan.io/tx/0x111aef012df47efb97202d0a60780ec082125639936dcbd56b27551ce05c4214) 可以看到存入的數量已經是 113 顆，而取出的數量為 226 顆。

## 修補建議

防止重入攻擊主要有兩種方法：

### 第一種：ReentrancyGuard

原理是利用一個 private 變數紀錄進出函數的狀態，每次進入函數都會先檢查狀態，以確保進入函數後不會調用同一合約的函數。

以本事件為例 如果 `supply` 與 `witdraw` 函數都受到 `ReentrancyGuard` 保護，那進入 `supply` 函數後就不能再進入 `withdraw` 函數了，所以交易會直接失敗。

這個方式的優點是開發容易，但缺點則是會失去一些智能合約的可組合性，可參考 openzeppelin 的實作：https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard

### 第二種：Checks-Effects-Interactions 模式

防止重入最好的方法應該是讓開發者使用 Checks-Effects-Interactions 模式；以本事件為例，若將更新餘額與轉移資產順序對調，就會符合 Checks-Effects-Interactions 模式，如下圖所示：

![p5](/img/posts/huli/defi-lendfme-hacked/p5.png)


## 總結

在智慧合約進行外部呼叫相關的操作時，應該注意是否有重入攻擊的風險，如果有的話，請務必使用上面提到的兩種方式去做保護，才能杜絕此類攻擊。

另外，Lendf. Me 的智慧合約其實是從 [Compound v1](https://github.com/compound-finance/compound-money-market) 修改而來，而 Compound 本身當時因為不接受 ERC777 的 token，所以才沒出事。而許多借貸合約都是從 Compound fork 出來的，就需要特別留意同類型的風險。

參考資料：

1. [A Summary of the Attack on Lendf.Me on April 19, 2020](https://medium.com/dforcenet/a-summary-of-the-attack-on-lendf-me-on-april-19-2020-e2f1c5d96640)
2. [Uniswap/Lendf.Me Hacks: Root Cause and Loss Analysis](https://peckshield.medium.com/uniswap-lendf-me-hacks-root-cause-and-loss-analysis-50f3263dcc09)
3. [慢霧分析｜DeFi 借貸協議 Lendf.Me 被駭細節分析及防禦建議](https://www.blocktempo.com/slowmist-defi-platform-lendfme-hacked-security-suggestions/)
4. [[BlockSec DeFi攻击系列之六] 终而复始：Uniswap重入事件](https://zhuanlan.zhihu.com/p/404184586)
5. [Uniswap / Lendf.Me遭受攻击的根本原因和损失分析](https://www.jianshu.com/p/1ca263ce4c4f)
6. [去中心化金融平台Lendf.Me黑客攻击事件分析](https://www.anquanke.com/post/id/203548)
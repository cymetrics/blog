---
title: "如何防範Solidity中的隨機性漏洞"
date: 2024-10-31
author: "alice"
tags: [Blockchain, Solidity]
layout: zh-tw/layouts/post.njk
---

![](/img/posts/alice/badrandom/bad_randomness.png)

## 什麼是隨機性?
<!-- summary -->
Solidity 中的隨機性經常應用在抽獎、NFT 生成、GameFi 等等，用來分配獎品或決定遊戲道具的稀有度和外觀等特徵，分散式應用中所使用的隨機性的真實與否會直接影響用戶權益，如果隨機的結果是可以被預測或操縱的，就削弱了分散式應用追求公平的宗旨，在Solidity中產生隨機數時使用可見資訊會導致偽隨機性相關的漏洞。

本文將深入探討Solidity中的隨機性問題及其潛在風險，並提供有效的解決方案，幫助開發者保護智能合約免受此類漏洞的影響。

<!-- summary -->

## 偽隨機性來源
智慧合約中產生隨機數字的來源如果是來自可見的資訊，攻擊者可以監看交易或藉此預測結果來獲得不公平的優勢。
在智慧合約中有一些參數是完全公開的資訊:
- block.difficulty :當前區塊難度
- block.timestamp :當前區塊時間戳
- block.number :當前區塊號


### Bad Randomness 漏洞範例
合約中有一個參與抽獎的函數。
``` solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UnfairLottery {
    uint public lotteryEndTime;
    address public winner;
    bool public hasWinner;
    uint public ticketPrice = 1 ether;

    constructor() {
        // EndTime
        lotteryEndTime = block.timestamp + 30 seconds;
    }

    // participate lottery
    function participate() public payable {
        require(msg.value == ticketPrice, "Must send exactly 1 ether to participate");
        require(!hasWinner, "Lottery already has a winner");
        
        // The first participant within 30 seconds after the end of the lottery will be the winner.
        if (block.timestamp >= lotteryEndTime && !hasWinner) {
            winner = msg.sender;
            hasWinner = true;
            payable(winner).transfer(address(this).balance);
        }
    }

}

```

### Bad Randomness 漏洞範例細節

每位參與者參與抽獎都需要支付固定數量的以太幣（1 ETH）作為參加的條件。

抽選獲獎者的方式使用鏈上可見的block.timestamp作為抽獎贏家的選擇。參與者可以藉由監看鏈上資訊，或是利用自動化腳本，確保自己始終成為得獎者。

這對其他使用者造成不公平的影響，因為部分參與者可以藉由操控或預測這些公開的鏈上數據，增加自己成為贏家的機率。

更多類似的發現:
[1](https://github.com/code-423n4/2022-10-holograph-findings/issues/427),[2](https://github.com/code-423n4/2021-05-nftx-findings/issues/78),[3](https://github.com/trailofbits/publications/blob/master/reviews/zecwallet.pdf),[4](https://github.com/code-423n4/2021-04-meebits-findings/issues/30),[5](https://github.com/code-423n4/2022-03-joyn-findings/issues/50)


## 如何實現真正的隨機性
透過整合 [Chainlink VRF V2](https://docs.chain.link/vrf/v2/subscription/examples/get-a-random-number#request-random-values) 來獲取隨機數字，合約可以藉由 requestRandomWords() 發送隨機數的請求。Chainlink VRF 會處理該請求，並使用 fulfillRandomWords() 將隨機值回傳至合約，隨機值會與對應的 requestId 關聯並存儲在合約中。


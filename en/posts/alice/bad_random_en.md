---
title: "How to prevent randomness vulnerabilities in Solidity."
author: alice
date: 2024-10-31
tags: [Blockchain, Solidity]
layout: en/layouts/post.njk
---

![](/img/posts/alice/badrandom/bad_randomness.png)


## What is Randomness?
<!-- summary -->
In Solidity, randomness is often applied in lotteries, NFT generation, GameFi, and so on, to distribute prizes or determine the rarity and appearance of game items and other characteristics. The authenticity of the randomness used in decentralized applications directly impacts user rights. If the random outcome can be predicted or manipulated, it undermines the principle of fairness pursued by decentralized applications. Using visible information when generating random numbers in Solidity can lead to vulnerabilities related to pseudo-randomness.

This article will delve into the issues of randomness in Solidity and its potential risks, providing effective solutions to help developers protect smart contracts from such vulnerabilities.
<!-- summary -->

## Source of Bad Randomness
If the source of random numbers in a smart contract comes from visible information, attackers can monitor transactions or use this to predict outcomes, gaining an unfair advantage. In smart contracts, some parameters are completely public information:

- `block.difficulty`: Current block difficulty
- `block.timestamp`: Current block timestamp
- `block.number`: Current block number


### Bad Randomness Vulnerability Example
There is a function in the contract that participates in a lottery.
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

### Details of Bad Randomness Vulnerability Example

Each participant must pay a fixed amount of Ether (1 ETH) as a condition to participate in the lottery.

The method for selecting the winner uses the on-chain visible `block.timestamp` as the basis for choosing the lottery winner. Participants can monitor on-chain information or use automated scripts to ensure they always become the winner.

This creates an unfair advantage for other users, as some participants can manipulate or predict these publicly available on-chain data to increase their chances of winning.

More Similar Findings:
[1](https://github.com/code-423n4/2022-10-holograph-findings/issues/427),[2](https://github.com/code-423n4/2021-05-nftx-findings/issues/78),[3](https://github.com/trailofbits/publications/blob/master/reviews/zecwallet.pdf),[4](https://github.com/code-423n4/2021-04-meebits-findings/issues/30),[5](https://github.com/code-423n4/2022-03-joyn-findings/issues/50)


## How to Implement True Randomness
Integrating [Chainlink VRF V2](https://docs.chain.link/vrf/v2/subscription/examples/get-a-random-number#request-random-values) to obtain a random number, the contract can send a request for randomness using requestRandomWords(). Chainlink VRF processes the request and returns the random value to the contract using fulfillRandomWords(). The random value is associated with the corresponding requestId and stored in the contract.

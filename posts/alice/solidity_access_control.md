---
title: "以太坊智慧合約權限管理揭秘：常見的權限控制漏洞"
date: 2024-10-19
author: "alice"
tags: [Blockchain, Solidity]
layout: zh-tw/layouts/post.njk
---

![](/img/posts/alice/solidityAccessControl/access_control.png)

## 什麼是 Access Control?
<!-- summary -->
意即「誰可以做這件事」，這在智慧合約的世界中非常重要。
合約的存取控制可能會影響哪些角色可以鑄造代幣、對提案進行投票、凍結轉帳以及許多其他關鍵的函數。
如何正確的實行權限控制非常重要，方能避免未經授權的行為者進行操作。

在 OpenZeppelin 中，主要有兩種方式來實現存取控制：Ownable 和 Role-Based Access Control。
Ownable 使合約擁有者掌握控制權，適合較簡單的應用，但當涉及多個角色或權限層級時，RBAC 提供了更精細的控制，讓不同角色執行特定功能。

<!-- summary -->

### Ownable
OpenZeppelin 的 Ownable.sol 提供基礎的存取控制模式，合約擁有一個owner，owner擁有合約的完全控制權。這個模式通常會限制某些功能只能由合約的擁有者來執行。Ownable.sol 合約提供了一些基本的功能，如轉移擁有者權限(transferOwnership())和檢查當前的擁有者(owner())。


### Role-Based Access Control (RBAC)
OpenZeppelin 的 AccessControl.sol 提供了基於角色的存取控制。它允許合約將不同的角色分配給不同的地址，從而根據這些角色來控制對某些功能的存取。這種模式更加靈活，允許為不同的功能設置不同的角色，並可以更詳細的設計控制合約中各種功能的執行權限。

在本文將介紹幾種常見的 Access Control 相關的漏洞:
1. Lack of two-step process for contract ownership changes
2. Lack of access control

### Lack of two-step process for contract ownership changes 漏洞範例
合約中有一個可以更改當前地址的函數。
``` solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract example {
    address public currentAddress;

    event AddressChanged(address indexed newAddress);

    modifier onlyCurrentAddress() {
        require(msg.sender == currentAddress, "Not authorized");
        _;
    }

    constructor(address initialAddress) {
        currentAddress = initialAddress;
    }


    function changeAddress(address _newAddress) public onlyCurrentAddress {
        require(_newAddress != address(0), "Invalid address");
        currentAddress = _newAddress;
        emit AddressChanged(_newAddress);
    }
}

```


### Lack of two-step process for contract ownership changes 漏洞範例細節

一次性所有權變更的風險很高，因為任何錯誤都無法恢復，若在更換所有權時使用了不正確的地址，例如：使用丟失了私鑰的地址、錯誤/非白名單的地址等等，都將會導致所有需要擁有者權限的操作無法執行。
受到onlyOwner()所保護的關鍵函數，都將因無法驗證正確的所有權而無法使用。

更多類似的發現:
[1](https://github.com/code-423n4/2021-11-bootfinance-findings/issues/35), [2](https://github.com/code-423n4/2021-07-pooltogether-findings/issues/40), [3](https://github.com/trailofbits/publications/blob/master/reviews/AdvancedBlockchainQ12022.pdf), [4](https://github.com/trailofbits/publications/blob/master/reviews/MorphoLabs.pdf), [5](https://github.com/trailofbits/publications/blob/master/reviews/LooksRare.pdf)


## Lack of access control
合約中的關鍵函數或是參數未正確實施權限控制，使得未經授權的用戶可以任意操作修改，從而導致安全風險。

### Lack of access control 漏洞範例
合約中包含一個可以修改所有者及提款的函數。
``` solidity
pragma solidity ^0.8.0;

contract example {
    address public owner;
    constructor() {
        owner = msg.sender;
    }

    function setOwner(address _newOwner) public {
        owner = _newOwner;
    }
    receive() external payable {}
   function withdraw() public {
        require(msg.sender == owner, "Not authorized");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
}

```

### Lack of access control 漏洞範例細節
setOwner() 缺乏適當的訪問控制，任何人都可以調用此函數更改合約的所有者。攻擊者可以藉由 setOwner()將自己的地址設為合約的所有者，從而能繞過 withdraw() 中 ```require(msg.sender == owner)```的檢查，再呼叫withdraw() 提領合約中的所有資金


### Lack of access control 相關的安全事件 


#### 2024-04-NGF

由於合約中的缺乏適當的權限控制，攻擊者使用 [delegateCallReserves()](https://bscscan.com/address/0xa608985f5b40cdf6862bec775207f84280a91e3a#code#F1#L485) 和 [reserveMultiSync() ](https://bscscan.com/address/0xa608985f5b40cdf6862bec775207f84280a91e3a#code#F1#L521)函數，通過修改儲備金邏輯將流動性池中的 NGFS 代幣轉移給自己，再使用PancakeSwap 將NGFS 代幣兌換成 USDT，最終導致約 19 萬美元的損失。

[NGF Hacks Reproduce](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240425-ngfs---bad-access-control)

#### 2022-09-Ragnarok Online Invasion 
發生漏洞的[程式碼片段](https://bscscan.com/address/0xe48b75dc1b131fd3a8364b0580f76efd04cf6e9c#code#L185)：
``` solidity
function transferOwnership(address newOwner) public virtual {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
```

攻擊者透過 transferOwnership()將所有權轉移給自己，修改如 setTaxFeePercent() 等手續費相關參數，避免支付交易手續費。
除此之外攻擊者還排除部分帳戶的分紅，影響代幣分配機制。
攻擊者最後透過閃電貸交易利用高額手續費機制使得流動性池中的代幣失衡，並將代幣轉換為 BNB 獲利。

[Ragnarok Online Invasion Hacks Reproduce](https://github.com/SunWeb3Sec/DeFiHackLabs/blob/main/past/2022/README.md#20220908-ragnarok-online-invasion---broken-access-control)


## 如何設置完善的權限控管
在設計智慧合約時套用最小特權原則（Principle of Least Privilege, POLP )，每個角色跟函數只執行必要操作所需要的最少權限，以大幅降低中心化或是特權角色的對關鍵函數操作的控制，關鍵函數變更數值可以藉由添加時間鎖或是設計對應流程 來增加攻擊者操縱的難度
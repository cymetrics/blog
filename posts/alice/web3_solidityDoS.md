---
title: "解密 Solidity 中的 DoS 攻擊：資安漏洞與防範策略"
date: 2024-10-17
author: "alice"
tags: [Blockchain, Solidity]
layout: zh-tw/layouts/post.njk
---

![](/img/posts/alice/solidityDoS/solidityDoS.png)

## 什麼是 DoS
<!-- summary -->
Solidity 中的 DoS（Denial of Service）是一種常見的漏洞型態，藉由耗盡資源或阻斷合約運作，使得功能無法如預期執行來達成。
在區塊鏈的世界中程式碼就是資金流動或是內部邏輯的執行的實現，DoS 在嚴重的情境下，可能會直接導致資產或資金變磚，從而直接導致使用者或協議的損失。

在本文將介紹幾種常見的 DoS 情境:
1. Unbounded loop
2. Integration/Logical error
3. Refund failed
<!-- summary -->

## Unbounded loop
### Unbounded loop 漏洞範例
合約中有一個用於從存款陣列中提取資金的函數。

``` solidity
struct Deposit {
  address depositor;
  uint256 amount;
}

Deposit[] public deposits;

function deposit() public payable {
  deposits.push(Deposit(msg.sender, msg.value));
}

function withdraw() public {
  uint256 totalAmount = 0;
  uint256 length = deposits.length;

  for (uint256 i = 0; i < length; i++) {
    if (deposits[i].depositor == msg.sender && deposits[i].amount > 0) {
      uint256 amountToTransfer = deposits[i].amount;
      deposits[i].amount = 0;

      (bool success, ) = msg.sender.call {
        value: amountToTransfer
      }("");
      require(success, "Transfer failed");
    }
  }
}
```
### Unbounded loop 漏洞範例背景知識

**Gas 是什麼?**

衡量執行操作所需的計算量的單位，區塊鏈中的交易操作，從簡單的轉帳到複雜的合約交互，都需要 gas。

**Gas Limit**

是一種有助於防止無限循環和其他意外運算消耗所有網路資源的機制，對智慧合約可使用的 gas 量設定了最大限制。
當合約使用的 Gas 量超過 Gas 限制時，合約會停止執行，並且對任何更改都會 revert。

### Unbounded loop 漏洞範例細節
如果 deposits 陣列的長度過長，會因為 Gas 消耗過高導致交易無法完成，從而導致提款操作失敗。
隨著用戶數量增加，deposits 陣列的長度也會不斷增長，這將使一般使用者在提款時面臨更高的 Gas 費用，最終可能導致交易失敗，甚至無法提取其存入的資金。


## Integration/Logical error
經常發生在錯誤的條件式或是與外部整合沒有被正確處理的情況，造成合約功能中斷或無法使用。

### Logic Error 漏洞範例

合約中有一個可以設定數字的函數。
``` solidity
// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8 .0;

contract setNumber {
  uint256 returnValue;

  function setValue(uint256 _value) public {
    require(address(this).balance <= 1 ether, "Function cannot be used anymore due to high contract balance");
    returnValue = _value;
  }

  receive() external payable {}
}
```
### Logic Error 漏洞範例細節
因為使用合約餘額 ```address(this).balance <= 1 ether``` 作為條件式，導致如果有意外發送的 Ether，使得合約餘額超過 1 Ether 時，會永久阻斷 setValue()。


### Integration Error 漏洞範例
合約中有一個跨鏈結算的函數。

``` solidity
/**
 * @notice Settles claimed tokens to any valid Connext domain.
 * @dev permissions are not checked: call only after a valid claim is executed
 * @param _recipient: the address that will receive tokens
 * @param _recipientDomain: the domain of the address that will receive tokens
 * @param _amount: the amount of claims to settle
 */
function _settleClaim(
  address _beneficiary,
  address _recipient,
  uint32 _recipientDomain,
  uint256 _amount
) internal virtual {
  bytes32 id;
  if (_recipientDomain == 0 || _recipientDomain == domain) {
    token.safeTransfer(_recipient, _amount);
  } else {
    id = connext.xcall(
      _recipientDomain, // destination domain
      _recipient, // to
      address(token), // asset
      _recipient, // delegate, only required for self-execution + slippage
      _amount, // amount
      0, // slippage -- assumes no pools on connext
      bytes('') // calldata
    );
  }
  emit CrosschainClaim(id, _beneficiary, _recipient, _recipientDomain, _amount);
}
```

### Integration Error 漏洞範例背景知識

**Connext 是什麼?**

[Connext](https://docs.connext.network/) 是一種模組化協議，用於在鏈之間傳遞資金和資料。開發人員可以使用 Connext 建立跨鏈應用程式。

**xcall 的使用**

Connext 的 xcall 用途是實現跨鏈調用、資料傳遞與跨鏈資產傳輸，在使用 xcall 進行跨鏈操作時，需要支付給鏈下代理[兩種類型的費用](https://docs.connext.network/developers/guides/estimating-fees)，並且以原生資產進行支付：
1. 路由器費用
2. 中繼者費用

### Integration Error 漏洞範例細節
使用 xcall 時沒有支付中繼費用，導致無法完成跨鏈資產結算，所認領的代幣永遠不會轉移到目標鏈上的受益人錢包，跨鏈結算功能無法正常運作。

## Refund failed
此類型漏洞經常發生在智慧合約嘗試退還款項給先前使用者/合約時，由於接收方無法接受退款，導致合約的功能永久阻斷。
經典的案例如 [King of the Ether](https://github.com/NorthPoleYuri/web3SecurityCourses/blob/main/src/dos_example/king.sol)


### Refund failed 漏洞範例

合約中有一個將指定資金按比例分配給多個收件人的提款函數。


``` solidity
function withdraw(uint256 amount, address[] memory recipients) external {
  require(recipients.length > 0, "No recipients provided");
  require(recipients.length <= 3, "Too many recipients");

  uint256 recipientAmount = amount / recipients.length;
  require(recipientAmount > 0, "Amount too small to split");

  for (uint256 i = 0; i < recipients.length; ++i) {
    require(recipients[i] != address(0), "Invalid recipient address");
    token.safeTransfer(recipients[i], recipientAmount);
  }
}
```

### Refund failed 漏洞範例背景知識

### 特殊的 ERC20 代幣
實作黑名單的代幣相當常見，某些代幣（例如USDC、USDT）具有合約等級管理員控制的地址黑名單。如果某個地址被列入黑名單，則會禁止向該地址進行傳輸或從該地址傳輸代幣出去。
惡意或受損的代幣所有者可以透過將合約地址添加到黑名單中來將資金困在合約中。

### 相容 ERC20 的 ERC777 代幣
ERC777 兼容 ERC20，ERC777 藉由 ERC1820 registry 來實現 tokensReceived。
惡意的使用者可以調用 tokensReceived 並且拒絕代幣轉帳，從而導致交易失敗而使資金陷入困境。


### Refund failed 漏洞範例細節
由於在迴圈中使用 safeTransfer，如果 recipients 中有接收者被列入黑名單，或是有使用 ERC777 作為接收者的用戶在 tokensReceived 中實作 revert，會導致提款流程遭到阻斷，即使其他接收者是正常且合法的用戶，也無法收到應得的款項。

## 如何避免DoS

考慮所有可能發生的邏輯或整合錯誤、邊緣情況以及依賴外部的協議，設計完善的流程應對，避免由於 DoS 而導致對協議或使用者造成不可逆的財務損失或操作中斷，在自身協議運作或是提供其他協議進行整合支持時，才能確保雙方系統穩定及兼容性，可以藉由詳盡的測試所有使用情境來確保合約中所有功能的可用性。

---
title: "Decoding DoS Attacks in Solidity: Security Vulnerabilities and Prevention Strategies."
author: alice
date: 2024-10-17
tags: [Blockchain, solidity]
layout: en/layouts/post.njk
---

![](/img/posts/alice/solidityDoS/solidityDoS.png)


<!-- summary -->
## What is Denial of Service ?
In Solidity, Denial of Service (DoS) is a common vulnerability type that disrupts the expected execution of contract functions by exhausting resources or blocking the contract’s operation. In the blockchain world, code represents the flow of funds or the execution of internal logic. In severe cases, DoS can directly result in asset or fund immobilization, leading to losses for users or protocols.

This article will introduce several common DoS scenarios:
1. Unbounded loop
2. Integration/Logical error
3. Refund failed  
<!-- summary -->

## Unbounded loop
This means that a loop without a clear termination condition could cause the loop to run continuously. In Solidity, each operation consumes Gas, which could directly result in transaction failure.

### Unbounded loop 漏洞範例
The contract contains a function used to withdraw funds from the deposit array.
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

              
                (bool success, ) = msg.sender.call{value: amountToTransfer}("");
                require(success, "Transfer failed");
            }
        }
    }
```


### Background knowledge of Unbounded loop Vulnerability Example
**What is Gas?**

A unit used to measure the amount of computation required to execute an operation. In blockchain, every transaction operation, from simple transfers to complex contract interactions, requires gas.

**Gas Limit**

It is a mechanism that helps prevent infinite loops and other unintended computations from consuming all network resources by setting a maximum limit on the amount of gas that can be used by a smart contract. When the amount of gas used by the contract exceeds the gas limit, the contract will stop executing, and any changes will be reverted.

### Details of the Unbounded Loop Vulnerability Example
If the length of the deposits array is too long, the transaction may fail due to excessive Gas consumption, causing the withdrawal operation to fail. As the number of users increases, the length of the deposits array will continue to grow, leading to higher Gas fees for regular users when attempting to withdraw. This could eventually result in transaction failures or even the inability to withdraw the funds they have deposited.


## Integration/Logical error
This often occurs when incorrect conditions or improper handling of external integrations lead to contract functions being interrupted or rendered unusable.

### Logic Error Vulnerability Example

The contract contains a function that allows setting a number.
``` solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract setNumber {   
    uint256 returnValue;

    function setValue(uint256 _value) public {       
        require(address(this).balance <= 1 ether, "Function cannot be used anymore due to high contract balance");      
        returnValue = _value;
    }

    receive() external payable {}
}
```

###  Details of the Logic Error Vulnerability Example
Due to using the contract balance `address(this).balance <= 1 ether` as a condition, if unexpected Ether is sent, causing the contract balance to exceed 1 Ether, it will permanently block the `setValue()` function.


### Integration Error Vulnerability Example
The contract contains a function for cross-chain settlement.

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

### Background knowledge of Integration Error Vulnerability Example

**What is Connext ?**

[Connext](https://docs.connext.network/) is a modular protocol used to transfer funds and data between chains. Developers can use Connext to build cross-chain applications.

**The usage of xcall**

The purpose of Connext's xcall is to enable cross-chain calls, data transfer, and cross-chain asset transfers. When performing cross-chain operations using xcall, [two types](https://docs.connext.network/developers/guides/estimating-fees) of fees need to be paid to the off-chain agents, and the fees are paid in native assets:
1. Router fee
2. Relayer fee

### Details of the Integration Error Vulnerability Example
When using xcall, the lack of payment for the relayer fee results in the failure to complete the cross-chain asset settlement. The claimed tokens will never be transferred to the beneficiary's wallet on the target chain, causing the cross-chain settlement function to fail.

## Refund failed
This type of vulnerability often occurs when a smart contract attempts to refund a previous user/contract, and the recipient is unable to accept the refund, leading to the contract's functionality being permanently blocked. A classic example is [King of the Ether](https://github.com/NorthPoleYuri/web3SecurityCourses/blob/main/src/dos_example/king.sol)


### Refund failed Vulnerability Example

The contract contains a withdrawal function that distributes specified funds proportionally to multiple recipients.

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

### Background knowledge of Refund failed  Vulnerability Example


### Weird ERC20 tokens
It is quite common to implement blacklisted tokens. Some tokens (such as USDC, USDT) have contract-level administrator-controlled address blacklists. If an address is blacklisted, it is prohibited from sending tokens to or transferring tokens out of that address. 

Malicious or compromised token owners can trap funds in a contract by adding the contract address to the blacklist.

### ERC777 tokens that are compatible with ERC20.
ERC777 is compatible with ERC20, and it implements `tokensReceived` via the ERC1820 registry. Malicious users can invoke `tokensReceived` and reject token transfers, causing the transaction to fail and trapping the funds.


### Details of the Refund failed Vulnerability Example
Due to the use of `safeTransfer` in the loop, if any recipient in the `recipients` list is blacklisted or if a user receiving ERC777 tokens implements a `revert` in `tokensReceived`, the withdrawal process will be blocked. As a result, even if other recipients are normal and legitimate users, they will not be able to receive their entitled funds.

## How to avoid DoS

Consider all possible logical or integration errors, edge cases, and dependencies on external protocols when designing robust processes to prevent irreversible financial losses or operational interruptions caused by DoS. Whether in the operation of your own protocol or when providing integration support for other protocols, this ensures system stability and compatibility on both sides. Comprehensive testing of all use cases can help ensure the availability of all contract functions.
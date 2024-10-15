---
title: "Unveiling Access Control in Ethereum Smart Contracts: Common Access Control Vulnerabilities"
author: alice
date: 2024-10-19
tags: [Blockchain, Solidity]
layout: en/layouts/post.njk
---

![](/img/posts/alice/solidityAccessControl/access_control.png)


<!-- summary -->
## What is Access Control ?
Access control refers to "who can perform a specific action," which is crucial in the world of smart contracts. The access control of a contract can determine which roles can mint tokens, vote on proposals, freeze transfers, and execute many other essential functions. Properly implementing access control is vital to prevent unauthorized actors from performing actions.

In OpenZeppelin, there are two primary ways to implement access control: Ownable and Role-Based Access Control (RBAC).
Ownable grants control to the contract owner, making it suitable for simpler applications.
When multiple roles or permission levels are involved, RBAC provides more granular control, enabling different roles to perform specific functions.
<!-- summary -->

### Ownable

The `Ownable.sol` contract from OpenZeppelin provides a basic access control pattern, where the contract has a single **owner** who holds full control over the contract. This pattern typically restricts certain functions to be executed only by the contract owner. The `Ownable.sol` contract offers some fundamental functions, such as transferring ownership (`transferOwnership()`) and checking the current owner (`owner()`).


### Role-Based Access Control (RBAC)

The `AccessControl.sol` contract from OpenZeppelin provides role-based access control. It allows the contract to assign different roles to various addresses, thereby controlling access to specific functions based on those roles. This pattern offers greater flexibility, enabling the assignment of different roles for different functions and providing more detailed control over the execution permissions within the contract.

This article will introduce some common vulnerabilities related to access control:

1. Lack of a two-step process for contract ownership changes
2. Lack of access control

## Lack of Two-Step Process for Contract Ownership Changes

The contract does not use a phased process to complete ownership changes.

### Example of Vulnerability: Lack of Two-Step Process for Contract Ownership Changes  
The contract contains a function that allows changing the current address directly.

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
### Details of the Vulnerability: Lack of Two-Step Process for Contract Ownership Changes

A single-step ownership change carries significant risks because any mistakes made during the process are irreversible. If an incorrect address is used when transferring ownership—such as an address with lost private keys, an incorrect address, or a non-whitelisted address—it can render all operations requiring owner privileges unusable. 

Critical functions protected by `onlyOwner()` will become inaccessible since the correct ownership cannot be verified.

More similar findings:  
[1](https://github.com/code-423n4/2021-11-bootfinance-findings/issues/35), [2](https://github.com/code-423n4/2021-07-pooltogether-findings/issues/40), [3](https://github.com/trailofbits/publications/blob/master/reviews/AdvancedBlockchainQ12022.pdf), [4](https://github.com/trailofbits/publications/blob/master/reviews/MorphoLabs.pdf), [5](https://github.com/trailofbits/publications/blob/master/reviews/LooksRare.pdf)

## Lack of Access Control

Critical functions or parameters in the contract lack proper access control, allowing unauthorized users to manipulate or modify them, leading to potential security risks.

### Example of Vulnerability: Lack of Access Control  
The contract contains a function that allows modifying the owner and performing withdrawals.

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
### Details of the Vulnerability: Lack of Access Control

The `setOwner()` function lacks proper access control, allowing anyone to invoke it and change the contract’s owner. An attacker can use `setOwner()` to set their own address as the contract owner, bypassing the ownership check in the `withdraw()` function:

```solidity
require(msg.sender == owner);
```

This allows the attacker to call `withdraw()` and drain all the funds from the contract.

### Security Incidents Related to Lack of Access Control
#### 2024-04-NGF

Due to the lack of proper access control in the contract, the attacker exploited the [delegateCallReserves()](https://bscscan.com/address/0xa608985f5b40cdf6862bec775207f84280a91e3a#code#F1#L485) and [reserveMultiSync()](https://bscscan.com/address/0xa608985f5b40cdf6862bec775207f84280a91e3a#code#F1#L521) functions to modify the reserve logic and transfer NGFS tokens from the liquidity pool to their own address. The attacker then swapped the NGFS tokens for USDT on PancakeSwap, resulting in a loss of approximately $190,000.

[NGF Hacks Reproduce](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240425-ngfs---bad-access-control)

#### 2022-09-Ragnarok Online Invasion  
The vulnerable [code snippet](https://bscscan.com/address/0xe48b75dc1b131fd3a8364b0580f76efd04cf6e9c#code#L185):
``` solidity
function transferOwnership(address newOwner) public virtual {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
```
The attacker used the `transferOwnership()` function to transfer ownership to themselves and modified fee-related parameters such as `setTaxFeePercent()` to avoid paying transaction fees. 

Additionally, the attacker excluded certain accounts from receiving dividends, disrupting the token distribution mechanism. 

Finally, the attacker exploited the high fee mechanism through flash loan transactions, causing an imbalance in the liquidity pool and converting the tokens into BNB for profit.

## How to Implement Proper Access Control

When designing smart contracts, apply the **Principle of Least Privilege (POLP)**, ensuring that each role and function is granted only the minimum permissions required to perform necessary operations. This approach significantly reduces the control that centralized or privileged roles have over critical functions. 

To further mitigate the risk of manipulation by attackers, consider adding **time locks** or implementing **corresponding processes** for changing key function values. This makes unauthorized manipulation more difficult.
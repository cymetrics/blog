---
title: "2024 DeFi Smart Contract Hack Incident Review"
author: alice
date: 2024-12-30
tags: [Blockchain, Solidity]
layout: en/layouts/post.njk
---

![](/img/posts/alice/2024_defi_hack/2024_defi_hack.jpg)

## Background
<!-- summary -->
In the first half of 2024, significant progress was made in the cryptocurrency space. The U.S. Securities and Exchange Commission (SEC) approved a spot Bitcoin ETF in January, followed by the approval of a spot Ethereum ETF in July. 

Meanwhile, on April 23, the Hong Kong Securities and Futures Commission (SFC) approved three asset management companies—Bosera International, China Asset Management, and Harvest Global Investments—to issue spot Bitcoin and Ethereum ETFs. These products were officially listed on exchanges on April 30. 

The DeFi sector subsequently experienced diversified and vibrant development. Driven by market anticipation of regulatory policies, Bitcoin surpassed the $100,000 mark. According to statistics from DeFiLlama, on January 1, 2024, the total value locked (TVL) in DeFi stood at $54.162 billion. As of now (December 2024), the TVL has risen significantly, exceeding $100 billion. 

These changes symbolize the integration of crypto assets into traditional financial markets, bringing more diversified services, investment opportunities, and potential returns. 
<!-- summary -->
However, decentralized finance also faces significant challenges. As of now (December 2024), according to statistics from DeFiLlama losses due to hacking incidents have accumulated to over $9.11 billion, highlighting substantial security vulnerabilities amidst rapid development.

While market enthusiasm remains high, investors and institutions must remain vigilant regarding regulatory policies, extreme market volatility, and various security risks. Security concerns include smart contract vulnerabilities, phishing attacks, and improper private key management.

Against this backdrop, we analyzed data from DeFiHackLabs' vulnerability proof-of-concept (PoC) database, which focuses on hacking incidents caused by smart contract vulnerabilities. This analysis aims to provide in-depth discussions on DeFi contract security issues, helping industry professionals and investors understand and prevent common security risks, thereby fostering the development of the overall ecosystem.

The DeFiHackLabs vulnerability PoC database is collaboratively built by over 116 contributors worldwide. It reproduces more than 550 hacking incidents from 2017 to the present, making it a comprehensive and reliable reference for vulnerability replication.

## Analysis of Common Vulnerabilities in DeFi Smart Contracts in 2024

### 2024 Number of Vulnerabilities by Type
![image](https://hackmd.io/_uploads/BkJ5bq8HJg.png)

### 2024 Proportion of Vulnerability Types
![image](https://hackmd.io/_uploads/S1zaZc8rJg.png)


As of now (December 2024), according to statistics from the DeFiHacksLabs Reproduce Repo, there have been over 150 contract attack incidents in 2024, resulting in losses exceeding $328 million. The root causes of these vulnerabilities are quite diverse. Upon analysis and categorization, several types of vulnerabilities were identified. Among them, logic errors were the most common root cause, accounting for 50 incidents, highlighting the need for more rigorous design at the system level of smart contracts.

Following logic errors, input validation issues accounted for 20 incidents, and price manipulation accounted for 18 incidents. Input validation deficiencies or inaccuracies are a frequent type of vulnerability found during smart contract audits. Such vulnerabilities occur when contracts fail to adequately inspect and validate data and parameters provided by users or external sources before processing them. This allows attackers to manipulate contract logic, inject malicious data, or trigger unintended behaviors. Price manipulation, on the other hand, reflects risks associated with the use of oracles and market data. Several incidents involved exploits such as arbitrage based on [outdated data]((https://github.com/SunWeb3Sec/DeFiHackLabs#20240816-zenterest---price-out-of-date)), [flaws in price-setting mechanisms](https://github.com/SunWeb3Sec/DeFiHackLabs#20240305-woofi---price-manipulation), and [manipulable values retrieved by oracles]((https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240806-novax---price-manipulation)).
Other noteworthy vulnerabilities include Access Control and Reentrancy, which accounted for 17 and 12 incidents, respectively. Access control exploits involved [flaws in permission mechanisms]((https://github.com/SunWeb3Sec/DeFiHackLabs#20240323-cgt---incorrect-access-control)), [unprotected critical functions](https://github.com/SunWeb3Sec/DeFiHackLabs#20241022-erc20transfer---access-control), and [unrestricted callback functions handling fund transfers](https://github.com/SunWeb3Sec/DeFiHackLabs#20240320-paraswap---incorrect-access-control).  

Furthermore, there have also been a few cases of Precision Loss and Arbitrary Call security incidents. Although these issues occur less frequently, they still pose threats to protocol security.  

In terms of the security lifecycle management of smart contracts, in addition to regular security audits, it is essential to increase the involvement of security researchers. Engaging professional white-hat hackers during the project development phase can help quickly identify and address potential risks, ensuring significant mitigation of integration risks at every stage of development.  

After deploying contracts on-chain, real-time monitoring is necessary to detect abnormal operations or potential attacks promptly and to take immediate countermeasures to minimize losses. Security monitoring tools can be deployed to track transactions, user behaviors, and system performance, combined with alert mechanisms to automatically notify the security team for rapid response.  

In addition to the involvement of security personnel and tools, dispersing potential economic risks requires implementing comprehensive exposure management strategies. By adopting appropriate insurance solutions, protocols can provide tangible protection for both users and the protocol itself in the event of security incidents. Considering various risk allocation strategies holistically can ensure the safety of assets within the protocol.

### 2024 Vulnerability Losses by Type
![image](https://hackmd.io/_uploads/B1R3r58Hke.png)

### 2024 Proportion of Losses by Vulnerability Type
![image](https://hackmd.io/_uploads/Byt1Ds8Hyg.png)
The diversity of vulnerabilities has resulted in significant economic losses. Statistics show that the overall losses are dominated by a few high-risk vulnerabilities, with the top three types of vulnerabilities accounting for nearly 70% (69.15%) of the total loss amount.  

Among the top three types of vulnerabilities causing the highest financial losses, input validation vulnerabilities rank first with losses amounting to $115,815,175. Logic error vulnerabilities rank second with $57,084,013 in losses, while access control vulnerabilities rank third with $48,612,091.85 in losses.  

It is worth noting that in the earlier statistics on the number of vulnerabilities, access control-related vulnerabilities ranked fourth, indicating a certain degree of positive correlation between the number of vulnerabilities and the financial losses they cause. Price manipulation vulnerabilities, on the other hand, are highly dependent on specific conditions, such as trading depth and price volatility, making their profit potential relatively limited.  

Based on the above background information, we will conduct an in-depth analysis and summary of the top three types of vulnerabilities: Input Validation, Logic Errors, and Access Control. Additionally, we will provide detailed case studies from this year, exploring the root causes of these vulnerabilities and corresponding preventive measures.

## Input Validation

The lack of input validation can result in vulnerabilities that allow the manipulation of contract logic through arbitrary values. Analysis shows that most cases of such vulnerabilities this year occurred due to the absence of validation for `calldata`, enabling attackers to exploit maliciously crafted `calldata` to transfer or compromise assets within the contract. Additionally, several cases involved contracts failing to check whether an address had approval for asset transfer operations, allowing attackers to steal various assets from the contract by transferring them in bulk.  

Any data passed into a contract must undergo validation. For addresses, considerations should include whether they are whitelisted and whether they could arbitrarily manipulate assets within the contract. For numerical inputs, considerations should involve whether edge cases in calculations could potentially manipulate asset outputs in the contract. For `calldata`, there should be restrictions, such as a prohibited function selector list, to ensure that the contract operates according to the developer's intended flow.  

To effectively reduce such risks, contract development and auditing phases should improve code test coverage, incorporate user scenario testing, and perform fuzz testing to identify unexpected operations. It is also crucial to account for parameter variations when integrating with other protocols or deploying in multiple environments. Contracts and system designs must validate all input values or implement appropriate error handling to ensure security and proper functionality.

## Logic Error

Logical errors refer to flaws in the design or implementation of a smart contract where program logic is not handled correctly, resulting in behaviors that deviate from expectations. This can compromise system security, increase asset risks, or affect functionality. Upon analyzing and categorizing the root causes of logical error vulnerabilities, most cases can be grouped into the following types: state update errors, numerical calculation errors, and functional implementation errors.

State update errors occur in most cases when specific functions within a contract fail to correctly record changes. Attackers can exploit this to repeatedly trigger withdrawals after staking or performing certain actions, depleting assets within the protocol. For instance, in the cases of OTSeaStaking and JokInTheBox, improper state recording after staking allowed attackers to continuously withdraw funds.

Numerical calculation errors often arise from poorly designed numerical computations. Attackers can manipulate values, such as significantly increasing or depleting pool liquidity, to cause abnormal fluctuations in internal system prices, assets, or liabilities. This enables arbitrage or bypasses restrictions like health checks. For example, in [STM](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240606-minestm---business-logic-flaw) and [YYStoken](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240608-yystoken---business-logic-flaw), attackers manipulated reserve quantities in liquidity pools through large token swaps, disrupting the target token's price and gaining arbitrage opportunities. In [Tradeonorion](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240528-tradeonorion---business-logic-flaw), calculation errors allowed attackers to manipulate asset and liability values, effectively doubling the collateralized assets of users, which enabled them to bypass health checks. In [UPS Token](https://github.com/SunWeb3Sec/DeFiHackLabs?tab=readme-ov-file#20240409-ups---business-logic-flaw), a numerical update error allowed attackers to destroy other assets with minimal operational ratios, further depleting the total asset pool and causing irreversible losses.
Errors in functional implementation refer to poorly designed code flows that can harm the protocol in various ways. These include incorrect token swap logic, transfer functions that can deplete assets, errors in liquidation implementation, and attackers being able to bypass permission controls to register as legitimate roles.

The root causes of logical errors are diverse. Increasing the involvement of security personnel in projects can mitigate most systemic risks. After deployment, implementing real-time monitoring, abnormal transaction detection, and automated alert systems, as well as designing corresponding contingency measures such as post-incident asset recovery plans, incident reporting workflows, and emergency response drills, ensures a swift response to issues. Additionally, introducing more exposure strategies in asset management and providing asset compensation guarantees can minimize losses during incidents while ensuring a prompt response.

## Access Control

In the world of smart contracts, "who can perform this action" is critically important. Access control in contracts determines which roles can mint tokens, vote on proposals, freeze transfers, and perform other key functions. Properly implementing permission controls is essential to prevent unauthorized actors from taking malicious actions.

In cases observed this year, most vulnerabilities stemmed from improper contract visibility settings and flaws in permission design. Improper visibility settings include setting asset transfer functions to public, allowing any contract or user to transfer assets. Additionally, key functions set to public enabled attackers to arbitrarily burn assets or modify liquidity pool parameters, leading to theft or depletion of assets within the contract. Regarding permission control flaws, some contracts failed to protect upgrade authority functions, allowing attackers to escalate privileges and propose then approve actions to mint protocol assets for themselves.

Most of these issues can be effectively avoided through security reviews by qualified personnel. For deployed on-chain contracts, implementing monitoring systems for critical role addresses and tracking fund movements within the contract can help mitigate corresponding risks.

## About Cymetrics
Cymetrics is the cybersecurity arm of OneDegree Global, incorporated in Sin‐ gapore with a strong presence in the APAC & Middle East regions. From on‐ demand cybersecurity assessments to Red Team services, Cymetrics helps secure your enterprise cyber defense with proprietary SaaS‐based technol‐ ogy and market‐leading intelligence.
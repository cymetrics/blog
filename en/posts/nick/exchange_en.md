---
title: "How to Choose a Safe Exchange"
date: 2022-09-05
tags: [Web3.0,Blockchain,Security]
author: nick
layout: en/layouts/post.njk
image: /img/posts/nick/exchange/1.jpg
---

![](/img/posts/nick/exchange/ex_1.jpg)

## 前言
<!-- summary -->
Exchanges can be seen as the core of Web 3.0 centralized services, but in recent years, more and more cybersecurity incidents are surrounding exchanges. Therefore, it has become very important to find more scientific ways to choose exchanges instead of relying on own instincts.
<!-- summary -->
## Basic Judgement Methods
When there is not enough information, or when you are just starting to invest, the following three conditions are often used to choose an exchange. These methods are not wrong, but they are not enough. The reasons will be explained later. The items are listed for everyone to check whether they only rely on these methods to judge.
### 1. Size of Exchanges:：
Large-scale exchanges should be chosen in top priority. It seems like there’s a positive correlation between the size of exchanges and their safety standard and quality.
### 2. Multilingual support:
Choose the one that provides local language options. It is even better to have live customer service in the corresponding language.
### 3. Smooth Operation:
It includes platform operating experience, fluency, information transparency, etc. Usually, the technical capabilities are positively related to security.

## From a Cybersecurity Perspective

#### If you want to eat a fresh fish, it is faster to find a shop that sells live fish than to learn how to fish.

The methods introduced in the following can be roughly divided into two categories, one is the exchange security rating organized by experts for you, and the other is that experts integrate various non-intrusive scanning platforms. We emphasize non-intrusive testing is because if unauthorized testing affects the other party's service, there will be legal responsibility coming along. So only non-intrusive tests are recommended when evaluating other companies' websites.

### 1. Cybersecurity Rating:
#### Tool link: [CER.Live](https://cer.live)

It is the fastest and most convenient way to judge an exchange’s security by checking its cybersecurity rating. CER.Live uses its own method to evaluate more than 300 well-known cryptocurrency exchanges, and 111 exchanges have obtained security certification. It is a pity that not all exchanges have paid CER.Live to do a more in-depth test. The exchanges that have not been tested in depth will not get high scores. If the exchange you want to choose is one of the certified exchanges, CER.Live can help you quickly understand the security level of this exchange.

In addition to looking at the security of the trading platform, CER.Live will also include penetration testing, bug bounty programs, proof of funds, etc. into the rating, which can be quickly checked from the platform. The picture below shows the top 10 exchanges in terms of security.

![](/img/posts/nick/exchange/ex_2.jpg)
Resource: https://cer.live/

### 2. Cybersecurity Incidents:

#### Tool link: [SlowMist](https://hacked.slowmist.io)

Another way to judge an exchange’s security is to see if it has happened any incident in the past. SlowMist helps us to sort out the cybersecurity incidents related to the blockchain, and attaches the loss amounts and attack methods, which is very useful for evaluating the security of the exchange. We recommend using the search function to check whether there has been a cybersecurity incident on the exchange you are interested in before the selection.

Some exchange platforms themselves are very safe, but there is negligence existing in management, such as keys stolen by employees, developers fleeing with money, etc. Such problems are unlikely to be found by testing the platform with scanning tools. From the cybersecurity incident records, there is a chance to see clues.

The following picture shows the two recent cybersecurity incidents while this article is written. The incidents in the picture are taken as an example. It is not recommended to conduct transactions on the audius (https://audius.co/) platform, because the type of attack is a contract vulnerability, and the amount of loss is not small.

![](/img/posts/nick/exchange/ex_3.jpg)
Resource: https://hacked.slowmist.io/


### 3. Trading Volume Statistics:

#### Tool link: [CoinGecko](https://www.coingecko.com)

#### Tool link: [CoinMarketCap](https://coinmarketcap.com)

Although at first glance there is no major correlation between transaction volume and cybersecurity; nevertheless, there are many cybersecurity incidents that can be seen from the transaction volume. The classic case is some digital currencies or smart contracts issued for the purpose of collecting funds. The following is a classic news case.

News link: [The Fake Team That Made Solana DeFi Look Huge](https://www.coindesk.com/layer2/2022/08/05/the-fake-team-that-made-solana-defi-look-huge/ "Title")

If you want to avoid unscrupulous exchanges full of such commodities, trading volume and liquidity are very important. Those information can usually be found in the trading information in the exchange, but in order to prevent fraud or flooding, using a non-exchange third party is very important to analyze the platform. We recommend CoinGecko and CoinMarketCap. These two platforms will track the trading address of the exchange and analyze the trading volume of the exchange. We can use this kind of platform to quickly find the trading volume of exchanges.

![](/img/posts/nick/exchange/ex_4.jpg)
Resource: https://www.coingecko.com/zh-tw/交易平台

## Advanced Judgement Methods

#### If the store doesn't sell the fish you want, learn how to fish !

If the exchange you are evaluating is a relatively new platform, although there’s no cybersecurity incident before, it is not on the security list of the rating website. If you want to use a free cybersecurity tool to do a little security test on the exchange, here we recommend two non-intrusive scanning tools to prevent unauthorized testing from affecting other party's services and avoid being judged as an attack.

### 1. Encryption (SSL/TLS) Strength:

#### Tool link: [SSL Labs](https://www.ssllabs.com/ssltest/)

<br>

![](/img/posts/nick/exchange/ex_5.jpg)

<br>

SSL Labs can find out all the SSL/TLS encryption methods supported by the website and score the website according to the strength of the encryption method. It is recommended to choose an exchange with a rating of A or above, which greatly reduces the risk of information leakage caused by the decryption of the communication content.

In the HTTPS website, the conversation you communicate with the exchange is encrypted, and the transaction information will not be disclosed to others due to the outflow of packets. In order to communicate with different types of users, the website will provide multiple encryption methods for users to choose. The old encryption methods have been proven to be exploitable. In order to communicate with the old system (such as Windows XP using IE browser), many websites still keep these weak encryption methods, which gives hackers the opportunity to exploit the loopholes. Compared with other attacks, the decryption cost is very high. Usually, attackers rarely use this method to attack general websites, but when they know that the target is an exchange, it will be treated as a special case. Information related to money is worth a lot of time for hackers to crack in. Therefore, the strength of encryption is very critical at this moment.

### 2. Website Toolkit Check:

#### Tool link: [Snyk website-scanner](https://snyk.io/website-scanner/)

![](/img/posts/nick/exchange/ex_6.jpg)

Snyk can be used to check whether a website uses an unsafe plugin with third party libraries. Unsafe condition is defined as the version currently used by the toolkit has been reported to have vulnerabilities, and there will be corresponding risks if used.

No matter how beautiful a building is, if its foundation is unstable, it will collapse after being shaken by the earthquake. Whether it is the server selected for the website-building or the third-party library installed on the website, it will affect the security of the website. Generally, we will expect the exchanges to use newer and safer plugin; therefore, these two points are the top priority when doing evaluation. We could firstly use Snyk to check whether the toolkits library or plugin used on the website have security problems. This tool will scan the library and plugin versions on the website and check with the information on the vulnerability platform (CVE). Later on, the version information found by Snyk will be used to query the release date of the version. If an exchange uses a plugin with third party libraries that is no longer maintained, it is also a deduction item during evaluation.

## Conclusion

Various methods have been introduced to evaluate the security of exchanges. Although their specialties are not the same, they are not in conflict with each other. If you plan to conduct large or long-term transactions, you can choose to use multiple methods together.

If you want to buy a relatively popular currency or contract today, it is recommended to check the rating first and then the trading volume when choosing an exchange. These two queries are relatively quick and intuitive. You can then check whether there’s any major security incident. However, if you want to pursue high-risk and high-reward trading in relatively small or emerging currencies, you can only use tools to detect since their trading volume are not huge and they won’t be listed on security rating ranking.

Last but not least, if you feel that the analysis for those exchanges is too complicated, and you want to find an expert to give you a more certain answer, Cymetrics also provides such services, especially for various Web 3.0 testing services. Welcome to contact us directly.
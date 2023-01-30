---
title: Poly Network 遭駭事件分析
date: 2023-01-30
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/defi-poly-network-hacked/cover.png
---

<!-- summary -->
前一陣子開始研究智慧合約相關的漏洞，參考了許多資料以後對一些經典的 DeFi 遭駭事件重新做了分析，並撰寫了分析報告。雖然說有些事件有點舊了，但類似的漏洞依舊不斷發生，還是很有分析的價值。接下來也會陸續有幾篇相關的分析報告產出，而這次來看的是一個叫做 Poly Network 的專案。
<!-- summary -->

## 事件簡介

Poly Network 是一個跨鏈橋的專案，你可以透過它把資產從 A 鏈轉到 B 鏈。

在 2021 年 8 月 10 日，Poly Network 遭受駭客攻擊，損失超過 6 億美金，成為了 DeFi 歷史中損失前三名的事件：

![intro](/img/posts/huli/defi-poly-network-hacked/p1.png)

圖片來源：[Twitter](https://twitter.com/PolyNetwork2/status/1425073987164381196)

在分析攻擊手法之前，我們先簡單瞭解一下 Poly Network 的運作。

先來看看 Poly Network 的官網是怎麼描述自己的：

> Poly Network is a global cross-chain protocol for implementing blockchain interoperability and building Web3.0 infrastructure

簡單來說呢，Poly Network 就是一個跨鏈橋的協議，可以讓 A 鍊的資產跨到 B 鏈去，而詳細的流程可以看底下這張出現在 Poly Network 白皮書裡的圖：

![whitepaper](/img/posts/huli/defi-poly-network-hacked/p2.png)

假設我要把 USDC 從 Ethereum 轉到 Ontology 去，我就先在 Ethereum（SRC chain） 上呼叫 Poly Network 的智慧合約，接著等交易上鏈以後，off chain 的 Relayer 就會收到通知，接著把這筆交易的 block header 同步到 Poly Chain 上面。

同步到 Poly Chain 以後，又會有另外一個 Relayer 收到通知，確認交易合法性以後，就會把交易透過智慧合約同步到 Ontology（DST chain）上，最後由 DST chain 上的智慧合約完成交易。

那 DST chain 上面的智慧合約，要怎麼知道它現在簽署的交易是合法的？Poly Chain 上有幾個 validator 的節點，公鑰都存在 DST chain 上的智慧合約內，因此智慧合約只要拿這些公鑰來驗證傳進來的交易，就知道這些交易是不是真的合法。

以上大概就是 Poly Network 的基本運作流程。

## 漏洞分析

在跨鏈轉帳的時候，執行流程大約是：

1. 呼叫 SRC chain 上的 LockProxy 智慧合約，執行 lock
2. 發出 CrossChainEvent，並說明要呼叫 DST chain LockProxy 的 unlock
3. SRC Relayer 把區塊資訊同步到 Poly Network 上
4. DST Relayer 監聽到新事件後，呼叫 DST chain 的智慧合約
5. DST chain 透過 _executeCrossChainTx 執行智慧合約的呼叫

在最後一步 `_executeCrossChainTx` 的時候，智慧合約是透過存在鏈上的 validator 公鑰來驗證傳進來的 Tx 是否合法，如果我們能把超過驗證門檻數量的 validator 駭掉，或是把鏈上儲存的公鑰換掉，就可以偽造出合法的 Tx。

而換掉 validator 公鑰的操作，在另外一個合約 [EthCrossChainData](https://github.com/polynetwork/eth-contracts/blob/d16252b2b857eecf8e558bd3e1f3bb14cff30e9b/contracts/core/cross_chain_manager/data/EthCrossChainData.sol#L45) 中，叫做 `putCurEpochConPubKeyBytes`：

``` sol
// Store Consensus book Keepers Public Key Bytes
function putCurEpochConPubKeyBytes(bytes memory curEpochPkBytes) public whenNotPaused onlyOwner returns (bool) {
    ConKeepersPkBytes = curEpochPkBytes;
    return true;
}
```

這個函式有加上 `onlyOwner`，因此需要是函式的擁有者才能呼叫，那誰是擁有者呢？擁有者是另一個叫做 `EthCrossChainManager` 的合約。所以，如果我們可以用 `EthCrossChainManager` 的身份去呼叫 `EthCrossChainData` 的 `putCurEpochConPubKeyBytes`，就可以把公鑰換成我們自己的。

那該怎麼達到這一步呢？讓我們看看在 `EthCrossChainManager` 合約裡的 `_executeCrossChainTx` 方法：

``` sol
function _executeCrossChainTx(address _toContract, bytes memory _method, bytes memory _args, bytes memory _fromContractAddr, uint64 _fromChainId) internal returns (bool){
    // Ensure the targeting contract gonna be invoked is indeed a contract rather than a normal account address
    require(Utils.isContract(_toContract), "The passed in address is not a contract!");
    bytes memory returnData;
    bool success;
    
    // The returnData will be bytes32, the last byte must be 01;
    (success, returnData) = _toContract.call(abi.encodePacked(bytes4(keccak256(abi.encodePacked(_method, "(bytes,bytes,uint64)"))), abi.encode(_args, _fromContractAddr, _fromChainId)));
    
    // Ensure the executation is successful
    require(success == true, "EthCrossChain call business contract failed");
    
    // Ensure the returned value is true
    require(returnData.length != 0, "No return value from business contract!");
    (bool res,) = ZeroCopySource.NextBool(returnData, 31);
    require(res == true, "EthCrossChain call business contract return is not true");
    
    return true;
}
```

可以看到這裡對 `_toContract` 沒有任何限制，所以這邊其實可以傳入 `EthCrossChainData` 的地址！

那 method 的話怎麼辦呢？更換公鑰是 `function putCurEpochConPubKeyBytes(bytes)`，怎麼看都不會符合 `method(bytes,bytes,uint64)`。

但是 Solidity 的運作方式或許跟你想的不同，你以為 Solidity 會用 `method(bytes,bytes,uint64)` 這個字串去找出合約相對應的 method，但這是錯的。

事實上，Solidity 在查詢 method 的時候，都是用一個叫做 method ID 的東西。把 method name 加上 signature 丟到 `keccak256` 去做 hash，然後取前 4 個 bytes 就是 method ID。

舉例來說，`putCurEpochConPubKeyBytes(bytes)` hash 完以後是 `41973cd9ca2c3f7fa28309a71815e084e9827b0551227e684c70c7d6c9e5e031`，取前四個 bytes 就是 `41973cd9`，這個就是它的 method ID。

在 call 的時候也是一樣，Solidity 不會用你提供的字串來找，而是取 hash 完的前四個 bytes。

也就是說，如果我們找到一個字串 str 使得 `str(bytes,bytes,uint64)` 的前四個 bytes 是 `41973cd9`，我們就能呼叫到 `putCurEpochConPubKeyBytes`。

這樣的字串有很多個，而 `f1121318093` 就是一個，`f1121318093(bytes,bytes,uint64)` hash 完的結果是 `41973cd95e41447fbb4f155da56b91d5b31daf7e54600218eb7b6c8384048c4c`，前四個 bytes 就是我們要的 `41973cd9`。

因此，只要送出一個跨鏈的合約請求，呼叫 `EthCrossChainData` 的 `f1121318093` 並傳入自己的公鑰，就可以把 validator 的公鑰換成自己的，接著偽造出假的跨鏈交易，就可以把合約中的錢全部轉走。

## 攻擊分析

在 +0 時區的 2021 年 8 月 10 號早上 9 點 32 分，駭客在 Ontology 上發起了一筆跨鏈交易 [0xf771ba610625d5a37b67d30bf2f8829703540c86ad76542802567caaffff280c](https://explorer.ont.io/tx/f771ba610625d5a37b67d30bf2f8829703540c86ad76542802567caaffff280c)，內容是要呼叫 Ethereum 上的`EthCrossChainData`，從截圖中可以看出傳入了方法名稱 `f1121318093`：

![method](/img/posts/huli/defi-poly-network-hacked/p3.png)

因為 Poly Network 的本質就是個跨鏈協定，所以要從哪一個鏈發起攻擊都可以，而據說駭客會從 Ontology 發起攻擊，是因為這個鏈比較冷門也比較難追蹤，從截圖中也可以看出它的 transaction explorer 的介面確實比較陽春一些。

接著這筆交易就被同步到 Poly Network 上：[0xHash1a72a0cf65e4c08bb8aab2c20da0085d7aee3dc69369651e2e08eb798497cc80](https://explorer.poly.network/tx/1a72a0cf65e4c08bb8aab2c20da0085d7aee3dc69369651e2e08eb798497cc80)

而接下來這筆交易並沒有直接同步到 Ethereum，因為 Relayer 在同步的時候會對 `param.MakeTxParam.ToContractAddress` 做檢查，如果不是合法的地址就不同步。

駭客要呼叫的 `EthCrossChainData` 並不是合法的地址，所以 Relayer 並不會幫你同步。

可是這其實沒有關係，因為所謂的「同步」指的也只是 Relayer 幫你呼叫 `verifyHeaderAndExecuteTx`，而 `verifyHeaderAndExecuteTx ` 本來就是一個公開的方法，所以你自己呼叫也行。

駭客在 9 點 48 分的時候，就從自己的地址直接呼叫了 `verifyHeaderAndExecuteTx`，交易為 [0xb1f70464bd95b774c6ce60fc706eb5f9e35cb5f06e6cfe7c17dcda46ffd59581](https://etherscan.io/tx/0xb1f70464bd95b774c6ce60fc706eb5f9e35cb5f06e6cfe7c17dcda46ffd59581)：

![call](/img/posts/huli/defi-poly-network-hacked/p4.png)

執行結束以後 Keeper 的地址被修改，駭客接下來就執行一系列的交易把錢轉走，像是 [0xad7a2c70c958fcd3effbf374d0acf3774a9257577625ae4c838e24b0de17602a](https://etherscan.io/tx/0xad7a2c70c958fcd3effbf374d0acf3774a9257577625ae4c838e24b0de17602a) 轉了 2857 顆以太幣，[0x5a8b2152ec7d5538030b53347ac82e263c58fe7455695543055a2356f3ad4998](https://etherscan.io/tx/0x5a8b2152ec7d5538030b53347ac82e263c58fe7455695543055a2356f3ad4998) 轉了將近一億美金的 USDC。

## 修補建議

在這次的事件當中，最有問題的其實是 `verifyHeaderAndExecuteTx` 與
 `_executeCrossChainTx` 都沒有檢查要呼叫的合約地址以及方法，才會導致有這種「可以呼叫意料之外的方法」的事件發生。
 
除此之外，或許開發者當初在寫的時候並不知道 method ID 的機制，以為加上了 `(bytes,bytes,uint64)` 就真的只能呼叫到有這個參數的方法，才產生了以為那段程式碼很安全的假象。

在事件之後，開發者在 `verifyHeaderAndExecuteTx` 中針對合約地址以及 method 做了[檢查](https://github.com/polynetwork/eth-contracts/blob/2b1cbe073e40a7bd26022d1cda9341b4780d07ee/contracts/core/cross_chain_manager/logic/EthCrossChainManager.sol#L199-L200)，要在名單之內才通過，解決了最根本的問題。

因此，我們建議對於 `call` 或 `delegatecall` 這種較底層的合約呼叫方式，需要特別加上對於合約地址以及方法名稱的檢查，確保只能對許可的清單進行呼叫。

## 總結

在這次事件中，攻擊者利用沒有檢查參數的 `call`，以 `EthCrossChainManager` 合約的身份呼叫了更換公鑰的方法，並偽造了交易之後把錢偷走。像是這類型的事件其實並不少見，因此開發者在撰寫合約時，需要特別注意 `call` 的使用以及檢查，才能避免這種事件再次發生。

除此之外，對於 `call` 的底層運作方式不熟悉，也有可能是導致此次事件發生的原因之一。開發智慧合約時一旦寫錯，就幾乎沒了回頭路，開發者們應對於 Solidarity 以及 EVM 有更深入的理解，才能撰寫出安全的合約。

參考資料：

1. [Understanding nameReg.call("register", "MyName") style call between contracts](https://ethereum.stackexchange.com/questions/8168/understanding-namereg-callregister-myname-style-call-between-contracts)
2. [Analysis of US$600M Poly Network Hack](https://www.youtube.com/watch?v=-RNo8dbawvs)
3. [Abusing Smart Contracts to Steal $600 million: How the Poly Network Hack Actually Happened](https://blog.kraken.com/post/11078/abusing-smart-contracts-to-steal-600-million-how-the-poly-network-hack-actually-happened/)
4. [THE POLY NETWORK HACK EXPLAINED](https://research.kudelskisecurity.com/2021/08/12/the-poly-network-hack-explained/)
5. [被黑 6.1 亿美金的 Poly Network 事件分析与疑难问答](https://mp.weixin.qq.com/s?__biz=MzU4ODQ3NTM2OA==&mid=2247491356&idx=1&sn=5c35fca18f7d14ab39ffe667bf0ec15a&chksm=fddd619bcaaae88d04fff37dd60212a268b93e7351ad827cdce87afb876765dc90017bc9cd82&scene=178&cur_album_id=1378653641065857025#rd)
6. [Poly Network攻击关键步骤深度解析](https://zhuanlan.zhihu.com/p/398941126)
7. [The Further Analysis of the Poly Network Attack](https://gist.github.com/yajin/0f1a7acfd54adce02422298a1dea8d89)
8. [PolyNetwork事件調査資料（JPYC社）](https://hide.ac/articles/yLCIP9jQ1)
9. [Hack Track: An Analysis of Poly Network Hack and Latest Related Events](https://blog.merklescience.com/hacktrack/hack-track-an-analysis-of-poly-network-hack-and-latest-related-events)



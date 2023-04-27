---
title: DeFi 借貸協議 Cream finance 遭駭事件分析
date: 2023-04-27
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/defi-cream-finance-hacked/cover.png
---

## 事件簡介

<!-- summary -->2021 年 10 月 27 日，借貸協議 Cream fiancne 遭到閃電貸攻擊，損失高達 1.3 億美金。<!-- summary -->

![twitter](/img/posts/huli/defi-cream-finance-hacked/p1.png)

來源：[Twitter](https://twitter.com/CreamdotFinance/status/1453455806075006976)

## 漏洞分析

在借款時主要會被呼叫到的函式為 [borrowFresh](https://github.com/CreamFi/compound-protocol/blob/master/contracts/CToken.sol)，在開頭就會先檢查是否符合借款資格：

```sol
function borrowFresh(
        address payable borrower,
        uint256 borrowAmount,
        bool isNative
    ) internal returns (uint256) {
        /* Fail if borrow not allowed */
        require(comptroller.borrowAllowed(address(this), borrower, borrowAmount) == 0, "comptroller rejection");
        // ...
}
```

在 [borrowAllowed](https://github.com/CreamFi/compound-protocol/blob/master/contracts/Comptroller.sol#L373) 中，會再呼叫另一個函式 `getHypotheticalAccountLiquidityInternal`：

```sol
/**
 * @notice Checks if the account should be allowed to borrow the underlying asset of the given market
 * @param cToken The market to verify the borrow against
 * @param borrower The account which would borrow the asset
 * @param borrowAmount The amount of underlying the account would borrow
 * @return 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
 */
function borrowAllowed(
    address cToken,
    address borrower,
    uint256 borrowAmount
) external returns (uint256) {
    // Pausing is a very serious situation - we revert to sound the alarms
    require(!borrowGuardianPaused[cToken], "borrow is paused");

    require(isMarketListed(cToken), "market not listed");

    if (!markets[cToken].accountMembership[borrower]) {
        // only cTokens may call borrowAllowed if borrower not in market
        require(msg.sender == cToken, "sender must be cToken");

        // attempt to add borrower to the market
        require(addToMarketInternal(CToken(msg.sender), borrower) == Error.NO_ERROR, "failed to add market");

        // it should be impossible to break the important invariant
        assert(markets[cToken].accountMembership[borrower]);
    }

    require(oracle.getUnderlyingPrice(CToken(cToken)) != 0, "price error");

    uint256 borrowCap = borrowCaps[cToken];
    // Borrow cap of 0 corresponds to unlimited borrowing
    if (borrowCap != 0) {
        uint256 totalBorrows = CToken(cToken).totalBorrows();
        uint256 nextTotalBorrows = add_(totalBorrows, borrowAmount);
        require(nextTotalBorrows < borrowCap, "market borrow cap reached");
    }

    (Error err, , uint256 shortfall) = getHypotheticalAccountLiquidityInternal(
        borrower,
        CToken(cToken),
        0,
        borrowAmount
    );
    require(err == Error.NO_ERROR, "failed to get account liquidity");
    require(shortfall == 0, "insufficient liquidity");

    return uint256(Error.NO_ERROR);
}
```

而在 `getHypotheticalAccountLiquidityInternal` 裡面，會呼叫 `oracle.getUnderlyingPrice(asset);` 來取得價格，[getUnderlyingPrice](https://github.com/CreamFi/compound-protocol/blob/master/contracts/PriceOracle/PriceOracleProxy.sol) 的實作如下：

```solidity
/**
 * @notice Get the underlying price of a listed cToken asset
 * @param cToken The cToken to get the underlying price of
 * @return The underlying asset price mantissa (scaled by 1e18)
 */
function getUnderlyingPrice(CToken cToken) public view returns (uint256) {
    address cTokenAddress = address(cToken);
    if (cTokenAddress == cEthAddress) {
        // ether always worth 1
        return 1e18;
    } else if (cTokenAddress == crXSushiAddress) {
        // Handle xSUSHI.
        uint256 exchangeRate = XSushiExchangeRateInterface(xSushiExRateAddress).getExchangeRate();
        return mul_(getTokenPrice(sushiAddress), Exp({mantissa: exchangeRate}));
    }

    address underlying = CErc20(cTokenAddress).underlying();

    // Handle LP tokens.
    if (isUnderlyingLP[underlying]) {
        return getLPFairPrice(underlying);
    }

    // Handle Yvault tokens.
    if (yvTokens[underlying].isYvToken) {
        return getYvTokenPrice(underlying);
    }

    // Handle curve pool tokens.
    if (crvTokens[underlying].isCrvToken) {
        return getCrvTokenPrice(underlying);
    }

    return getTokenPrice(underlying);
}
```

接著我們來看 `getYvTokenPrice`：

```solidity
/**
 * @notice Get price for Yvault tokens
 * @param token The Yvault token
 * @return The price
 */
function getYvTokenPrice(address token) internal view returns (uint256) {
    YvTokenInfo memory yvTokenInfo = yvTokens[token];
    require(yvTokenInfo.isYvToken, "not a Yvault token");

    uint256 pricePerShare;
    address underlying;
    if (yvTokenInfo.version == YvTokenVersion.V1) {
        pricePerShare = YVaultV1Interface(token).getPricePerFullShare();
        underlying = YVaultV1Interface(token).token();
    } else {
        pricePerShare = YVaultV2Interface(token).pricePerShare();
        underlying = YVaultV2Interface(token).token();
    }

    uint256 underlyingPrice;
    if (crvTokens[underlying].isCrvToken) {
        underlyingPrice = getCrvTokenPrice(underlying);
    } else {
        underlyingPrice = getTokenPrice(underlying);
    }
    return mul_(underlyingPrice, Exp({mantissa: pricePerShare}));
}
```

這邊的 `YVaultV2Interface(token).pricePerShare()` 如果再繼續深入追下去，會發現是透過另一個叫做 `_totalAssets` 的值除以 `totalSupply` 算出來的，而這個 `_totalAssets` 就是 token 數量。

因此，只要合約有的 token 數量增加，pricePerShare 就會跟著增加。

此次攻擊便是透過直接將錢轉入 pool 中，增加 token 數量且抬高抵押品的價格，來使得攻擊者可以借出更多的資產。

## 攻擊分析

攻擊者在 2021/10/27 的下午 1:54:10 發起攻擊，交易為 [0x0fe2542079644e107cbf13690eb9c2c65963ccb79089ff96bfaf8dced2331c92](https://etherscan.io/tx/0x0fe2542079644e107cbf13690eb9c2c65963ccb79089ff96bfaf8dced2331c92)

可以看到攻擊流程中經歷多次的代幣轉換：

![p2](/img/posts/huli/defi-cream-finance-hacked/p2.png)

而最關鍵的步驟是在圖中框起來的地方，攻擊者藉由「直接轉入」token 的方式，使得池子內的 token 數量增加而 totalSupply 不變，藉此抬高價格。

![p3](/img/posts/huli/defi-cream-finance-hacked/p3.png)

一般正常的操作是「存入」A token，換取另外一個 B token，此時合約地址有的 token 數量跟 totalSupply 應該是一致的，但攻擊者可以藉由直接送錢給合約，來達成 A token 數量增加，但是 B 的發行數量不變。

價格抬高以後，抵押品的價值翻倍，可以借出的東西就變多了，此時攻擊者把平台上能借的東西都借走了：

![p4](/img/posts/huli/defi-cream-finance-hacked/p4.png)

最後再把一部分資金拿去償還閃電貸，成功獲利出場。

## 修補建議

在選擇 price oracle 的時候，應該選擇比較不容易被操控價格之方法，才能確保 oracle 的穩定性，避免在短時間內被大幅控制價格而讓攻擊者獲利。

## 總結

透過閃電貸來操控價格是個在 DeFi 中十分常見的攻擊手法，開發者在選擇 price oracle 的時候，應該特別注意背後的原理以及被操控的可能性，謹慎選擇安全的價格計算方式，才能防止此類攻擊。

參考資料：

1. [细节分析：DeFi 平台Cream Finance 再遭攻击，1.3 亿美金被盗](https://www.8btc.com/article/6702657)
2. [零时科技 | DeFi平台Cream Finance攻击事件分析](https://learnblockchain.cn/article/3151)
3. [Creamed Cream – Learn the Secret Recipe (Cream Hack Analysis)](https://mudit.blog/cream-hack-analysis/)
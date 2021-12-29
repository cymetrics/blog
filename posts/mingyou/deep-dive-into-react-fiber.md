---
title: 隱藏在 React 下的機制： Fiber
date: 2021-05-28
tags: [Front-end]
author: mingyou
description: 從 React 16.3 的重大更新後也已經過了兩年多了，不知到大家還記不記得當時的兩大重要功能，其一為 Function Component ( hooks )，另一個大家比較不那麼熟悉但卻也很重要的則應該屬 Fiber 架構。而在過去這個部分全部只由一個主線程去做同步式渲染。
layout: zh-tw/layouts/post.njk
image: /img/posts/mingyou/deep-dive-into-react-fiber/p1.png
---


不知不覺都 2021 年中了，從 React 16.3 的重大更新後也已經過了兩年多了，不知到大家還記不記得當時的兩大重要功能，其一為 Function Component ( hooks )，另一個大家比較不那麼熟悉但卻也很重要的則應該屬 Fiber 架構，但其實會有 hook 的設計也是也是因為上述架構的關係。

在當時引想大家最多的應該屬生命週期的變換，不曉得大家是否還記得當時最常用到的生命週期 `componentWillUpdate`/`componentWillReceiveProps` 將被廢除時驚訝的心情? 而當時也加入了兩個新的 lifecycle 來解決以上問題。

- getDerivedStateFromProps
- getSnapshotBeforeUpdate

![Re: React 常用的生命週期(1)](/img/posts/mingyou/deep-dive-into-react-fiber/p1.png)
https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/


至於為什麼會產生以下的變化呢？這就要說說本次的主題 Fiber 了。

## Fiber 是什麼

Fiber 屬於更為底層的抽象行為，目的是為了達到以下幾種功能

- 幫不同類型的工作分配優先順序
- 暫停工作，稍後回來
- 當不需要工作時取消
- 重新使用已經完成的工作

<!-- summary -->
在尚未使用 Fiber 前，由於畫面更新前須由 reconciler ( React ) 調度完後才會送到 renderer，且當畫面複雜時，更動一個 state 狀態時也需要將底下的所有子元件重新 render 出一份 virtual dom，而在過去這個部分全部只由一個主線程去做同步式渲染，因此當有一個 Component 需要費時較多時間時，將會把主線程 block，當時間一長，就有可能導致來不及更新至指定時間範圍內，造成無法順利渲染，會有不順暢的情況發生。
<!-- summary -->

![Re: sync mode 和 async mode 的差異](/img/posts/mingyou/deep-dive-into-react-fiber/p2.png)
https://twitter.com/acdlite/status/977291318324948992


## Fiber 的產生及作用

為了解決此問題，React 制定了 fiber 的結構，利用非同步的渲染方式來解決，將各元件拆解，也避免了長時間占用主線程所導致卡頓的問題。 ( 所使用的 [API](https://developer.mozilla.org/zh-TW/docs/Web/API/Window/requestIdleCallback)， [source code](https://github.com/facebook/react/blob/4c7036e807fa18a3e21a5182983c7c0f05c5936e/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1541) )

傳統 React 更新時會分成兩個時期

![Re: React 更新時期](/img/posts/mingyou/deep-dive-into-react-fiber/p3.png)

- reconciliation / render 階段 ( 判斷哪先元件需要更新，可中斷 )
- commit 階段 ( 插入、移動、刪除節點，不可中斷 )

<!--（有誤 需更正） commit phase 的執行很快，而 render phase 產生真實 DOM 的時間卻很久，因此在 react 更新元件時可能會中斷更新以避免阻塞瀏覽器，也代表可能會因為被中斷而重新執行，所以必須保持沒有 side effect 的情況來避免非預期的情況。 -->

reconciliation phase 會先通過 render 更新元件，在第一次實建立 Fiber 節點，並在之後更新與上一次所渲染的 DOM 比較，因此在 render 階段將執行以下生命週期方法判斷是否有更新：

* componentWillMount (已廢棄)
* componentWillReceiveProps (已廢棄)
* componentWillUpdate (已廢棄)
* getDerivedStateFromProps
* shouldComponentUpdate

react 可以根據目前的狀況調整，可以選擇一次處理單個或者多個 fiber 並且調整優先權，因此可以異步執行及中斷，但也因為如此，內部的邏輯必須避免 side effect。

![Re: Commit phrase 和 render phrase](/img/posts/mingyou/deep-dive-into-react-fiber/p4.png)

在 render 階段執行完後將會產生包含著 side effect 的 fiber 節點樹，而 side effect 事實上就是 commit 階段所需要更新操作，會在執行 commit 階段時輪詢 side effect 列表去對 DOM 進行修改。

以下是commit階段執行的生命週期方法列表：

* getSnapshotBeforeUpdate
* componentDidMount
* componentDidUpdate
* componentWillUnmount

因為這些方法在同步commit階段執行，所以它們可能包含副作用或更動 DOM。


而前面說到被廢除的兩個 lifecycle 因為是屬於 render phase，有機會被多次執行，為了避免 side effect 發生，才會移除此 lifecycle。

- `componentWillUpdate`
- `componentWillReceiveProps`

而拿掉以上 API 後則利用 `getDerivedStateFromProps` 來取代 `componentWillReceiveProps`，但由於 `getDerivedStateFromProps` 被設計成靜態函數，不用擔心 side effect 所帶來的影響，不過要避免從 props 等等去觸發 side effect。


## Fiber nodes 和 Fiber tree
在 reconciliation 時，每個 component 的 render 方法回傳的資料都會合併到 Fiber tree 中，每個React元素都有一個對應的 Fiber nodes，用來記錄對應的工作內容，而特別的地方在於在每次 render 時不會重新產生 Fiber node。

更確切的說，每個 Fiber 就是一個 worker ，提供了跟踪，調度，暫停和中止工作的方法。

每一個 Fiber Node 節點與 Virtual Dom 對應，所有 Fiber Node 連接起來形成 Fiber tree，為單向連結串列的樹狀結構：
![Re: Fiber tree](/img/posts/mingyou/deep-dive-into-react-fiber/p5.png)


主要是為了將原本的樹狀遞迴輪詢轉變成循環輪詢，配合 requestIdleCallback API, 實現任務拆分、中斷與恢復。

大概結構如下：

``` js
type Fiber = {
  // 標籤類型
  tag: TypeOfWork,

  key: null | string,

  // 與 Fiber 所關聯的類型
  type: any,

  // local 狀態
  stateNode: any,

  // 以下區塊負責處理 Fiber

  return: Fiber | null,

  // 單向連結串列結構
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  ...


  // 輸出用的狀態
  memoizedState: any,

  ...

  // 紀錄在單向鏈結串列中的下一個 Fiber 
  nextEffect: Fiber | null,

  // 子樹中具有 side effect 的第一個和最後一個光纖
  // 當我們重用已完成的工作時，我們重用 link list 的一部分
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  // 快速確定子樹是否沒有正在等待的更動
  pendingWorkPriority: PriorityLevel,


  // 如果工作在光纖上進行，而該光纖已經在較低的優先權開始了一部分工作
  // 那麼我們需要將已完成的工作儲存著。直到我們需要重新開始處理它為止
  // 它可能與 "目前" 的 child 不同。
  progressedChild: Fiber | null,

  ...
}
```

在這結構中，nextEffect / firstEffect / lastEffect 將在後面的章節 ( Effect List ) 中表現出相當的重要性。

## workInProgress tree

``` js
function createWorkInProgress(current, ...) { 
    let workInProgress = current.alternate;
    if (workInProgress === null) {
        workInProgress = createFiber(...);
    }
    ...
    workInProgress.alternate = current;
    current.alternate = workInProgress;
    ...
    return workInProgress;
}
```
[source code](https://github.com/facebook/react/blob/4c7036e807/packages/react-reconciler/src/ReactFiber.new.js#L254)

React 在第一次 render 時會將各節點紀錄為 Fiber Tree，而在之後檢查時會建立一個 workInProgress tree ，等待 workInProgress tree 完成後就會被當作 current tree，而此稱為`雙緩衝技術` (double buffering)。

![](/img/posts/mingyou/deep-dive-into-react-fiber/p6.png)
[source video](https://www.youtube.com/watch?v=ZCuYPiUIONs&t=1040s)


## Effect List
在上一張圖中，有標記標籤的元件是需要 side effect 進行處理的，為了達到高效的處理，因此需要將原本的樹狀咧表轉換為線性列表，才能夠快速的遍歷，除此之外還會省略沒有 side effect 的節點，流程如下圖：

![](/img/posts/mingyou/deep-dive-into-react-fiber/p7.png)

順序的部分是從子到父的方式去執行，在各個階段如果為該層結構**第一個節點**會記錄在 firstEffect，其後則會記錄在 nextEffect 當中，並會在父層級將其合併起來並將自己綁入 lastEffect ，並向上傳遞，遇到沒有 effect 的節點會直接向上傳遞而不進行更動，最後將所有順序傳遞至 Root 層建立出如下圖的 effect list。


![Re: Effect list](/img/posts/mingyou/deep-dive-into-react-fiber/p8.png)
[source video](https://youtu.be/ZCuYPiUIONs?t=1373)

## Render 階段的工作循環

``` js
function workLoop(isYieldy) {
  if (!isYieldy) {
    // Flush work without yielding
    while (nextUnitOfWork !== null) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
  } else {
    // Flush asynchronous work until the deadline runs out of time.
    while (nextUnitOfWork !== null && !shouldYield()) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
  }
}
```

在上面[程式碼](https://github.com/facebook/react/blob/f765f022534958bcf49120bf23bc1aa665e8f651/packages/react-reconciler/src/ReactFiberScheduler.js#L1136)中，nextUnitOfWork 存有 workInProgress 樹中的 Fiber nodes。當 React 輪詢 Fiber tree 時，它會使用這個變量來知曉是否有任何其他 Fiber nodes 具有未完成的工作。目前的 Fiber 處理完後，nextUnitOfWork 會指向下一個 Fiber node 或者 null (結束)。

輪詢 Fiber trees 主要根據以下四個功能：

- performUnitOfWork
- beginWork
- completeUnitOfWork
- completeWork

執行順序參考如下圖：

![](/img/posts/mingyou/deep-dive-into-react-fiber/p9.gif)
[source image](https://images.indepth.dev/images/2019/08/tmp2.gif)

由於透過了深度優先搜尋(DFS)，整個流程會優先執行底部 child node 的工作，最後才會到 parent node。


## Commit 階段

在這個階段，React 會將 render phase 所產生的 workInProgress tree 轉移到 current tree，並執行 render phase 所比對所產生的 Effect list，此步驟將會有更新 Dom 的節點等等的操作，假如有不需更新的項目將不會包含在 Effect list 中，所以不會被 commit (更新)。

而執行完後的 current tree 將會被放到 finishedWork tree 中。

而在此階段將會觸發以下操作：
- 執行 getSnapshotBeforeUpdate event
- 執行 componentWillUnmount event
- 執行所有 DOM 操作
- 將 finishedWork tree 設置為 current tree
- 執行 componentDidMount event
- 執行 componentDidUpdate event


### Dom 更新
[commitAllHostEffects](https://github.com/facebook/react/blob/95a313ec0b957f71798a69d8e83408f40e76765b/packages/react-reconciler/src/ReactFiberScheduler.js#L376) 是React在其中執行DOM更新的函數。該函數定義了 Dom 需要執行的操作類型。

## 較少在用 class component ，那來談談 function component

時至今日，function component 搭配 hooks 幾乎已成了主流，而 function component 在渲染時可以避免多餘的判斷 ([mountIndeterminateComponent](https://github.com/facebook/react/blob/v16.13.1/packages/react-reconciler/src/ReactFiberBeginWork.js#L1306))

![RE: React hooks](/img/posts/mingyou/deep-dive-into-react-fiber/p10.png)
[under-the-hood-of-reacts-hooks-system](https://medium.com/the-guild/under-the-hood-of-reacts-hooks-system-eb59638c9dba)

而大家常用的 [hook](https://github.com/facebook/react/blob/4c7036e807/packages/react-reconciler/src/ReactFiberHooks.new.js) 則會形成 hook 鍊，保存在 Fiber 的 memoizedState 中，通過 dispatcher 去更新 fiber 內的 state 及 effect 狀態：

```js
const hook: Hook = {
  memoizedState: null,// hook 的狀態
  baseState: null,//起始 state
  baseQueue: null,//起始 queue
  queue: null,//需要更新的update
  next: null,//下一個hook
};
```

例如 const \[state, updateState\] = useState(initialState)， memoizedState 就是 initialState。

每個 hook 都會被放到 queue 當中。當您調用 setState 函數時，React 其實不會立即調用 updater 函式，而是將其保存在隊列中並安排重新渲染。


<!-- 至於優化常用的 [useMemo](https://github.com/facebook/react/blob/v16.13.1/packages/react-reconciler/src/ReactFiberBeginWork.js#L370) 則會將元件改為較為[淺層的比對](https://github.com/facebook/react/blob/v16.13.1/packages/react-reconciler/src/ReactFiberBeginWork.js#L456) -->


### 參考
https://segmentfault.com/a/1190000039225217
https://twitter.com/acdlite/status/977291318324948992
https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react
https://www.bilibili.com/video/av48384879/

延伸閱讀
https://segmentfault.com/a/1190000017241034?utm_source=sf-related
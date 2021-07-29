---
title: 從編譯器優化角度初探 Javascript的V8 引擎
date: 2021-04-07
author: maxchiu
description: 這篇文章想以V8引擎對於JS的實現為例來探討編譯器優化的一些基礎議題並搭配實驗，希望能讓讀者對於血汗的編譯器到底在背後幫我們完成了多少事情有點概念。
layout: layouts/post.njk
tags: [Front-end, JavaScript]
image: /img/DiveIntoTurbofan/1__NyZv46I1bYz4K7ngiT__W9Q.jpeg
---

![](/img/posts/max/DiveIntoTurbofan/1__NyZv46I1bYz4K7ngiT__W9Q.jpeg)

<!-- summary -->
這篇文章想以V8引擎對於JS的實現為例來探討編譯器優化的一些基礎議題並搭配實驗，希望能讓讀者對於血汗的編譯器到底在背後幫我們完成了多少事情有點概念。
<!-- summary -->

一般人對於 JS 這種 Scripting Language 的印象大概就是相比於 C++ 之類直接編譯成對應指令集的語言，因為是把 Source code 藉由 Interpreter 編譯成 跑在原生環境的 [Process VM](https://en.wikipedia.org/wiki/Virtual_machine) 上對應的 Bytecode，沒辦法直接在 Machine code 層級做優化，所以速度通常會慢了一截。

![](/img/posts/max/DiveIntoTurbofan/0__6JLpKVtBq4eIEljk.png)

雖然 Bytecode 這種做法在執行時期速度顯然會較慢，但把 Source code 編譯成 Bytecode 形式，不僅僅是具備了“編譯一次，各平台通用”的跨平台的特性，同時 Bytecode 的指令層級也因為比較 High level， 相比於精確繁瑣的 Machine 層級指令，編譯 Bytecode 的速度通常會快出許多。

![](/img/posts/max/DiveIntoTurbofan/0__FK2W6kz9__36yXHnm.png)
![](/img/posts/max/DiveIntoTurbofan/0__pq5o__C__DCDLht__XB.png)

以上圖為例，一個 result = 1 + obj.x 這樣的 source code，隨著指令層級的越低，編譯的複雜度和時間也會隨之提升。然而越精確的指令對 CPU 來說才可以發揮最高的硬體效能。 所以其實要把 Source code 抽象到怎樣的層級就是設計編譯器時一個很重要的 Issue。

而許多基於 Bytecode 的語言為了能夠提升效率，引入了所謂的 [JIT](https://zh.wikipedia.org/wiki/%E5%8D%B3%E6%99%82%E7%B7%A8%E8%AD%AF) 技術，透過在執行時期分析常被執行的片段，同步地把這些片段的 profileing data 在背後偷偷餵進 optimizing compiler ，編譯成 Machine code 後偷偷的替換掉原本 bytecode 以提升運行的速度。（可以是從 [AST](https://www.google.com/search?q=abstract+syntax+tree&sxsrf=ALeKk02ELy_J6aRB-LjA0fdC8u6fBk-ITA%3A1617433965743&ei=bRVoYNz1LIOmmAXr6LfwBg&oq=abstract+syn&gs_lcp=Cgdnd3Mtd2l6EAEYADICCAAyAggAMgIIADICCAAyBQgAEMsBMgUIABDLATIFCAAQywEyBQgAEMsBMgUIABDLATIFCAAQywE6BAgjECc6BAgAEEM6BQgAELEDOggIABCxAxCDAToHCAAQsQMQQzoKCAAQsQMQRhD_AVDY_QhYtZAJYL2bCWgDcAB4AIABQIgBhQWSAQIxM5gBAKABAaoBB2d3cy13aXrAAQE&sclient=gws-wiz) 也可以是從 Bytecode 優化）\[2\]

V8 引擎目前所使用的 Optimizing Compiler叫做 [TurboFan](https://v8.dev/) ， 他使用了一套自訂的 IR \[3\] ，並用 Sea Of Nodes 取代傳統編譯器優化中使用的 CFG，大幅提升了優化策略的彈性，並實現了大部分語言都有的共通優化方式（ Inlining、Loop Splitting 、 Escape Analysis … etc )。(**＊註一)**

具體來說， Turbofan 採用的是所謂的推測式優化（ Speculative Optimization ）。動態語言因為允許不指名變數型別，執行期的 Machine 指令理當是無法確定（舉最簡單的例子 ，“＋”這個 operator 在 String 跟 Number 行為完全不一樣），但 Turbofan 根據 Runtime 時的 Profiling 資訊，“推測” 一些這段 Source Code 確切的型別。以函式呼叫來說， Turbofan會在執行期的每個 Function的Code Object裡面都額外帶上所謂的 **Feedback Vector\[4\]** ，用來統計一個函式的執行狀況。

![](/img/posts/max/DiveIntoTurbofan/0____DVw6OQA0S5z1Ryu.png)

我們考慮一個簡單的狀況

![](/img/posts/max/DiveIntoTurbofan/0__ec5paOPfU9S1XkoU.png)

這樣的話函式為例，若執行期數十次對這個函式的呼叫傳入的都是Integer，那麼 Feedback Vector 就會開始統計這些資訊，Turbofan 會開始在背後同步地把 Add( x, y)的 Bytecode 轉換成針對 Integer 操作的指令。

然而推測性的優化終究只是推測性的，過了一陣子如果User突然對 Add 函式傳進了一個 String，V8引擎是不是就要爆掉了？畢竟連 Machine code 都已經把它當成 Integer 來操作了，難道要噴 Segmentation Fault了？

實際上 TurboFan 在處理 JIT 優化時，並不只是單純的把對應的 code 轉成 machine code ， 而是會同時在 Code 中塞入所謂的 Checkpoint，執行優化過的 Machine code 函式 之前，會先檢查傳入的參數是否跟先前的假設一致，若假設不成立了，則進行 Deoptimization。  
（這邊有個點要提醒，若 同一段 code Optimization-Deoptimization 這樣子的重複了五次以上，在 Turbofan 就會認定這是段 Megamorphic 的 Code，並放棄對他進行 JIT 優化）\[7\]

![](/img/posts/max/DiveIntoTurbofan/0__cSphl2MMRjAZlmi3.png)

從上圖可以看到，優化過的機器碼中，實際的函數內指令是黃色的部分，藍色部分檢查參數是否為 Small Integer 型別，橘色部分檢查 object 的 Hidden Class (＊註二）是否相同。 若不相同就直接 Jump 到對應的處理程式碼。

具體來說， 為了能順利 fallback 回去用 Bytecode 執行，Deoptimization 要做以下幾件事：

*   把目前 memory stack 中的 frame 和 Register 中的資訊存進 buffer
*   從 (optimized) frame 中重構出 interpreter 的 frame，若優化後的 frame 是 inlined 的，則必須依序建構出正確的 function stack (畢竟 interpreter 是沒有辦法做 inlining 優化的啊啊）
*   把 Register 的值讀進新的 stack 需要的位置 （有沒有感覺跟 Context Switch 在做的事有點像XD)
*   重新 Materialize 那些被 Turbofan 用 [Escape Analysis](https://en.wikipedia.org/wiki/Escape_analysis) 優化省略掉的物件實例
*   把 Program counter 跳回去給 Interpreter

以上這就是 V8引擎中所謂的 Eager Deoptimization。

並且，若某個變數的 CheckPoint Fail了，所有其他會使用到同一個變數的函式也要 Deoptimize。然而實際上這些相依的函式因為不是在 Stack 的頂端，不能直接 Deoptimize ( 例如無法取得 register 的 snapshot )

![](/img/posts/max/DiveIntoTurbofan/0__WTJD__3E4soas9mJh.png)

所以實務上 Turbofan 還有一招所謂的 Lazy Deoptimization。 在一開始編譯 Machine Code 時就會註冊函式和變數之間的 Dependency， 而若某一段code 改到了某個變數的 Shape，會在相依的函數中把原本要存取此變數的 code 區段先用一段 Patched instruction 替代。這個 instruction 的功用就是去呼叫Deoptimizer。這樣子我們就可以在執行到會出問題的片段時再去 Deoptimize了！

![](/img/posts/max/DiveIntoTurbofan/0______KJ__E7A8zUnQ2BP.png)

以上就是我們偉大的 Turbofan 大大在我們跑 JS Code 時一直勞心勞力在做的事情。講了這麼多理論上的東西我想大家可能還是有點茫然，以下就用幾個簡單的實驗來探討一些 Turbofan 幫我們做的事情。

讓我們考慮以下這個簡單的程式片段 test.js

![](/img/posts/max/DiveIntoTurbofan/0__tzW02alSCz__NNYJD.png)

我們在 node 環境下執行 **node — trace-opt — trace-deopt test.js | grep doSomething ，藉由 — trace-opt 和 — tract-deopt觀**察 V8 在執行時動態優化和反優化時的行為**，**並用 **perf\_hook** 紀錄執行時間 **。**

![](/img/posts/max/DiveIntoTurbofan/0__ysU6PBHyDXMgEG4c.png)
![](/img/posts/max/DiveIntoTurbofan/0__Uk6z7x4EsoOieT2J.png)

可以看到 Turbofan 確實在執行期間動態的去優化了 doSomething。 被 mark起來的 reason是 **small function**，也就是說 Turbofan 覺得可以進行 inlining的優化。

> _Inlining 代表的是 假裝函式裡面的 code 像是直接在 caller 對函式的呼叫處展開。這樣的做法可以省略創建跟維護新的 stack frame 所需的時間。 TurboFan 中對於一個函式是否可以進行 Inlining 的標準可以參考 \[9\]._

![](/img/posts/max/DiveIntoTurbofan/1__dBY1pw8ZHWqe__I__SfLGPyw.png)

> _簡單來說，如果函式在 AST 中的 Node 數少於 200，且函式的 callstack 深度小於 5，就是一個合格的 Candidate。  
> 但程式中可能會有大量的 Candidate，如果全部都展開可能過度消耗資源，所以 Turbofan 會考量函式的 Relative Call Frequency。也就是說，從 callstack 最下面的函式的執行次數開始，依序乘上每個函數在父函數每次執行時被執行到的比例（而非直接看函式被執行的絕對次數）。 此值越高的函式會越優先被 Inlining。_

![](/img/posts/max/DiveIntoTurbofan/1__Tll__Gz2BbaIIYreX4s0H1g.png)

> _另外如果我們在上面的執行中把 — no-turbo-inlining flag 打開來，可以看到效能也有明顯的下降_

接著我們把上面的 code 的第二個迴圈的型別改成 String。再重新執行一次。

![](/img/posts/max/DiveIntoTurbofan/0__aD0KzOXJwDqy__rXO.png)
![](/img/posts/max/DiveIntoTurbofan/0__Akv2Bje8G0v9ilEw.png)

從上面這段 trace 可以看出來， Turbofan 對 doSomething 一樣先做了優化，接著因為參數型別不一致而進行了 Eager 的反優化（畢竟是傳入參數的問題，並不是動到了別的地方的 object ) 。並且在最後執行了 doSomething 函式裡面的 obj 的 **Materialization**。\[8\]

> _Materialization 意味著的就是在優化時， Turbofan 把 obj 做了 “Escape Analysis” (De-materialization)，也就是說它分析了這段函式的執行狀況，認定 obj 這個物件從來都不會脫離當前的 scope。_

> _不會脫離當前 scope 代表的意義就是其實沒有必要把 obj 放到 heap 去（放到 Heap 最重要的意義就是為了讓別的 frame 可以存取到）， 直接把 obj 裡的property 都變成 local variable 放到 stack 裡面，可以提昇操作速度（畢竟放到 heap 的話就變成要先從 stack 讀變數在 heap 的位置再去拿）。_

> 舉例來說我們以上的 code 若做了 De-materialization，會變成這樣的形式

![](/img/posts/max/DiveIntoTurbofan/1__U__ToZYPMtzR8AZcc9cGqQA.png)
![](/img/posts/max/DiveIntoTurbofan/0__iyespGXRfBRYgYUm.png)

> _當然，這些優化是不能在 Bytecode 層級做的，所以既然要反優化，就表示我們必須把 obj 重新放回 heap ，這就是所謂的 Materialization。_

但隨著後半的 iteration 傳入的型別都是 String， Turbofan 過了一段時間再次把 doSomething 編譯成了針對字串參數的機器碼。

![](/img/posts/max/DiveIntoTurbofan/0__AWTn6yUGsGVEZEgf.png)

其實從上面的 trace 可以看出來，執行動態優化和反優化花費的時間大多都在 1ms 以下，然而最後的執行時間卻有如此大的差異，應該不難想像執行優化前跟優化後的代碼的效率有多大的差異了。

再來我們看看這段程式碼的效率

![](/img/posts/max/DiveIntoTurbofan/0__4P7hndqriK0eWdQN.png)
![](/img/posts/max/DiveIntoTurbofan/0__KEMsyBqrOWpWdash.png)

不難看出，如果每次呼叫 doSomething 時的參數型別都持續變化，對於 Turbofan 來說是很難進行有效率的優化的。 這也正是為什麼寫 JS 時我們應該要盡可能遵守固定參數型別的原因。（ 從另一方面來看，使用 Typescript 也是有執行期效率的考量，畢竟型別都固定了，對編譯器來說很好優化）

接著考慮以下這段 code

![](/img/posts/max/DiveIntoTurbofan/0__frVKSQdgjWzqL__Ls.png)
![](/img/posts/max/DiveIntoTurbofan/0__L6lZmMx5NWshUaI__.png)

如果我們把 **yoo (obj)** 這行的註解拿掉，就符合了我們上面所講的， Stack Top 的 Frame 更改了會被其他地方存取的變數的 Shape 的狀況。這會讓 couter += obj.x 這行機器碼指令因為 obj 的形狀改變而失效。 我們印出他的 trace-opt:

![](/img/posts/max/DiveIntoTurbofan/0__RBX4Eyd__16Ud7A__x.png)
![](/img/posts/max/DiveIntoTurbofan/0__kSr7ZNJFmbrhn1QG.png)

我們可以看到，這次的 Deoptimization 是 soft 模式，也就是上面所談的 Lazy Deoptimization。

### 結論

這篇文章介紹了 V8 引擎和 Turbofan 執行大家的 JS Code 時的優化方式跟原理。 寫出來的 code 越穩定好分析，編譯器就可以做越進階的優化。

其實絕大多數的 Web Application都是 IO-Bound 的，如何寫出讓 Compiler 好優化的 Code 可能在很多時候都不是個很關鍵的問題，畢竟寫出讓編譯器好優化的程式碼可能會破壞許多易用好維護的軟體設計原則。 但儘管如此，作為 Web 開發者相信對 JS 背後的執行環境有深一層的認識也是一件重要的事。

＊註一 ： TurboFan 所採取的 Sea-of-Nodes 是編譯器用來表示程式行為的表示方式的一種。相比傳統上常用的 Control Flow Graph 在做指令的 Scheduling 時把 Basic block 當作 Scheduling 的原子單位， Sea-of-Nodes 把所有的資料跟操作都變成單一的節點，並用 Effect-edge 來維持程式流程中的 State 關係，提升了 Scheduling 的彈性。 有興趣的人可以參考 \[1\]和\[4\]。

＊註二： V8 引擎中，具有相同的 Shape（ object 中所有 attribute 的 type 和name) 的 object 都會對應到一個相同的 Map，稱之為 Hidden class，裡面存放了這些 attribute 在 memory layout 中固定的 offset，是 V8 為了加速記憶體存取速度而出現的設計。\[6\]

### References:

\[1\] Turbofan JIT Design [https://docs.google.com/presentation/d/1sOEF4MlF7LeO7uq-uThJSulJlTh--wgLeaVibsbb3tc/edit#slide=id.g5499b9c42\_01170](https://docs.google.com/presentation/d/1sOEF4MlF7LeO7uq-uThJSulJlTh--wgLeaVibsbb3tc/edit#slide=id.g5499b9c42_01170)

\[2\] An overview of Turbofan Compiler [https://docs.google.com/presentation/d/1H1lLsbclvzyOF3IUR05ZUaZcqDxo7\_-8f4yJoxdMooU/edit#slide=id.g18ceb14729\_0\_124](https://docs.google.com/presentation/d/1H1lLsbclvzyOF3IUR05ZUaZcqDxo7_-8f4yJoxdMooU/edit#slide=id.g18ceb14729_0_124)

\[3\] Turbofan IR [https://docs.google.com/presentation/d/1Z9iIHojKDrXvZ27gRX51UxHD-bKf1QcPzSijntpMJBM/edit#slide=id.g19134d40cb\_0\_0](https://docs.google.com/presentation/d/1Z9iIHojKDrXvZ27gRX51UxHD-bKf1QcPzSijntpMJBM/edit#slide=id.g19134d40cb_0_0)

\[4\] An Introduction to TurboFan  
 [https://www.mdeditor.tw/pl/po7T/zh-tw](https://www.mdeditor.tw/pl/po7T/zh-tw)

\[5\] Deoptimization in V8 [https://docs.google.com/presentation/d/1Z6oCocRASCfTqGq1GCo1jbULDGS-w-nzxkbVF7Up0u0/edit#slide=id.g19ea708688\_0\_10](https://docs.google.com/presentation/d/1Z6oCocRASCfTqGq1GCo1jbULDGS-w-nzxkbVF7Up0u0/edit#slide=id.g19ea708688_0_10)

\[6\] V8 Hidden class   
[https://engineering.linecorp.com/en/blog/v8-hidden-class/](https://engineering.linecorp.com/en/blog/v8-hidden-class/)

\[7\] V8 Function Optimization   
[https://erdem.pl/2019/08/v-8-function-optimization](https://erdem.pl/2019/08/v-8-function-optimization)

\[8\] Escape Analysis in V8  
 [https://www.youtube.com/watch?v=KiWEWLwQ3oI](https://www.youtube.com/watch?v=KiWEWLwQ3oI)

\[9\] Turbofan Inlining Heuristics [https://docs.google.com/document/d/1VoYBhpDhJC4VlqMXCKvae-8IGuheBGxy32EOgC2LnT8/edit](https://docs.google.com/document/d/1VoYBhpDhJC4VlqMXCKvae-8IGuheBGxy32EOgC2LnT8/edit)

\[10\] JavaScript engine fundamentals: Shapes and Inline Caches  
[https://mathiasbynens.be/notes/shapes-ics](https://mathiasbynens.be/notes/shapes-ics "https://mathiasbynens.be/notes/shapes-ics")
---
title: Java’s Thread Model and Golang Goroutine
date: 2021-07-05
tags: [Back-end, java, golang, thread, goroutine, concurrency]
author: genchilu
layout: layouts/post.njk
---
<!-- summary -->
說到 Golang，總會提到其高併發的特性，而 goroutine 則是撐起 Golang 高併發的基礎。本文試著比較 Java thread 和 Golng goroutine 在 OS 運行的方式，讓大家能理解 goroutine 在設計上的獨到之處。
<!-- summary -->

# Java Thread

Java thread 直接使用 OS 提供的 native thread，即是每一個 Java thread 都是對應 OS 的 thread，完全依賴 OS 去排程調度：

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/thread-model-os-thread.png)

下面是一段簡單的 Java code，內容是創建 1000 個 thread：

```java
public static void main(String []args) throws InterruptedException {
    for (int i = 0 ;i<1000;i++){
        new Thread(()->{
            try {
                Thread.sleep(100000000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    Thread.sleep(100000000);
}
```

當你在 linux 上跑起來用 ps 指令觀察 java 程序，可以看到該程序使用了 1018 個 thread (其中 18 個為 jvm 本身系統使用的 thread，例如 GC 之類的)。

```bash
**g7@g7test1**:**~**$ ps -T 102763 | wc -l
1018
```

但隨著時代演進，曾經被稱為 lightweight process 的 thread，也逐漸無法應付高併發的場景。

## 原生 Thread 的問題

1.  記憶體  
    Java 每創建一個 thread 都會分配一個固定的 memory 作為 stack 使用。也就是 OS 的記憶體和 SWAP 空間會限制 Java Application 創建 thread 的數量上限，即便 Java Application 實際上沒用到這麼多記憶體。  
    另外你可以在啟動 Java 時用 -Xss 指令指定 thread 佔用的記憶體大小，但實際上太小也會導致 Jvm 無法啟動。像我的筆電指定記憶體小於 135k 就會出錯。
2.  創建 thread 和 Context Switch 的開銷  
    當 thread 數量超過 core 數量的時候，OS 會透過排程盡可能讓每個 thread 都能公平的佔用 core，而 core 把執行到一半的 thread 狀態存起來，切換到另一個 thread 執行就是 Context Switch。  
    context switch 本身也是會佔用 core 運算資源的。當 thread 數量過多時，會造成 core 花在創建/銷毀 thread 和 Context Switch上的比例變多，變相減少 throughput。

下這是一段段用 ExecutorService 的 thread pool 執行 200000 次 doSomething function 的 java code，用來實驗 thread 的開銷有多昂貴：

```java
public static void doSomething(){
    for (int j = 0; j < 1000; j++) {
        Random random = new Random();
        int anInt = random.nextInt();
    }
}

public static void main(String []args) throws InterruptedException {
    int threadNum = Integer.parseInt(args[0]);

    ExecutorService executorService = Executors.newFixedThreadPool(threadNum);

    for (int j = 0; j < 200000; j++) {
        executorService.execute(new Thread(() -> {
            doSomething();
        }));
    }
    executorService.shutdown();
    executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
}
```

我嘗試把 thread poll 的 thread 數量從 100~9000 去執行，去比較執行時間：

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/measure-thread-loading.png)

可以看到使用越多 thread 數量越高反而執行時間越久。試著 profile 程式可以看到當 thread num 為 100 時，cpu 花在 _doSomething 的時間佔比約為 51%，如下：_

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/profile-thread-overhead-10.png)

而當 thread num 為 9900 時，**_doSomething_** _的 cpu 佔用時間比例驟降到 27%。_

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/profile-thread-overhead-990.png)

種種跡象都告訴我們，thread 昂貴的開銷，讓 Java 在高併發的場景是略顯無力的。

# Goroutine 怎麼做？

相較 Java 使用 native thread，依賴 OS 原生的 scheduler 去調度，goroutine 實作自己的 scheduler，自行調度 goroutinue 在固定的 thread 間執行：

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/go-scheduler-1.png)

Thread 大約每執行一個 goroutine 10ms 就會切換到另一個 thread。而 thread 挑選 goroutine 的優先順序為

1.  每個 thread 各自的 queue 中的 goroutine
2.  global queue 中的 goroutine
3.  從其他 thread 的 queue 竊取 (work-stealing)

> Golang 用 GOMAXPROCS 這參數決定 gouroutine 使用多少 thread，預設是 core 數量。

實際看一下在 linux 上跑 goroutine 的 thread 數量，下面是執行的 golang code:

```go
func doSomething() {
	time.Sleep(10 * time.Minute)
}

func main() {
	for i := 0; i < 100000; i++ {
		go doSomething()
	}

	time.Sleep(10 * time.Minute)
}
```

實際在我的開發環境觀察 thread 數量都在 4~6 左右。

```bash
**g7@g7test1**:**~**$ ps -T 1013506 | wc -l

5
```

## Goroutine 的記憶體

一開始創建 goroutine 時會先分配 4k 的記憶體，隨著 goroutine 使用量會動態擴展。相較 Java 的 thread 模型，golang 會比較難被記憶體大小限制著上限。

## Blocking System Call

目前為止看起來很美好，但如果 thread 被 blocking system call 卡住呢 (ex. 讀大檔案)？例如下圖有三個 goroutine 透過 io system call 讀大檔案，此時會導致全部的 goroutinue 只依賴一個 thread 執行，大幅減少 core 的利用率。

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-1.png)

為了解決這問題，golang 在 thread 和 goroutine 間再隔一層 process 如下：

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-2.png)

而當有 thread 被 system call block 住時，golang 會另外創建新的 thread 接手該 processor 的工作，而原本的 thread 則繼續執行 system call。

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-3.png)

實際用下面的 code，開 1000 個 goroutine 讀大檔案測試：

```go
func readBigFile() {
	fi, err := os.Open("bigfile")
	if err != nil {
		panic(err)
	}
	defer fi.Close()

	buf := make([]byte, 1024)
	for {
		n, err := fi.Read(buf)
		if err != nil && err != io.EOF {
			panic(err)
		}
		if 0 == n {
			break
		}
	}
}

func main() {
	for i := 0; i < 1000; i++ {
		go readBigFile()
	}

	time.Sleep(10 * time.Minute)
}
```

跑起來以後觀察該程式啟動的 thread 會增加到 1xx：

```bash
**g7@g7test1**:**~**$ ps -T 1013506 | wc -l

142
```

由此我們也可以知道，當 Golang 頻繁開 goroutine 去 call blocking system call 時，其併發量可能會退化到 Java 使用 native thread 一樣。

> 如果你想更深入了解 goroutine scheduler，可以參考 [Go scheduler: Implementing language with lightweight concurrency](https://www.youtube.com/watch?v=-K11rY57K7k&t=316s&ab_channel=Hydra)。

# 結論

目前為止我們討論了 Java 如何實現併發和面臨的問題，以及 goroutine 如何在解決這些問題。但這不代表 Java 對高併發束手無策。

實際上目前 Java 有個 [Loom Project](https://blogs.oracle.com/javamagazine/going-inside-javas-project-loom-and-virtual-threads)，就是要在 JVM 上實作類似 goroutine 機制的 virtual thread。或許在下一個 Java 的 LTS 版本，我們就能在 Java 上感受 Goroutine 輕巧。

> 題外話，我個人覺得比較有趣的點是 Java 1.2 前 Java 的 thread 設計其實跟 goroutine 很像，是在 OS thread 上跑 Java thread，但在多核心的環境遇到一些效能問題才在 Java 1.3 以後改為使用 native thread。但隨著時代演進，Java 又要改回在 thread 上跑 thread 的設計。

> 讓我不禁想：會不會未來有一天 OS 有原生類似 goroutine 的機制以後，各大語言又會又轉而改使用 OS 原生的併發機制呢，而不使用自己實作的 scheduler 呢？
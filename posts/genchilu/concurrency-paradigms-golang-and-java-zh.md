---
title: "並行程式典範 (Paradigms): Golang V.S. Java"
date: 2021-08-29
tags: [Back-end, java, golang, thread, goroutine, concurrency paradigms]
author: genchilu
layout: layouts/post.njk
---

<!-- summary -->
當我回頭看剛開始學 Golang 的程式時，我發現我只是用 Golang 語法寫 Java 程式。尤其在並行程式的設計思路上 Golang 和 Java 完全不同：Java 習慣上會用 thread-safe 的概念設計並行，而 Golang 的設計上鼓勵開發者使用 channel 處理並行問題。
<!-- summary -->

這篇文章主要想討論 Java 和 Golang 撰寫並行程式上的風格差異，希望能讓初學 Golang 的開發者在撰寫並行時，能對 Golang 的並行設計模式有些概念。  

# 什麼是典範
程式典範是指規範如何撰寫程式的指導原則，一種更高位的設計模式， 像是物件導向程式設計 (Object Oriented Programming) 就是一種程式典範，其餘的還有函式語言程式設計 (Functional programming)。  
要注意的是，典範本身並無優劣之分，有的只是適用的情境不同。  
如同程式並行典範，撰寫並行程式也有典範，如 Thread & Lock 就是一種並行的典範。Java 在撰寫並行程式時即是依循 Thread & Lock。另一方面， Golang 的並行典範則更多是遵循 Communicating Sequential Process(CSP) 。接下來讓我們更深入探討兩種典範的差異。  

# Thread & Lock
Thread & Lock 在運作上完全反映底層硬體的行為。基本上是不同 Thread 透過共享記憶體溝通，而透過 Lock 確保一次只有個 Thread 存取共享記憶體，即是互斥鎖的概念：
![](/img/posts/genchilu/concurrency_paradigms_golang_and_Java/thread_and_lock.png)

以經典的同步問題 - 生產者/消費者問題為例，Java 實作起來會像這樣：

```java
    static Lock lock = new ReentrantLock();
    static Queue queue = new LinkedList<Integer>();
    static Condition con=lock.newCondition();

    public static void main(String[] args) throws InterruptedException {
        var size = 10;

        for (int i=0;i<100;i++){
            var producer = new Thread(() -> {
                lock.lock();
                while (queue.size() == size) {
                    try {
                        con.await();
                    } catch (InterruptedException e) {
                    }
                }
                var item = Math.random() * 100;
                queue.add(item);
                System.out.println("Produce : " + item);
                con.signal();
                lock.unlock();
            });
            producer.start();
        }

        for(int i=0;i<100;i++) {
            var consumer = new Thread(() -> {
                lock.lock();
                while (queue.size() == 0) {
                    try {
                        con.await();
                    } catch (InterruptedException e) {
                    }
                }
                var item = queue.remove();
                System.out.println("Consume : " + item);
                con.signal();
                lock.unlock();
            });
            consumer.start();
        }
    }
```
生產者和消費者透過 queue 溝通，每次往 queue 新增/刪除資料時，都會先用 lock 保護，確保一次只有一個 thread 能存取 queue。  
Thread & Lock 基本上完全模擬了底層硬體處理並行的行為，且大部分程式語言都有支援，因此可以廣泛應用在大多數的場景。  
但是 Thread & Lock 很難寫好，不小心會造成 deadlock。如以下的 code：

```java
    public static Object cacheLock = new Object();
    public static Object tableLock = new Object();

    public static void oneMethod()  {
        synchronized (cacheLock) {
            synchronized (tableLock) {
                System.out.println("hio1");
            }
        }
    }
    public static void anotherMethod() {
        synchronized (tableLock) {
            synchronized (cacheLock) {
                System.out.println("hio2");
            }
        }
    }

    public  static void main(String[] args) {
        new Thread(()->{
                oneMethod();
                anotherMethod();
        }).start();

        new Thread(()->{
                anotherMethod();
                oneMethod();
        }).start();
    }
```
20 行的 Thread 和 25 行的 Thread 彼此等待對方的鎖，讓程式卡住。  
而更棘手的是 deadlock 通常不容易發現。想像一下上面的 code：若是 **oneMethod** 和 **anotherMethod** 是第三方套件提供的方法，除非你 trace 過 code，不然你無法確保該 method 裡面是否有使用到 lock。甚至有可能在例外處理中忘記解鎖導致系統 deadlock。  

# Communicating Sequential Process(CSP)
相較於多個 Thread 透過共享記憶體溝通的 Threa & Lock 典範，CSP 提倡透過溝通來共享資訊。概念上如下圖，每個 Thread 透過 channel 發送/接收訊息來溝通：

![](/img/posts/genchilu/concurrency_paradigms_golang_and_Java/csp.png)

Golang 的並行典範則是圍繞著 CSP 概念設計，[Golang 官方 blog](https://go.dev/blog/codelab-share) 提到:

> Do not communicate by sharing memory; instead, share memory by communicating.  
不要透過共享記憶體溝通，透過溝通來共享記憶體。  

同時你可以在 Golang Sysn Package 的文件中看到下列敘述：

> Package sync provides basic synchronization primitives such as mutual exclusion locks. Other than the Once and WaitGroup types, most are intended for use by low-level library routines. Higher-level synchronization is better done via channels and communication.  
Package sync 提供基礎的同步原型，像是互斥鎖。除了 Once 和 WaitGroup 以外，大部分都是提供用來做底層 library 使用。高階的同步建議使用 channel 。

因此若是用 Golang 解決生產者/消費者問題時，程式寫起來會像這樣：

```go
func main() {
	queue := make(chan int)

	// producer
	for i := 0; i < 100; i++ {
		go func() {
			item := rand.Intn(100)
			fmt.Printf("Produce: %d\n", item)
			queue <- item
		}()
	}

	// consumer
	for i := 0; i < 100; i++ {
		go func() {
			item := <-queue
			fmt.Printf("Consume: %d\n", item)
		}()
	}

}
```
可以看到 Golang 將複雜的互斥鎖邏輯封裝在 channel 裡面，開發者可以安心地使用 channel 而不用分心 Lock & Unlock 的邏輯。以更高位的角度來看，可以說是 Golang 鼓勵開發者用 Channel 把所有 Goroutine 解耦合，也就是 CSP 的理念。反之 Thread & Lock 會把所有 thread 用 shared memory 耦合在一起。   
但這是有代價的 - 為了達到 Goroutine 間不共享記憶體，channel 在實作上並不是把 sender 的物件直接透過 channel 傳給 receiver，而是傳遞一個 copy 的物件，可以用下面這段 code 驗證：

```go
	go func() {
		item := rand.Intn(100)
		fmt.Printf("Produce item Addr: %v\n", &item)
		queue <- item
	}()

	go func() {
		item := <-queue
		fmt.Printf("Consume item Addr: %v\n", &item)
	}()
```

實際 print 到銀幕上的記憶體位置會不一樣：

```text
roduce item Addr: 0xc000014090
Consume item Addr: 0xc000120000
```
而每個物件都需要 copy 在效能上是一定會有損耗的，這就是用 channel 把 goroutine 解耦合要付出的代價。


# 結論
當我們說 Java 的並行是以 Thread & Lock 為基底，並不代表 Java 不能做到 CSP。以生產者/消費者的範例來看， Java 用 BlockingQueue 可以做到類似 Golang 的 channel 的功能。同理，Golang 中也有提供的  sync package 不乏有 Mutex、RWMutex 等機制。    
但在 Java 中你會看到 Java 的並行生態系會是環繞著 Thread & Locl 去打造，你會看到大量的 synchronized 去規範某個區段一次只能被一個 Thread 執行，你會看到 Java 文章常提到要 Thread-safe 等概念。而在 Golang 你更多的是看到怎麼運用 select & channel 去打造並行程式。    
在下一篇文章中，我會介紹 Golang 官網介紹的幾種常見的 Concurrency Pattern，以及對應 Java 的寫法做比較，讓大家可以更深刻體會兩種並行典範的內涵差異。

# Reference
[GopherCon 2017: Kavya Joshi - Understanding Channels](https://www.youtube.com/watch?v=KBZlN0izeiY)  
[Seven Concurrency Models in Seven Weeks When Threads Unravel](https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/)
---
title: Java’s Thread Model and Golang Goroutine
date: 2021-07-05
tags: [Back-end, java, golang, thread, goroutine, concurrency]
author: genchilu
layout: en/layouts/post.njk
---
<!-- summary -->
One of the most important features of Golang is its ability to handle high concurrency. And goroutine is the foundation to support high concurrency. This article will briefly explain how Java’s thread model and Golang’s goroutine work in OS. And I believe you will be impressive in the principle behind goroutine. Let’s go!
<!-- summary -->

## Java Thread Model

Java uses native thread in OS. That is every Java thread mapping to one kernel thread. Java can not determine which thread would occupy the core, it is completely dependent on OS’s scheduler.

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/thread-model-os-thread.png)

Below is a simple java code that creates 1000 threads and does nothing:

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

I run this code in my Linux VM and use ps command to monitor the number of threads. It shows that the Java process creates about 1018 threads (Java creates about 18 threads to maintain JVM system, like GC.)

```bash
**g7@g7test1**:**~**$ ps -T 102763 | wc -l

1018
```

However, with the advent of technology, it becomes more common for people to connect to the internet, we all want our server could support high concurrency to serve our customers. But the thread — ever called lightweight process — becomes too heavy to support high concurrency. Why?

### Problem of Thread

1.  Memory size  
    Every time Java creates a thread, Java would allocate a fixed memory size as that thread’s stack. The number of threads would be limit by OS’s memory and SWAP size, even if your Java application does not use that much memory.  
    You can use -Xss JVM option to the specific memory size of the stack used by each thread. But JVM would not run up if you specify too small memory size. Take my laptop, for example, JVM would crash if I set memory size smaller than 135k.
2.  The Cost of Create Thread and Context Switch  
    When the number of threads exceeds the number of cores, OS would arrange core to run each thread as fairs as it can through the scheduler. When one core switches one thread to another thread, it would store the current thread’s state, load another thread’s state and run it. That is the so-called context switch.  
    But one thing you must know is that context switch is also cost. If there are too many threads, your core would spend too much time in context switch. Thus it would decrease your system’s throughput.

Let’s see an actual example to show how expensive thread is. Below is a simple Java code, it uses ExecutorService with a fixed number thread pool to run the function doSomething 200000 times.

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

I run the code with the number of threads from 100 to 9900 and record the time it runs:

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/measure-thread-loading.png)

You can see that it take more time to finish the process if Java creates more thread. Let dig deep into what happened by profiling CPU. When the number of threads is set to 100, about 51% of CPU time is spent in function **doSomething:**

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/profile-thread-overhead-10.png)

And we increase the number of threads to 9900, the CPU time spent in function **doSomething** is down to about 27%.

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/profile-thread-overhead-990.png)

All of the metrics tell us the cost of the thread makes Java’s thread model suffer in the high concurrency scenario.

## How Goroutine

Compare to Java, Golang does not use OS’s native thread. Instead, Golang implements its scheduler, arrange goroutines to run spread between a fixed number of threads.

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/go-scheduler-1.png)

Every thread would switch one goroutine to another goroutine in about 10ms. And the basic police for a thread to pick a goroutine is:

1.  pick a goroutine from a FIFO per-thread local queue
2.  pick a goroutine from a global FIFO queue
3.  steal a goroutine from another thread’s local queue (work-stealing)

> Golang uses GOMAXPROCS parameter to determine how many threads to use in Golang application. The default value is the number of cores.

To be more specific, let’s run the below go code and monitor the numbers of threads:

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

It shows up that the number of threads is between 4~6.

```bash
**g7@g7test1**:**~**$ ps -T 1013506 | wc -l

5
```

### Goroutine’s Memory

Golang would allocate 4k memory to goroutine in the very beginning. As Goroutine uses more and more memory, Golang would dynamically scale up the stack size. That’s to say the number of goroutines is also bound by the size of memory, but not as suffer as Java’s thread.

### Blocking System Call

Since goroutines are run between threads, what if a thread were blocked by a blocking system call, like file IO?

Let’s see the below graph, if three of four threads are blocked, would Golang’s throughput be impacted because there was only one thread serve Goroutine?

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-1.png)

The answer is NO. To solve this problem, Golang design processor to separate goroutine.

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-2.png)

If a thread was blocked by a system call, Golang would create a new thread and handoff the whole processor to the new thread. Thus the processor can keep serving goroutine, and the blocking thread could keep waiting system call to finish.

![](/img/posts/genchilu/javas-thread-model-and-golang-goroutine/blocking-system-call-3.png)

Here is a simple Golang code, create 1000 goroutine to read big file:

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

After running it in my Linux VM, ps command show up that the number of threads increasing to 130~200:

```bash
**g7@g7test1**:**~**$ ps -T 1013506 | wc -l

142
```

So that if you use lots of goroutine to call blocking system call, the concurrency may degrade as Java’s thread model.

> If you want to know more about goroutine scheduler，please refer [Go scheduler: Implementing language with lightweight concurrency](https://www.youtube.com/watch?v=-K11rY57K7k&t=316s&ab_channel=Hydra)。

## Conclusion

So far we had discussed the challenge Java’s thread model meet in high concurrency scenario and how Golang’ goroutine solve these issue. Does that mean Java is powerless in high concurrency?

Of Course NO. There is an ongoing project name [Loom Project](https://blogs.oracle.com/javamagazine/going-inside-javas-project-loom-and-virtual-threads), it’s purpose is to implement a mechanism like goroutine in JVM. Maybe in the next Java LTS version, we could handle high concurrency in JVM gracefully, just like goroutine.

By the way, what makes me feel interesting is that before Java 1.2, Java uses green thread which runs virtual thread on OS thread just like goroutine. But green thread suffers some performance issues in multi-core environment. That’s why Java decide to use native afterJava 1.3.

I wonder that if OS could provide some concurrency mechanism one day as goroutine does, would programing language switch to use native mechanism instead of implementing their scheduler?
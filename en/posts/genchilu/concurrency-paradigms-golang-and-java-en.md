---
title: "Concurrency Paradigms: Golang V.S. Java"
date: 2021-08-29
tags: [Back-end, java, golang, thread, goroutine, concurrency paradigms]
author: genchilu
layout: en/layouts/post.njk
---

<!-- summary -->
I find that I was just using Golang's syntax to write Java after I reviewed the Golang code I wrote years ago, I was a newbie in Golang then. Especially in writing concurrency programs, the design ideas are totally different between Golang and Java: we are used to designing concurrency with the idea "thread-safe" in Java, but we would use the idea "channel" more in Golang.
<!-- summary -->

In this article, I want to discuss the different styles in writing concurrency programs between Java and Goalng, Hope that can help some newbie Golang programmers could have some basic concept while writing concurrency.

## What is Paradigms
Program paradigms are the guideline principle of how to writing a program, a higher level design pattern. For example, Object-Oriented Programming is one kind of Program paradigms. There are other program paradigms, like Functional programming. While paradigms differ in many ways, such differences are neither superior nor inferior to each other. There are suitable scenarios for each paradigm.  

Like program paradigms, there are also concurrency paradigms, like Thread & Lock is one of those paradigms that you would follow while writing Java concurrency code. On the other hand, Go's concurrency paradigm is base on Communicating Sequential Process(CSP).  
Let's deep into the difference more between these two paradigms in the following.

## Thread & Lock
Thread & Lock works like what underlying hardware does. Threads communicate with each other by sharing memory and ensure only one thread can access share memory by Lock. That's what we call mutual exclusion or mutex.  

![](/img/posts/genchilu/concurrency_paradigms_golang_and_Java/thread_and_lock.png)

Take the classic producer-consumer problem, for example, Java's implementation may use Lock like below:

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
The producer produces an item and passes it to the queue, and the consumer consumes the item from the queue. Every time the producer or consumer access the queue, it must acquire Lock first. So only one thread can access the queue at the same time.  
Almost all program languages support Lock, so this paradigm can be applied widely.  
But it's difficult to use Thread & Lock to get right, you may accidentally fail into deadlock, see follow code:  

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
Threads in line 20 and 25 wait for each other's Lock, and the whole process will block forever.  
What's more, deadlock is not obvious in most cases. Think above code, what if **oneMethod** and **anotherMethod** are provided by a third party, you don't know the behavior inside these two methods, you don't know how they use Lock until you trace source code, so you may probably use these two methods in the wrong way that could cause deadlock.  

## Communicating Sequential Process(CSP)
Compare to Thread & Lock paradigm that communicates by sharing memory, CSP paradigm encourages to share by communicating, every thread sends/receives the message to/from each other. Looks like:  

![](/img/posts/genchilu/concurrency_paradigms_golang_and_Java/csp.png)

And Golang's concurrency paradigm's design principle is base on CSP. [Golang's offical blog](https://go.dev/blog/codelab-share) means:

> Do not communicate by sharing memory; instead, share memory by communicating.   

Also, you can see the comment in the document of Golang Sync package:

> Package sync provides basic synchronization primitives such as mutual exclusion locks. Other than the Once and WaitGroup types, most are intended for use by low-level library routines. Higher-level synchronization is better done via channels and communication.  

So the implementation of producer-comsumer problem in Golang would like:

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
Developers can easily use channel without caring about the sophisticated mutex. In the aspect of high level, Golang decouples goroutines by channel instead of coupling all threads together by share memory, like Java using Thread & Lock.  
But that does cost - Golang's channel does not pass the original item, instead, channel would copy items from/to the sender/receiver. You may check with the following code:  

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

and the memory address is different.

```text
roduce item Addr: 0xc000014090
Consume item Addr: 0xc000120000
```

Copying items will decrease performance more or less, that is the cost to decouple goroutine.


## Conculsion
In this article, we mention that Java's concurrency paradigm is base on Thread & Lock does not mean that you can not write Java's concurrency code like CSP. For example, you can use BlockingQueue. Similarly, Golang provides Mutex or RWMutex to developers who are familiar with Lock, too.  
What I want to say is you may see lots of Thread & Lock in Java's project more than CSP, you would see that thread-safe terms in Java's ecosystem, but You may see that Golang developers are caring more about select & channel while writing concurrency.  
In the next article, I will introduce some common concurrency patterns with channel & select in Goalng's blog and compare that to Java. I think that may uncover more differences between these two paradigms.

## Reference
[GopherCon 2017: Kavya Joshi - Understanding Channels](https://www.youtube.com/watch?v=KBZlN0izeiY)  
[Seven Concurrency Models in Seven Weeks When Threads Unravel](https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/)
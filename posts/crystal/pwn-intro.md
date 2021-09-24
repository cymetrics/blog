---
title: PWN 入門 — ret addr, shellcode
author: crystal
date: 2021-09-27
tags: [Security, Reverse Engineering, Binary Exploitation]
layout: layouts/post.njk
image: /img/posts/crystal/pwn-intro/cover.jpg
---
<!-- summary -->
你可能在很多 CVE 裡都看過 buffer overflow 這個名詞，但你知道這個弱點是如何引發 RCE 這麼嚴重的問題的嗎？這次讓我們來透過幾個簡單小題目看看 buffer overflow 如何發生，又該如何 exploit。
<!-- summary -->


在開始之前，請先閱讀 Reverse 101 的基礎篇：[**Reverse Engineering 101 — Part 1**](https://tech-blog.cymetrics.io/posts/crystal/reverse-01)，學習 pwn 的時候，了解記憶體分配與程式的運作方式是很重要的。

### What is buffer overflow?

讓我們回顧一下函數的呼叫與執行是如何運作的。在 64 bit 的 Unix 系統中，參數會以暫存器傳遞（通常前六個為 `rdi` `rsi` `rdx` `rcx` `r8` `r9`），而每一個函數內部會用到的變數以及結束後要返回繼續執行的指令位置等資料，會以一個 stack frame 的結構層層堆疊，並用 calling convention 管理 stack frame 的創建與銷毀。

先前我們看到的 stack frame 只是一個粉紅色的區塊，但現在我們要來更仔細的檢視這塊記憶體裡到底裝了什麼。

下面這邊是一段簡單的 C code，一開始會宣告一些區域變數，做一些運算邏輯，然後吃一段使用者輸入的名字到 name 這個長度為 64 byte 的字串裡，最後再把名字印出來。右邊是這個函數用到的記憶體空間，stack frame 底部會先放 function prologue 儲存好的 return address 以及舊的 rbp 位置，再往上才是函數內部用到的區域變數。這塊空間中，區域變數的順序 spec 並沒有規定，主要是 compiler 編譯時會根據一些優化規則跟記憶體 alignment 分配，然後把安排好的順序包進執行檔。

#[simple C code and stack frame](/img/posts/crystal/pwn-intro/c-to-stack.png)

這些為區域變數預留好的空間，就是一個一個的 buffer，當變數被賦值或是寫入的時候，資料就會填入這些記憶體。在程式開發者預設的情況下，使用者的名字幾乎不會超過 64 byte，所以他預期用戶輸入名字之後，記憶體就會長得像下面左邊的樣子，一個蘿蔔一個坑。

但是，這裡有一個致命的缺點。在 C 語言中，`gets(char s*)` 這個函數會從 stdin 讀取一行字並存到 s 指到的記憶體位置中，所謂『一行字』就是說，在遇到換行符號或 EOF 前都會一直讀下去。

你可能發現問題在哪了：當讀取的字串長度超過了分配的記憶體大小會怎麼樣呢？

答案就是：會把後面的記憶體空間覆寫過去，這就叫做溢位（overflow）。

那溢位又會如何？別忘了，當你把區域變數的空間都蓋過去了，下面兩塊記體就是舊的 rbp 位置跟函數結束後要回復執行的 return address。如果再多寫一點蓋過去，那你就可以竄改 return address，掌控程式的運作流程（hijack control flow），執行你想要的邏輯！下圖右邊就是當你輸入一大串的 A 把記憶體都填滿之後會噴的錯誤，因為 return address 指向不存在程式邏輯的 0xAAAAAAAA 所以導致程式 crash 報出 segmentation fault 的錯誤。

#[buffer overflow!](/img/posts/crystal/pwn-intro/stack-overflow.png)

以上就是最基礎的 stack-based buffer overflow 模型。在 pwn 的題目中，我們的目標就是要想辦法控制 return address 來達到 RCE。再來讓我們用兩個簡單的小題目實際練習一下吧！

### Simple retaddr overwrite

第一個簡單的小範例我們用 2021 Hactivitycon CTF 的暖身題 Butter_overflow 示範如何篡改 return address。你可以在![這裡]()下載擋案自己練習。

跟之前 reverse 的方法一樣，我們先跑一次看看。你會發現它就是跟使用者要一行輸入，然後就結束了，非常簡短。

#[running butter](/img/posts/crystal/pwn-intro/butter-run.png)

用 `file` 得知檔案 not stripped 所以 symbols 都還在，然後用 GDB 打開這個檔案看一下 `main` 做了哪些事。

#[main function](/img/posts/crystal/pwn-intro/butter-main.png)

扣除掉一些不重要的函數，核心執行的邏輯如下：

```txt
push   rbp
mov    rbp,rsp
sub    rsp,0x200
lea    rdi,[rip+0xc3a]
call   0x1110 <puts@plt>    # print prompt
lea    rax,[rbp-0x200]
mov    rdi,rax
mov    eax,0x0
call   0x1170 <gets@plt>    # get input
mov    eax,0x0
leave  
ret  
```

那麼該如何成功造成 overflow 呢？首先我們知道 `gets` 的 input 是 `[rbp-0x200]` 這個記憶體位置，所以字串 buffer 長度超過 0x200 就會溢出分配的空間，覆寫到後面的記憶體。請注意，不是所有的程式中，記憶體都單單是 `buffer size + old ebp(8 bytes) + retaddr` 這麼單純，根據保護機制不同跟編譯的差別，你能控制的空間跟 return address 的位置之間的 offset 是需要實際測試出來的。

為了判斷多少字元會蓋過 return address，我們先手動創建一個非常長的字串：`'A'*0x200 + 'B'*8`，然後跑起來並輸入程式中。

#[main function](/img/posts/crystal/pwn-intro/butter-segfault.png)

馬上就跑出了一個 segmentation fault！

identify overflow 

find offset (gdb)

info functions -> find win()

talk about protections: PIE

get flag

### Simple shellcode

show reversed code (ghidra)

identify overflow

find offset (gdb)

talk about protection: NX

bypass obfuscation

shell

### rop
### ret2libc
### shelle-2

## 結語

做 binary exploitation 的喜歡 segmentation fault 就跟做 web 的喜歡 500 internal error XDDD
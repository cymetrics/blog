---
title: Reverse Engineering 101 — Part 1
author: crystal
date: 2021-06-04
tags: [Security]
layout: layouts/post.njk
---
<!-- summary -->
<!-- 很多人對逆向工程躍躍欲試卻不知道從何開始，又該具備哪些知識？這一篇文章會從逆向一個小程式，帶你建立基礎知識與想法！ -->
<!-- summary -->

最近解一些 CTF 順便跟同事分享 Reversing 的一點基礎技巧，想說寫成文章分享一下。這篇是給技術小白的 Reversing 入門系列，零基礎第一課！

本篇會用到的工具有：

1. linux 或 Unix-like 作業系統
2. GDB（GNU Debugger），一個不管靜態還是動態分析都很好用的 linux 內建工具
3. 滿滿的好奇心！

## 該如何開始？

以下以一個簡單的[小程式](https://github.com/OneDegree-Global/medium-resources/tree/main/reverse-101)為例。

今天拿到一個未知的檔案，我們該從何下手呢？首先，要知道我們的目標是什麼樣的檔案。我們可以用 linux 內建的 `file` 指令來辨識檔案類型。

![](/img/posts/crystal/reverse-01/file.png)

例如從上圖中我們可以觀察到幾件事：

1. 這是一個 ELF 檔案（Executable Linkable Format），是 Unix 系統上常見的 binary 執行檔、共用函式庫、或是 object code 類型，也意味這我們可以直接在 linux 系統上把他跑起來 [^1]

2. 記憶體的位元組順序（Endianness）採 LSB（Least Significant Bit），或是常說的 little endian，表示把最高位的位元組放在最高的記憶體位址上，如下圖所示。這表示當我們輸入 `1234` 的時候，在 GDB 等軟體裡觀察記憶體時會看到的是 `\x34\x33\x32\x31`，這部分我們等等用 GDB 會再看到。

    ![](/img/posts/crystal/reverse-01/little-endian.png)

3. libc 函數的調用為 dynamically linked，亦即程式跑起來的時候，作業系統才會做 linking，把各個要調用的 libc 函數的位置填到這隻程式的一張表裡，方便執行時查詢呼叫。如果是 statically linked，在編譯過程中就會直接把這些外部函數都一起包到程式裡面，產出一個比較肥大的檔案。就像有人製作筆記時，會把課本內容抄到筆記本上，這樣所有資料一目瞭然，馬上就能找到，缺點是筆記厚厚一本；也有人僅是標註對應的課本頁數，這樣筆記較為精簡輕便，不過缺點是要找資料時必須另外參照課本。[^2]

4. 跑在 x86–64 （64 bits）的結構上，64 bits 跟 32 bits 不只在暫存器名稱上不同，在 system call 的呼叫上也不一樣。

5. `not stripped`，表示在編譯過程中，debugging 資訊沒有被去掉，我們還看的到各個函數跟變數的名稱等等。

接著就可以執行看看！跑起來如下圖所示，會先跟使用者要三個數字，然後進行某些判斷，錯誤就會像這樣印出 ‘nope.’。因此，我們可以判斷拿到 flag 的條件就是讓這三個數字符合某些關係，檢查通過了就會印出 flag。

![](/img/posts/crystal/reverse-01/execution.png)

---

## GDB 是什麼？能吃嗎？

GDB 的全名是 GNU Debugger，顧名思義就是可以讓你一邊執行一個檔案一邊看到裡面的細節，也可以設置中斷點來逐步檢視記憶體裡面存的東西跟執行順序，方便開發者抓蟲。他還有很多強大的功能跟插件，例如最常用的 peda、gef、pwndbg 等等，可以讓你很方便地看到不同區段的資料甚至產生 shellcode ，大家如果有興趣可以再去逛逛。

首先，執行 `gdb <filename>` 就可以在 GDB 裡面載入這個執行檔。再來就是用 `info file` 來觀察這個程式的進入點跟各區段位置[^3]。編譯器運作時，會把負責邏輯的程式碼跟變數等資料分區存放並加上對應的標籤以供程式運行時存取。

![](/img/posts/crystal/reverse-01/gdb-info.png)

通常我們會注意的幾個比較重要的區段為：

1. `.text`：放置可執行的程式碼。權限為唯讀。

2. `.rodata`：已初始化的資料，例如你在程式裡面寫死的字串或是常數。權限為唯讀。

3. `.data`：已初始化的資料，例如你在程式裡面使用的全域變數。權限為可讀可寫。

4. `.bss`：未初始化的資料。權限為可讀可寫。

我們知道開始執行的地方是 `0x400860` 後，就可以用 `disas` 反編譯這段程式碼。

![](/img/posts/crystal/reverse-01/disas-start.png)

我們會觀察到這個函數有一個名字 `_start`。之前說過，`not stripped` 表示函數名稱都有被保留，所以我們也可以用函數名稱當作 reference 對象，在反編譯跟設中斷點的時候使用這個名稱。

但是我們的程式裡面沒有寫到 `_start` 這個函數啊，他是哪裡來的呢？其實在編譯的過程中，編譯器會加入一個進入點 `_start` 函數，負責初始化一些 gcc/glibc 的準備工作再呼叫我們的 `main`，可以想成是在我們的程式外多加一層包裝來整頓好環境再開始執行主邏輯。所以，我們可以看到在 `<+36>` 的地方呼叫 `<__libc_start_main@plt>`，其實也就是透過 libc 的函數再間接呼叫我們所撰寫的主程式 `main`。

這裡我們打個岔，回去看一下前面提到的 little endian。下面這張圖是在 GDB 裡面用 `x/<num><unit> addr` 去看記憶體的指令，unit 有 b（bytes = 1 byte）、h（halfword = 2 bytes）、w（word = 4 bytes）、g（giant word = 8 bytes）這幾種，表示一次看的單位是多少位元，前面的 num 就是看多少單位，所以 `x/4x 0x400cd0`就是從地址 `0x400cd0`開始讀取 4 個 4 byte 的記憶體。unit 預設是 w，x 就是延續用最後一次設的單位。

![](/img/posts/crystal/reverse-01/gdb-endian.png)

我們看到第一行的第一塊記憶體是紅色框起來的 `0x65746e45`，第二塊記憶體是黃色框起來的 `0x68742072`，那第三行一次讀 8 bytes 的時候怎麼順序交換變成黃色框在前面了呢？

那就是因為 little endian 必須反過來讀，我們看到的 `\x65\x74\x6e\x45` 在記憶體裡面存的其實是 `\x45\x6e\x74\x65`，所以把第一行的框框們從屁股讀回來，黏一起就是 `\x45\x6e\x74\x65 \x72\x20\x74\x68`，就是第三行的第一個單位反過來的樣子啦！大家記得不要讀反囉！

---

## 基礎知識：組合語言與計算機結構

接下來，在進到 `main` 之前，先來講講一點基本的組合語言與計算機結構。

組合語言是介於機器看得懂的二進位操作碼（opcode）與一般人看得懂的高階程式語言中間的一種低階語言，目的是讓二進位的程式變得可以閱讀與編輯。由於每一種 CPU 使用的機器指令（machine instruction）都不同，所以對應的組合語言也不一樣，這裡我們以 x86–64 為例介紹，遇到不懂或沒看過的都可以去查指令集哦。[^4]

最常見的指令如下，`S` 指 source，`D` 指 destination：

*   `mov D, S`：將某個值或是記憶體的位置寫入某個暫存器。把 `S` 裡面的值寫到 `D`裡面。
*   `push S`：將 `S` 裡面的值放到 stack 上。
*   `pop D`：把 stack 上的值放到 `D` 裡面，從 stack 移除。
*   `add D, S`、`sub D, S`：將 `S` 跟 `D` 裡面的值相加相減，結果放在 `D` 裡面。
*   `call Label`：呼叫帶有 Label 標籤的函數，這時程式會為這個函數創一個新的 stack frame。
*   `ret`：終止當前函數的執行，返回到上一層的函數。

還有進行條件判斷的 `cmp`、`test` 跟各種跳躍的 `jmp` 家族，之後我們遇到再說明。

要注意的是，上面的寫法是 Intel 語法，如果是 AT&T 語法就將 `S` 跟 `D`反過來（如 `mov S,D`）。

首先，我們必須先理解暫存器與記憶體。CPU 只跑指令，而資料儲存交給記憶體，當 CPU 需要用到資料時就會向記憶體請求。我們可以把記憶體想像成一間很小的圖書館，門口有一個櫃子放本週最熱門的書籍，進門後一樓放各個老師指定的課本與參考資料，其他書籍都放在地下倉庫內。那麼今天有學生想借書，他要是在門口一看就能找到想要的那本當然是最有效率的，不然他就得走進去，在層架間仔細翻找，也許要一個小時才能找到。要是更慘都沒有，還要勞煩管理員到倉庫裡搜尋，說不定要一兩天功夫才行。越多的資料量查詢起來越沒有效率，反之，越少的資料越能快速存取。

記憶體常見的結構如下圖。最上層是 CPU 暫存器（register），是存取最快速頻繁也最小的記憶體。再往下至快取（cache）、RAM、 hard drive ，能存的資料越來越多、體積越來越大、存取速度也越來越慢。

![](/img/posts/crystal/reverse-01/memory-model.png)

要看懂組合語言，首要之務就是了解暫存器。

在 x86–64 結構下，暫存器都是 64 bits = 8 bytes 大小[^5]，暫存器也可以部分存取，以 `rax` 為例，`eax` 指 `rax` 的後 4 bytes、再對切得到 `ax` 為倒數 2 bytes、然後再切分為 `ah` 與 `al`。

![](/img/posts/crystal/reverse-01/reg-size.png)

暫存器的種類也非常多，一般來說，有 16 個一般用途暫存器，為 `rax` `rbx` `rcx` `rdx` `rdi` `rsi` `rbp` `rsp` `r8-r15`，意指可能被用於任何運算操作。與之相對，屬於特殊用途暫存器的 `rip` `rflags`就不是可以拿來運算調用的。

![](/img/posts/crystal/reverse-01/x64-regs.png)

每個暫存器傳統上都有特殊用途，例如：

*   `rax` 常用於放函數回傳值跟乘除法運算結果
*   `rbx` 常用於放 base address
*   `rcx` 常用於回圈中的計數器（counter）
*   `rdx` 常用於存放資料
*   `rbp (base pointer)` 指向當前函數 stack 上的底部（stack frame 下緣）
*   `rsp (stack pointer)` 指向當前函數 stack 上的頂部（stack frame 上緣）
*   `rip (instruction pointer)` 指向下一個要執行的 CPU 指令

再來，我們看看 stack 跟 heap 。C 程式一般的記憶體配置如下圖。上面是高的記憶體位址（`0xffff…`）下面是低的記憶體位址（`0x0000…`），heap 在 `.bss` 區段之後開始、隨著動態記憶體配置增加慢慢往上長，而 stack 則是從高的記憶體位址開始往下長。stack 放置的是靜態的、已知大小的資料，例如每一個函數內的區域變數以及函數的參數跟地址等等。

![](/img/posts/crystal/reverse-01/memory-layout.png)

程式執行時函數的呼叫就會以 stack frame 的方式層層堆疊，也可以想成記憶體是一個直立式的櫃子、每個函數是一本一本的書籍，裡面記載了這個函數內的各種變數，當一個函數被呼叫時，就把這本書平放到櫃子中書堆的最上面，完成後再從書堆上拿下來。

那麼，誰去管理這個櫃子中的書堆，確保書籍有好好的被堆疊跟移除呢？

管理函數之間參數傳遞、並規定誰負責清除堆疊的一套約定，我們稱為 calling convention ，或是國家教育研究院譯為呼叫約定。在不同的系統架構下會有不同的 calling convention，以 AMD64 系統（用於 Solaris、Linux、FreeBSD、MacOS 等 Unix 跟 Unix-like 系統）的 x86–64 為例，儲存函數前六個參數的暫存器依序為 `rdi` `rsi` `rdx` `rcx` `r8` `r9`，而函數 return 的回傳值則會放在 `rax` 中（若大於一個暫存器的空間，例如回傳值在 64–128 bit，則會放在 `rax` 跟 `rdx`）。在呼叫一個函數前，呼叫者（caller）會把被呼叫的函數（callee）的參數放到暫存器中，再透過 `call` 這個指令去執行 callee。而進入 callee 後，在進行主邏輯前，callee 會先創造自己的 stack frame，在 stack 上留一塊記憶體空間。邏輯執行結束時，用 `leave` 把 stack frame 裡的東西清掉，最後 `ret` 把控制權交回 caller。

『創造自己的 stack frame』這個動作又稱為 function prologue，可以類比為書的前言、鋪成。實作上其實有一個組語指令叫 `enter n,0`，不過因為他太慢了，所以通常用下面這段取代：

```txt
push  ebp
mov   ebp, esp     # ebp = esp
sub   esp,  $n     # allocate space on the stack
```

搭配下圖由左而右來看，藍色區塊是 caller 的 stack frame，黃色是進行 `call` 後把當前執行到的地方，也就是等等 callee 結束執行要返回的地方給存起來。第一行的 `push` 把當前的 `ebp` 放到 stack 上面，等同存好現在的 stack 基底，方便函數結束後回復到前一個函數的狀態，此時 stack 從左一變成左二，多了綠色的部分。第二行把 `ebp` 指到現在 `esp` 的位置，stack 從左二變成左三。第三行把 `esp` 向上移大小為 n 的空間，也就是預留出 callee 函數所需要的記憶體，stack 變成最後一張，創造出了紅色部分的另一個 stack frame。

![](/img/posts/crystal/reverse-01/prologue.png)

『清掉自己的 stack frame』這個動作又稱為 function epilogue，可以類比為書的後言。使用的組語指令叫 `leave`，概念上等同下面這段：

```txt
mov   esp, ebp     # esp = ebp
pop   ebp          # restore old ebp
```

搭配下圖由左而右來看，原始狀態就是前面 function prologue 完的樣子。第一行把 `esp` 指回 `ebp` 的地方，stack 從左一變成左二，這下子紅色的 callee stack frame 就被釋放出來了。第二行把 stack 上的值拿下來放回 `ebp`，也就是把舊的 `ebp` 位置還原回來，stack 變成最右邊的樣子，當前的記憶體最上面就回到 caller 的 stack frame 了。

![](/img/posts/crystal/reverse-01/epilogue.png)

---

## 結語

到這裡為止，我們其實都還沒開始逆向呢XDDD 先具備一些基礎知識是很重要的，知己知彼才能見招拆招嘛！

這一篇我們先講解了逆向的起手式、基本的組合語言以及計算機結構、還有編譯完的程式碼以及記憶體的運作方式。上面只是針對AMD 的 x86–64 這一種結構做說明，有興趣的話可以去查查不同結構下的組合語言指令集跟 calling convention，可是很不同的喔！你也可以把這篇用到的小程式跟你電腦上別的程式用 GDB 或是 IDA 打開來看看，比較一下差異。

總之，我們總算把前置準備完成，下一集我們來正式開始看 `main` ！


[^1]: 小提醒：千萬別執行來路不明的檔案哦！一般來說提供軟體的廠商都會在下載點提供一個 MD5 checksum，也就是將這個檔案的資料做雜湊運算得出的一個值，你可以利用 linux 內建的 `md5sum` 指令驗明正身！如果 `md5sum <file>` 的到的結果跟網站標示的一樣才是對的！
[^2]: 在 dynamically linked 的時候，如果想看到有哪些外部函示庫被調用，以及他們的 base address，可以用 `ldd <filename>` 查看，這部分的利用以後有 pwn 入門系列再來說明 XDD
[^3]: 或者我們也可以用 `objdump` 來看各區段的位置以及權限，指令為 `objdump -h <filename>`，同一個檔案的輸出會長這樣
[^4]: 指令集：[Intel 64 & 32 bits](https://software.intel.com/content/www/us/en/develop/articles/intel-sdm.html)、[維基百科](https://en.wikipedia.org/wiki/X86_instruction_listings)、[x64 cheat sheet](https://cs.brown.edu/courses/cs033/docs/guides/x64_cheatsheet.pdf)
[^5]: 另外其實有 128 bit 的暫存器，例如用來傳遞浮點數的參數時使用的是 `XMM` 系列，calling convention 跟一般用途暫存器類似，`XMM0-XMM7` 用於傳遞參數，回傳值則會放在 `XMM0`

    ![](/img/posts/crystal/reverse-01/objdump.png)
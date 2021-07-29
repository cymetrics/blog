---
title: Reverse Engineering 101 — Part 2
author: crystal
date: 2021-07-24
tags: [Security]
layout: layouts/post.njk
image: /img/posts/crystal/reverse-02/cover.jpg
---
<!-- summary -->
<!-- 逆向小白帶著滿箱的知識，準備正式開始拆解小程式啦！ -->
<!-- summary -->

part 1 傳送門：[**Reverse Engineering 101 — Part 1**](https://tech-blog.cymetrics.io/posts/crystal/reverse-01)

熬過了基礎知識的建立，接下來我們來分析一下程式的邏輯吧！

## 事不宜遲，快快開始

首先先給大家看一下 `disas main` 的完整結果。 

```txt
Dump of assembler code for function main:
   0x0000000000400b1e <+0>:	    push   rbp
   0x0000000000400b1f <+1>:	    mov    rbp,rsp
   0x0000000000400b22 <+4>:	    sub    rsp,0x20
   0x0000000000400b26 <+8>:	    mov    DWORD PTR [rbp-0xc],0x0
   0x0000000000400b2d <+15>:	mov    DWORD PTR [rbp-0x10],0x0
   0x0000000000400b34 <+22>:	mov    DWORD PTR [rbp-0x14],0x0
   0x0000000000400b3b <+29>:	mov    esi,0x400cd0
   0x0000000000400b40 <+34>:	mov    edi,0x6021a0
   0x0000000000400b45 <+39>:	call   0x400830 <_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt>
   0x0000000000400b4a <+44>:	lea    rax,[rbp-0xc]
   0x0000000000400b4e <+48>:	mov    rsi,rax
   0x0000000000400b51 <+51>:	mov    edi,0x602080
   0x0000000000400b56 <+56>:	call   0x400850 <_ZNSirsERi@plt>
   0x0000000000400b5b <+61>:	lea    rdx,[rbp-0x10]
   0x0000000000400b5f <+65>:	mov    rsi,rdx
   0x0000000000400b62 <+68>:	mov    rdi,rax
   0x0000000000400b65 <+71>:	call   0x400850 <_ZNSirsERi@plt>
   0x0000000000400b6a <+76>:	lea    rdx,[rbp-0x14]
   0x0000000000400b6e <+80>:	mov    rsi,rdx
   0x0000000000400b71 <+83>:	mov    rdi,rax
   0x0000000000400b74 <+86>:	call   0x400850 <_ZNSirsERi@plt>
   0x0000000000400b79 <+91>:	mov    edx,DWORD PTR [rbp-0xc]
   0x0000000000400b7c <+94>:	mov    eax,DWORD PTR [rbp-0x10]
   0x0000000000400b7f <+97>:	add    edx,eax
   0x0000000000400b81 <+99>:	mov    eax,DWORD PTR [rbp-0x14]
   0x0000000000400b84 <+102>:	add    eax,edx
   0x0000000000400b86 <+104>:	mov    edi,eax
   0x0000000000400b88 <+106>:	call   0x40094d <_Z3geni>
   0x0000000000400b8d <+111>:	mov    QWORD PTR [rbp-0x8],rax
   0x0000000000400b91 <+115>:	mov    edx,DWORD PTR [rbp-0xc]
   0x0000000000400b94 <+118>:	mov    eax,DWORD PTR [rbp-0x10]
   0x0000000000400b97 <+121>:	add    edx,eax
   0x0000000000400b99 <+123>:	mov    eax,DWORD PTR [rbp-0x14]
   0x0000000000400b9c <+126>:	add    eax,edx
   0x0000000000400b9e <+128>:	cmp    eax,0x539
   0x0000000000400ba3 <+133>:	jne    0x400bcc <main+174>
   0x0000000000400ba5 <+135>:	mov    esi,0x400ce6
   0x0000000000400baa <+140>:	mov    edi,0x6021a0
   0x0000000000400baf <+145>:	call   0x400830 <_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt>
   0x0000000000400bb4 <+150>:	mov    rax,QWORD PTR [rbp-0x8]
   0x0000000000400bb8 <+154>:	mov    rdi,rax
   0x0000000000400bbb <+157>:	call   0x400ae3 <_Z9print_ptrPc>
   0x0000000000400bc0 <+162>:	mov    edi,0x400cef
   0x0000000000400bc5 <+167>:	call   0x4007c0 <puts@plt>
   0x0000000000400bca <+172>:	jmp    0x400bdb <main+189>
   0x0000000000400bcc <+174>:	mov    esi,0x400cf1
   0x0000000000400bd1 <+179>:	mov    edi,0x6021a0
   0x0000000000400bd6 <+184>:	call   0x400830 <_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt>
   0x0000000000400bdb <+189>:	mov    rax,QWORD PTR [rbp-0x8]
   0x0000000000400bdf <+193>:	mov    rdi,rax
   0x0000000000400be2 <+196>:	call   0x400840 <free@plt>
   0x0000000000400be7 <+201>:	mov    eax,0x0
   0x0000000000400bec <+206>:	leave  
   0x0000000000400bed <+207>:	ret    
End of assembler dump.
```

哇，這些密密麻麻的怎麼看？！從第一行開始讀嗎？

> 首先，最重要的是理出邏輯，也就是要辨別『用了哪些函數』跟『經過哪些判斷式』。

『用了哪些函數』簡單，只要找出所有的 `call` 指令就行了。上面用到的就有好幾個，例如好短的 `<_Z3geni>` `<puts@plt>`跟這個好長的`<_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt>`。有人可能會發現，怎麼有些函數後面加了一個 `@plt` 呢？

這裡要先講『函數』是怎麼被儲存跟存取的。寫過一點程式的人應該都用過一些 standard library 或是第三方函式庫，有沒有想過程式執行起來的時候怎麼抓到或引用這些外部函數呢？

### Linking

在編譯程式碼的時候，有 dynamic linking 和 static linking 兩種方法，簡單對比的話，dynamic linking 就是只把作者自己定義的函數跟邏輯包進執行檔，而 static linking 則會把外部引用的函數一起包進去。所以 static linking 產生的檔案會大很多，而 dynamic linking 則會需要檔案執行者本機上的函示庫支援。到了執行的時候，statically linked 的檔案就可以直接在執行檔裡找到函數，dynamically linked 則是在程式跑起來的時候，作業系統才會做 linking，把各個要調用的外部函數的位置填到這隻程式的一張表裡，方便執行時查詢呼叫。剛剛說要『填入的一張表』就是 GOT（Global Offsets Table），是一個可讀可寫的記憶體空間；而 PLT（Procedure Linkage Table）就是『執行時查詢呼叫』的另一張表，是一個可讀可執行的記憶體空間。

![](/img/posts/crystal/reverse-02/plt-got.png)

我們用上面這張圖簡單說明一下。

當程式跑起來時，dynamic linker 會做幾件事：

1.  把引用到的外部檔案 load 到 memory
2.  創建 PLT 與 GOT，PLT 中的欄位指向對應的 GOT 欄位
3.  在 GOT 欄位中放入一個 default stub（可以先想成是一個機關）。

第一次遇到 `call func@plt` 的指令時，程式就會戳到 GOT 欄位裡的 default stub，觸發機關使 dynamic linker 依據剛剛 load 進來的函式庫跟 `func` 在外部檔案中的 offset 算出此時 `func` 在記憶體中的位置並且填入表中，變成下面那張圖的樣子。此後，任何的 `call func@plt` 指令就會順利呼叫到 `0x7fff12b0` 這個位置的函數啦！

以上是一個非常簡略的介紹，其實 linker 的機制還有非常多細節，有興趣的可以參考大佬 [Ian Lance Taylor 的一系列文章](https://www.airs.com/blog/archives/41)。

不過經過這個簡略的介紹，大家可以記得兩件事：

*   GOT 可寫，PLT 可執行
*   通常用 `@plt` 呼叫的指令是外部函數，常常是標準函式庫，看不懂可以直接 google 查詢，都找得到詳盡的文件

### Function calls

好的，那上面 `main`的函數有哪些呢？又是什麼意思呢？幫你查好了！

*   `_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt`：basic `ostream`，也就是 `cout` 用到的 `<<`
*   `_ZNSirsERi@plt`：`istream`，也就是 `cin` 用到的`>>`
*   `_Z3geni`：作者自定義的函數，看起來本來是 `gen()`，應該是用來產生 flag 的函數
*   `_Z9print_ptrPc`：作者自定義的函數，看起來本來是 `print_ptr()`，應該是印出某些東西
*   `puts@plt`：libc `put` function
*   `free@plt`：libc `free` function

小提示：判別函數除了查詢之外，也可以從剛剛的 assembly 看出一點端倪！我們知道函數接收參數是用 `rdi` `rsi` ，那就可以把一些已知位置的記憶體印出來。

例如 `main+39` 的 `_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc` 前面是 `mov esi,0x400cd0; mov edi,0x6021a0`， `main+56` 的 `_ZNSirsERi` 前面是 `mov edi,0x602080`：

![](/img/posts/crystal/reverse-02/cin-cout.png)

最後 `main+145` 的 `_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc` 前面是 `mov esi,0x400ce6; mov edi,0x6021a0`， `main+167` 的 `puts@plt` 前面是 `mov edi,0x400cef`：

![](/img/posts/crystal/reverse-02/flag-cout.png)

標準函式庫的參數都可以在文件上查到，只要對應著前一篇提過的 register 的順序就可以推敲出每塊資料的意義了喔！

### Conditionals

再來判別程式的邏輯，最重要的就是找出 `cmp` 指令並回推必要的條件。以下節錄判斷邏輯，省略的部分跟函數呼叫我用註解寫上他們的功能。

```txt
Dump of assembler code for function main:
   .....snip...... # setup and print prompt  
   0x0000000000400b4a <+44>:	lea    rax,[rbp-0xc]
   0x0000000000400b4e <+48>:	mov    rsi,rax
   0x0000000000400b51 <+51>:	mov    edi,0x602080
   0x0000000000400b56 <+56>:	call   0x400850 <_ZNSirsERi@plt>    # cin to [rbp-0xc] 
   0x0000000000400b5b <+61>:	lea    rdx,[rbp-0x10]
   0x0000000000400b5f <+65>:	mov    rsi,rdx
   0x0000000000400b62 <+68>:	mov    rdi,rax
   0x0000000000400b65 <+71>:	call   0x400850 <_ZNSirsERi@plt>    # cin to [rbp-0x10]
   0x0000000000400b6a <+76>:	lea    rdx,[rbp-0x14]
   0x0000000000400b6e <+80>:	mov    rsi,rdx
   0x0000000000400b71 <+83>:	mov    rdi,rax
   0x0000000000400b74 <+86>:	call   0x400850 <_ZNSirsERi@plt>    # cin to [rbp-0x14]
   .....snip...... # generate something from input
   0x0000000000400b91 <+115>:	mov    edx,DWORD PTR [rbp-0xc]
   0x0000000000400b94 <+118>:	mov    eax,DWORD PTR [rbp-0x10]
   0x0000000000400b97 <+121>:	add    edx,eax
   0x0000000000400b99 <+123>:	mov    eax,DWORD PTR [rbp-0x14]
   0x0000000000400b9c <+126>:	add    eax,edx
   0x0000000000400b9e <+128>:	cmp    eax,0x539                    # compare to 1337!
   0x0000000000400ba3 <+133>:	jne    0x400bcc <main+174>
   .....snip...... # success, print flag
   0x0000000000400bcc <+174>:	mov    esi,0x400cf1                 # 'nope.'
   0x0000000000400bd1 <+179>:	mov    edi,0x6021a0
   0x0000000000400bd6 <+184>:	call   0x400830 <_ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@plt>
   .....snip...... # clean up, free buffer
   0x0000000000400bec <+206>:	leave  
   0x0000000000400bed <+207>:	ret  
```

首先注意到 `main+128` 的 `cmp eax,0x539`。

下一行的 `jne 0x400bcc <main+174>` 告訴我們，如果 `eax` 的值不是 1337（把十六進位轉成十進位），那邏輯就會跳到 `main+174`，也就是印出失敗字串 “nope.” 的地方，所以我們的目標是讓：`eax=1337`。

往回推，`eax=eax+edx (main+126)`，又本來的 `eax=[rbp-0x14] (main+123)`、本來的`edx=edx+eax=[rbp-0xc]+[rbp-0x10] (main+115~121)`，也就是說，最後 `eax` 的值其實就是 `[rbp-0x14]+[rbp-0xc]+[rbp-0x10]`。

那這三個記憶體又是哪來的呢？

再往前看一些你就會發現，這三塊其實就是 `cin` 吃進來的三個數字，也就是我們一開始輸入的值呀！往上看到一進入 `main` 的前幾行，有把這三塊記憶體清空的指令，其實就是把這三個 4 byte 大小的 int 區域變數初始化為 0 的舉動。

其實到這裡，這一題就已經解完了。我們只要輸入任意三個相加為 1337 的數字就可以成功拿到 flag 了！

![](/img/posts/crystal/reverse-02/reversed.png)

根據上面的分析，我們可以手動還原 `main`的 cpp code。建議你可以先自己試試看，練習完再來看下面這段！

```cpp
int main() {
    int a,b,c = 0;
    char* flag;
    std::cout << "Enter three numbers!" << std::endl;
    std::cin >> a >> b >> c ;
    a = a + b;
    a = a + c;

    flag = gen(a);

    if (a == 1337){
        std::cout << "FLAG{" ;
        print_ptr(flag);
        std::cout << "}";
    }
    return 0;
}
```

### That’s it?

就這樣了嗎？是不是有點空虛？我們都還沒看過自定義的函數呢！

為了物盡其用，我們拿簡單的 `print_ptr()` 來看一下『迴圈』長什麼樣子。

從頭 trace 一下，略過前面 function prologue，在 `+8` 的地方把參數 `rdi` 放到 `rbp-0x18`，然後把 `rbp-0x4` 設成 0。接著，邏輯跳到 `+51` 的地方，這時我們才剛把 `rbp-0x4` 設成 0，跟 0x14 做比較當然 `jle`(**j**ump if **l**ess than or **e**qual)會成立，然後跳回到 `+21` 的地方，最後呼叫 `putchar@plt (+42)`。字元印出來後，會把 `rbp-0x4` 加 1，然後繼續判斷是否大於 0x14，否則再度跳回 `+21` 呼叫 `putchar@plt (+42)`。這個『加一、判斷』的循環會一直持續到 `rbp-0x4=0x15` 為止，然後整個函數就會結束。

聰明的你一定發現了，`rbp-0x4` 根本就是一個計數器（counter），這一整段程式跳來跳去其實就是為了重複執行 `+21` 到 `+42` 的部分，跑一個 0x15 次（0 到 0x14）的迴圈逐個印出 `gen()` 產生的 flag 的每一個字元。因爲實在太短了，我直接把還原的 cpp 寫在這：

```cpp
for(int i=0; i<0x15; ++i){  
    put_char(flag[i]);  
}
```

這種很短的『加減＋判斷＋ jump』組合，常常都是迴圈的邏輯喔！

再來看看這題最複雜的 `gen()`，因為他的組語太長我就不放上來了，請自己操作配著以下敘述觀察思考。`gen()` 的邏輯是先用 `malloc()` 拿到一塊記憶體，然後使用參數值，也就是三個數字的總和（就是 1337 啦）進行一些運算來產生 flag。小提醒：字串是由許多連續的字元或位元構成，因此我們可以用『字串頭的記憶體位置』加上『第幾個字元』來做 string indexing。

有興趣多練習的人可以試著自己 reverse 看看 `gen()`，我在這裡也附上參考的 cpp code 還有 ascii decode 結果。

```cpp
char* gen(int a){
    char *result = (char *)malloc(22);       // 0x16 = 22 (dec)
  
    *result = 121;                           // 0x79 = 121     -> 'y'
    result[1] = a + (a/7)* -7 + '0';         // 0x30 = '0'
    result[2] = a + 0x3c;                    // 0x529+0x3c=0x75 ->'u'
    result[3] = '_';                         // 0x5f = '_'
    result[4] = result[2] - 0x14;            // 0x75-0x14=0x61 -> 'a'
    result[5] = result[4] - 0x03;            // 0x61-0x03=0x64 -> 'd'
    result[6] = result[5];                   // 'd'
    result[7] = 0x65;                        // 'e'
    result[8] = result[6];                   // 'd'
    result[9] = result[3];                   // '_'
    result[10] = 0x74;                       // 't'
    result[11] = result[10] - 0xc;           // 0x74-0xc=0x68 -> 'h'
    result[12] = 0x72;                       // 'r'
    result[13] = 0x33;                       // 'e'
    result[14] = 0x33;                       // 'e'
    result[15] = result[3];                  // '_'
    result[16] = 0x6e;                       // 'n'
    result[17] = result[2];                  // 'u'
    result[18] = result[16] - 0x1;           // 0x6e-0x1=0x6d -> 'm'
    result[19] = 0x73;                       // 's'
    result[20] = 0x21;                       // '!'
    result[21] = 10;                         // '\n'

    return result;
}
```

### Patching

最後結束前來講另一個不錯的想法：直接更改判斷式 patch binary 讓印出 flag 的條件成立，這樣就不用管條件啦！

Patching 的確是一個常見又簡單的方法的方法，這題只要把 `main+133` 的 `jne 0x400bcc` 改成相反的 `je 0x400bcc` 就可以觸發印出 flag 的邏輯。

我們從 assembly dump 可以看到 `jne 0x400bcc` 在 `0x400ba3` 的地方。另外，從 ELF header 可以看到程式跑起來會被 load 在 `0x400000` 的位置，所以我們在 ELF 中要找的就是 `0x400ba3 — 0x400000 = 0xba3` 這個 offset。

![](/img/posts/crystal/reverse-02/codebase.png)

我們可以用 vim + xxd mode 找到 `0xba3` 的位置（記得 little endian 嗎），看到代表 `jne` 的 75。再來只要把它編輯成代表 `je` 的 74 再存檔，我們就 patch 好了！

![](/img/posts/crystal/reverse-02/xxd-patch.png)

於是我們很興奮地把它跑起來，為了確定真的有影響『印 flag 的邏輯』還先輸入正確數字並看到確實出現 “nope”。結果… flag 怎麼是個亂七八糟的東西！

![](/img/posts/crystal/reverse-02/messed-flag.png)

抱歉啦，出題者為了防止這種解法，加了產生 flag 的 `gen()`，所以數字總合如果不是 1337，產出的 flag 也會是不對的！

（作者 murmur：而且看出邏輯是三數總合應該還比 patch 簡單吧？

## 結語

恭喜大家成功 reverse 了第一隻小程式，看懂邏輯的剎那有沒有覺得成就感爆棚呢！雖然這是邏輯非常直觀的題目，不過練習判斷程式中『哪裡是重要邏輯』是成為逆向大師的關鍵第一步！

作為進階一點的挑戰，你可以試試自己寫一隻 hello world 小程式，看看 compile 成不同架構跟處理器後再 disassemble 有何不同喔！

#### 備註：

`lea` 和 `mov` 有何不同？更精確一些，下面這兩種有何不同？

```txt
LEA rax, [RBP+5] ; Compute address of valueMOV rax, [RBP+5] ; Load value at that address
```

`lea` 代表 load effective address，裝到暫存器的是『指到目標記憶體的 pointer』，常用於記憶體位置運算。

`mov` 代表 load value，裝到暫存器的是『目標記憶體內的值』，常用於值的運算與傳遞。
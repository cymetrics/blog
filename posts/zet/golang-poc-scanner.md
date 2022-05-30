---
title: "使用 golang 設計與實作批量檢測工具"
date: 2022-05-30
tags: [golang, scanner]
author: zet
layout: zh-tw/layouts/post.njk
image: /img/posts/zet/uuid-shellcode/uuid-in-memory.png
---

<!-- summary -->

在內部檢測過程中會需要針對目標做自動化檢測，如何設計與實作自動化與彈性增加模組，下面提供一個情境

> Database 裡整理了 100 個 IP, domain，需要對目標使用 nmap, subdomain enumeration 或是其他檢測工具串接(有可能是 local script, binary, docker)，需要可以判斷輸出結果有沒有符合特定特徵

<!-- summary -->


類似的專案，大多需要使用特定程式語言的 class 去串接，而 nuclei 雖然是使用 yaml 的格式但是受限於網路相關協定，後面要串接 docker 與 binary 相對不容易

- https://github.com/projectdiscovery/nuclei
- https://github.com/knownsec/Pocsuite
- https://github.com/cckuailong/pocsploit
- https://github.com/chaitin/xray

使用 golang 來實作，client 可以很好的跨平台，~~順便來練一下golang~~

可以參考 [https://github.com/golang-standards/project-layout](https://github.com/golang-standards/project-layout) 來放檔案

需求：
- CLI tools
- 針對內部搜集資料的 DB 查詢
- 介接掃描模組
  - 可以介接 docker, binary tools
  - 判斷結果是否符合預期
- 可以設定 woker 來加速掃描

## Commnad line interface

心目中好的 CLI tool 我覺得有一下幾個特點
- 良好 command, flag 的處理
- help 完整，不用一直翻文件
- 假如有進度功能可以加上 progressbar
- log 方便閱讀 (顏色 與 logging level)



要在 terminal 中跑少不了處理 argv 跟 flag，這邊用鼎鼎大名的 [spf13/cobra](https://github.com/spf13/cobra)，許多專案例如 Hugo、Github CLI、Kubernetes、Docker 都有使用到 cobra ，用 command 的功能把文件切開讓專案可以比較乾淨，還支援 autocompletion，`-h` flag 執行後大概是下面這樣，有漂亮的 help output

```diff
Usage:
  twpocsuite [flags]
  twpocsuite [command]

Available Commands:
  add         Add a new module
  completion  Generate the autocompletion script for the specified shell
  doc         Generate document
  doctor      Check system and config file
  help        Help about any command
  init        Init config files
  scan        Scan domain and ip
  version     Show version

Flags:
  -h, --help   help for twpocsuite
```

甚至內建可以產生文件
```go
import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/cobra/doc"
)

var docCmd = &cobra.Command{
	Use:   "doc",
	Short: "Generate document",
	Run: func(cmd *cobra.Command, args []string) {
		if _, err := os.Stat("./docs"); os.IsNotExist(err) {
			os.Mkdir("./docs", 0755)
		}
		doc.GenMarkdownTree(rootCmd, "./docs")
	},
}
```

## Database

資料庫方面因為想使用 ORM 所以就挑個支援最多討論度最高的 [gorm](https://github.com/go-gorm/gorm) 來使用

相對於其他語言 C++, python 的 ORM，個人覺得 gorm 用起來沒這麼方便，或許是golang 語言特性個關係，導致 gorm 比較不靈活，有些語法還要加入 string 去串接

把 database 的設定檔放在外面利用 `viper` 去讀取 config ，進行連接

## Module

設計客製化模組，可以運用在不同的場景與需求

因為 query DB 後必須要把 domain ip 這類的資訊帶入 Module ，Module 這邊比較像是一個樣板的感覺，這邊選擇 [pongo2](https://github.com/flosch/pongo2) 來做 Template Engine

引用一下官方的範例

```go
// Compile the template first (i. e. creating the AST)
tpl, err := pongo2.FromString("Hello {{ name|capfirst }}!")
if err != nil {
    panic(err)
}
// Now you can render the template with the given
// pongo2.Context how often you want to.
out, err := tpl.Execute(pongo2.Context{"name": "florian"})
if err != nil {
    panic(err)
}
fmt.Println(out) // Output: Hello Florian!
```


最後自己客製化一下樣板格式結合 templating，大致如下，當然中間的 cmd 會換成 docker commnad 或其他 binary

- 可以開關模組
- 會依照 `run.cmd` 中的 command 依序執行，有 timeout
- 跑完會依照 `checker.file` 去檢查檔案，確認 `checker.keys` 裡面有沒有內容，再依照 `checker.count` 去記數判斷

```yaml
enable: false

run:
  timeout: 120
  cmd:
    - "mkdir output/demo"
    - "touch output/demo/{{Domain}}.json"
    - "echo eyJkZW1vIjogdHJ1ZX0= | base64 --decode > output/demo/{{Domain}}.json"
    - "sleep $((RANDOM % 10));"

checker:
  file: output/demo/{{Domain}}.json
  type: json
  count: 1
  keys:
    - demo
```

當中因為要讀取 module template 檔案 yaml 格式的關係所以直接使用 [viper](https://github.com/spf13/viper)，比較省時一點剛好也可以跟 cobra 再一起使用，讀取工具本身的設定檔

### multiple workers

使用 Work Queue 的方式，把所有的 task 放到 Channel 然後起用多個 work 去消化

這邊考慮到流量問題(有可能被 ban)所以在 taget 這層用 multiple workers，不在 module 使用，使用 `goroutine` + `channel` + `WaitGroup`

## Logger

因為 log 有可能要再做後處理的需求，structured logging 的方式輸出 json 格式可以方便針對 log 後面的串接，在考慮 lib 有以下幾個方案

- [zap](https://github.com/uber-go/zap) - Uber 開發的，最早的 structured logging library ?
- [logrus](https://github.com/sirupsen/logrus) - 目前僅維護專案
- [zerolog](https://github.com/rs/zerolog) - 受到 zap 的啟發，在效能方便目前看起來是最好的

在使用性以及性能方面最後選擇 zerolog，我們希望在 console 輸出方便好看的 log，落地的 log file 是 json 格式，我們可以用 `[]io.Writer` 來綁定多個輸出

```go
var writers []io.Writer

f, _ := os.OpenFile("twpocsuite.log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0666)

writers = append(writers, zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})
writers = append(writers, f)

mw := io.MultiWriter(writers...)

log.Logger = log.Output(mw)
```


最後跑起來的 log 大概會像這樣

```diff
2022-04-07T17:39:42+08:00 INF start workers workers=20
2022-04-07T17:39:42+08:00 INF module scan finished entity_id=15 job=**** module=test result=true
2022-04-07T17:39:42+08:00 INF worker done job=**** worker=16
2022-04-07T17:39:42+08:00 INF module scan finished entity_id=7 job=**** module=test result=true
2022-04-07T17:39:42+08:00 INF worker done job=**** worker=6
2022-04-07T17:39:42+08:00 INF module scan finished entity_id=23 job=**** module=test result=true
2022-04-07T17:39:42+08:00 INF worker done job=**** worker=6
2022-04-07T17:39:43+08:00 INF module scan finished entity_id=14 job=**** module=test result=true
2022-04-07T17:39:43+08:00 INF worker done job=**** worker=4
2022-04-07T17:39:43+08:00 INF module scan finished entity_id=17 job=**** module=test result=true
2022-04-07T17:39:43+08:00 INF worker done job=**** worker=5
2022-04-07T17:39:43+08:00 INF module scan finished entity_id=22 job=**** module=test result=true
2022-04-07T17:39:43+08:00 INF worker done job=**** worker=16
2022-04-07T17:39:44+08:00 INF module scan finished entity_id=4 job=**** module=test result=true
2022-04-07T17:39:44+08:00 INF worker done job=**** worker=11
2022-04-07T17:39:44+08:00 INF module scan finished entity_id=11 job=**** module=test result=true
2022-04-07T17:39:44+08:00 INF worker done job=**** worker=12
2022-04-07T17:39:44+08:00 INF module scan finished entity_id=10 job=**** module=test result=true
```

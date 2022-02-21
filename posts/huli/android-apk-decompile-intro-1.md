---
title: Android App 逆向入門之一：拆開與重組 apk
date: 2022-02-21
tags: [Security, Mobile]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/android-apk-decompile-intro/cover1.png
---

<!-- summary -->
<!-- 「Android App 逆向入門」系列文一共有四篇，適合沒有接觸過 Android App 逆向，想要嘗試看看的人，內容包含基本的工具使用以及概念。第一篇我們將利用 apktool 拆開與重組 apk。 -->
<!-- summary -->

五年前我有寫過一篇：[[Android] 人人都會的 apk 反編譯](https://blog.huli.tw/2016/03/20/android-apk-decompile/)，那時我還是個寫 Android 的工程師，因為工作上的需求跟同事一起研究了基本的 Android 逆向工程，想達成的目標是全自動的流程，上傳一個 apk 以後自動把 apk 拆開來，塞一些奇怪的東西再裝回去。

而現在同樣是因為工作上的需求，再次回憶並補強了一下對於 apk 反編譯以及修改等等的相關知識，寫成這一系列的文章跟大家分享。

先說在前面，這一系列都只是「入門」而已，利用各種工具把 apk 拆開來再裝回去，對於沒有加殼的 app 應該夠用了，但如果有加殼過的話，需要再更深一點的 binary 相關知識才能夠解開，那又是另一個世界了。

總之呢，這個系列適合沒有接觸過 Android App 逆向，想要玩玩看的人，也適合 Android 工程師，可以把自己寫的 app 拆開來，看看是什麼樣子，我覺得也滿有用的。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)

## 要逆向，先從正向了解 Android app 開始

我認為想要逆向 Android app 的話，先大致了解一下 app 到底是怎麼寫出來的會滿有幫助的，至少在把 app 拆開來以後可以快速地知道各個部分大概在幹嘛。

所以我很推薦大家隨便找個 Android app 的教學，跟著教學把 Android Studio 裝起來，然後寫一個非常簡單的 app 並且跑起來，甚至打包成 apk 檔案，都會加強對於整個流程的理解。

接下來我就帶大家簡單看看一個 app 是怎麼寫成的。

首先呢，一個 app 大概是由三個元件所組成的：

1. AndroidManifest.xml，可以想成是 app 的設定檔，寫著各種 app 相關資訊
2. resources，各種資源，包括排版、程式中出現的字串、圖片等等所有資訊
3. 程式碼

底下是一個簡單的專案截圖，左邊是檔案結構，右邊是 `AndroidManifest.xml` 的內容：

![](/img/posts/huli/android-apk-decompile-intro/p1-manifest.png)

為了怕圖片不太清楚，底下是 xml 的內容：

``` xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myapplication">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

從這個檔案中我們可以知道幾件事情，包括：

1. 這個 app 的 package name 是 `com.example.myapplication`
2. 這個 app 有一個 activity，名稱是 `MainActivity`，是主要的 activity

每一個 app 都會有一個 unique 的 package name，可以想成就是這個 app 的 id，會寫在 AndroidManifest 裡面，而這也會跟你程式碼的檔案結構有關，有寫過 Java 的都會知道。

如果你去網頁版的 Google Play，就會發現網址上寫著的就是 package name，舉例來說 Facebook 的頁面網址長這樣：https://play.google.com/store/apps/details?id=com.facebook.katana&hl=zh_TW&gl=US

因此 `com.facebook.katana` 就是 Facebook app 的 package name。

再來我們看第二點，什麼又是 activity 呢？

你可以把 activity 想成是一個「畫面」，每一個畫面就是一個 activity，所以假設現在是個需要註冊才能使用的 app，很可能會有底下這些畫面：

1. 歡迎頁面
2. 註冊頁面
3. 登入頁面
4. 主頁面（登入成功後顯示）

而這每一個頁面都是一個 activity，而每一個 activity 可能都有一個 layout，在 Android 開發中，layout 其實就是一個 xml 檔案，會像是這樣：

![](/img/posts/huli/android-apk-decompile-intro/p2-layout.png)

右邊是你看到的樣子，左邊則是 layout 的 xml 檔案，這就有點像是網頁前端中畫面跟 HTML+CSS 的關係一樣，只是在 Android 開發中是用 xml 來產生畫面，而不是用 HTML+CSS。

像 layout 就屬於資源的一種，會被放在 `res` 資料夾裡面。

而上面的 layout 檔案，還有兩個值得注意的地方。

第一個是 `android:id="@+id/textview_first"`，代表這個 component 對應到一個 id，為什麼要對應到 id 呢？因為這樣我們才能在程式碼裡面存取到這個 component，像這樣：

``` java
TextView tv = (TextView) findViewById(R.id.textview_first);
tv.setText("hello");
```

我們要先利用 id 找到這個 component，才能改變它的文字。

第二個值得注意的地方是 `android:text="@string/hello_first_fragment"`，這其實就是元件會顯示的文字，假設我寫：`android:text="hello"`，畫面上就會顯示 hello。

那為什麼上面的內容是 `@string/hello_first_fragment` 呢？我們可以去看看 `res/values/strings.xml` 這個檔案：

![](/img/posts/huli/android-apk-decompile-intro/p3-strings.png)

內容為：

``` xml
<resources>
    <string name="app_name">My Application</string>
    <string name="action_settings">Settings</string>
    <!-- Strings used for fragments for navigation -->
    <string name="first_fragment_label">First Fragment</string>
    <string name="second_fragment_label">Second Fragment</string>
    <string name="next">Next</string>
    <string name="previous">Previous</string>

    <string name="hello_first_fragment">Hello first fragment</string>
    <string name="hello_second_fragment">Hello second fragment. Arg: %1$s</string>
</resources>
```

可以看到裡面有個 name 為 `hello_first_fragment` 的 string，內容是 `Hello first fragment`。

利用這樣的方法，我們可以避免直接在 layout 裡面 hard code 字串，避免將字串寫死。為什麼要避免寫死呢？因為要做多國語系！

如果你想要做成英文版的，那其實你可以建立一個新檔案叫做 `res/values/strings-en.xml` 之類的，Android 偵測到作業系統是英文時，就會自動去抓這個檔案裡面的字串來用，如此一來，你就只需要改變這個字串檔就好，不需要動到程式碼。

以上就是一些 Android app 的基本介紹，包括：

1. AndroidManifest 是做什麼的？
2. 什麼是 activity？
3. 各種 xml 檔案的用途是什麼？

理解這些以後，我們就可以來拆 apk 了。

我寫了一個簡單的範例 app，連結在這：https://github.com/aszx87410/demo/raw/master/android/demoapp.apk

跑起來以後長這樣，小巧可愛：

![](/img/posts/huli/android-apk-decompile-intro/p4-scr.png)

按下 `Check root` 之後會檢查裝置是否有 root，並改變畫面上的文字。

## 簡易 apk 拆解

其實 apk 就是一個壓縮檔，所以我們可以直接用內建的指令把 apk 拆開：

``` shell
unzip demoapp.apk -d demoapp
```

拆開來會長這樣：

![](/img/posts/huli/android-apk-decompile-intro/p5-apk.png)

大致上有底下幾個資料夾跟檔案：

* lib - 拿來放 native 程式碼用的，以後會講到
* META-INF - 會有一些簽章相關資訊
* res - 剛剛寫 app 的時候有看到了
* AndroidManifest.xml - 同上 
* classes.dex - 程式碼編譯成 dex 後的結果
* resources.arsc - resource 相關的索引表

先來講一下 `resources.arsc` 是幹嘛的，如果你打開 res 資料夾底下的任一檔案時，你會發現檔案內容不是純文字，而是一堆 16 進位的東西，像這樣：

```
0300 0800 8401 0000 0100 1c00 a800 0000
0700 0000 0000 0000 0001 0000 3800 0000
0000 0000 0000 0000 0f00 0000 1a00 0000
2600 0000 3000 0000 3800 0000 4200 0000
0c0c 696e 7465 7270 6f6c 6174 6f72 0008
0864 7572 6174 696f 6e00 0909 6672 6f6d
416c 7068 6100 0707 746f 416c 7068 6100
0505 616c 7068 6100 0707 616e 6472 6f69
6400 2a2a 6874 7470 3a2f 2f73 6368 656d
```

這是因為這些 xml 已經被編譯過了，需要搭配 `resources.arsc` 才能還原成文字的形式。

而 `classes.dex` 也是經過編譯的東西，需要再進一步反編譯之後才能看到裡面的內容。

從上面這些我們可以知道，雖然可以手動利用解壓縮的方式把 apk 拆開，但其實看不到什麼有用的內容。為了進一步看到其中的內容，我們需要其他工具來做這件事情。

## 利用 Apktool 拆解 apk

剛剛使用的 `unzip` 只是單純將壓縮檔解開，而 [Apktool](https://ibotpeaches.github.io/Apktool/) 的網站上開宗明義就寫了：A tool for reverse engineering Android apk files，表明了它就是拿來拆 apk 用的。

有關於下載跟安裝的細節我就不寫了，可自行參考官網：https://ibotpeaches.github.io/Apktool/ 或者是其他網路上的資源。

接著，我們就來用 Apktool 拆開剛剛的 demoapp：

``` shell
# d 是 decode 的意思
# -f 是 --force，代表如果有 demoapp 的資料夾就先刪掉
apktool d -f demoapp
```

拆開來以後可以看到底下的檔案結構：

``` shell
.
├── AndroidManifest.xml
├── apktool.yml
├── lib
├── original
├── res
└── smali
```

跟我們用壓縮檔解開的差別在於沒有了 `resources.arsc`，也沒有了`classes.dex`，前者是因為已經將資源還原成文字檔，後者則是還原成了 `smali` 資料夾底下的檔案，這個下一篇會提到。

接著我們先來改改看畫面上的文字。

打開 `res/values/strings.xml`，搜尋：`Hello first fragment`，會找到這一段：

``` xml
<string name="hello_first_fragment">Hello first fragment</string>
```

我們直接將內容改掉，改成：

``` xml
<string name="hello_first_fragment">Hacked!</string>
```

接下來只要將 apk 重新打包並裝回去，應該就能看到改過的文字。

## 重新打包 apk

Apktool 除了拿來拆解 apk 以外，也可以將 apk 重新組裝回去，指令如下：

``` shell
apktool b demoapp -o demoapp2.apk
```

如果在打包的時候有出錯，可以改用：

``` shell
apktool b --use-aapt2 demoapp -o demoapp2.apk
```

沒意外的話，就會在資料夾底下看到一個 `demoapp2.apk` 的檔案，但這時如果你直接安裝這個檔案會出錯：

``` shell
adb: failed to install demoapp2.apk: Failure [INSTALL_PARSE_FAILED_NO_CERTIFICATES: Failed to collect certificates from /data/app/vmdl1575742168.tmp/base.apk: Attempt to get length of null array]
```

這是因為 apk 檔打包出來以後還要經過兩道手續：align 跟 sign，才能安裝到手機上面。

align 是為了效能上的考量，而 sign 則是為了安全性。

在 Google Play 後台上傳新的 apk 時，Google 會檢查 apk 簽署時用的簽章是否跟之前一樣，如果不一樣的話會不讓你上傳。如此一來，就算攻擊者拿到受害者的帳號，也沒辦法上傳新的 apk，因為簽章不符。

我們先來產生一個新的簽章：

``` shell
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
```

問你 password 的地方輸入 123456 即可，其他都可以不填，執行完畢以後就會看到一個 `my-release-key.jks` 的檔案。

接著我有寫了一個簡單的 script，自動移除舊版本 + build + align + sign + install：

``` shell
# compile.sh

# 移除舊的 app
adb uninstall com.cymetrics.demo

# 刪除舊的 apk
rm -f demoapp2.apk
rm -f demoapp2-final.apk
rm -f demoapp2-aligned.apk

# build
apktool b --use-aapt2 demoapp -o demoapp2.apk

# align
zipalign -v -p 4 demoapp2.apk demoapp2-aligned.apk

# sign
apksigner sign --ks my-release-key.jks --ks-pass pass:123456 --out demoapp2-final.apk demoapp2-aligned.apk
adb install demoapp2-final.apk
```

跑完 script 以後打開 app，沒意外的話你就會看見字已經被我們改掉了：

![](/img/posts/huli/android-apk-decompile-intro/p6-apk2.png)

沒錯，修改一個單純的 app 就是這麼簡單。

## 總結

在這篇文章中我們學習了一些 Android 開發的基礎，也利用了 Apktool 將 apk 拆開，看見裡面的 resources 檔案，並且將其改造過後重新包回 apk 檔，安裝到手機上，做出了一個修改版的 app。

如果只是要改文字這些資源的話，就是這麼容易，但如果要改程式碼的話就相對麻煩許多。

在下一篇中，我們會來學習如何把 smali 還原成 Java code，以及如何修改 smali 程式碼。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/) - 你在這篇
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)
---
title: Android App 逆向入門之二：修改 smali 程式碼
date: 2022-02-21
tags: [Security, Mobile]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/android-apk-decompile-intro/cover2.png
---

<!-- summary -->
在第一篇當中我們學到了基礎中的基礎，靠著 Apktool 把 apk 拆開，修改資源以後組裝回去，並且把對齊且簽署過的 apk 裝回手機上面。

而接下來的這一篇，我們要來看看如何修改程式碼。
<!-- summary -->

我們的目的是在一台有 root 的手機上繞過檢查，讓 app 顯示沒有 root。如果你是用沒有 root 的手機來測試的話，你可以反過來，將 app 改成會偵測出你有 root。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)

## 什麼是 Smali

在我們利用 `apktool d` 拆開的內容中，有一個資料夾叫做 smali，裡面存放著的就是從 classes.dex 還原出來的東西，也就是程式碼。但這些程式碼跟你想的可能不太一樣，例如說我們可以來看看 `smali/com/cymetrics/demo/MainActivity.smali`：

``` java
.class public Lcom/cymetrics/demo/MainActivity;
.super Landroidx/appcompat/app/AppCompatActivity;
.source "MainActivity.java"


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 16
    invoke-direct {p0}, Landroidx/appcompat/app/AppCompatActivity;-><init>()V

    return-void
.end method


# virtual methods
.method protected onCreate(Landroid/os/Bundle;)V
    .locals 1

    .line 20
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    const p1, 0x7f0b001c

    .line 21
    invoke-virtual {p0, p1}, Lcom/cymetrics/demo/MainActivity;->setContentView(I)V

    const p1, 0x7f080122

    .line 22
    invoke-virtual {p0, p1}, Lcom/cymetrics/demo/MainActivity;->findViewById(I)Landroid/view/View;

    move-result-object p1

    check-cast p1, Landroidx/appcompat/widget/Toolbar;

    .line 23
    invoke-virtual {p0, p1}, Lcom/cymetrics/demo/MainActivity;->setSupportActionBar(Landroidx/appcompat/widget/Toolbar;)V

    const p1, 0x7f08007a

    .line 25
    invoke-virtual {p0, p1}, Lcom/cymetrics/demo/MainActivity;->findViewById(I)Landroid/view/View;

    move-result-object p1

    check-cast p1, Lcom/google/android/material/floatingactionbutton/FloatingActionButton;

    .line 26
    new-instance v0, Lcom/cymetrics/demo/MainActivity$1;

    invoke-direct {v0, p0}, Lcom/cymetrics/demo/MainActivity$1;-><init>(Lcom/cymetrics/demo/MainActivity;)V

    invoke-virtual {p1, v0}, Lcom/google/android/material/floatingactionbutton/FloatingActionButton;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    return-void
.end method

.method public onCreateOptionsMenu(Landroid/view/Menu;)Z
    .locals 2

    .line 38
    invoke-virtual {p0}, Lcom/cymetrics/demo/MainActivity;->getMenuInflater()Landroid/view/MenuInflater;

    move-result-object v0

    const/high16 v1, 0x7f0c0000

    invoke-virtual {v0, v1, p1}, Landroid/view/MenuInflater;->inflate(ILandroid/view/Menu;)V

    const/4 p1, 0x1

    return p1
.end method

.method public onOptionsItemSelected(Landroid/view/MenuItem;)Z
    .locals 2

    .line 47
    invoke-interface {p1}, Landroid/view/MenuItem;->getItemId()I

    move-result v0

    const v1, 0x7f08003f

    if-ne v0, v1, :cond_0

    const/4 p1, 0x1

    return p1

    .line 54
    :cond_0
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onOptionsItemSelected(Landroid/view/MenuItem;)Z

    move-result p1

    return p1
.end method

```

如果你覺得看起來不是很好閱讀，那是正常的。

Smali 是跑在 Android Dalvik VM 上的 byte code，有著自己的一套語法規則，如果想要看到我們熟悉的 Java 程式碼，必須要將 smali 還原成 Java。

## 利用 jadx 還原出 Java 程式碼

接著我們要用到另外一套工具：[jadx](https://github.com/skylot/jadx)，GitHub 上面它對自己的描述是：Dex to Java decompiler。

安裝過程我一樣省略，接著我們用 jadx 把 apk 拆開：

``` shell
# -r 代表不要把 resource 拆開，因為我們只關注程式碼
# -d 代表目的地
jadx -r demoapp.apk -d jadx-demoapp
```

跑完以後就會看到多了一個 jadx-demoapp 的資料夾，我們點進去裡面的 `sources/com/cymetrics/demo/MainActivity.java`，可以看到如下內容：

``` java
package com.cymetrics.demo;

import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.snackbar.Snackbar;
/* loaded from: classes.dex */
public class MainActivity extends AppCompatActivity {
    /* JADX INFO: Access modifiers changed from: protected */
    @Override // androidx.appcompat.app.AppCompatActivity, androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView(R.layout.activity_main);
        setSupportActionBar((Toolbar) findViewById(R.id.toolbar));
        ((FloatingActionButton) findViewById(R.id.fab)).setOnClickListener(new View.OnClickListener() { // from class: com.cymetrics.demo.MainActivity.1
            @Override // android.view.View.OnClickListener
            public void onClick(View view) {
                Snackbar.make(view, "Replace with your own action", 0).setAction("Action", (View.OnClickListener) null).show();
            }
        });
    }

    @Override // android.app.Activity
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override // android.app.Activity
    public boolean onOptionsItemSelected(MenuItem menuItem) {
        if (menuItem.getItemId() == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(menuItem);
    }
}

```

這才是我們想看到的內容嘛！因為這個 apk 沒有經過混淆，所以幾乎可以看到完整的 java 檔案，跟原始碼差不了多少。

簡單講一下混淆（Obfuscation），混淆就是把程式碼打亂，讓人不容易看出來原本的程式碼是什麼，例如說把變數名字都換成 aa, bb, cc, dd 這種沒有意義的名稱之類的，就是最基本的混淆。在 Android 開發中通常透過 ProGuard 這個工具來做混淆。

像上面那樣的程式碼很明顯就沒有混淆過，讓人很容易就能看出原本的邏輯。

這次我們要來改動的程式碼在 `com/cymetrics/demo/FirstFragment.java`：

``` java
package com.cymetrics.demo;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.fragment.app.Fragment;
import com.scottyab.rootbeer.RootBeer;
/* loaded from: classes.dex */
public class FirstFragment extends Fragment {
    @Override // androidx.fragment.app.Fragment
    public View onCreateView(LayoutInflater layoutInflater, ViewGroup viewGroup, Bundle bundle) {
        return layoutInflater.inflate(R.layout.fragment_first, viewGroup, false);
    }

    @Override // androidx.fragment.app.Fragment
    public void onViewCreated(View view, Bundle bundle) {
        super.onViewCreated(view, bundle);
        view.findViewById(R.id.button_first).setOnClickListener(new View.OnClickListener() { // from class: com.cymetrics.demo.FirstFragment.1
            @Override // android.view.View.OnClickListener
            public void onClick(View view2) {
                TextView textView = (TextView) view2.getRootView().findViewById(R.id.textview_first);
                if (new RootBeer(view2.getContext()).isRooted()) {
                    textView.setText("Rooted!");
                } else {
                    textView.setText("Safe, not rooted");
                }
            }
        });
    }
}
```

主要的邏輯是這一段：

``` java
public void onClick(View view2) {
    TextView textView = (TextView) view2.getRootView().findViewById(R.id.textview_first);
    if (new RootBeer(view2.getContext()).isRooted()) {
        textView.setText("Rooted!");
    } else {
        textView.setText("Safe, not rooted");
    }
}
```

這一段會去呼叫一個第三方的 library 檢查是否有 root，有的話就顯示 `Rooted!`，沒有的話就顯示 `Safe, not rooted`。

在研究程式碼邏輯時，我們可以看著 java 程式碼，但如果要改 code 的話，就不是改 java code 這麼簡單了，我們必須要直接去改 smali 的 code，才能把 app 重新打包回去。

## 修改 smali 程式碼

還記得我們用 Apktool 解開的資料夾嗎？smali 程式碼就在那裡面，路徑是：`smali/com/cymetrics/demo/FirstFragment$1.smali`，仔細找一下內容，就可以找到 onClick 的程式碼：

``` java
# virtual methods
.method public onClick(Landroid/view/View;)V
    .locals 2

    .line 32
    invoke-virtual {p1}, Landroid/view/View;->getRootView()Landroid/view/View;

    move-result-object v0

    const v1, 0x7f08011c

    invoke-virtual {v0, v1}, Landroid/view/View;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    .line 34
    new-instance v1, Lcom/scottyab/rootbeer/RootBeer;

    invoke-virtual {p1}, Landroid/view/View;->getContext()Landroid/content/Context;

    move-result-object p1

    invoke-direct {v1, p1}, Lcom/scottyab/rootbeer/RootBeer;-><init>(Landroid/content/Context;)V

    .line 35
    invoke-virtual {v1}, Lcom/scottyab/rootbeer/RootBeer;->isRooted()Z

    move-result p1

    if-eqz p1, :cond_0

    const-string p1, "Rooted!"

    .line 36
    invoke-virtual {v0, p1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    goto :goto_0

    :cond_0
    const-string p1, "Safe, not rooted"

    .line 38
    invoke-virtual {v0, p1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    :goto_0
    return-void
.end method
```

簡單講解一下一些基礎的 smali 語法，`.method public onClick(Landroid/view/View;)V` 就是說有一個 public 的 method 叫做 onClick，接收一個參數類型是 `android/view/View`，括號最後面的 V 則代表 void，沒有回傳值。

`.locals 2` 指的是這個 function 會用到兩個暫存器，也就是 v0 跟 v1，如果你用到 v2 的話就會出錯，因此如果需要更多暫存器，記得要改這邊。

參數的話會用 p 來表示，通常 p0 代表 this，p1 就是第一個參數，因此 `invoke-virtual {p1}, Landroid/view/View;->getRootView()Landroid/view/View;` 就是把第一個參數丟進去呼叫 `getRootView()` 這個 method。

而這整段裡面，核心的程式碼是這一段：

``` java
.line 35
invoke-virtual {v1}, Lcom/scottyab/rootbeer/RootBeer;->isRooted()Z

move-result p1

if-eqz p1, :cond_0

const-string p1, "Rooted!"

.line 36
invoke-virtual {v0, p1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

goto :goto_0

:cond_0
const-string p1, "Safe, not rooted"
```

`if-eqz p1, :cond_0` 指的就是如果 p1 是 0，就跳到 `:cond_0` 的地方，而 p1 是 `RootBeer->isRooted()` 的回傳值。也就是說，p1 代表著 root 檢查的結果，只要能把 p1 改掉，就能偽造不同的結果。

這邊有很多種改法，例如說把原本的 `if-eqz` 改成 `if-nez`，就可以反轉邏輯，或我們可以直接將 p1 硬改成 0，順便加上 log 確認我們有執行到這裡：

``` java
.line 35
invoke-virtual {v1}, Lcom/scottyab/rootbeer/RootBeer;->isRooted()Z

move-result p1

# 加上 log，印出 "we are here"
const-string v1, "we are here"
invoke-static {v1, v1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

# 將 p1 直接硬改成 0
const/4 p1, 0x0

if-eqz p1, :cond_0

const-string p1, "Rooted!"

.line 36
invoke-virtual {v0, p1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

goto :goto_0

:cond_0
const-string p1, "Safe, not rooted"
```

加上那三行以後存檔，接著照著上一篇講的重新打包，安裝在手機上，打開 app 以後先看 log。

要看 Android 的 log 的話，需要用 `adb logcat` 這個指令來看，但如果你直接輸入這個指令，會噴一堆 log 出來，在這邊教大家兩個好用的指令。

第一個是 `adb logcat -c`，可以清掉之前的 log，第二個是：

``` shell
adb logcat --pid=`adb shell pidof -s com.cymetrics.demo`
```

可以看到指定 package name 的 log，排除其他雜訊，這個真的很好用。

準備就緒以後，按下 app 內的 `CHECK ROOT` 按鈕，就會看到一條新的 log：

``` shell
01-25 09:32:06.528 27651 27651 E we are here: we are here
```

以及畫面上出現的 `Safe, not rooted` 的字樣，就大功告成了。

## 更改其他地方的程式碼

剛剛我們改動了 fragment 中的程式碼，也就是程式的邏輯，把 `isRooted()` 的回傳值取代掉，讓它永遠是 false，繞過了檢查。

但如果程式中還有其他地方也會做類似的檢查那就麻煩了，因為我們必須找出每一個做檢查的地方，然後都做類似的事情，把每一處都改掉。

因此，一個比較有效率的方法是直接去改動這個第三方 library 的程式碼，讓 `isRooted` 永遠都回傳 false，這樣就算 app 在多個地方都有檢查，也會一起被繞過。

呼叫 function 時的程式碼是 `Lcom/scottyab/rootbeer/RootBeer;->isRooted()`，因此我們可以順藤摸瓜找到這個檔案：`com/scottyab/rootbeer/RootBeer.smali`，搜尋 `isRooted` 就會找到程式碼：

``` java
.method public isRooted()Z
    .locals 1

    .line 44
    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->detectRootManagementApps()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->detectPotentiallyDangerousApps()Z

    move-result v0

    if-nez v0, :cond_1

    const-string v0, "su"

    invoke-virtual {p0, v0}, Lcom/scottyab/rootbeer/RootBeer;->checkForBinary(Ljava/lang/String;)Z

    move-result v0

    if-nez v0, :cond_1

    .line 45
    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->checkForDangerousProps()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->checkForRWPaths()Z

    move-result v0

    if-nez v0, :cond_1

    .line 46
    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->detectTestKeys()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->checkSuExists()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->checkForRootNative()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Lcom/scottyab/rootbeer/RootBeer;->checkForMagiskBinary()Z

    move-result v0

    if-eqz v0, :cond_0

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    goto :goto_1

    :cond_1
    :goto_0
    const/4 v0, 0x1

    :goto_1
    return v0
.end method
```

想要 patch 這個函式非常簡單，我們讓它永遠都回傳 false 就好：

``` java
.method public isRooted()Z
    .locals 1
    
    # 在開頭新增底下這兩行，永遠回傳 false
    const/4 v0, 0x0
    return v0
    
    # 以下省略...
.end method
```

接著一樣重新打包之後安裝在手機上，就能看到繞過的成果。

## 總結

在這篇裡面我們學到了如何閱讀基本的 smali 程式碼以及修改它，也學到了該如何利用 `adb logcat` 來看 Android app 的 log，並且實際下去修改 smali，反轉原本的邏輯，去繞過 app 對於 root 的檢查。

加上 log 是一個我覺得雖然看起來好像很笨很沒效率，但其實很有用的方法，就跟寫程式出錯的時候我會加一大堆 `console.log` 一樣，透過 log 來確認程式的執行流程跟自己預期中的相符，對於還原邏輯很有幫助。

最後，這篇我只有稍微提了一下 smali，如果想更了解 smali 的語法，可以參考底下文章：

1. [Android逆向基础：Smali语法](https://www.jianshu.com/p/9931a1e77066)
2. [APK反编译之一：基础知识--smali文件阅读](https://blog.csdn.net/chenrunhua/article/details/41250613)

在下一篇文章中，我會介紹如何去監聽 app 向外發送的 request 以及 response，幫助我們了解 app 跟 API server 的溝通。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/) - 你在這篇
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)
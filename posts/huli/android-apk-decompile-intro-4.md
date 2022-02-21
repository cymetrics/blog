---
title: Android App 逆向入門之四：使用 Frida 進行動態分析
date: 2022-02-21
tags: [Security, Mobile]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/android-apk-decompile-intro/cover4.png
---

<!-- summary -->
前面幾篇我們講的都是靜態分析的東西，也就是說我們並沒有把 app 跑起來，只是透過反編譯出來的程式碼研究 app 運作的邏輯，並且修改程式碼後重新打包執行。

而動態分析指的就是我們會把 app 跑起來，並透過一些方式讓我們可以 hook 各種方法，去監視某些 method 的輸入以及輸出，甚至是竄改。

這篇就讓我們來學習該怎麼樣使用 Frida 進行動態分析。
<!-- summary -->

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)

## 工具介紹：Frida

這次要來使用的動態分析工具為 [Frida](https://frida.re/)，官網的介紹為：「Dynamic instrumentation toolkit for developers, reverse-engineers, and security researchers.」，其實不只是 Android，其他平台也都可以使用 Frida 來做動態分析。

有一套叫做 Objection 的工具是以 Frida 為基礎開發的，建議可以直接裝這個，因為會順便連 Frida 一起裝好，安裝教學可參考：https://github.com/sensepost/objection/wiki/Installation

雖然說 Frida 這種東西感覺就是要 root 才能使用，但其實它有兩種方法可以跑，一種確實需要 root，另外一種不需要 root

需要 root 的要在手機上安裝 frida-server，詳情可參考官網：https://frida.re/docs/android/

基本上就是丟個執行檔進去手機，然後用 root 的權限跑起來，檔案推進去要跑起來的時候如果不是預設 root，可以用 adb shell 進去改：

``` shell
adb shell

# 先刪掉舊的
ps -e | grep frida-server
kill -9 {your_process_id}

# 確認用 root 跑
su
/data/local/tmp/frida-server &
```

跑起來之後可以用 `frida-ps -U` 確認是否有跑起來

第二種不需要 root 的方法要改 apk，原理是在 apk 裡面加一個 Frida 的 so 檔，並在入口點加一行 `System.loadLibrary()`，就可以使用 Frida，在 wiki 裡面有詳細說明：https://github.com/sensepost/objection/wiki/Patching-Android-Applications

上面改 apk 的流程不需要自己執行，有現成的指令幫你做，如果打包不起來可以用這個指令：

``` shell
objection patchapk --source test.apk --skip-resources --ignore-nativelibs
```

如果還是不行，可以運用我們之前學到的知識自己動手改造，先用 `apktool d` 把包好的 apk 拆開，然後自己改裡面東西，例如說有時候會有 so 檔案 align 的問題，就可以把 `AndroidManifest.xml` 裡的 `android:extractNativeLibs` 改成 true，再包回去就好了。

## Frida 基本使用

先講一下 Frida 是做什麼的，最普遍的用途是寫一些程式碼來 hook function，hook 指的就是你可以自己覆蓋任何一個 function 的實作，就可以觀察輸入以及輸出，也可以改變函式的回傳值。

而這些程式碼會用 JavaScript 來寫，並在啟動 app 時注入進去，以我自己的經驗來說，其實只要看多一點範例之後，就能滿快上手的。

講這麼多，不如動手來做做看，這次用的範例 app 跟第一篇一樣，就是個按下按鈕以後會檢測是否有 root 的 app：https://github.com/aszx87410/demo/raw/master/android/demoapp.apk

這個 app 開啟之後預設的 activity 會是 `com.cymetrics.demo/MainActivity`，我們先來 hook 這個 class 的 onCreate 方法看看。

我們先新建一個檔案 `script.js`，內容為：

``` js
function run() {
  Java.perform(() => {
    var MainActivity = Java.use('com.cymetrics.demo.MainActivity')
    MainActivity.onCreate.implementation = function() {
      console.log('MainActivity onCreate')
    }
  })
}

setImmediate(run)
```

接著下指令：

``` shell
frida -U --no-pause -l script.js -f "com.cymetrics.demo"
```

如果你沒有 root 的話，啟動方式會不太一樣，先照上面說的 patch app，接著在手機上安裝，然後在 terminal 輸入：

``` shell
frida -U Gadget -l script.js
```

接著你應該會看到你的 terminal 上面多了一行 log，內容就是 `MainActivity onCreate`，而手機上出現 app crash 的訊息，這是正常的。

先來簡單講一下 Frida 腳本的基本結構，起手式就是：

``` js
function run() {
  Java.perform(() => {
    // 程式碼放這邊
  })
}

setImmediate(run)
```

接著就看你想要 hook 什麼樣的方法，以我們剛剛的程式碼來說，先用 `Java.use` 拿到想要 hook 的 class，再用 `MainActivity.onCreate.implementation` 把原本的實作換成我們自己定義的 function。

那為什麼 hook 之後 app 就掛掉了呢？因為我們自己實作的 function 除了 log 以外什麼都沒做，也就是說原本的 onCreate 該做的事情都被拿掉了，所以 crash 也是合情合理，想知道 crash 的根本原因可以 `adb logcat | grep AndroidRuntime` 一下：

``` shell
android.util.SuperNotCalledException: Activity {com.cymetrics.demo/com.cymetrics.demo.MainActivity} did not call through to super.onCreate()
```

那我們應該怎麼做呢？只要記得在最後面呼叫原本的實作即可，這樣寫：

``` js
function run() {
  Java.perform(() => {
    var MainActivity = Java.use('com.cymetrics.demo.MainActivity')
    MainActivity.onCreate.implementation = function() {
      console.log('MainActivity onCreate')
      this.onCreate.call(this)
    }
  })
}

setImmediate(run)
```

`this` 會是原本的 MainActivity，透過 `this.onCreate.call` 可以呼叫到原本的實作，而 call 這個方法第一個要傳入的參數就是 this，後面傳入參數。

執行上面腳本之後，會出現另外一個錯誤：

``` shell
Error: onCreate(): argument types do not match any of:
  .overload('android.os.Bundle')
```

這是因為 onCreate 其實應該是有帶參數的，只是我們覆蓋的時候沒有接收參數，因此就出錯了。為了避免這個問題，我會建議在覆蓋實作的時候在前面加上 `.overload()`，像這樣：

``` js
MainActivity.onCreate.overload().implementation = function() {

}
```

Frida 就會再次出現錯誤訊息提示你正確的參數應該是什麼，就可以照著做，最後會像這樣：

``` js
function run() {
  Java.perform(() => {
    var MainActivity = Java.use('com.cymetrics.demo.MainActivity')
    MainActivity.onCreate.overload('android.os.Bundle').implementation = function(a) {
      console.log('MainActivity onCreate')
      this.onCreate.call(this, a)
    }
  })
}

setImmediate(run)
```

如此一來，就能知道參數是什麼，在呼叫原本的實作時也能帶入參數，就不會出錯了。

既然都可以插入程式碼了，我們可以做一大堆事情，像是直接在 UI 上面顯示一個新的訊息：

``` js
function run() {
  Java.perform(() => {
    var MainActivity = Java.use('com.cymetrics.demo.MainActivity')
    MainActivity.onCreate.overload('android.os.Bundle').implementation = function(a) {
      console.log('MainActivity onCreate')
      // Toast 一定要跑在 main thread(UI thread)
      Java.scheduleOnMainThread(function() {
        var Toast = Java.use("android.widget.Toast");
        var currentApplication = Java.use('android.app.ActivityThread').currentApplication();
        // Toast 的第一個參數需要 context 才能執行
        var context = currentApplication.getApplicationContext();
        Toast.makeText(
          context,
          // 這個參數的型態要正確，直接傳字串會出錯
          Java.use("java.lang.String").$new("Hello!"),
          Toast.LENGTH_SHORT.value
        ).show();
      });
      this.onCreate.call(this, a)
    }
  })
}

setImmediate(run)
```

程式碼來自：[makeToast.js](https://gist.github.com/myzhan/ab13068463cd7f77b7f06ae561ea853a)。

## 使用 Frida 繞過 root 檢測

我們在之前的文章中繞過 root 檢測時，是直接去改 smali 的程式碼，直接把檢測的 function 給 patch 掉，藉此來繞過。有了 Frida 以後，就不需要去改 smali 的程式碼了，可以直接 hook 檢測的 function 並且把實作替換掉即可，像是這樣：

``` js
function run() {
  Java.perform(() => {
    var RootBeer = Java.use('com.scottyab.rootbeer.RootBeer')    
    RootBeer.isRooted.overload().implementation = function(){
        console.log('bypass rootbeer')
        return false
    };
  })
}

setImmediate(run)
```

沒錯，就是這麼容易。

那你可能會問說，我們是怎麼知道要 hook 這個 function 的？這部分還是需要靠靜態分析，從靜態分析中我們得知是這個 function 在做檢測，所以用 Frida 來 hook 這個 function。

我自己的話通常是兩個搭配使用，先反組譯之後靜態分析，稍微看一下程式碼，接著再用 Frida 去 hook，看能不能做到想做的事情，如果可以的話，我會再去改 smali 相對應的地方，然後把 app 重新打包，這樣就可以在沒有 Frida 的手機上也執行我想要的流程。

其實 Frida 的基礎使用就是這樣了，剩下的就是靠著對於程式碼以及 Android 開發的理解，決定要 hook 哪一個 function。

## 其他 Frida 小技巧

底下列幾個我從網路上找到的 Frida 小技巧，都是實務上我有用到的，供大家參考。

### 印出 stack trace

假設某個 app 有檢查機制，會偵測是不是有 root，然後原始碼經過混淆所以比較難追蹤，但是在檢查時會用 Log.d 輸出檢查相關資訊，這時候我們可以 hook Log.d，並且利用 `Log.getStackTraceString` 輸出 stack trace，就能知道是在哪邊呼叫這個 function：
 
``` js
var Log = Java.use("android.util.Log");
var Exception = Java.use("java.lang.Exception");
Log.d.overload("java.lang.String", "java.lang.String").implementation = function (a, b) {
   // 發現輸出 root 偵測資訊的時候
   if (b.indexOf('root') >= 0) {
    // 印出 stack trace 方便追蹤
    console.log(Log.getStackTraceString( Exception.$new()));
   }
   return this.d.overload("java.lang.String", "java.lang.String").call(this, a, b)
};
```

### hook Reflect 相關方法

在 Java 中除了直接呼叫方法以外，也可以透過反射（Reflect）的方式去呼叫，有些混淆的程式會大量運用這種技巧來加強靜態分析的難度，我們可以把每一個動態呼叫的方法都印出來，看看有沒有什麼蛛絲馬跡：

``` js
// hook Class.forName
var JavaClass = Java.use('java.lang.Class');
JavaClass.forName.overload('java.lang.String', 'boolean', 'java.lang.ClassLoader').implementation = function(name, b, c) {
  console.log('Class.forName', name)
  // 還可以印出特定 class 底下所有的方法
  if (name.indexOf('cymetrics') === 0) {
    var TargetClass = Java.use(name);
    var methodsList = TargetClass.class.getDeclaredMethods();
    for (var k=0; k<methodsList.length; k++){
        console.log(methodsList[k].getName());
    }  
  }
  return this.forName.overload('java.lang.String', 'boolean', 'java.lang.ClassLoader').call(this, name, b, c)
}

// hook Method.invoke，知道動態呼叫了哪些方法
var Method = Java.use('java.lang.reflect.Method')
Method.invoke.overload('java.lang.Object', '[Ljava.lang.Object;').implementation = function(a,b){
  console.log('reflect', a, b)
  return this.invoke.call(this,a,b)
}
``` 

### hook 字串操作

有些混淆程式會把程式中寫死的字串全都透過各種步驟打亂，讓人不易搜尋，例如說把字串變成數字然後再還原之類的，而在還原的時候通常都會經過字串操作，這時候我們可以直接去 hook 字串操作，並搭配前面提過的 stack trace 去追蹤：

``` js
['java.lang.StringBuilder', 'java.lang.StringBuffer'].forEach(function(clazz, i) {
  Java.use(clazz)['toString'].implementation = function() {
    var ret = this.toString();
    console.log('ret:', ret)
    return ret;
  }   
}); 
```

### hook 加解密相關操作

通常在 Android App 裡面要進行加解密的話，都會透過內建的 API 來進行，像是這樣（來源：[Android中的AES加密--上](https://cloud.tencent.com/developer/article/1647740)）：

``` java
public static final String CODE_TYPE = "UTF-8";
public static final String AES_TYPE = "AES/ECB/PKCS5Padding";
private static final String AES_KEY="1111222233334444";

public static String encrypt(String cleartext) {
    try {
        SecretKeySpec key = new SecretKeySpec(AES_KEY.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance(AES_TYPE);
        cipher.init(Cipher.ENCRYPT_MODE, key); 
        byte[] encryptedData = cipher.doFinal(cleartext.getBytes(CODE_TYPE));
        return Base64.encodeToString(encryptedData,Base64.DEFAULT);
    } catch (Exception e) {
        e.printStackTrace();
        return "";
    }
}
```

所以只要能 hook 像是 `SecretKeySpec` 或是 `doFinal` 這些方法，就能夠攔截到 key 跟加密前的明文。

這篇文章值得一看：[How Secure is your Android Keystore Authentication ?](https://labs.f-secure.com/blog/how-secure-is-your-android-keystore-authentication/)，裡面有附了一堆加解密相關的 Frida 腳本，在這裡：https://github.com/FSecureLABS/android-keystore-audit/blob/master/frida-scripts/tracer-cipher.js

話說腳本裡面沒有直接把 byte array 轉成字串，這邊提供一個比較方便的方式（來源：[frida小技巧之string与byte转化](https://lingwu111.github.io/frida%E5%B0%8F%E6%8A%80%E5%B7%A7%E4%B9%8Bstring%E4%B8%8Ebyte%E8%BD%AC%E5%8C%96.html)）：

``` js
function bytesToString(bytes) {
    var javaString = Java.use('java.lang.String');
    return javaString.$new(bytes);
}

var Base64 = Java.use('android.util.Base64')
Base64.decode.overload('[B', 'int').implementation = function(a, b) {
  console.log(bytesToString(a))
  return this.decode.call(this, a, b)
}
```

## 偵測 Frida

既然 Frida 這麼強大，那有些 app 的安全機制自然而然想把它擋下來，一旦偵測到 Frida 的蹤跡，就直接退出 app 或是製造當機，可以參考底下這兩篇：

1. [Android逆向 多种特征检测 Frida](https://www.jianshu.com/p/f679cb404524)
2. [多种特征检测 Frida](https://blog.csdn.net/zhangmiaoping23/article/details/109697329)

而反偵測的方式有很多種，其中一種就是去 hook 上面文章提到的各種方法，畢竟我們有 root 權限又有 Frida hook 在前，所以只要我們知道是怎麼判斷的，就一定可以把檢查拿掉。如果找不出檢查的地方，可以利用上面提到的各種 hook 抽絲剝繭，慢慢找出來。

## 結語

在這篇裡面我們介紹了 Frida 的基本使用，學習如何使用 Frida 來 hook 各種方法，藉此來得到各種我們想要的資訊。

而前四篇我們涵蓋了一些基本的東西，包括：

1. 基本的 Android App 組成
2. 如何用 Apktool 把 apk 拆開並裝回去
3. 如何用 jadx 把 smali 還原成 java 檔
4. 熟悉一點點 smali 的語法，知道如何改 code 以及加 code
5. 如何透過電腦上的 proxy 攔截封包
6. 如何改造 apk，讓 proxy 能夠順利攔截
7. 如何使用 Frida 來 hook function
8. 各種 Frida 的小技巧

再往後走的話，就要進入 native 的領域了。

除了使用 Java 撰寫 Android App 以外，也可以使用 [Android NDK](https://developer.android.com/ndk)，就可以用 C/C++ 撰寫程式碼，提供給 Android app 使用。

什麼情況會需要用到呢？第一是比較耗效能的地方，例如說圖片辨識之類的，用 C++ 來寫會比 Java 來得快，所以通常會用 native 來做，第二則是一些比較隱密的操作，例如說加解密，如果放在 Java 層，很容易就能反編譯並且看出在做什麼，用 native 來寫的話會需要更多 binary 相關知識才能破解。

除此之外，現實世界中的 app 並不像我們前面示範的 app 這麼簡單，可能經過加殼或是更強程度的混淆，就算 apk 拆得開，只要殼拆不掉，就看不到真正的邏輯。有些殼也具有反竄改跟反動態分析的機制，能夠把功力不足的攻擊者們阻擋在外，相關的介紹可以參考 [2019 台灣資安週](http://confapi.ithome.com.tw/session/4186)的議程：[打造⼀一個安全與便利性兼具的 App 安全防護產品](https://s.itho.me/cybersec/2019/slides/321/I_%E4%B8%96%E8%B2%BF%E4%B8%89/0321I51610%E7%8E%8B%E7%BE%BF%E5%BB%B7.pdf)

這個系列之所以叫做「入門」，就是因為完全沒有提到這些實戰上會接觸的東西，只專注於入門的基礎跟工具；話雖如此，對於沒有特殊混淆或是加殼的 app，這樣應該就足夠了。

參考資料：

1. [《FRIDA操作手册》](https://github.com/hookmaster/frida-all-in-one)
2. [翻译——N种脱壳安卓恶意软件的方式](https://www.giantbranch.cn/2019/10/25/%E7%BF%BB%E8%AF%91%E2%80%94%E2%80%94N%E7%A7%8D%E8%84%B1%E5%A3%B3%E5%AE%89%E5%8D%93%E6%81%B6%E6%84%8F%E8%BD%AF%E4%BB%B6%E7%9A%84%E6%96%B9%E5%BC%8F/)
3. [frida hook java](https://kevinspider.github.io/fridahookjava/)
4. [这恐怕是学习Frida最详细的笔记了](https://juejin.cn/post/6847902219757420552#heading-39)
5. [frida-snippets](https://github.com/iddoeldor/frida-snippets#class-description)
6. [Frida Tutorial](https://book.hacktricks.xyz/mobile-apps-pentesting/android-app-pentesting/frida-tutorial)
7. [实用FRIDA进阶：内存漫游、hook anywhere、抓包](https://www.anquanke.com/post/id/197657)

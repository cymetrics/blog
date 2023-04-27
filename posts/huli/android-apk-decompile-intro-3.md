---
title: Android App 逆向入門之三：監聽 app 封包
date: 2022-02-21
tags: [Security, Mobile]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/android-apk-decompile-intro/cover3.png
canonical: https://blog.huli.tw/2023/04/27/android-apk-decompile-intro-3/
---

<!-- summary -->
<!-- 監聽 App 的 request 是個很常見的需求，無論是 Android 工程師或者是前端工程師，都有可能會因為要 debug，所以必須看見 App 到底發了哪些 request，這篇就讓我們來看看該怎麼做。 -->
<!-- summary -->

我記得在我剛接觸 Android 沒多久的時候，要看 app 到底發了哪些 request 是很簡單的一件事情。只要在電腦上面裝個 [Charles](https://www.charlesproxy.com/)，接著設定手機上的 Wifi，讓它 proxy 到電腦上，然後輸入特定網址下載 Charles 提供的憑證，安裝完成以後就搞定了。

但前陣子用了一樣的流程，雖然有聽到一些封包，但從 app 出來的流量卻是空的，上網找了各式各樣的解法之後都行不通。

最後我才知道，原來是 Android 在 6.0 以上改變了安全性的設定，預設就不相信使用者自行安裝的憑證，所以才會攔截不到。有種做法是裝個 local VPN，這樣流量就會全部都過 proxy，但我試過以後發現還是有點麻煩。

在眾多方法之中，我試過最有用的方法，就是把 apk 拆開，改一些設定之後再裝回去，這篇就來記錄一下流程跟心得。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/)
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)

## 前置作業

前置作業一共有兩項：

1. 準備 proxy
2. 設置手機

Proxy 的部分其實任選一套都可以，我是用常見的 [Burp Suite](https://portswigger.net/burp)，其他軟體的設置應該也都大同小異。

首先，先到 Proxy -> Options 裡面新增 Proxy Listeners，bind to address 的部分記得選 all interfaces，手機才連的到：

![](/img/posts/huli/android-apk-decompile-intro/p7-proxy.png)

電腦的 proxy 就這樣設置完成了，接著我們來設定手機。

在開始設定以前，記得要先讓手機跟電腦連到同一個 wifi，才會在同樣的網路底下。再來，在電腦上看一下自己的內網 IP 是多少，前往手機裡的設定 => 連線 => Wi-Fi，接著編輯連到的網路，設置手動 proxy，讓手機的流量 proxy 到電腦去。

然後我們要在手機上安裝 Burp Suite 的憑證，手機上直接造訪 `http://burpsuite` 即可，會下載一個檔案叫做 `cert.der`，記得改名成 `cert.cer` 後點開就可以安裝憑證。

到這邊為止，手機上的準備就完成了。

## 改造 apk

這次拿來示範的 apk 在這裡：https://github.com/aszx87410/demo/raw/master/android/demoapp-http.apk

App 的內容很簡單，就是按下按鈕以後會發 request，只要有監聽到就代表成功了。裝上 app 之後可以先試試看，你應該會發現儘管上面那些都設定好了，proxy 還是一片空白。

原因就如同我開頭講的一樣，在 Android 官方文件裡有一個章節就在講這個：[Network security configuration](https://developer.android.com/training/articles/security-config)

而改造方法也很簡單，基本上不需要動到程式碼，因此我們先用 Apktool 把 apk 解開。

接著打開 AndroidManifest.xml，找到 `<application>` 的地方，看一下有沒有 `android:networkSecurityConfig` 這個屬性，沒有的話就加上去：`android:networkSecurityConfig="@xml/network_security_config"`，有的話就記住 xml 的名稱。

再來我們去 res/xml 底下，新增 `network_security_config.xml`，內容為：

``` xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
```

這個檔案內容代表這個 app 信任所有憑證，包括使用者自行安裝的憑證也是。如果 app 裡面本來就有這個檔案，你可以把內容取代成上面的，確保 app 有信任使用者的憑證。

接著把 apk 打包裝回去，再按下按鈕看看，應該就能從 proxy 看到攔截到的流量：

![](/img/posts/huli/android-apk-decompile-intro/p8-success.png)

## Certificate pinning

如果上面的動作做完以後，proxy 還是監聽不到，那就代表 app 裡面可能有其他安全性的設置，例如說 certificate pinning。

什麼是 certificate pinning 呢？如果網頁有用 https，就代表伺服器有一個 https 的憑證，而 certificate pinning 就代表 app 裡有指定某個 domain 對應到的憑證應該要是什麼，如果憑證不符，就代表有人在中間搞事，所以拒絕連線。

以熱門的 library OkHttp 為例，[文件](https://square.github.io/okhttp/4.x/okhttp/okhttp3/-certificate-pinner/)上就有寫說應該怎麼實作這個功能：

``` java
String hostname = "publicobject.com";
CertificatePinner certificatePinner = new CertificatePinner.Builder()
    .add(hostname, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build();
OkHttpClient client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build();

Request request = new Request.Builder()
    .url("https://" + hostname)
    .build();
client.newCall(request).execute();
```

如果想實作看看的話，可以拿這個 apk 檔來嘗試：https://github.com/aszx87410/demo/raw/master/android/demoapp-pinning.apk

我們一樣用 apktool 解開，接著先照之前那樣，把 network security config 給放進去，再來就是要找到程式碼哪裡有用到 certificate pinner 了。

因為這次的程式碼有開啟 proguard，所以連 okhttp 也被混淆了，直接用 `certificatePinner` 做關鍵字下去搜尋不一定找得到東西。那怎麼辦呢？我們可以換個方式，在使用這個功能的時候，一定要寫一組 sha256 的值在裡面，所以我們可以搜尋：`sha256/`

可以找到這樣一個段落：

``` java
# virtual methods
.method public run()V
    .locals 13

    .line 1
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    const-string v1, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

    .line 2
    filled-new-array {v1}, [Ljava/lang/String;

    move-result-object v1

    const-string v2, "archive.org"

    const-string v3, "pattern"

    .line 3
    invoke-static {v2, v3}, Lc/j/b/d;->d(Ljava/lang/Object;Ljava/lang/String;)V

    const-string v3, "pins"

    invoke-static {v1, v3}, Lc/j/b/d;->d(Ljava/lang/Object;Ljava/lang/String;)V

    const/4 v3, 0x0

    const/4 v4, 0x0
```

找到之後該做什麼呢？難道要去改 smali，把 certificate pinner 拿掉嗎？其實有更簡單的做法。

從程式碼中可以猜得出來底下那個 `archive.org` 應該就是綁定的網域，因此只要把這個網域隨便改成其他字串即可，如此一來其他的網域就不會檢查憑證是否相符。

改完以後重新打包 app 並安裝，就能正常監聽到流量。

像上面這樣是去改變使用 certificatePinner 的地方，還有另一個方式是直接去改變 okhttp 的實作，找到 smali 中的 `okhttp3/CertificatePinner$Builder.smali`，有一個 function 是：

``` java
# virtual methods
.method public varargs add(Ljava/lang/String;[Ljava/lang/String;)Lokhttp3/CertificatePinner$Builder;
    .locals 5
```

這個就是 okhttp 在處理新增 certificate pinner 時的方法，我們只要這樣改就好了：

``` java
# virtual methods
.method public varargs add(Ljava/lang/String;[Ljava/lang/String;)Lokhttp3/CertificatePinner$Builder;
    .locals 5

    # patch
    const-string p1, "abc"
```

這樣第一個參數（domain）就永遠是 abc，永遠不會生效。

## 總結

這篇文章中我們學習到了如何自己動手改造 app，拿掉一些防中間人攻擊的機制，例如說改掉 network security config 以及程式碼中處理 certificate pinning 的部分。

對於一般的 app 來說，做到這邊應該就滿夠的了，至少能夠監聽流量，看見 app 到底發送了些什麼。而且跟 VPN 的解法相比，還有另外一個好處，那就是可以二次打包，包出一個把 API 網址換掉也能動的版本，自由度比較高。

在下一篇裡面，我們會學習另外一種分析 app 的方式。

系列文連結：

1. [Android App 逆向入門之一：拆開與重組 apk](/posts/huli/android-apk-decompile-intro-1/)
2. [Android App 逆向入門之二：修改 smali 程式碼](/posts/huli/android-apk-decompile-intro-2/)
3. [Android App 逆向入門之三：監聽 app 封包](/posts/huli/android-apk-decompile-intro-3/) - 你在這篇
4. [Android App 逆向入門之四：使用 Frida 進行動態分析](/posts/huli/android-apk-decompile-intro-4/)


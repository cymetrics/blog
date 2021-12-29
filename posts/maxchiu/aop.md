---
title: 來談談 AOP (Aspect-Oriented Programming) 的精神與各種主流實現模式的差異
date: 2021-05-27
author: maxchiu
description: 這篇文章將從 AOP 的核心思想談到目前主流實現 AOP 的不同策略並比較他們的差異，適合了解 Java 語言或者有稍微玩過 AOP 但是不清楚其原理的人閱讀。
layout: zh-tw/layouts/post.njk
tags: [Back-end]
image: /img/TheSpiritAndImplementationOfAOP/0____Bm36Dv5mm97e2vF.jpg
---

這篇文章將從 AOP 的核心思想談到目前主流實現 AOP 的不同策略並比較他們的差異，適合了解 Java 語言或者有稍微玩過 AOP 但是不清楚其原理的人閱讀。

隨著軟體專案規模的擴大，程式碼的維護基本上已經變成了一個世紀難題，學界和業界一直以來都持續許多降低程式碼維護難度的方案。 [AOP ( Aspected-Oriented Programming )](https://en.wikipedia.org/wiki/Aspect-oriented_programming) 作為一個在上世紀末就被提出的編程典範，這數十年來也經歷了許多的轉變。

<!-- summary -->
這篇文章會先討論 AOP 的行為本質，並剖析 Java 語言中 AOP 實現的幾種模式，並且比較彼此之間的行為。
<!-- summary -->

#### AOP 的本質 — 改變程式碼的流程

以 Web Server 開發場景為例，我們經常會需要在很多 end-point API 的方法執行前先執行權限驗證，或者是在這些 end-point 執行 transaction 失敗時可以 rollback。

這些在程式碼中會重複出現，它們是重要但是不屬於我們核心業務的操作，如果要重複複製貼上到專案中的各處會造成難以維護的窘境。因此 AOP 試圖讓這些常被複用的邏輯獨立出來，用特殊的機制包裝起來，讓我們的業務邏輯不需要去看到任何相關的程式碼。

![](/img/posts/max/TheSpiritAndImplementationOfAOP/0____Bm36Dv5mm97e2vF.jpg)

這件事本質上聽起來跟呼叫函式沒有太大的區別，然而 AOP 本質上是屬於一種 [Meta Programming](https://en.wikipedia.org/wiki/Metaprogramming) 。具體來說，實現 AOP 的工具處理的是程式碼本身（或 bytecode本身） 或是 class (或 object ) 的資訊，是用來改變程式碼的流程或織入（ weaving ) 新的程式碼，而非只是單純地「執行一段程式」。

AOP 只是種指導編程模式的原則而已，在不同的語言和生態系中，類似的概念都有不同的實作方式，然而共通點都是藉由改變程式碼的流程讓核心邏輯不會受到額外的切面邏輯的影響。

在靜態語言中，程式的流程在編譯時期就會被寫死了，要穿插切面在程式碼各處會需要有額外的工具來支持。而在動態語言中，因為程式的流程並不是在編譯時期就被決定了，而是可以動態更改的，所以通常原生語法就支持了 AOP 功能。

以 Python 為例，Python內建的 decorator 修飾詞可以將被切入 （ advised ) 的函式直接傳入別的函式，並且藉由回傳另一個已經被修飾完成的函式物件來實現 AOP （ 至於這究竟是不是一種 [Decorator Pattern](https://en.wikipedia.org/wiki/Decorator_pattern) 的實現，可以參 考 \[2\] 的討論）

```python
def decorator(func):
    def wrapper():
        # 執行前的關注切面, 
        func()
        # 執行後的關注切面
    return wrapper

@decorator
def decorated():
    # 核心業務邏輯
```

而在 Javascript 來說， ES7 之後也開始支援跟 Python 類似語法的 decorator。

```js
function decorator() {
  return function(target) {
    // 執行前的關注切面
    target();
    // 執行後的關注切面
  }
}

@decorator
function decorated() {
  // do something
}
```

同時，如果用過 React 的話，可能會對 HOC ( Higher Order Component) 有印象， 以我自己的角度來看，HOC 在本質上其實很接近 AOP。

```js
const withExtraProps = Component => ({ ...props }) => (
    <Component {...props} extraProps="Hello~" />
  );
const ComponentWithExtraProps = withExtraProps(Component);
const instance = <CComponentWithExtraProps defaultProp="test" />;
```

接著讓我們來看看靜態語言實現 AOP 有哪些不同的手段。 大體可以分為 “ Run-time AOP ” 跟 “ Compile-time AOP ” 。文章以下的部分將介紹 Java 生態系中不同的 AOP 實現取徑。

#### Compile-Time AOP — AspectJ 中的策略

[AspectJ](http://eclipse.org/aspectj/) 是由 Eclipse Foundation 所維護的，Java生態系中最泛用的 AOP 工具。我會先簡述 AspectJ 的運作概念，接著在後面給出實作和反組譯的實際範例。

簡單說明 AspectJ 的使用情境會是這樣：我們有一個物件類別定義要被複用的切面邏輯（ e.g. AuthorizeAspect ），另一個物件類別執行業務邏輯。這兩個類別彼此在 source code 中是沒有直接的關連的（只有 meta information，例如 @ annotation 標註其為切入點或切入函式 ) ，但在程式碼執行前我們可以用 AspectJ 套件自動生成將兩者關聯起來的 bytecode ，並且在正確的位置插入這些 bytecode 。

![](/img/posts/max/TheSpiritAndImplementationOfAOP/1__1o3LETcmZrvDa__1I__h9roQ.png)

AspectJ 實現 AOP 的方式主要是所謂的 Compile-time AOP。在建置時使用 AspectJ 的插件 ( e.g. aspectj-maven-plugin )，或是在執行前讓 JavaAgent呼叫 AspectJWeaver 將 aspects 織入到 classfile。  
並且在執行期用 aspectJ 的 Runtime library ( e.g. aspectjrt ) 作為 Trampoline 來將程式的 Control flow 在正確的時間點跳轉給對應的 Advice。

AspectJ 可以指名在不同的時間點執行 aspects 的織入。

*   Compile Time Weaving  
    在編譯時就把 aspects 跟你的原始碼一起從用專屬的編譯器 (ajc) 直接編譯成包含了 aspects 的 classfile。這個操作可以是 java -> class (有源碼的情況) 或是 class -> class ( 織入第三方jar檔的狀況 )  
    這麼做的好處很明顯，就是只要 ajc 編譯好了，之後 run 的時候都不會有額外的 weaving overhead。但壞處就是如果要關閉或開啟某些 aspect，就必須整包重新 compile。

![](/img/posts/max/TheSpiritAndImplementationOfAOP/0__O0jiGBeR8PEv__63Z.jpg)

*   Load-Time Weaving  
    相對地，load-time weaving 藉由定義額外的 aspect config file (下圖中的 aop.xml) ，把 weaving的操作推遲到 JVM 的 classloader load classfile 時才把對應的 aspect 織入。 這樣的操作優勢也很明顯，就是不需要每次調整 aspect 的 config 時都需要整個專案重新 compile 。

如果對於 Compile-Time Weaving 跟 Load-Time Weaving 的執行效率差異有興趣的話，\[4\] 是個 benchmark 可以參考。

![](/img/posts/max/TheSpiritAndImplementationOfAOP/0__RMHhvccYDP2ziXr3.jpg)

讓我們用程式碼看看 AspectJ 具體的行為。考慮以下的 dummy 函式，我們定義了一個 Authorize Aspect ，希望在執行 dummy 函式之前以及之後，都能夠執行 Authorize 相關的邏輯，因此聲明了 before 和 after 的切入點。

```java
@Authorize
public User createNewUser(String id, String email) throws InValidEmailException {
    System.out.println("some task");
    return new User(id,email);
}
```
  
```java
@Aspect
public class AuthorizeAspect {
    @Pointcut("execution(@com.example.annotation.Authorize  * *..*.*(..))")
    public void pointCut() {

    }
    @Before("pointCut()")
    public void before(JoinPoint joinPoint) throws UnAuthorizeException {
        System.out.println("dummy");
    }

    @After("pointCut()")
    public void after(JoinPoint joinPoint) throws UnAuthorizeException {
        System.out.println("dummy");
    }
}
```

為了更好地瞭解 Compiler-Time AOP的行為，我用 AspectJ 的 AJC Compiler (這邊用的是 Compile time weaving ) 織入切面，編譯完 classfile 之後再用 [javap](https://docs.oracle.com/javase/7/docs/technotes/tools/windows/javap.html) 反編譯回源碼之後如下。  
可以看到 ajc 實作 AOP 的方式就是先幫標記的 Aspect 類別建立 aspectOf() 函式取得 Aspect 類別的 Singleton ，

```java
public static AuthorizeAspect aspectOf() {
        if (ajc$perSingletonInstance == null) {
            throw new NoAspectBoundException("com.example.application.aspect.AuthorizeAspect", ajc$initFailureCause);
        } else {
            return ajc$perSingletonInstance;
        }
}
```

接著在標注對應 annotation 的函式中符合切面條件的位置之前或之後插入跳轉點並傳入織入點的相關訊息(類名、方法名、參數等）

```java
@Authorize
public User createNewUser(String id, String email) throws InValidEmailException {
    // 用 Java reflection機制獲得 JoinPoint 的 Package, class, method name 等訊息，創造 JointPoint實例
    JoinPoint var3 = Factory.makeJP(ajc$tjp_1, this, this, id, email);

    User var7;
    try {
        // 執行 Authorize 的 before aspect，並傳入 JointPoint 提供此函數的資訊與參數
        AuthorizeAspect.aspectOf().before(var3);
        System.out.println("some task");
        var7 = new User(id, email);
    } catch (Throwable var8) {
        // 若出現異常 依然執行 after aspect並拋出異常
        AuthorizeAspect.aspectOf().after(var3);
        throw var8;
    }
    // 執行 Authorize 的 after aspect
    AuthorizeAspect.aspectOf().after(var3);
    return var7;
}
```

從以上範例應該不難看出 Compile-Time AOP 的核心運作邏輯，也就是在 classfile 中根據某些 meta information (e.g. annotation) 生成對應的 aspect 函式，並且在合格的切入點處插入跳轉點的函式。

基本上 Compile-Time AOP 最明顯的好處就是在於延遲低，執行期不需要知道任何 meta information，也不需要用到 [reflection](https://www.oracle.com/technical-resources/articles/java/javareflection.html) 機制，被織入的 code 看起來就像是原生的 code 一樣，只是幫你省掉了自己重複撰寫的麻煩。

#### Run-Time AOP — Spring AOP 中的策略

相較於 Compile-Time AOP 中主要是藉由「織入」來完成 AOP， Run-Time AOP 希望能讓一切的相關操作都發生在執行期 (就像動態語言中的 AOP 實現那樣)。目前最主流的做法是所謂的 “Proxy-based AOP” ，以 Java 為例，便是運用 reflection API 中的 Proxy 函式庫。 再具體地細分，還可以分成靜態代理與動態代理兩種模式。

*   靜態代理 ( Static-Proxy)  
    一句話概括說明靜態代理就是：用一個 Aspect Proxy 實現 “ Decorator Pattern ” 。所有需要被 Aspect 切入的函式都必須以介面的形式定義。 AspectProxy 類別則也需要實作此介面，把要被切入的介面的實例保存起來( target )。在呼叫 target 的介面方法時， 讓 proxy 先(或之後)去執行切面方法。

```java
package com.proxy;

public class IFetchData {
    public Object fetch();
}
```
  
```java
package com.proxy;


public class FetchData implements IFetchData{
    @Override
    public Object fetch() {
        System.out.println("取得資料");
    }
}
```
   
```java
package com.proxy;

public class AuthorizeProxy implements IFetchData{
  
    private IFetchData target;
    public AuthorizeProxy(IFetchData target) {
        this.target = target;
    }
    
    @Override
    public void () {
        System.out.println("執行before Aspect");
        target.fetch();
        System.out.println("執行after Aspect");
    }
}
```

相信大家應該不難看出來，用靜態代理實現 AOP 非常之麻煩，有任何可能會需要被代理的地方都必須宣告成介面，同時 Aspect Proxy 也必須針對所有可能需要被代理的介面都撰寫重複的切面邏輯。在實務上這麼做其實不太實際。

*   動態代理 ( Dynamic Proxy )  
    另一種 Run-Time AOP ，同時也是 包含 Spring AOP 等套件所使用的主流方式是動態代理。這種作法的基礎是來自於 Java 原生包含的 reflection API。 reflection API 是一套可以向 JVM 詢問、修改 class 和其方法與屬性的機制。  
    至於為什麼用 reflection 我們就可以實現 AOP，先讓我們參考以下這個範例：

```java
package com.example.dynamicproxy

import java.lang.reflect.*; 

public class AuthorizeProxy implements InvocationHandler { 
    private Object delegate;
    private AuthorizeService authorizeService;
    public Object bind(Object target) { 
        this.target = target; 
        // 向 reflection.Proxy 註冊 target 的類別並提供 Handler（此例中為this)，並回傳 proxy 實例， 
        // proxy 藉由 reflection API，可以構造出一個跟 target 具有一樣 method 和 field 的全新類別
        return Proxy.newProxyInstance( 
                           target.getClass().getClassLoader(), 
                           target.getClass().getInterfaces(), 
                           this); 
    } 
    @Override
    public Object invoke(Object proxy, Method method, 
                         Object[] args) throws UnAuthorizedException { 
        // Aspect 真正的邏輯就在這邊執行
        authorizeService.Authorize(args);
        result = method.invoke(tagret, args);
        System.out.println("如果要做什麼 clean up 可以在這邊做;
        return result; 
    } 
 
}
```

我們可以藉由一個 bind 函式，向 reflection.Proxy 註冊 target 的類別並提供 Handler（此例中為this)，並回傳 proxy 實例。

Proxy 藉由 reflection API，可以建構出一個跟 target 具有一樣 method 和 field 的全新類別，但因為我們實現了 InovocationHandler 介面，因此 proxy 在建構這個幾乎一樣的類別時，會在 target 的方法被呼叫時改成呼叫 invoke 方法\[5\]，因此如果要實現 AOP ，我們就只要修改 invoke 函式加上需要的 aspects 就行了。

需要注意的是，我們使用了基於 reflection API 動態創造出來的 class ，除了 會有 JVM 中 class loader 的 overhead 以外，這個 class 的 method 被呼叫時都會需要通過許多額外的檢查，讓許多 JVM 的執行期優化策略失效\[6\]，所以本質上這種作法在速度上會有明顯的劣勢。

```java
package com.example.dynamicproxy;

public class DataFetcherDemo {
    public static Object DemoFetchData {
        AuthorizeProxy proxy  = new AuthorizeProxy(); 
        
        IFetchData fetchData = 
                (IFetchData) proxy.bind(new FetchData());
        
        return fetchData.fetch();
    }
}
```

這種「動態代理」的方式正是 Spring 框架中的 Spring AOP 所使用的策略。根據 Spring AOP 的[官方 document](https://docs.spring.io/spring-framework/docs/2.5.x/reference/aop.html) ，在使用方面幾乎是跟 AspectJ 大同小異，卻可以省去建置專案時需要額外的插件來織入 aspects 的麻煩。

但因為 Proxy 的管理是由 Spring 容器來執行，所以限制自然就是只有被 Spring 管理的 beans 可以被代理。

基於動態代理來做 AOP 的話，務必要搞清楚 Proxy 的行為。在同一個類別中呼叫類別內其他函式的話，是沒有辦法被 Proxy 攔截的。考慮一個我們將 FooBoo 類別用 FooBooProxy 進行代理並呼叫其中的 boo 函式的狀況：

![](/img/posts/max/TheSpiritAndImplementationOfAOP/1__LCqsIhQ__1KGPazjA85zDZQ.png)

另外值得一提的一點是， Java 中實現動態代理除了使用原生的 Proxy 以外，亦可以使用如 [cglib](https://github.com/cglib/cglib) 等 bytecode generation 函式庫，可以做到讓 Proxy 繼承 target 類別就能完成動態代理，而不需要讓所有需要 AOP 的類別都實作特定介面 \[7\] 。

#### 結語

AOP 切分關注點的核心思想在不同生態系中都有不同的實現方式。

如果是在 Java 這種有眾多 AOP 不同實現的工具存在的語言，也要注意就算使用方式看起來幾乎一模一樣（看看 AspectJ 和 Spring AOP 的語法那驚人的相似度），背後執行的原理導致的適用情境、執行效率等等的差別所帶來的影響。

![](/img/posts/max/TheSpiritAndImplementationOfAOP/1__FzyYBeQHVhaDG7Ln9Fif__A.png)

— — -

最後稍微介紹一下敝團隊。我們是隸屬於 OneDegree 集團底下的 Cymetrics 部門，此部門主要負責集團中資安產品的開發，團隊文化鼓勵工程師鑽研和分享技術原理。

目前團隊有經營一個技術 Blog [https://medium.com/cymetrics](https://medium.com/cymetrics)   
用來分享團隊成員們在工作中遇到或者自己想鑽研的主題。

#### References:

\[1\][https://www.slideshare.net/koneru9999/aspect-oriented-programing-introduction](https://www.slideshare.net/koneru9999/aspect-oriented-programing-introduction)  
\[2\][https://stackoverflow.com/questions/8328824/what-is-the-difference-between-python-decorators-and-the-decorator-pattern](https://stackoverflow.com/questions/8328824/what-is-the-difference-between-python-decorators-and-the-decorator-pattern)  
\[3\][https://livebook.manning.com/book/aspectj-in-action-second-edition/chapter-8/26](https://livebook.manning.com/book/aspectj-in-action-second-edition/chapter-8/26)  
\[4\][https://www.nurkiewicz.com/2009/10/yesterday-i-had-pleasure-to-participate.html](https://www.nurkiewicz.com/2009/10/yesterday-i-had-pleasure-to-participate.html)  
\[5\][https://www.itread01.com/content/1547764384.html](https://www.itread01.com/content/1547764384.html)  
\[6\][https://mattwarren.org/2016/12/14/Why-is-Reflection-slow/](https://mattwarren.org/2016/12/14/Why-is-Reflection-slow/)  
\[7\][https://www.cnblogs.com/carpenterlee/p/8241042.html](https://www.cnblogs.com/carpenterlee/p/8241042.html)
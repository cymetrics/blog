---
title: 資安也要自動化 Selenium 
date: 2021-12-28
tags: [Security, Selenium, Selenium IDE, Selenium WebDriver, Selenium Grid]
author: nick
layout: layouts/post.njk
image: /img/posts/cymetrics/selenium/se_1.jpg
---


## 前言

很多人都買過福袋，試想今天買了一個很貴的福袋，拿起來又大又重感覺很充實，但辛苦的搬回家後卻發現裡面只有一支筆是你想要的，其他都是用不到丟掉卻可惜的東西，真的令人很崩潰。

當你想做特定的安全性測試，又不想只為了單一測項花大錢買整套的弱掃工具時，一個好入門又方便客製化的開源工具能給你很大的幫助，就像根據自己的手打造一支專屬的筆，多花點時間但順手，還比福袋省錢。

本文的目的就是簡單介紹一下 Selenium，在舉幾個有關網站安全測試的例子，最後分享一下使用心得。

___

## Selenium 簡介

Selenium 能模擬一般消費者瀏覽網頁的行為並藉此進行自動化測試，雖然它是自動化測試工具但更多人拿來做動態網頁爬蟲，因為在動態網頁抓資料時必須要模擬一些操作行為，而這正好是 Selenium 的強項。

### 1. Selenium IDE

瀏覽器的擴充套件，它提供了錄製、回放、測試腳本匯入匯出功能，用於編寫功能測試，且不需要用寫程式，是使用 Selenium 進行網站自動化的基礎。

### 2. Selenium WebDriver

用來執行並操作瀏覽器的一個 API 介面，程式透過呼叫 WebDriver 來直接對瀏覽器進行操作，Selenium WebDriver API 支援 Java、C#、Ruby、Python 及 Perl 等多種語言進行腳本撰寫，許多 Web Test Framework，都是以 Selenium WebDriver API 作為基礎，功能強大且穩固已經讓 Selenium 成為瀏覽器自動化的基石。

### 3. Selenium Grid

主要可以讓我們輕鬆的同時使用多台機器、多個瀏覽器來對網頁進行測試。

___

## 初階實作方式: Selenium IDE

最簡單的自動化測試就是將手動測試時的動作紀錄起來，之後要測試的時候重新播放，省去重新手動測試的人力。因為 Selenium IDE 本質是瀏覽器的擴充套件，接下來以 Chrome 來示範對 DVWA 靶站的登入測試頁做 SQL injection 的測試(對 SQL Injection 不熟的可參考)。

### 步驟 1. 安裝 Selenium IDE 

* 1. 安裝 chrome
    https://www.google.com/intl/zh-tw/chrome/

* 2. 到 chrome 線上應用程式商店搜索 Selenium IDE 並安裝
    https://chrome.google.com/webstore/detail/selenium-ide/mooikfkahbdckldjjndioackbalphokd
![](/img/posts/cymetrics/selenium/se_2.jpg)

### 步驟 2. 行為錄製
* 1. 點選 Icon 開啟 Selenium IDE

    ![](/img/posts/cymetrics/selenium/se_3.jpg)

* 2. 點選 "Record a new test in a new project" 建立測試專案並指定要錄製的網站 URL

    ![](/img/posts/cymetrics/selenium/se_4.jpg)
    
    ![](/img/posts/cymetrics/selenium/se_5.jpg)

* 3. 在彈出來的新視窗進行測試行為，這邊以 SQL injection 為例

    ![](/img/posts/cymetrics/selenium/se_6.jpg)

    * 1. 點輸入框
    * 2. 輸入 admin' or '1' = '1
    * 3. 點擊登入按鍵

### 步驟 3. 重放測試

* 1. 重放前一步驟記錄下的測試，Selenium 會做 5 個動作
    * 1. 開啟測試頁面
    * 2. 設定視窗大小
    * 3. 點輸入框
    * 4. 輸入 admin' or '1' = '1
    * 5. 點擊登入按鍵

    ![](/img/posts/cymetrics/selenium/se_7.jpg)

* 2. 這時候會看到成功執行 SQL Injection 的畫面

    ![](/img/posts/cymetrics/selenium/se_8.jpg)
    
* 3. 最後記得存檔，瀏覽器不會幫你記錄這些，下次開啟需從存檔導入

    ![](/img/posts/cymetrics/selenium/se_9.jpg)

___

## 進階實作方式: Selenium WebDriver

有一些無法攻擊方式較難只靠側錄來完成，像是 Brute Force 和 Buffer Overflow 等等，這時候就需要寫程式來配合 Selenium WebDriver 進行測試。接下來以 Chrome + Python 來對 iThome 做登入測試，因為選真實的網站來示範，所以只執行單次登入來證實可以用 Selenium WebDriver 做 Brute Force，而不是真的打下去。

### 步驟 1. 安裝 Selenium WebDriver

安裝步驟就不多贅述，這邊提供下載位置與測試時的版本作為參考

* 1. Chrome (96.0.4664.110)
    https://www.google.com/intl/zh-tw/chrome/
    
* 2. Python (3.8.9)
    https://www.python.org/downloads/
    
* 3. Selenium WebDriver (4.0.0)
    `pip install selenium`
    
* 4. ChromeDriver (96.0.4664.45)
    https://chromedriver.chromium.org/
    
* 5. (option)webdriver_manager (3.5.2)
    `pip install webdriver-manager`
    
備註: webdriver_manager 可偵測當前系統與Chrome版本自動下載 ChromeDriver，但不是所有開發環境都通用(ex. docker)

### 步驟 2. 取得頁面元素
* 1. 從頁面上取得 XPath 用於定位點擊與輸入

    ![](/img/posts/cymetrics/selenium/se_10.jpg)



### 步驟 3. 執行測試
* 1. 開啟瀏覽器
```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.utils import ChromeType
# 0. init
chrome_options = Options()
chrome_options.add_argument("--incognito")
# 1. set headless
if headless_mode:
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
# 2. set user-agent
ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) " \
    "AppleWebKit/537.36 (KHTML, like Gecko) " \
    "Chrome/92.0.4515.159 Safari/537.36"
chrome_options.add_argument('user-agent={}'.format(ua))
# 3. open browser
driver = webdriver.Chrome(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install(),
                          options=chrome_options)
driver.set_window_size(1024, 768)

```

* 2. 設計動作

```python
from selenium.webdriver.common.by import By

try:
    driver.implicitly_wait(10)
    driver.get(input_url)
    for temp_action in input_action_list:
        if temp_action['type'] == 'click':
            driver.find_element(By.XPATH, temp_action['xpath']).click()
        if temp_action['type'] == 'write':
            driver.find_element(By.XPATH, temp_action['xpath']).send_keys(temp_action['text'])
except Exception as ex:
    print('Exception:' + str(ex))
finally:
    driver.quit()

```

* 3. 啟動測試(完整程式碼)

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.utils import ChromeType

def selenium_chrome_demo(input_url, input_action_list, headless_mode=False):
    # 0. init
    chrome_options = Options()
    chrome_options.add_argument("--incognito")
    # 1. set headless
    if headless_mode:
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-gpu')
    # 2. set user-agent
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) " \
         "AppleWebKit/537.36 (KHTML, like Gecko) " \
         "Chrome/92.0.4515.159 Safari/537.36"
    chrome_options.add_argument('user-agent={}'.format(ua))
    # 3. open browser
    driver = webdriver.Chrome(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install(),
                              options=chrome_options)
    driver.set_window_size(1024, 768)
    # 4. run action
    try:
        driver.implicitly_wait(10)
        driver.get(input_url)
        for temp_action in input_action_list:
            if temp_action['type'] == 'click':
                driver.find_element(By.XPATH, temp_action['xpath']).click()
            if temp_action['type'] == 'write':
                driver.find_element(By.XPATH, temp_action['xpath']).send_keys(temp_action['text'])
    except Exception as ex:
        print('Exception:' + str(ex))
    finally:
        driver.quit()
    return

test_json_list = [
{'type': 'write', 'xpath': '//*[@id="account"]', 'text': 'account'},
{'type': 'write', 'xpath': '//*[@id="password"]', 'text': 'password'},
{'type': 'click', 'xpath': '/html/body/div/div/div/form/button', 'text': ''}]

selenium_chrome_demo(input_url="https://member.ithome.com.tw/login",
                     input_action_list=test_json_list)

```

因為帳號跟密碼是隨便寫的理論上會看到這各畫面

![](/img/posts/cymetrics/selenium/se_11.jpg)


## 高階實作方式: Selenium Grid

如果要更進一步建立一個平台來控管 Selenium 的自動化測試，官方就有提供解決方案 Selenium Grid，其中管理平台稱為 Hub，實際運行測試的稱為 Node

![](/img/posts/cymetrics/selenium/se_12.jpg)
圖片來源: https://www.edureka.co/blog/selenium-grid-tutorial
### 步驟 1. 安裝 Selenium Grid
Selenium Grid 安裝與串接推薦用 docker 

* 1. 建立串接用的網路(Bridge)
```
$ docker network create grid
```

* 2. 安裝 hub
```
$ docker run -d -p 4442-4444:4442-4444 --net grid --name selenium-hub selenium/hub:4.1.1-20211217
```
* 3. 安裝 node
```
$ docker run -d --net grid -e SE_EVENT_BUS_HOST=selenium-hub \
    --shm-size="2g" \
    -e SE_EVENT_BUS_PUBLISH_PORT=4442 \
    -e SE_EVENT_BUS_SUBSCRIBE_PORT=4443 \
    selenium/node-chrome:4.1.1-20211217
```
### 步驟 2. node 設定
node 的本質就是一個幫你安裝好 Selenium WebDriver 的 Ubuntu VM，部份 Selenium 會用到的套件已經裝在裡面了，可以省掉不少架環境的時間
* 1. 進入 node 的 container 

    `docker exec -i -t your_node /bin/bash`
    
    ![](/img/posts/cymetrics/selenium/se_13.jpg)
    
* 2. 建立測試
    可參考 Selenium WebDriver 的實作方式建立測試，然後將我們之前準備好確未用到的功能 headless 打開，就可以在 node 裡面跑測試了

```python
 selenium_chrome_demo(input_url="https://member.ithome.com.tw/login",
                     input_action_list=test_json_list,
                     headless_mode=True)
```

* 3. (option) docker 版本預設開啟 VNC server，可藉此連去調整設定或建立測試
![](/img/posts/cymetrics/selenium/se_14.jpg)


### 步驟 3. 從 hub 檢視測試結果

![](/img/posts/cymetrics/selenium/se_15.jpg)



## 總結

Selenium 在安全性測試上有他優勢或強大的地方，但是也有從實作過程中較難表現出來的缺點，所以實際運用在資安領運通常要看測試對象的特性來決定。

先提一下 Selenium 整體的優缺點，Selenium 在自動化的部分非常強大，可以錄製也可以使用 Script，而且因為是透過瀏覽器來執行動作，被網站判斷是自動化程式而導致被屏蔽的機會也比較低，但缺點就是部份設定細節無法自訂，像是 header 無法自訂導致從 header 發起的攻擊無法實作。

Selenium IDE 的優點是設定簡單、測試過程與結果較直觀、不需要 Codeing，總體來說就是開發成本很低，非常適合開發速度較快的團隊，但特有的缺點是無法排程，還是需要一定程度的人力介入，

Selenium WebDriver 的泛用性很高，不管是動態還是靜態的網站都能進行攻擊測試，個人認為是三者中最好用的，除了共同的缺點以外，硬要說缺點的話就是改版(4.0.x)後向下兼容性不佳，部分舊版程式碼無法沿用。

Selenium Grid 的優點是可以規模化，但實際執行安全性測試的時候基本上是跟 Selenium WebDriver 一樣的，所以優缺點很類似，跟其他兩者相比的缺點則是架設較為複雜，如果使用 docker 的狀況下使用 Gitlab，jenkins 等管理平台可能還更適合大部分的狀況。
    
前面為快速說明原理挑了一些簡單易懂的攻擊來示範，實際上還有更多更進階的用法，如果閱覽數量夠多，之後會再加開一篇分享一些更進階的用法與經典案例，有任何資安方面相關的問題都歡迎留言討論，或者直接到 Cymetrics 尋求協助。

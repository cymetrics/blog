---
title: WordPress Plugin VikBooking <= 1.5.3 Unauthorized RCE 漏洞細節
date: 2022-05-20
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/wordpress-plugin-vikbooking-unauth-rce/cover.png
---

<!-- summary -->
前陣子在看一些 WordPress Plugin 的東西，發現是個滿好練習的地方，因為那邊 plugin 數量很多，而且每一個都有原始碼可以看，想要黑箱白箱都可以，然後安裝也很方便。

這篇來講一下前陣子找到的一個洞，用的是最基本而且經典的攻擊手法，檔案上傳導致的 RCE。

漏洞編號：[CVE-2022-27862
 WordPress VikBooking Hotel Booking Engine & PMS plugin <= 1.5.3 - Arbitrary File Upload leading to RCE](https://patchstack.com/database/vulnerability/vikbooking/wordpress-vikbooking-hotel-booking-engine-pms-plugin-1-5-3-arbitrary-file-upload-leading-to-rce)
<!-- summary -->

## VikBooking 簡介與漏洞細節

[VikBooking](https://wordpress.org/plugins/vikbooking/) 是個 WordPress 的訂房外掛，官網的 demo 長這樣：

![booking page](/img/posts/huli/wordpress-plugin-vikbooking-unauth-rce/p1-booking-page.png)

就跟其他的訂房外掛其實沒有什麼區別，完成訂房以後管理員在 WordPress 後台可以管理訂單，而消費者也會收到一封信，可以透過信件中提供的網址來管理自己的訂房：

![booking page customer](/img/posts/huli/wordpress-plugin-vikbooking-unauth-rce/p2-email.png)

雖然說 UI 上看起來沒什麼東西，但既然我們有了原始碼，就可以透過白箱測試的方式去看一下裡面的實作為何。

主要的操作跟邏輯都放在 `site/controller.php` 當中，裡面每一個 function 基本上都對應到一個 action，其中我發現了一個方法叫做 `storesignature`，程式碼如下：

``` php
public function storesignature()
{
  $sid = VikRequest::getString('sid', '', 'request');
  $ts = VikRequest::getString('ts', '', 'request');
  $psignature = VikRequest::getString('signature', '', 'request', VIKREQUEST_ALLOWRAW);
  $ppad_width = VikRequest::getInt('pad_width', '', 'request');
  $ppad_ratio = VikRequest::getInt('pad_ratio', '', 'request');
  $pitemid = VikRequest::getInt('Itemid', '', 'request');
  $ptmpl = VikRequest::getString('tmpl', '', 'request');
  $dbo = JFactory::getDBO();
  $mainframe = JFactory::getApplication();
  $q = "SELECT * FROM `#__vikbooking_orders` WHERE `ts`=" . $dbo->quote($ts) . " AND `sid`=" . $dbo->quote($sid) . " AND `status`='confirmed';";
  $dbo->setQuery($q);
  $dbo->execute();
  if ($dbo->getNumRows() < 1) {
    VikError::raiseWarning('', 'Booking not found');
    $mainframe->redirect('index.php');
    exit;
  }
  $row = $dbo->loadAssoc();
  $tonight = mktime(23, 59, 59, date('n'), date('j'), date('Y'));
  if ($tonight > $row['checkout']) {
    VikError::raiseWarning('', 'Check-out date is in the past');
    $mainframe->redirect('index.php');
    exit;
  }
  $customer = array();
  $q = "SELECT `c`.*,`co`.`idorder`,`co`.`signature`,`co`.`pax_data`,`co`.`comments` FROM `#__vikbooking_customers` AS `c` LEFT JOIN `#__vikbooking_customers_orders` `co` ON `c`.`id`=`co`.`idcustomer` WHERE `co`.`idorder`=".(int)$row['id'].";";
  $dbo->setQuery($q);
  $dbo->execute();
  if ($dbo->getNumRows() > 0) {
    $customer = $dbo->loadAssoc();
  }
  if (!(count($customer) > 0)) {
    VikError::raiseWarning('', 'Customer not found');
    $mainframe->redirect('index.php');
    exit;
  }
  //check if the signature has been submitted
  $signature_data = '';
  $cont_type = '';
  if (!empty($psignature)) {
    //check whether the format is accepted
    if (strpos($psignature, 'image/png') !== false || strpos($psignature, 'image/jpeg') !== false || strpos($psignature, 'image/svg') !== false) {
      $parts = explode(';base64,', $psignature);
      $cont_type_parts = explode('image/', $parts[0]);
      $cont_type = $cont_type_parts[1];
      if (!empty($parts[1])) {
        $signature_data = base64_decode($parts[1]);
      }
    }
  }
  $ret_link = JRoute::rewrite('index.php?option=com_vikbooking&task=signature&sid='.$row['sid'].'&ts='.$row['ts'].(!empty($pitemid) ? '&Itemid='.$pitemid : '').($ptmpl == 'component' ? '&tmpl=component' : ''), false);
  if (empty($signature_data)) {
    VikError::raiseWarning('', JText::translate('VBOSIGNATUREISEMPTY'));
    $mainframe->redirect($ret_link);
    exit;
  }
  //write file
  $sign_fname = $row['id'].'_'.$row['sid'].'_'.$customer['id'].'.'.$cont_type;
  $filepath = VBO_ADMIN_PATH . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'idscans' . DIRECTORY_SEPARATOR . $sign_fname;
  $fp = fopen($filepath, 'w+');
  $bytes = fwrite($fp, $signature_data);
  fclose($fp);
  if ($bytes !== false && $bytes > 0) {
    //update the signature in the DB
    $q = "UPDATE `#__vikbooking_customers_orders` SET `signature`=".$dbo->quote($sign_fname)." WHERE `idorder`=".(int)$row['id'].";";
    $dbo->setQuery($q);
    $dbo->execute();
    $mainframe->enqueueMessage(JText::translate('VBOSIGNATURETHANKS'));
    //resize image for screens with high resolution
    if ($ppad_ratio > 1) {
      $new_width = floor(($ppad_width / 2));
      $creativik = new vikResizer();
      $creativik->proportionalImage($filepath, $filepath, $new_width, $new_width);
    }
    //
  } else {
    VikError::raiseWarning('', JText::translate('VBOERRSTORESIGNFILE'));
  }
  $mainframe->redirect($ret_link);
  exit;
}
```

從 function name 跟程式碼可以推測出應該是一個上傳簽名檔案的功能，而檔案的內容會先 base64 過，所以程式碼中 decode 回 binary 然後寫進檔案，核心的程式碼如下：

``` php
$psignature = VikRequest::getString('signature', '', 'request', VIKREQUEST_ALLOWRAW);

//check if the signature has been submitted
$signature_data = '';
$cont_type = '';

if (!empty($psignature)) {
  //check whether the format is accepted
  if (strpos($psignature, 'image/png') !== false || strpos($psignature, 'image/jpeg') !== false || strpos($psignature, 'image/svg') !== false) {
    $parts = explode(';base64,', $psignature);
    $cont_type_parts = explode('image/', $parts[0]);
    $cont_type = $cont_type_parts[1];
    if (!empty($parts[1])) {
      $signature_data = base64_decode($parts[1]);
    }
  }
}
$ret_link = JRoute::rewrite('index.php?option=com_vikbooking&task=signature&sid='.$row['sid'].'&ts='.$row['ts'].(!empty($pitemid) ? '&Itemid='.$pitemid : '').($ptmpl == 'component' ? '&tmpl=component' : ''), false);
if (empty($signature_data)) {
  VikError::raiseWarning('', JText::translate('VBOSIGNATUREISEMPTY'));
  $mainframe->redirect($ret_link);
  exit;
}
$sign_fname = $row['id'].'_'.$row['sid'].'_'.$customer['id'].'.'.$cont_type;
$filepath = VBO_ADMIN_PATH . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'idscans' . DIRECTORY_SEPARATOR . $sign_fname;
$fp = fopen($filepath, 'w+');
$bytes = fwrite($fp, $signature_data);
fclose($fp);
```

從最後一段可以看出寫入檔案的內容為 `$signature_data`，路徑為 `VBO_ADMIN_PATH . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'idscans' . DIRECTORY_SEPARATOR . $sign_fname`，如果我們可以控制 `$signature_data` 跟 `$sign_fname`，就有了一個任意寫檔的漏洞，這些變數的值如下：

``` php
if (strpos($psignature, 'image/png') !== false || strpos($psignature, 'image/jpeg') !== false || strpos($psignature, 'image/svg') !== false) {
  $parts = explode(';base64,', $psignature);
  $cont_type_parts = explode('image/', $parts[0]);
  $cont_type = $cont_type_parts[1];
  if (!empty($parts[1])) {
    $signature_data = base64_decode($parts[1]);
  }
}
$sign_fname = $row['id'].'_'.$row['sid'].'_'.$customer['id'].'.'.$cont_type;
```

一個正常的 `$psignature` 大概是長這樣：`data:image/png;base64,image_content`。

這邊先檢查 $psignature 有沒有指定的 content type，有的話用 `;base64,` 去做字串切割，切完的 parts 會變成：

``` php
parts[0] = 'data:image/png';
parts[1] = image_content;
```

然後再把 `parts[0]` 用 `image/` 來切，拿到的第二段資料（以上面的例子來說，會拿到 `png`）就是 content type，而 `parts[1]` 則是直接做 base64 decode 後做為檔案內容寫入。

檔名 `$sign_fname` 的部分則是一些 id 最後加上剛剛得出的 content type。

從上面的邏輯可看出檔案內容基本上可以隨意控制，而檔名的部分也可以輕鬆繞過檢查，像這樣：

```
image/png/../../../../shell.php;base64,web_shell
```

有包含 `image/png` 所以檢查會過，切完之後 parts[0] 變成 `image/png/../../../../shell.php`，最後拿到的 content type 為 `png/../../../../shell.php`，拼接完的檔名會像這樣：`id_sid_cid.png/../../../../shell.php`，雖然說這檔名看起來很不合理，是檔案之後再接 `../`，不過這在 PHP 中是沒問題的，可以看以下範例：

``` php
<?php
  $filepath = 'not_exist.php/../poc.php';
  $fp = fopen($filepath, 'w+');
  $bytes = fwrite($fp, 'abc');
  fclose($fp);
?>
```

像上面這樣的程式碼，最後還是會把內容寫入同個目錄底下的 `poc.php`。

有了任意寫檔的漏洞以後，寫入一個 web shell 就 RCE 了，結果像是這樣：

![rce](/img/posts/huli/wordpress-plugin-vikbooking-unauth-rce/p3-rce.png)

## 修復方式

Vikbooking 在 1.5.4 版修復了這個漏洞，把拿出資料以及 content type 的程式碼改為下面這一段：

``` php
if (!empty($psignature)) {
    /**
     * Implemented safe filtering of base64-encoded signature image
     * to obtain content and file extension.
     *
     * @since       1.15.1 (J) - 1.5.4 (WP)
     */
    if (preg_match("/^data:image\/(png|jpe?g|svg);base64,([A-Za-z0-9\/=+]+)$/", $psignature, $safe_match)) {
            $signature_data = base64_decode($safe_match[2]);
            $cont_type = $safe_match[1];
    }
}
```

這邊改用正則來處理以後，確保了 match 到的 content type 只會是圖片的副檔名，在沒辦法控制檔名中其他參數的狀況下，就無法寫檔案到任意位置了。

## 結語

只能說在做這種讓使用者上傳檔案的功能時都必須特別小心，這種功能特別容易出事，例如說：

1. 檔名沒過濾好，上傳 php 可以 web shell，上傳 HTML 就是 XSS
2. 路徑沒過濾好，可以上傳到任意位置
3. 不知道解壓縮時有可能會碰到 [zip slip](https://github.com/snyk/zip-slip-vulnerability)

總之呢，未來在實作類似功能時記得特別注意這些問題，避免寫出有漏洞的程式碼。


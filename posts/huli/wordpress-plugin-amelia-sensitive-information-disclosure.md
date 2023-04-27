---
title: WordPress Plugin Amelia < 1.0.49 敏感資訊洩露漏洞細節
date: 2022-03-30
tags: [Security]
author: huli
layout: zh-tw/layouts/post.njk
image: /img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/cover.png
canonical: https://blog.huli.tw/2022/03/30/wordpress-plugin-amelia-sensitive-information-disclosure/
---

<!-- summary -->
[Amelia](https://tw.wordpress.org/plugins/ameliabooking/) 是一個由 TMS 公司所開發的 WordPress 外掛，能夠輕鬆幫你的 WordPress 網站加上預約系統的功能，例如說診所、理髮廳或是家教等等，都很適合使用這個外掛來架一個簡單的預約系統。根據 WordPress 官方的統計，大約有 40,000 個網站都安裝了這個 plugin。

在三月初的時候我針對 Amelia 這套系統的原始碼做了一些研究，找到了三個都是敏感資訊洩露的漏洞<!-- summary -->：

* `CVE-2022-0720` Amelia < 1.0.47 - Customer+ Arbitrary Appointments Update and Sensitive Data Disclosure (CVSS 6.3)
* `CVE-2022-0825` Amelia < 1.0.49 - Customer+ Arbitrary Appointments Status Update (CVSS 6.3)
* `CVE-2022-0837` Amelia < 1.0.48 - Customer+ SMS Service Abuse and Sensitive Data Disclosure (CVSS 5.4)

如果被攻擊者利用這些漏洞，可以取得所有消費者的資料，包括姓名、電話以及預約資訊。

底下我會簡單介紹一下 Amelia 的架構以及這三個漏洞的細節。

## Amelia 基本介紹

安裝好 Amelia 以後，你可以新增一個預約頁面，大概是長這樣：

![intro1](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p1-intro-1.png)

在預約時需要提供一些基本資料，例如說姓名以及 email 等等，輸入後即可完成預約：

![intro2](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p2-intro-2.png)

完成預約以後，Amelia 會幫你在 WordPress 系統裡面新增一個低權限的帳號，並且把重設密碼的連結寄到剛剛提供的信箱。帳號開通以後，就可以登入 WordPress 管理剛剛的預約：

![intro3](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p3-intro-3.png)

使用方式介紹完以後，我們來看一下更技術的部分。

## WordPress 外掛與 Amelia 架構介紹

WordPress 的外掛有很多，每一個的寫法都不太一樣，但因為是外掛，所以會呼叫 WordPress 提供的函式來註冊事件。

`add_action` 這個函式就扮演著很重要的角色，你可以幫特定的 action 加上一個 hook，當這個 action 被觸發時，就會呼叫到你提供的函式。

其中由 `wp_ajax_nopriv_` 開頭的 action，可以透過 `wp-admin/admin-ajax.php` 來呼叫，相關程式碼節錄如下（[admin-ajax.php](https://github.com/WordPress/WordPress/blob/master/wp-admin/admin-ajax.php)）：

``` php
<?php

$action = $_REQUEST['action'];

if ( is_user_logged_in() ) {
  // If no action is registered, return a Bad Request response.
  if ( ! has_action( "wp_ajax_{$action}" ) ) {
    wp_die( '0', 400 );
  }

  /**
   * Fires authenticated Ajax actions for logged-in users.
   *
   * The dynamic portion of the hook name, `$action`, refers
   * to the name of the Ajax action callback being fired.
   *
   * @since 2.1.0
   */
  do_action( "wp_ajax_{$action}" );
} else {
  // If no action is registered, return a Bad Request response.
  if ( ! has_action( "wp_ajax_nopriv_{$action}" ) ) {
    wp_die( '0', 400 );
  }

  /**
   * Fires non-authenticated Ajax actions for logged-out users.
   *
   * The dynamic portion of the hook name, `$action`, refers
   * to the name of the Ajax action callback being fired.
   *
   * @since 2.8.0
   */
  do_action( "wp_ajax_nopriv_{$action}" );
}

?>
```

以 Amelia 來說，在 `ameliabooking.php` 中註冊了兩個 hook：

``` php
/** Isolate API calls */
add_action('wp_ajax_wpamelia_api', array('AmeliaBooking\Plugin', 'wpAmeliaApiCall'));
add_action('wp_ajax_nopriv_wpamelia_api', array('AmeliaBooking\Plugin', 'wpAmeliaApiCall'));
```

有 `nopriv` 的代表沒有權限（未登入）也可以呼叫，沒有的代表需要登入 WordPress 系統才能呼叫，而許多的 plugin 會選擇自己處理身份驗證相關的邏輯，所以會把兩個動作都導到同一個地方。


而 `wpAmeliaApiCall` 這個函式則是註冊了 routes：

``` php
/**
 * API Call
 *
 * @throws \InvalidArgumentException
 */
public static function wpAmeliaApiCall()
{
    try {
        /** @var Container $container */
        $container = require AMELIA_PATH . '/src/Infrastructure/ContainerConfig/container.php';

        $app = new App($container);

        // Initialize all API routes
        Routes::routes($app);

        $app->run();

        exit();
    } catch (Exception $e) {
        echo 'ERROR: ' . $e->getMessage();
    }
}
```

在 `src/Infrastructure/Routes` 底下有許多的資料夾跟檔案，裡面負責處理不同的路由，舉例來說，User 相關的路由在 `src/Infrastructure/Routes/User/User.php`，相關程式碼節錄如下：

``` php
/**
 * Class User
 *
 * @package AmeliaBooking\Infrastructure\Routes\User
 */
class User
{
    /**
     * @param App $app
     */
    public static function routes(App $app)
    {
        $app->get('/users/wp-users', GetWPUsersController::class);
        $app->post('/users/authenticate', LoginCabinetController::class);
        $app->post('/users/logout', LogoutCabinetController::class);

        // Customers
        $app->get('/users/customers/{id:[0-9]+}', GetCustomerController::class);
        $app->get('/users/customers', GetCustomersController::class);
        $app->post('/users/customers', AddCustomerController::class);
        $app->post('/users/customers/{id:[0-9]+}', UpdateCustomerController::class);
        $app->post('/users/customers/delete/{id:[0-9]+}', DeleteUserController::class);
        $app->get('/users/customers/effect/{id:[0-9]+}', GetUserDeleteEffectController::class);
        $app->post('/users/customers/reauthorize', ReauthorizeController::class);

        // Providers
        $app->get('/users/providers/{id:[0-9]+}', GetProviderController::class);
        $app->get('/users/providers', GetProvidersController::class);
        $app->post('/users/providers', AddProviderController::class);
        $app->post('/users/providers/{id:[0-9]+}', UpdateProviderController::class);
        $app->post('/users/providers/status/{id:[0-9]+}', UpdateProviderStatusController::class);
        $app->post('/users/providers/delete/{id:[0-9]+}', DeleteUserController::class);
        $app->get('/users/providers/effect/{id:[0-9]+}', GetUserDeleteEffectController::class);

        // Current User
        $app->get('/users/current', GetCurrentUserController::class);
    }
}
```

那實際上到底要怎麼呼叫到這些路由呢？在 `src/Infrastructure/ContainerConfig/request.php` 中，針對 request 的 query string 做了一些轉換：

``` php
<?php

use Slim\Http\Request;
use Slim\Http\Uri;

$entries['request'] = function (AmeliaBooking\Infrastructure\Common\Container $c) {

    $curUri = Uri::createFromEnvironment($c->get('environment'));
    // 附註：AMELIA_ACTION_SLUG = "action=wpamelia_api&call="
    $newRoute = str_replace(
        ['XDEBUG_SESSION_START=PHPSTORM&' . AMELIA_ACTION_SLUG, AMELIA_ACTION_SLUG],
        '',
        $curUri->getQuery()
    );

    $newPath = strpos($newRoute, '&') ? substr(
        $newRoute,
        0,
        strpos($newRoute, '&')
    ) : $newRoute;

    $newQuery = strpos($newRoute, '&') ? substr(
        $newRoute,
        strpos($newRoute, '&') + 1
    ) : '';

   $request = Request::createFromEnvironment($c->get('environment'))
       ->withUri(
           $curUri
               ->withPath($newPath)
               ->withQuery($newQuery)
       );

    if (method_exists($request, 'getParam') && $request->getParam('showAmeliaErrors')) {
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    }

    return $request;
};
```

簡單來說呢，當你的 request URL 長這樣的時候：`/wordpress/wp-admin/admin-ajax.php?action=wpamelia_api&call=/users/wp-users`，query string 就是 `action=wpamelia_api&call=/users/wp-users`，符合 AMELIA_ACTION_SLUG 的地方被換成空白之後，就變成了 `/users/wp-users`，就對應到了上面的檔案看到的路由，重新交由 Slim 這個 PHP 框架去處理。

而 `/users/wp-users` 對應到的是 `GetWPUsersController::class`，讓我們來看一下 controller 的程式碼：

``` php
<?php

namespace AmeliaBooking\Application\Controller\User;

use AmeliaBooking\Application\Commands\User\GetWPUsersCommand;
use AmeliaBooking\Application\Controller\Controller;
use Slim\Http\Request;

/**
 * Class GetWPUsersController
 *
 * @package AmeliaBooking\Application\Controller\User
 */
class GetWPUsersController extends Controller
{
    /**
     * Instantiates the Get WP Users command to hand it over to the Command Handler
     *
     * @param Request $request
     * @param         $args
     *
     * @return GetWPUsersCommand
     * @throws \RuntimeException
     */
    protected function instantiateCommand(Request $request, $args)
    {
        $command = new GetWPUsersCommand($args);
        $command->setField('id', (int)$request->getQueryParam('id'));
        $command->setField('role', $request->getQueryParam('role'));
        $requestBody = $request->getParsedBody();
        $this->setCommandFields($command, $requestBody);

        return $command;
    }
}
```

這邊使用了設計模式中的 Command Pattern，把每一個動作都包裝成一個指令，那這個指令會被誰處理呢？每一個 controller 都繼承了 `AmeliaBooking\Application\Controller\Controller`，所以處理的程式碼就在裡面：

``` php
/**
 * @param Request  $request
 * @param Response $response
 * @param          $args
 *
 * @return Response
 * @throws \InvalidArgumentException
 * @throws \RuntimeException
 */
public function __invoke(Request $request, Response $response, $args)
{
    /** @var Command $command */
    $command = $this->instantiateCommand($request, $args);

    if (!wp_verify_nonce($command->getField('ameliaNonce'), 'ajax-nonce') &&
        (
            $command instanceof DeleteUserCommand ||
            $command instanceof DeletePackageCommand ||
            $command instanceof DeleteCategoryCommand ||
            $command instanceof DeleteServiceCommand ||
            $command instanceof DeleteExtraCommand ||
            $command instanceof DeleteLocationCommand ||
            $command instanceof DeleteEventCommand ||
            $command instanceof DeletePaymentCommand ||
            $command instanceof DeleteCouponCommand ||
            $command instanceof DeleteCustomFieldCommand ||
            $command instanceof DeleteAppointmentCommand ||
            $command instanceof DeleteBookingCommand ||
            $command instanceof DeleteEventBookingCommand ||
            $command instanceof DeletePackageCustomerCommand ||
            $command instanceof DeleteNotificationCommand
        )
    ) {
        return $response->withStatus(self::STATUS_INTERNAL_SERVER_ERROR);
    }

    /** @var CommandResult $commandResult */
    $commandResult = $this->commandBus->handle($command);

    if ($commandResult->getUrl() !== null) {
        $this->emitSuccessEvent($this->eventBus, $commandResult);

        /** @var Response $response */
        $response = $response->withHeader('Location', $commandResult->getUrl());
        $response = $response->withStatus(self::STATUS_REDIRECT);

        return $response;
    }

    if ($commandResult->hasAttachment() === false) {
        $responseBody = [
            'message' => $commandResult->getMessage(),
            'data'    => $commandResult->getData()
        ];

        $this->emitSuccessEvent($this->eventBus, $commandResult);

        switch ($commandResult->getResult()) {
            case (CommandResult::RESULT_SUCCESS):
                $response = $response->withStatus(self::STATUS_OK);

                break;
            case (CommandResult::RESULT_CONFLICT):
                $response = $response->withStatus(self::STATUS_CONFLICT);

                break;
            default:
                $response = $response->withStatus(self::STATUS_INTERNAL_SERVER_ERROR);

                break;
        }

        /** @var Response $response */
        $response = $response->withHeader('Content-Type', 'application/json;charset=utf-8');
        $response = $response->write(
            json_encode(
                $commandResult->hasDataInResponse() ?
                    $responseBody : array_merge($responseBody, ['data' => []])
            )
        );
    }

    return $response;
}
```

這邊先實例化一個指令之後，再丟到 commandBus 去做處理：`$this->commandBus->handle($command)`，程式碼在 `src/Infrastructure/ContainerConfig/command.bus.php`，節錄部分：

``` php
<?php

defined('ABSPATH') or die('No script kiddies please!');

// @codingStandardsIgnoreStart
$entries['command.bus'] = function ($c) {
    $commands = [
        // User
        User\DeleteUserCommand::class                             => new User\DeleteUserCommandHandler($c),
        User\GetCurrentUserCommand::class                         => new User\GetCurrentUserCommandHandler($c),
        User\GetUserDeleteEffectCommand::class                    => new User\GetUserDeleteEffectCommandHandler($c),
        User\GetWPUsersCommand::class                             => new User\GetWPUsersCommandHandler($c),

        // more commands...
    ];

    return League\Tactician\Setup\QuickStart::create($commands);
};
// @codingStandardsIgnoreEnd

```

從中可以看出我們的 `GetWPUsersCommand` 會被 `User\GetWPUsersCommandHandler` 處理，所以主要的邏輯就在這裡面：

``` php
class GetWPUsersCommandHandler extends CommandHandler
{
    /**
     * @param GetWPUsersCommand $command
     *
     * @return CommandResult
     * @throws AccessDeniedException
     * @throws InvalidArgumentException
     * @throws \AmeliaBooking\Infrastructure\Common\Exceptions\QueryExecutionException
     * @throws \Interop\Container\Exception\ContainerException
     */
    public function handle(GetWPUsersCommand $command)
    {
        if (!$this->getContainer()->getPermissionsService()->currentUserCanRead(Entities::EMPLOYEES)) {
            throw new AccessDeniedException('You are not allowed to read employees.');
        }

        if (!$this->getContainer()->getPermissionsService()->currentUserCanRead(Entities::CUSTOMERS)) {
            throw new AccessDeniedException('You are not allowed to read customers.');
        }

        $result = new CommandResult();

        $this->checkMandatoryFields($command);

        /** @var UserService $userService */
        $userService = $this->container->get('users.service');

        $adminIds = $userService->getWpUserIdsByRoles(['administrator']);

        /** @var WPUserRepository $wpUserRepository */
        $wpUserRepository = $this->getContainer()->get('domain.wpUsers.repository');

        $result->setResult(CommandResult::RESULT_SUCCESS);
        $result->setMessage('Successfully retrieved users.');

        $result->setData([
            Entities::USER . 's' => $wpUserRepository->getAllNonRelatedWPUsers($command->getFields(), $adminIds)
        ]);

        return $result;
    }
}
```

可以看到業務邏輯都在 `handle` 這個函式裡面，裡面先檢查了權限，接著透過 `userService` 抓取相關資料，再來用 `$result->setData` 設置要回傳的資料，最後回傳結果，交給其他 infra 相關程式碼處理。

另外，在 controller 中可以看到 command 相關的權限檢查：

``` php
if (!wp_verify_nonce($command->getField('ameliaNonce'), 'ajax-nonce') &&
  (
      $command instanceof DeleteUserCommand ||
      $command instanceof DeletePackageCommand ||
      $command instanceof DeleteCategoryCommand ||
      $command instanceof DeleteServiceCommand ||
      $command instanceof DeleteExtraCommand ||
      $command instanceof DeleteLocationCommand ||
      $command instanceof DeleteEventCommand ||
      $command instanceof DeletePaymentCommand ||
      $command instanceof DeleteCouponCommand ||
      $command instanceof DeleteCustomFieldCommand ||
      $command instanceof DeleteAppointmentCommand ||
      $command instanceof DeleteBookingCommand ||
      $command instanceof DeleteEventBookingCommand ||
      $command instanceof DeletePackageCustomerCommand ||
      $command instanceof DeleteNotificationCommand
  )
) {
  return $response->withStatus(self::STATUS_INTERNAL_SERVER_ERROR);
}
```

如果是這些 delete 的指令，就需要通過 `wp_verify_nonce` 的檢查，這是什麼東西呢？

`wp_verify_nonce` 是 WordPress 提供用於安全性檢查的函式，對應的函式是 `wp_create_nonce`，在 WordPress 後台管理頁面有這樣一行程式碼：`var wpAmeliaNonce = '<?php echo wp_create_nonce('ajax-nonce'); ?>';`，會產生一個名稱為 `ajax-nonce` 的 nonce，而這個 nonce 其實就是把一些字串 hash 過後的結果。

如果你拿不到 hash 時用的 salt，基本上不可能偽造出 nonce，因為 salt 預設都非常長，而且都是安裝時隨機產生的：

``` php
define('AUTH_KEY',         ' Xakm<o xQy rw4EMsLKM-?!T+,PFF})H4lzcW57AF0U@N@< >M%G4Yt>f`z]MON');
define('SECURE_AUTH_KEY',  'LzJ}op]mr|6+![P}Ak:uNdJCJZd>(Hx.-Mh#Tz)pCIU#uGEnfFz|f ;;eU%/U^O~');
define('LOGGED_IN_KEY',    '|i|Ux`9<p-h$aFf(qnT:sDO:D1P^wZ$$/Ra@miTJi9G;ddp_<q}6H1)o|a +&JCM');
define('NONCE_KEY',        '%:R{[P|,s.KuMltH5}cI;/k<Gx~j!f0I)m_sIyu+&NJZ)-iO>z7X>QYR0Z_XnZ@|');
define('AUTH_SALT',        'eZyT)-Naw]F8CwA*VaW#q*|.)g@o}||wf~@C-YSt}(dh_r6EbI#A,y|nU2{B#JBW');
define('SECURE_AUTH_SALT', '!=oLUTXh,QW=H `}`L|9/^4-3 STz},T(w}W<I`.JjPi)<Bmf1v,HpGe}T1:Xt7n');
define('LOGGED_IN_SALT',   '+XSqHc;@Q*K_b|Z?NC[3H!!EONbh.n<+=uKR:>*c(u`g~EJBf#8u#R{mUEZrozmm');
define('NONCE_SALT',       'h`GXHhD>SLWVfg1(1(N{;.V!MoE(SfbA_ksP@&`+AycHcAV$+?@3q+rxV{%^VyKT');
```

因此，透過 `wp_verify_nonce`，我們可以確保只有已登入的使用者能使用到某些功能，因為沒登入的話拿不到 nonce。

以上就是 Amelia 的基本架構跟處理流程，是我看過的幾個 plugin 中最為漂亮的一個，東西都整理得很好，架構也切得不錯，不會出現一堆雜七雜八的程式碼，要找東西也很好找，只要去 routes 看一下網址跟對應的 controller，循線找到 command 跟 command handler 即可。

接著，就來談談開頭提到的那三個漏洞。

## CVE-2022-0720: Amelia < 1.0.47 - Customer+ Arbitrary Appointments Update and Sensitive Data Disclosure 

管理訂房相關的模組有兩個，一個叫做 Appointment，另一個叫做 Booking，他們是一對多的關係，一個 Appointment 底下可以對應到多個 Booking，相關路由如下：

`src/Infrastructure/Routes/Booking/Appointment/Appointment.php`

``` php
class Appointment
{
    /**
     * @param App $app
     *
     * @throws \InvalidArgumentException
     */
    public static function routes(App $app)
    {
        $app->get('/appointments', GetAppointmentsController::class);
        $app->get('/appointments/{id:[0-9]+}', GetAppointmentController::class);
        $app->post('/appointments', AddAppointmentController::class);
        $app->post('/appointments/delete/{id:[0-9]+}', DeleteAppointmentController::class);
        $app->post('/appointments/{id:[0-9]+}', UpdateAppointmentController::class);
        $app->post('/appointments/status/{id:[0-9]+}', UpdateAppointmentStatusController::class);
        $app->post('/appointments/time/{id:[0-9]+}', UpdateAppointmentTimeController::class);
    }
}
```

以顯示 appointment 的路由 `/appointments/{id:[0-9]+}` 為例，對應到 `GetAppointmentController`，在 controller 中會去呼叫 `GetAppointmentCommandHandler`，裡面有段程式碼是這樣的：

``` php
$customerAS->removeBookingsForOtherCustomers($user, new Collection([$appointment]));
```

在回傳資料前，會把不屬於自己的 booking 全部都過濾掉，所以看不到其他人的資料，有做好權限管理。

而更新 appointment 的路由對應到的 controller 是 `UpdateAppointmentController`，又對應到了 `UpdateAppointmentCommandHandler.php`，部分程式碼如下：

``` php
try {
    /** @var AbstractUser $user */
    $user = $userAS->authorization(
        $command->getPage() === 'cabinet' ? $command->getToken() : null,
        $command->getCabinetType()
    );
} catch (AuthorizationException $e) {
    $result->setResult(CommandResult::RESULT_ERROR);
    $result->setData(
        [
            'reauthorize' => true
        ]
    );

    return $result;
}

if ($userAS->isProvider($user) && !$settingsDS->getSetting('roles', 'allowWriteAppointments')) {
    throw new AccessDeniedException('You are not allowed to update appointment');
}

// update appointment
```

開頭有檢查了兩樣東西，第一樣是使用者是否登入，所以儘管沒有 nonce 也可以進來這個路由，在這邊還是會被擋下來。第二樣則是使用者的身份，如果是 provider 才會檢查有沒有權限。

在 Amelia 中基本上有幾個角色，消費者（Customer)、服務提供者（Provider）以及管理員（Admin），所以只要我們不是 provider，就可以通過這邊的檢查。

開頭有提過只要透過 Amelia 的外掛隨便預約一個服務，就可以在 WordPress 的系統中註冊一個 customer 的帳號，這組帳號可以登入 WordPress，來管理自己之前的預約。

因此，這邊的權限檢查是有漏洞的，一個 customer 身份的使用者可以通過這邊的檢查，去竄改其他人的預約。雖然看起來好像很普通，但其實使用者在前台修改自己的預約時，用的是另外一個 `/bookings/{id}` 的 API，這個 appointment 的 API 我猜預設是給 provider 使用的，所以才沒考慮到 customer 的狀況。

那除了修改 booking 以外，還可以幹嘛呢？我們來看一下更新完的 response：

![update booking](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p4-update.png)

我們可以看到 response 中有個 info 欄位，裡面有原本消費者的個人資料，包括姓名以及電話等等，這個欄位是在 `src/Application/Services/Reservation/AbstractReservationService.php` 中的 `processBooking` 時儲存的：

``` php
$appointmentData['bookings'][0]['info'] = json_encode(
[
    'firstName' => $appointmentData['bookings'][0]['customer']['firstName'],
    'lastName'  => $appointmentData['bookings'][0]['customer']['lastName'],
    'phone'     => $appointmentData['bookings'][0]['customer']['phone'],
    'locale'    => $appointmentData['locale'],
    'timeZone'  => $appointmentData['timeZone'],
    'urlParams' => !empty($appointmentData['urlParams']) ? $appointmentData['urlParams'] : null,
]
);
```

總結一下，因為權限檢查沒做好，所以 customer 可以更新其他人的預約，並且看到消費者的個人資料，而 appointment 的 ID 是流水號，所以直接列舉一下，就可以把系統中所有人的個資都撈出來。

### 修復方式

在 1.0.47 版中，有做出了兩個變動，第一個是針對我回報的問題，加上了對於 customer 的權限檢查：

``` php
if ($userAS->isCustomer($user)) {
    throw new AccessDeniedException('You are not allowed to update appointment');
}
```

第二個改動則是 routes 的權限檢查，從負面表列變成正面表列，只有幾個特定的 command 不需登入：

``` php
public function validateNonce($request)
{
    if ($request->getMethod() === 'POST' &&
        !self::getToken() &&
        !($this instanceof LoginCabinetCommand) &&
        !($this instanceof AddBookingCommand) &&
        !($this instanceof AddStatsCommand) &&
        !($this instanceof MolliePaymentCommand) &&
        !($this instanceof MolliePaymentNotifyCommand) &&
        !($this instanceof PayPalPaymentCommand) &&
        !($this instanceof PayPalPaymentCallbackCommand) &&
        !($this instanceof RazorpayPaymentCommand) &&
        !($this instanceof WooCommercePaymentCommand) &&
        !($this instanceof SuccessfulBookingCommand)
    ) {
        return wp_verify_nonce($request->getQueryParams()['ameliaNonce'], 'ajax-nonce');
    }
    return true;
}
```

## CVE-2022-0825: Amelia < 1.0.49 - Customer+ Arbitrary Appointments Status Update

這個漏洞跟上一個類似，都是屬於權限管理的問題，而這個漏洞的路由是 `$app->post('/appointments/status/{id:[0-9]+}', UpdateAppointmentStatusController::class);`，對應到的程式碼在 `src/Application/Commands/Booking/Appointment/UpdateAppointmentStatusCommandHandler.php`，開頭有先做權限檢查：

``` php
if (!$this->getContainer()->getPermissionsService()->currentUserCanWriteStatus(Entities::APPOINTMENTS)) {
    throw new AccessDeniedException('You are not allowed to update appointment status');
}

// update appointment
```

我們繼續往下追，去看看 `currentUserCanWriteStatus` 是怎麼實作的：

``` php
public function currentUserCanWriteStatus($object)
{
    return $this->userCan($this->currentUser, $object, self::WRITE_STATUS_PERMISSIONS);
}
```

再往下追，找到 `userCan`：

``` php
public function userCan($user, $object, $permission)
{
    if ($user instanceof Admin) {
        return true;
    }
    return $this->permissionsChecker->checkPermissions($user, $object, $permission);
}
```

再往下一層，在 `src/Infrastructure/WP/PermissionsService/PermissionsChecker.php` 中可以看到 `checkPermissions` 的實作：

``` php
public function checkPermissions($user, $object, $permission)
{
    // Admin can do all
    if ($user instanceof Admin) {
        return true;
    }

    // Get the WP role name of the user, rollback to customer by default
    $wpRoleName = $user !== null ? 'wpamelia-' . $user->getType() : 'wpamelia-customer';
    // Get the wp name of capability we are looking for.
    $wpCapability = "amelia_{$permission}_{$object}";

    if ($user !== null && $user->getExternalId() !== null) {
        return user_can($user->getExternalId()->getValue(), $wpCapability);
    }

    // If user is guest check does it have capability
    $wpRole = get_role($wpRoleName);
    return $wpRole !== null && isset($wpRole->capabilities[$wpCapability]) ?
        (bool)$wpRole->capabilities[$wpCapability] : false;
}
```

這邊有個值得注意的地方，就是如果 user 是 `null` 的話，會被當成 `customer` 來看待，而實際檢查有沒有權限要看 capabilities 這個 table，在 `src/Infrastructure/WP/config/Roles.php`：

``` php
// Customer
[
    'name'         => 'wpamelia-customer',
    'label'        => __('Amelia Customer', 'amelia'),
    'capabilities' => [
        'read'                             => true,
        'amelia_read_menu'                 => true,
        'amelia_read_calendar'             => true,
        'amelia_read_appointments'         => true,
        'amelia_read_events'               => true,
        'amelia_write_status_appointments' => true,
        'amelia_write_time_appointments'   => true,
    ]
],
```

其中 `amelia_write_status_appointments` 是 true，代表 customer 有權限更新狀態。

剩下的部分就跟上一個漏洞一樣了，更新 appointment 之後資料會整包回傳，透過 info 這個欄位可以看到消費者的個人資料。另外，這個漏洞在 1.0.47 以前會是 pre-auth 的，因為 1.0.47 以前 routes 的權限檢查還沒變成正面表列，所以沒登入也可以存取到這個指令，再加上 user 是 null 的話預設是消費者身份，完成了整條攻擊鏈的串接：

![update booking status](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p5-unauth-status.png)

### 修復方式

在 1.0.49 版中，移除了 customer 的 `amelia_write_status_appointments` 這個權限。

## CVE-2022-0837: Amelia < 1.0.48 - Customer+ SMS Service Abuse and Sensitive Data Disclosure

來看最後一個權限檢查相關漏洞，出問題的路由是 `$app->post('/notifications/sms', SendAmeliaSmsApiRequestController::class);`，對應到的是 `SendAmeliaSmsApiRequestCommandHandler`：

``` php
public function handle(SendAmeliaSmsApiRequestCommand $command)
{
    $result = new CommandResult();

    /** @var SMSAPIServiceInterface $smsApiService */
    $smsApiService = $this->getContainer()->get('application.smsApi.service');

    // Call method dynamically and pass data to the function. Method name is the request field.
    $apiResponse = $smsApiService->{$command->getField('action')}($command->getField('data'));

    $result->setResult(CommandResult::RESULT_SUCCESS);
    $result->setMessage('Amelia SMS API request successful');
    $result->setData($apiResponse);

    return $result;
}
```

可以看到這邊沒有做任何的權限檢查，而我們可以控制傳到這邊的參數：

``` php
$apiResponse = $smsApiService->{$command->getField('action')}($command->getField('data'));
```

在 smsApiService 中有不少方法，而其中只有一個參數的包括可以拿到管理員個人資訊的 `getUserInfo`，可以拿到付款紀錄的 `getPaymentHistory`，以及可以發送測試簡訊的 `testNotification`：

``` php
public function getUserInfo()
{
    $route = 'auth/info';

    return $this->sendRequest($route, true);
}

public function getPaymentHistory($data)
{
    $route = '/payment/history';

    return $this->sendRequest($route, true, $data);
}

public function testNotification($data)
{
    $route = '/sms/send';

    /** @var SettingsService $settingsService */
    $settingsService = $this->container->get('domain.settings.service');

    /** @var EmailNotificationService $notificationService */
    $notificationService = $this->container->get('application.emailNotification.service');

    /** @var PlaceholderService $placeholderService */
    $placeholderService = $this->container->get("application.placeholder.{$data['type']}.service");

    $appointmentsSettings = $settingsService->getCategorySettings('appointments');

    $notification = $notificationService->getById($data['notificationTemplate']);

    $dummyData = $placeholderService->getPlaceholdersDummyData('sms');

    $isForCustomer = $notification->getSendTo()->getValue() === NotificationSendTo::CUSTOMER;

    $placeholderStringRec  = 'recurring' . 'Placeholders' . ($isForCustomer ? 'Customer' : '') . 'Sms';
    $placeholderStringPack = 'package' . 'Placeholders' . ($isForCustomer ? 'Customer' : '') . 'Sms';

    $dummyData['recurring_appointments_details'] = $placeholderService->applyPlaceholders($appointmentsSettings[$placeholderStringRec], $dummyData);
    $dummyData['package_appointments_details']   =  $placeholderService->applyPlaceholders($appointmentsSettings[$placeholderStringPack], $dummyData);


    $body = $placeholderService->applyPlaceholders(
        $notification->getContent()->getValue(),
        $dummyData
    );

    $data = [
        'to'   => $data['recipientPhone'],
        'from' => $settingsService->getSetting('notifications', 'smsAlphaSenderId'),
        'body' => $body
    ];

    return $this->sendRequest($route, true, $data);
}
```

實際測試截圖：

![sms1](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p6-sms1.png)

發送測試簡訊：

![sms2](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p7-sms2.png)

發送測試簡訊也是要扣錢的，我們只要一直打這個 endpoint，就會一直發送測試簡訊然後一直扣款，可以利用這個漏洞把管理員的錢燒光。

### 修復方式

在 1.0.48 版中，於 controller 內加上了權限檢查：

``` php
if (!$this->getContainer()->getPermissionsService()->currentUserCanWrite(Entities::NOTIFICATIONS)) {
    throw new AccessDeniedException('You are not allowed to send test email');
}
```

## 總結

當開發的軟體變得愈來愈複雜，開發者往往容易忽略一些基本的權限檢查，以及對於權限有著錯誤的假設。舉例來說，雖然 appointment 相關的 API 是給 provider 用的，前端的消費者看不到這些 API，但是 WordPress 外掛的程式碼都是開放的，任何人只要看了程式碼，都能找出所有的 API 路徑。

在實作各種功能時，要記得把權限檢查放在第一位，確認當前的使用者對於欲操作的資源有權限以後，才繼續後面的流程。

最後附上時間軸：

`2022-02-20` 透過 WPScan 回報更新預約漏洞，保留 CVE-2022-0720
`2022-03-01` 發布 1.0.47 版，修復 CVE-2022-0720，部分資訊公開於 [WPScan](https://wpscan.com/vulnerability/435ef99c-9210-46c7-80a4-09cd4d3d00cf)
`2022-03-02` 透過 WPScan 回報更新預約狀態漏洞，保留 CVE-2022-0825
`2022-03-03` 透過 WPScan 回報 SMS 相關漏洞，保留 CVE-2022-0837
`2022-03-09` 發布 1.0.48 版，修復 CVE-2022-0837，部分資訊公開於 [WPScan](https://wpscan.com/vulnerability/0882e5c0-f319-4994-9346-aa18438fda6a)
`2022-03-14` 發布 1.0.49 版，修復 CVE-2022-0825，部分資訊公開於 [WPScan](https://wpscan.com/vulnerability/1a92a65f-e9df-41b5-9a1c-8e24ee9bf50e)
`2022-03-26` 漏洞細節公開於 WPScan
`2022-03-30` 文章發佈


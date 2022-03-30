---
title: Sensitive Data Disclosure in WordPress Plugin Amelia < 1.0.49
date: 2022-03-30
tags: [Security]
author: huli
layout: en/layouts/post.njk
image: /img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/cover-en.png
---

<!-- summary -->
[Amelia](https://tw.wordpress.org/plugins/ameliabooking/) is a WordPress plugin for booking systems developed by TNS. With 40,000+ active installations, it has been used for the clinic, hair salon, tutor, and so on.

In March, we studied the source code of Amelia and found three vulnerabilities in the end<!-- summary -->:

* `CVE-2022-0720` Amelia < 1.0.47 - Customer+ Arbitrary Appointments Update and Sensitive Data Disclosure (CVSS 6.3)
* `CVE-2022-0825` Amelia < 1.0.49 - Customer+ Arbitrary Appointments Status Update (CVSS 6.3)
* `CVE-2022-0837` Amelia < 1.0.48 - Customer+ SMS Service Abuse and Sensitive Data Disclosure (CVSS 5.4)

By exploiting these vulnerabilities, a malicious actor could get all the customer's data, including name, phone, and booking details.

In this article, I will talk about the code structure of Amelia and the details of three vulnerabilities.

## A Brief Introduction to Amelia

After installing Amelia plugin, the admin can create a new booking page:

![intro1](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p1-intro-1.png)

As a customer, basic personal information like name and email should be provided before making a booking:

![intro2](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p2-intro-2.png)

After the customer finished booking, Amelia will create a new low-privilege account for it and send a reset password email to enable the account.

Then, the customer can log into WordPress and manage their bookings:

![intro3](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p3-intro-3.png)

## How WordPress Plugin Works and the Code Structure of Amelia

When developing a WordPress plugin, the developer uses `add_action` to add a hook to the WordPress system. The hook function will be invoked when the corresponding action has been called.

The action starts with `wp_ajax_nopriv_` can be invoked via `wp-admin/admin-ajax.php`, following is the excerpt of [admin-ajax.php](https://github.com/WordPress/WordPress/blob/master/wp-admin/admin-ajax.php):

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

Amelia registered two hooks in `ameliabooking.php`:

``` php
/** Isolate API calls */
add_action('wp_ajax_wpamelia_api', array('AmeliaBooking\Plugin', 'wpAmeliaApiCall'));
add_action('wp_ajax_nopriv_wpamelia_api', array('AmeliaBooking\Plugin', 'wpAmeliaApiCall'));
```

The difference between `wp_ajax_wpamelia_api` and `wp_ajax_nopriv_wpamelia_api` is that the former requires authenticated user to perform the action, while the latter requires none.

As you can see, many plugins choose to handle both actions in the same place, to deal with the permission check itself.

In `wpAmeliaApiCall`, a few routes have been registered:

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

There are a few files in `src/Infrastructure/Routes` folder for handling routing. For example, `src/Infrastructure/Routes/User/User.php` is responsible for the routing of `/users`:

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

Usually, the routing is related to the URL path directly, but Amelia is a bit different because it's a WordPress plugin.

In Amelia, it's based on the query string, instead of the path of URL(`src/Infrastructure/ContainerConfig/request.php`):

``` php
<?php

use Slim\Http\Request;
use Slim\Http\Uri;

$entries['request'] = function (AmeliaBooking\Infrastructure\Common\Container $c) {

    $curUri = Uri::createFromEnvironment($c->get('environment'));
    // Note: AMELIA_ACTION_SLUG = "action=wpamelia_api&call="
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

For example, when the request URL is `/wordpress/wp-admin/admin-ajax.php?action=wpamelia_api&call=/users/wp-users`, query string is `action=wpamelia_api&call=/users/wp-users`. After AMELIA_ACTION_SLUG has been replaced with empty string, the remaining part is `/users/wp-users`, that's how the system handles routes.

Let's check `GetWPUsersController::class`, the corresponding controller for `/users/wp-users`:

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

We can see a classic design pattern here: Command Pattern, every action is a command. The command will be processed by its parent class `AmeliaBooking\Application\Controller\Controller`:

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

After instantiated the command, it called `$this->commandBus->handle($command)`. Following is the excerpt of `src/Infrastructure/ContainerConfig/command.bus.php`:

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

We can see that the `GetWPUsersCommand` is taken by `User\GetWPUsersCommandHandler`, so the main logic is inside this file: 

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

Besides, you can also see the part of permission check:

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

If the command is about deleting, need to pass the check of `wp_verify_nonce`, what is it?

`wp_verify_nonce` is a function provided by WordPress to perform security check. This nonce is generated in admin page via `var wpAmeliaNonce = '<?php echo wp_create_nonce('ajax-nonce'); ?>';`, and the nonce is actually the result of hashing.

In theory, it's not possible to spoof the nonce unless you can get the salt, which is generated randomly at install time:

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

So, we can ensure that only authenticated users have the ability to use certain features via `wp_verify_nonce`.

Phew! That's all about the structure of Amelia. It's elegant compared to other plugins, and it's easy to find what you want.

Finally, it's time to talk about the vulnerabilities.

## CVE-2022-0720: Amelia < 1.0.47 - Customer+ Arbitrary Appointments Update and Sensitive Data Disclosure 

There are two modules for managing the booking. One is "Appointment", the other is "Booking", it's a one-to-many relationship. One appointment can have multiple bookings.

Below are the routes for the appointment module:

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

Take `/appointments/{id:[0-9]+}` as an example, you can't see other customer's booking because there is a line to remove it in `GetAppointmentCommandHandler`:

``` php
$customerAS->removeBookingsForOtherCustomers($user, new Collection([$appointment]));
```

And here is the file for updating appointment(`UpdateAppointmentCommandHandler.php`):

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

In the beginning, there are two checks. The first one is to check if the user is logged in, and the second one is to check if the user's role is "Provider".

There are a few roles in Amelia: Customer, (Service) Provider, and Admin. So, as a customer, we can pass the check and update other customer's appointments!

When the customer manages their bookings, they use another module called "booking" because the appointment module is for providers. I guess that's why there is no permission check for the customer role because the developer has a false assumption that the customer won't access this endpoint at all.

What can we do besides updating the booking? Let's see the response:

![update booking](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p4-update.png)

There is a field called "info", it contains the personal data of the customer who booked it. This field is added by `processBooking` in `src/Application/Services/Reservation/AbstractReservationService.php` :

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

To sum up, a customer can update other customers' appointments and see their personal information due to a flawed permission check. Moreover, the appointment ID is a serial number so it's easy to enumerate.

### Remediation

In 1.0.47, they made two changes.

The first one is to implement the permission check for customer:

``` php
if ($userAS->isCustomer($user)) {
    throw new AccessDeniedException('You are not allowed to update appointment');
}
```

The other is about the permission check for routes, from the positive list to the negative list, only a few commands are accessible without logging in:

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

This vulnerability is quite similar to the previous one, it's also about permission check.

The route for updating appointment status is `$app->post('/appointments/status/{id:[0-9]+}', UpdateAppointmentStatusController::class);`, and the main handler is `src/Application/Commands/Booking/Appointment/UpdateAppointmentStatusCommandHandler.php`.

There is a permission check in the very beginning:

``` php
if (!$this->getContainer()->getPermissionsService()->currentUserCanWriteStatus(Entities::APPOINTMENTS)) {
    throw new AccessDeniedException('You are not allowed to update appointment status');
}

// update appointment
```

Let's dive in and see what is the implementation of `currentUserCanWriteStatus`:

``` php
public function currentUserCanWriteStatus($object)
{
    return $this->userCan($this->currentUser, $object, self::WRITE_STATUS_PERMISSIONS);
}
```

Keep diving, check `userCan`：

``` php
public function userCan($user, $object, $permission)
{
    if ($user instanceof Admin) {
        return true;
    }
    return $this->permissionsChecker->checkPermissions($user, $object, $permission);
}
```

In `src/Infrastructure/WP/PermissionsService/PermissionsChecker.php`, we can find the implementation of `checkPermissions`:

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

It was noteworthy that if the user is `null`, it will be treated as a `customer`. To check if a role has certain permission, we need to see the `capabilities` table in  `src/Infrastructure/WP/config/Roles.php`:

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

`amelia_write_status_appointments` is true, so the customer has permission to update the appointment status.

The rest part is just like the last vulnerability, the response of updating the appointment has a field called `info`, which contains the personal information of the customer who booked it.

By the way, the vulnerability is pre-auth before 1.0.48, because in 1.0.47 the permission check for routes is incomplete, an unauthenticated user can access this endpoint as well.

![update booking status](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p5-unauth-status.png)

### Remediation

Customer role has no permission of `amelia_write_status_appointments` since 1.0.49.

## CVE-2022-0837: Amelia < 1.0.48 - Customer+ SMS Service Abuse and Sensitive Data Disclosure

Let's see the last vulnerability, it's still about permission check.

The route is `$app->post('/notifications/sms', SendAmeliaSmsApiRequestController::class);`, and the handler is `SendAmeliaSmsApiRequestCommandHandler`:

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

As you see, there is no permission check at all, and we can control the parameters here:

``` php
$apiResponse = $smsApiService->{$command->getField('action')}($command->getField('data'));
```

There are few methods with only one parameter, including `getUserInfo`, `getPaymentHistory` and `testNotification`:

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

Screenshot:

![sms1](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p6-sms1.png)

Send test notification:

![sms2](/img/posts/huli/wordpress-plugin-amelia-sensitive-information-disclosure/p7-sms2.png)

Sending test notifications still costs real money, so we can drain out the account by keep calling this API.

### Remediation

In 1.0.48, they added permission check in the controller:

``` php
if (!$this->getContainer()->getPermissionsService()->currentUserCanWrite(Entities::NOTIFICATIONS)) {
    throw new AccessDeniedException('You are not allowed to send test email');
}
```

## Conclusion

When the software becomes more and more complex, developers usually overlook some basic permission checks and have false assumptions sometimes.

For example, although front-end customers can't see appointments-related API because it's for providers, we can still find those API endpoints by looking at the source code in WordPress SVN.

Developers should be cautions with those authorizations when implementing those features, to make sure the current user has permission to do certain operations.

## Disclosure timeline

`2022-02-20` Report updating appointment vulnerability via WPScan, reserved CVE-2022-0720
`2022-03-01` 1.0.47 is published, fixed CVE-2022-0720. [WPScan](https://wpscan.com/vulnerability/435ef99c-9210-46c7-80a4-09cd4d3d00cf)
`2022-03-02` Report updating appointment vulnerability via WPScan, reserved CVE-2022-0825
`2022-03-03` Report SMS related vulnerability via WPScan, reserved CVE-2022-0837
`2022-03-09` 1.0.48 is published, fixed CVE-2022-0837. [WPScan](https://wpscan.com/vulnerability/0882e5c0-f319-4994-9346-aa18438fda6a)
`2022-03-14` 1.0.49 is published, fixed CVE-2022-0825. [WPScan](https://wpscan.com/vulnerability/1a92a65f-e9df-41b5-9a1c-8e24ee9bf50e)
`2022-03-26` Details and POC have been disclosed on WPScan
`2022-03-30` Blog post published


<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),

    'guard' => ['web'],

    'expiration' => null,

    'middleware' => [
        'authenticate_session' => true,
        'encrypt_cookies' => false,
        'verify_csrf_token' => false,
    ],
];

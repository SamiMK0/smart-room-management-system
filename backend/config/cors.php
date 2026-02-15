<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Change this in production
    // 'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [], // Important for file downloads,
    'max_age' => 0,
    'supports_credentials' => true,
];

<?php
/**
 * Configuration template file
 * Copy this file to config.php and add your actual API keys
 * The config.php file is ignored by Git for security
 */

// OpenAI API Configuration
define('OPENAI_API_KEY', 'your-openai-api-key-here');
define('OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions');

// Weather API Configuration
define('WEATHER_API_ENABLED', true);
define('NASA_POWER_API_ENABLED', true);

// Application Settings
define('CACHE_DURATION', 300); // 5 minutes
define('MAX_SITES_PER_REQUEST', 20);

// Feature Flags
define('ENABLE_AI_ANALYSIS', true);
define('ENABLE_ADVANCED_RECOMMENDATIONS', true);

// Error Reporting (set to false in production)
define('DEBUG_MODE', false);

// Logging Configuration
define('LOG_API_CALLS', true);
define('LOG_ERRORS', true);
?> 
<?php
/**
 * Configuration template file
 * Copy this file to config.php and add your actual API keys
 * The config.php file is ignored by Git for security
 */

// OpenAI API Configuration
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: '');
define('OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions');

// Weather API Configuration
define('WEATHER_API_ENABLED', true);
define('NASA_POWER_API_ENABLED', true);

// Application Settings
define('CACHE_DURATION', 300); // 5 minutes
define('MAX_SITES_PER_REQUEST', 20);

// Feature Flags
define('ENABLE_AI_ANALYSIS', getenv('ENABLE_AI_ANALYSIS') ?: false);
define('ENABLE_ADVANCED_RECOMMENDATIONS', true);

// Error Reporting (set to false in production)
define('DEBUG_MODE', getenv('DEBUG_MODE') ?: false);

// Logging Configuration
define('LOG_API_CALLS', true);
define('LOG_ERRORS', true);

// Fallback configuration if config.php doesn't exist
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: '');
define('ENABLE_AI_ANALYSIS', getenv('ENABLE_AI_ANALYSIS') ?: false);
define('DEBUG_MODE', getenv('DEBUG_MODE') ?: false);
?> 
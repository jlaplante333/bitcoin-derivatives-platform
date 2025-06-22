<?php
header('Content-Type: application/json');

// Load configuration
if (file_exists('config.php')) {
    require_once 'config.php';
} else {
    // Fallback configuration if config.php doesn't exist
    define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: '');
    define('ENABLE_AI_ANALYSIS', getenv('ENABLE_AI_ANALYSIS') ?: false);
    define('DEBUG_MODE', getenv('DEBUG_MODE') ?: false);
}

$savedDataFile = 'saved_data.json';
$forceRefresh = isset($_GET['force_refresh']) && $_GET['force_refresh'] === 'true';
$specificSiteName = isset($_GET['site_name']) ? $_GET['site_name'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;

// --- ACTION HANDLING ---

if ($action === 'get_ai_recommendation') {
    handleAIAction();
}

// --- DATA LOADING ---

// If not forcing a full refresh, and the file exists, try to use it.
if (!$forceRefresh && file_exists($savedDataFile)) {
    $savedData = json_decode(file_get_contents($savedDataFile), true);
    if ($savedData && isset($savedData['sites']) && isset($savedData['bestSite'])) {
        // If a specific site is requested with force_refresh, we'll fall through to the main logic
        // but only for that site. This part handles loading from cache.
        if (!$specificSiteName) {
            echo json_encode($savedData);
            exit;
        }
    }
}


// --- MAIN DATA FETCHING LOGIC ---

$sitesToAnalyze = [
    ['lat' => 31.8640, 'lon' => -101.4812, 'name' => "Garden City, TX", 'type' => "Wind + Grid"],
    ['lat' => 31.7833, 'lon' => -102.2046, 'name' => "McCamey, TX", 'type' => "Wind + Grid"],
    ['lat' => 32.3357, 'lon' => -97.7335, 'name' => "Wolf Hollow, TX", 'type' => "Natural Gas"],
    ['lat' => 31.0000, 'lon' => -101.0000, 'name' => "Texas Oil Field", 'type' => "Flared Gas"],
    ['lat' => 46.1416, 'lon' => -98.4662, 'name' => "Ellendale, ND", 'type' => "Wind + Grid"],
    ['lat' => 46.9103, 'lon' => -98.7039, 'name' => "Jamestown, ND", 'type' => "Wind + Grid"],
    ['lat' => 46.0000, 'lon' => -102.0000, 'name' => "ND Oil Field", 'type' => "Flared Gas"],
    ['lat' => 41.5000, 'lon' => -99.6800, 'name' => "Nebraska Solar", 'type' => "Solar + Grid"],
    ['lat' => 40.6995, 'lon' => -99.0819, 'name' => "Kearney, NE", 'type' => "Grid"],
    ['lat' => 36.6000, 'lon' => -88.3121, 'name' => "Murray, KY", 'type' => "Grid"],
    ['lat' => 40.7334, 'lon' => -80.9430, 'name' => "Hannibal, OH", 'type' => "Grid"],
    ['lat' => 40.3137, 'lon' => -80.7530, 'name' => "Hopedale, OH", 'type' => "Grid"],
    ['lat' => 41.0442, 'lon' => -83.6499, 'name' => "Findlay, OH", 'type' => "Grid"],
    ['lat' => -25.4078, 'lon' => -54.5892, 'name' => "Paraguay Hydro", 'type' => "Hydroelectric"],
    ['lat' => 32.3357, 'lon' => -97.7335, 'name' => "Granbury, TX", 'type' => "Natural Gas"],
    ['lat' => 60.1700, 'lon' => 24.9400, 'name' => "Finland Pilot", 'type' => "Grid + Heat Recycle"],
    ['lat' => 24.4539, 'lon' => 54.3773, 'name' => "Masdar City, Abu Dhabi", 'type' => "Grid + Clean Energy Certs"],
    ['lat' => 24.5149, 'lon' => 54.3900, 'name' => "Mina Zayed, Abu Dhabi", 'type' => "Grid + Clean Energy Certs"]
];

if ($specificSiteName) {
    $sitesToAnalyze = array_filter($sitesToAnalyze, function($site) use ($specificSiteName) {
        return $site['name'] === $specificSiteName;
    });
}

$allSitesData = fetchAllSitesDataConcurrently($sitesToAnalyze);

// If we only updated one site, we need to merge it back into the cached data
if ($specificSiteName && !empty($allSitesData)) {
    $updatedSiteData = $allSitesData[0];
    $cachedData = json_decode(file_get_contents($savedDataFile), true);
    
    foreach ($cachedData['sites'] as $key => $site) {
        if ($site['name'] === $specificSiteName) {
            $cachedData['sites'][$key] = $updatedSiteData;
            break;
        }
    }
    $allSitesData = $cachedData['sites'];
}

// Find best site
$bestSiteData = null;
$maxAvgKwh = 0;
foreach ($allSitesData as $site) {
    if ($site && $site['avg_daily_kwh'] > $maxAvgKwh) {
        $maxAvgKwh = $site['avg_daily_kwh'];
        $bestSiteData = $site;
    }
}

$finalData = [
    'sites' => $allSitesData,
    'bestSite' => $bestSiteData
];

file_put_contents($savedDataFile, json_encode($finalData, JSON_PRETTY_PRINT | JSON_INVALID_UTF8_IGNORE));

echo json_encode($finalData);


// --- CONCURRENT DATA FETCHING ---

function fetchAllSitesDataConcurrently($sites) {
    $mh = curl_multi_init();
    $handles = [];

    foreach ($sites as $index => $site) {
        $nasa_url = "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=SB&start=20240101&end=20240131&latitude={$site['lat']}&longitude={$site['lon']}&format=JSON";
        $weather_url = "https://api.open-meteo.com/v1/forecast?latitude={$site['lat']}&longitude={$site['lon']}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=auto";

        $nasa_ch = curl_init($nasa_url);
        $weather_ch = curl_init($weather_url);

        curl_setopt($nasa_ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($weather_ch, CURLOPT_RETURNTRANSFER, true);

        curl_multi_add_handle($mh, $nasa_ch);
        curl_multi_add_handle($mh, $weather_ch);

        $handles[$index] = [
            'nasa_ch' => $nasa_ch,
            'weather_ch' => $weather_ch,
            'site_config' => $site
        ];
    }

    $running = null;
    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh);
    } while ($running > 0);

    $results = [];
    foreach ($handles as $index => $handle_info) {
        $nasa_response = curl_multi_getcontent($handle_info['nasa_ch']);
        $weather_response = curl_multi_getcontent($handle_info['weather_ch']);
        $site_config = $handle_info['site_config'];
        
        $results[] = processSiteData(
            json_decode($nasa_response, true),
            json_decode($weather_response, true),
            $site_config
        );

        curl_multi_remove_handle($mh, $handle_info['nasa_ch']);
        curl_multi_remove_handle($mh, $handle_info['weather_ch']);
    }

    curl_multi_close($mh);
    return $results;
}


// --- DATA PROCESSING FUNCTIONS ---

function processSiteData($solarApiResponse, $weatherData, $siteConfig) {
    if (!$solarApiResponse || !isset($solarApiResponse['properties']['parameter']['ALLSKY_SFC_SW_DWN'])) {
        return null;
    }
    
    $solarData = $solarApiResponse['properties']['parameter']['ALLSKY_SFC_SW_DWN'];
    $panelArea = 1000;
    
    $totalKWh = 0;
    foreach ($solarData as $irradiance) {
        if ($irradiance < 0) continue;
        $totalKWh += ($irradiance * 0.277778) * $panelArea * 0.20; // MJ to kWh conversion
    }
    
    $avgDailyKWh = count($solarData) > 0 ? $totalKWh / count($solarData) : 0;
    
    $score = ($avgDailyKWh / 500) + (rand(0, 10) / 10);
    $performance_score = round(min(max($score, 1), 10), 1);

    // Mock hardware data
    $gpu_total = rand(500, 2000);
    $gpu_used = rand(100, $gpu_total);
    $battery_capacity_mwh = rand(5, 20);

    return [
        'name' => $siteConfig['name'],
        'lat' => $siteConfig['lat'],
        'lon' => $siteConfig['lon'],
        'energy_type' => $siteConfig['type'],
        'total_kwh' => $totalKWh,
        'avg_daily_kwh' => $avgDailyKWh,
        'annual_kwh_yr' => $avgDailyKWh * 365,
        'weather' => $weatherData,
        'performance_score' => $performance_score,
        'recommendation' => generateBasicRecommendation($avgDailyKWh, $weatherData),
        'hardware' => [
            'gpu_total' => $gpu_total,
            'gpu_used' => $gpu_used,
            'battery_brand' => 'LG',
            'battery_capacity_mwh' => $battery_capacity_mwh
        ]
    ];
}


// --- AI AND RECOMMENDATION FUNCTIONS ---

function handleAIAction() {
    if (!defined('ENABLE_AI_ANALYSIS') || !ENABLE_AI_ANALYSIS || empty(OPENAI_API_KEY)) {
        echo json_encode(['recommendation' => 'AI analysis is not enabled or configured.']);
        exit;
    }
    
    $postData = json_decode(file_get_contents('php://input'), true);
    $sites = $postData['sites'] ?? [];
    $excludedSites = $postData['excludedSites'] ?? [];
    $searchType = $postData['searchType'] ?? 'location';
    
    if (empty($sites)) {
        $prompt = "As Mara, find the most optimal places for LG Battery installation. Consider renewable energy sources, grid stability, and land availability. Provide a brief recommendation of 2-3 locations.";
    } else {
        if ($searchType === 'facility') {
            $prompt = "As Mara, analyze this site data to find the best location for building a new energy facility. Consider factors like energy potential, infrastructure access, land availability, and regulatory environment. First line: 'Top Recommendation: [Site Name]'. Then provide a brief recommendation of the top 2-3 locations for facility construction.\n\n";
        } elseif ($searchType === 'analysis') {
            $prompt = "As Mara, analyze the energy patterns and provide insights about these sites. Consider energy output, performance scores, weather conditions, and market opportunities. Provide a brief analysis of energy trends and recommendations.\n\n";
        } else {
            $prompt = "As Mara, analyze this site data for LG Battery installation. First line: 'Top Recommendation: [Site Name]'. Then provide a brief recommendation of the top 2-3 locations.\n\n";
        }

        if (!empty($excludedSites)) {
            $prompt .= "Exclude: " . implode(', ', $excludedSites) . ".\n\n";
        }

        $prompt .= "Sites:\n";
        foreach ($sites as $site) {
            if (!$site || in_array($site['name'], $excludedSites)) continue;
            $temp = $site['weather']['current']['temperature_2m'] ?? 'N/A';
            $prompt .= "- {$site['name']}: {$site['energy_type']}, Score: {$site['performance_score']}, {$temp}°C, " . round($site['avg_daily_kwh']) . " kWh\n";
        }
    }
    
    $aiResponse = callOpenAI($prompt);
    
    // --- Parse AI Response to find location ---
    $recommendedSite = null;
    $photoUrl = null;
    $lines = explode("\n", $aiResponse);
    if (preg_match('/Top Recommendation: (.*)/i', $lines[0], $matches)) {
        $recommendedSiteName = trim($matches[1]);
        // Find the full site data
        foreach($sites as $site) {
            if ($site && strcasecmp($site['name'], $recommendedSiteName) == 0) {
                $recommendedSite = $site;
                $photoUrl = generateLocationPhoto($recommendedSiteName);
                break;
            }
        }
    }
    
    echo json_encode([
        'recommendation' => $aiResponse,
        'location' => $recommendedSite,
        'photoUrl' => $photoUrl
    ]);
    exit;
}

function generateLocationPhoto($locationName) {
    if (!defined('OPENAI_API_KEY') || empty(OPENAI_API_KEY)) {
        return null;
    }
    
    $prompt = "A photorealistic, wide-angle landscape photo of {$locationName}.";

    $ch = curl_init('https://api.openai.com/v1/images/generations');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "model" => "dall-e-2",
        "prompt" => $prompt,
        "n" => 1,
        "size" => "512x512"
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . OPENAI_API_KEY
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    return $data['data'][0]['url'] ?? null;
}

function callOpenAI($prompt) {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "model" => "gpt-3.5-turbo",
        "messages" => [
            ["role" => "system", "content" => "You are Mara, an AI energy expert. Keep responses brief and to the point."],
            ["role" => "user", "content" => $prompt]
        ],
        "max_tokens" => 150,
        "temperature" => 0.5
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . OPENAI_API_KEY
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200) {
        if(DEBUG_MODE) {
            error_log("OpenAI API Error: HTTP $http_code, Response: $response");
        }
        return "Error communicating with AI service.";
    }
    
    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? 'Could not retrieve a valid recommendation.';
}

function generateBasicRecommendation($avgDailyKwh, $weatherData) {
    $temp = $weatherData['current']['temperature_2m'] ?? 25;
    if ($avgDailyKwh > 4000) {
        if ($temp > 10 && $temp < 30) return "Excellent solar potential with ideal operating temperatures.";
        return "High solar output, but monitor temperatures.";
    } elseif ($avgDailyKwh > 2000) {
        return "Good solar potential. Suitable for most operations.";
    }
    return "Moderate solar potential. Consider for smaller scale or supplementary power.";
} 
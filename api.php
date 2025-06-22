<?php
header('Content-Type: application/json');

// Load configuration
if (file_exists('config.php')) {
    require_once 'config.php';
} else {
    // Fallback configuration if config.php doesn't exist
    define('OPENAI_API_KEY', '');
    define('ENABLE_AI_ANALYSIS', false);
    define('ENABLE_ADVANCED_RECOMMENDATIONS', false);
    define('DEBUG_MODE', false);
}

// Check if we have saved data
$savedDataFile = 'saved_data.json';

// If force_refresh is requested, always fetch fresh data
$forceRefresh = isset($_GET['force_refresh']) && $_GET['force_refresh'] === 'true';

// Check if we're updating a specific site
$specificSiteName = isset($_GET['site_name']) ? $_GET['site_name'] : null;

// Handle AI Action
$action = isset($_GET['action']) ? $_GET['action'] : null;
if ($action === 'get_ai_recommendation') {
    if (defined('ENABLE_AI_ANALYSIS') && ENABLE_AI_ANALYSIS && !empty(OPENAI_API_KEY)) {
        
        $postData = json_decode(file_get_contents('php://input'), true);
        $sites = $postData['sites'] ?? [];

        if (empty($sites)) {
            $prompt = "As Mara, an expert AI in energy infrastructure, find the most optimal places for a large-scale LG Battery installation. Consider factors like proximity to renewable energy sources (solar, wind), grid stability, and land availability. Provide a brief, actionable recommendation of 2-3 locations in general terms, as no specific site data is available.";
        } else {
            $prompt = "As Mara, an expert AI in energy infrastructure, analyze the following site data to find the most optimal places for a large-scale LG Battery installation. Consider all factors including energy type, performance score, weather (especially temperature), and existing hardware. Provide a brief, actionable recommendation of the top 2-3 locations from the list provided. Justify your choices with the data.\n\n";
            $prompt .= "Site Data:\n";
            foreach($sites as $site) {
                $temp = $site['weather']['current']['temperature_2m'] ?? 'N/A';
                $prompt .= "- Name: {$site['name']}, Type: {$site['energy_type']}, Score: {$site['performance_score']}, Temp: {$temp}°C, Avg kWh: " . round($site['avg_daily_kwh']) . "\n";
            }
        }
        
        $recommendation = callOpenAI($prompt);
        echo json_encode(['recommendation' => $recommendation]);

    } else {
        echo json_encode(['recommendation' => 'AI analysis is not enabled or configured.']);
    }
    exit;
}

if (!$forceRefresh && file_exists($savedDataFile)) {
    // Load saved data
    $savedData = json_decode(file_get_contents($savedDataFile), true);
    if ($savedData && isset($savedData['sites']) && isset($savedData['bestSite'])) {
        
        // If updating a specific site, only update that site's data
        if ($specificSiteName) {
            $siteToUpdate = null;
            foreach ($savedData['sites'] as $site) {
                if ($site['name'] === $specificSiteName) {
                    $siteToUpdate = $site;
                    break;
                }
            }
            
            if ($siteToUpdate) {
                // Find the site configuration
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
                
                $siteConfig = null;
                foreach ($sitesToAnalyze as $config) {
                    if ($config['name'] === $specificSiteName) {
                        $siteConfig = $config;
                        break;
                    }
                }
                
                if ($siteConfig) {
                    // Update only this specific site
                    $updatedSite = analyzeSite($siteConfig['lat'], $siteConfig['lon'], 1000, $siteConfig['name']);
                    if ($updatedSite) {
                        $updatedSite['energy_type'] = $siteConfig['type'];
                        
                        // Regenerate recommendation with correct energy type if AI is enabled
                        if (defined('ENABLE_AI_ANALYSIS') && ENABLE_AI_ANALYSIS && !empty(OPENAI_API_KEY)) {
                            $siteDataForAI = [
                                'name' => $updatedSite['name'],
                                'avg_daily_kwh' => $updatedSite['avg_daily_kwh'],
                                'energy_type' => $siteConfig['type']
                            ];
                            $updatedSite['recommendation'] = getAIRecommendation($siteDataForAI, $updatedSite['weather']);
                        }
                        
                        // Replace the site in the saved data
                        foreach ($savedData['sites'] as $key => $site) {
                            if ($site['name'] === $specificSiteName) {
                                $savedData['sites'][$key] = $updatedSite;
                                break;
                            }
                        }
                        
                        // Recalculate best site
                        $bestSiteData = null;
                        $maxAvgKwh = 0;
                        foreach ($savedData['sites'] as $site) {
                            if ($site['avg_daily_kwh'] > $maxAvgKwh) {
                                $maxAvgKwh = $site['avg_daily_kwh'];
                                $bestSiteData = $site;
                            }
                        }
                        $savedData['bestSite'] = $bestSiteData;
                        
                        // Save updated data
                        file_put_contents($savedDataFile, json_encode($savedData, JSON_PRETTY_PRINT));
                    }
                }
            }
        }
        
        echo json_encode($savedData);
        exit;
    }
}

// --- DATA FETCHING FUNCTIONS ---

function getSolarData($lat, $lon, $start = '20240101', $end = '20240131') {
    $url = "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=SB&start=$start&end=$end&latitude=$lat&longitude=$lon&format=JSON";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        return null;
    }
    return json_decode($response, true);
}

function getLiveWeather($lat, $lon) {
    $url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,cloud_cover,wind_speed_10m&timezone=auto";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        return null;
    }
    return json_decode($response, true);
}


// --- DATA PROCESSING FUNCTIONS ---

function calculateSolarPower($solarIrradiance, $panelArea, $efficiency = 0.20) {
    // Convert MJ/m²/day to kWh/m²/day (1 MJ = 0.277778 kWh)
    $kWhPerSqMeter = $solarIrradiance * 0.277778;
    $totalKWh = $kWhPerSqMeter * $panelArea * $efficiency;
    return $totalKWh;
}

function analyzeSite($lat, $lon, $panelArea = 1000, $siteName = "Site") {
    $solarApiResponse = getSolarData($lat, $lon);
    
    // Check if solar data is valid
    if (!$solarApiResponse || !isset($solarApiResponse['properties']['parameter']['ALLSKY_SFC_SW_DWN'])) {
        return null;
    }
    $solarData = $solarApiResponse['properties']['parameter']['ALLSKY_SFC_SW_DWN'];
    
    $weatherData = getLiveWeather($lat, $lon);
    
    $totalKWh = 0;
    $dailyProduction = [];
    $minProduction = PHP_FLOAT_MAX;
    $maxProduction = 0;
    
    foreach ($solarData as $date => $irradiance) {
        if ($irradiance < 0) continue; // Skip invalid data points
        $dailyKWh = calculateSolarPower($irradiance, $panelArea);
        $dailyProduction[$date] = $dailyKWh;
        $totalKWh += $dailyKWh;
        
        if ($dailyKWh < $minProduction) $minProduction = $dailyKWh;
        if ($dailyKWh > $maxProduction) $maxProduction = $dailyKWh;
    }
    
    if (count($solarData) === 0) return null;
    $avgDailyKWh = $totalKWh / count($solarData);
    
    // Calculate a performance score (e.g., scale of 1 to 10)
    // This is a placeholder. A real score would be more complex.
    $score = ($avgDailyKWh / 500) + (rand(0, 10) / 10);
    $performance_score = round(min(max($score, 1), 10), 1);

    // Create site data for AI analysis
    $siteData = [
        'name' => $siteName,
        'avg_daily_kwh' => $avgDailyKWh,
        'energy_type' => 'Solar' // Will be overridden later
    ];

    // Generate AI-powered recommendation
    $recommendation = getAIRecommendation($siteData, $weatherData);

    // Mock hardware data
    $gpu_total = rand(500, 2000);
    $gpu_used = rand(100, $gpu_total);
    $battery_capacity_mwh = rand(5, 20);

    return [
        'name' => $siteName,
        'lat' => $lat,
        'lon' => $lon,
        'total_kwh' => $totalKWh,
        'avg_daily_kwh' => $avgDailyKWh,
        'annual_kwh_yr' => $avgDailyKWh * 365,
        'weather' => $weatherData,
        'performance_score' => $performance_score,
        'recommendation' => $recommendation,
        'hardware' => [
            'gpu_total' => $gpu_total,
            'gpu_used' => $gpu_used,
            'battery_brand' => 'LG',
            'battery_capacity_mwh' => $battery_capacity_mwh
        ]
    ];
}


// --- API LOGIC ---

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

$sitesData = [];
foreach ($sitesToAnalyze as $site) {
    $analyzedData = analyzeSite($site['lat'], $site['lon'], 1000, $site['name']);
    if ($analyzedData) {
        $analyzedData['energy_type'] = $site['type'];
        
        // Regenerate recommendation with correct energy type if AI is enabled
        if (defined('ENABLE_AI_ANALYSIS') && ENABLE_AI_ANALYSIS && !empty(OPENAI_API_KEY)) {
            $siteDataForAI = [
                'name' => $analyzedData['name'],
                'avg_daily_kwh' => $analyzedData['avg_daily_kwh'],
                'energy_type' => $site['type']
            ];
            $analyzedData['recommendation'] = getAIRecommendation($siteDataForAI, $analyzedData['weather']);
        }
        
        $sitesData[] = $analyzedData;
    }
}

if (empty($sitesData)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not fetch data for any site.']);
    exit;
}

// Find best site and its data
$bestSiteData = null;
$maxAvgKwh = 0;
foreach ($sitesData as $site) {
    if ($site['avg_daily_kwh'] > $maxAvgKwh) {
        $maxAvgKwh = $site['avg_daily_kwh'];
        $bestSiteData = $site;
    }
}

// Calculate efficiency for the best site
$efficiencyScore = 0;
if ($maxAvgKwh > 0 && $bestSiteData) {
    // A simplified efficiency score. You can make this more complex.
    // This score is higher for sites with consistently high production.
    $efficiencyScore = round(($bestSiteData['avg_daily_kwh'] / 10000) * 80) + 15; // Scaled to a %
    $efficiencyScore = min($efficiencyScore, 95); // Cap at 95%
}


// --- COMPILE FINAL JSON RESPONSE ---

$response = [
    'sites' => $sitesData,
    'bestSite' => $bestSiteData,
    'efficiencyScore' => $efficiencyScore
];

// Save the data to file for future use
file_put_contents($savedDataFile, json_encode($response, JSON_PRETTY_PRINT));

echo json_encode($response);

// --- AI-POWERED ANALYSIS FUNCTIONS ---

function getAIRecommendation($siteData, $weatherData) {
    if (!defined('ENABLE_AI_ANALYSIS') || !ENABLE_AI_ANALYSIS || empty(OPENAI_API_KEY)) {
        return generateBasicRecommendation($siteData, $weatherData);
    }

    try {
        $prompt = createAnalysisPrompt($siteData, $weatherData);
        $response = callOpenAI($prompt);
        
        if ($response && isset($response['choices'][0]['message']['content'])) {
            return $response['choices'][0]['message']['content'];
        }
    } catch (Exception $e) {
        if (DEBUG_MODE) {
            error_log("AI analysis failed: " . $e->getMessage());
        }
    }
    
    // Fallback to basic recommendation
    return generateBasicRecommendation($siteData, $weatherData);
}

function callOpenAI($prompt) {
    if (empty(OPENAI_API_KEY)) {
        return null;
    }

    $data = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert energy analyst specializing in renewable energy optimization and site analysis. Provide concise, actionable insights.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'max_tokens' => 300,
        'temperature' => 0.7
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, OPENAI_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . OPENAI_API_KEY
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        throw new Exception("OpenAI API request failed with status: $http_code");
    }

    return json_decode($response, true);
}

function createAnalysisPrompt($siteData, $weatherData) {
    $siteName = $siteData['name'];
    $avgDailyKwh = $siteData['avg_daily_kwh'];
    $energyType = $siteData['energy_type'] ?? 'Unknown';
    
    $weatherInfo = '';
    if ($weatherData && isset($weatherData['current'])) {
        $temp = $weatherData['current']['temperature_2m'];
        $windSpeed = $weatherData['current']['wind_speed_10m'];
        $cloudCover = $weatherData['current']['cloud_cover'];
        $weatherInfo = "Current weather: Temperature {$temp}°C, Wind Speed {$windSpeed} m/s, Cloud Cover {$cloudCover}%.";
    }

    return "Analyze this energy site and provide a brief, professional recommendation:

Site: $siteName
Energy Type: $energyType
Average Daily Production: " . round($avgDailyKwh) . " kWh
$weatherInfo

Provide a 2-3 sentence recommendation focusing on:
1. Current performance assessment
2. Potential optimization opportunities
3. Any environmental considerations

Keep the response concise and actionable.";
}

function generateBasicRecommendation($siteData, $weatherData) {
    $avgDailyKwh = $siteData['avg_daily_kwh'];
    $energyType = $siteData['energy_type'] ?? 'Unknown';
    
    if ($avgDailyKwh > 4500) {
        $recommendation = "Excellent performance for $energyType. This site demonstrates optimal energy production efficiency.";
    } elseif ($avgDailyKwh > 3000) {
        $recommendation = "Good performance for $energyType. Consider monitoring for potential optimization opportunities.";
    } else {
        $recommendation = "Moderate performance for $energyType. Review system configuration and environmental factors.";
    }

    if ($weatherData && isset($weatherData['current']['wind_speed_10m']) && $weatherData['current']['wind_speed_10m'] > 20) {
        $recommendation .= " High wind conditions detected - excellent for wind energy potential.";
    }

    return $recommendation;
} 
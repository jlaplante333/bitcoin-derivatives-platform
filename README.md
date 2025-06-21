# MARA - Energy Site Analysis Dashboard

A real-time energy site monitoring and analysis dashboard with AI-powered insights.

## Features

- **Real-time Data**: Live weather and solar irradiance data from NASA POWER API and Open-Meteo
- **AI-Powered Analysis**: OpenAI GPT-3.5 integration for intelligent site recommendations
- **Interactive Map**: Leaflet.js powered map with custom energy site markers
- **Performance Metrics**: Real-time efficiency scoring and hardware monitoring
- **Multi-Site Support**: Monitor 18+ energy sites across different energy types

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mara
```

### 2. Configure API Keys
1. Copy the configuration template:
   ```bash
   cp config.template.php config.php
   ```

2. Edit `config.php` and add your OpenAI API key:
   ```php
   define('OPENAI_API_KEY', 'your-openai-api-key-here');
   ```

3. The `config.php` file is automatically ignored by Git for security.

### 3. Server Setup
The application requires a PHP server with cURL support.

**Option A: Using MAMP/XAMPP**
- Place the project in your MAMP/XAMPP htdocs folder
- Access via `http://localhost/mara`

**Option B: Using PHP Built-in Server**
```bash
php -S localhost:8000
```

**Option C: Using Python (as shown in your terminal)**
```bash
python3 -m http.server 8000
```

### 4. Access the Dashboard
Open your browser and navigate to:
- `http://localhost:8000` (if using Python server)
- `http://localhost/mara` (if using MAMP/XAMPP)

## API Configuration

The application uses several APIs:

- **OpenAI GPT-3.5**: For AI-powered site analysis and recommendations
- **NASA POWER API**: For solar irradiance data (free, no key required)
- **Open-Meteo**: For current weather data (free, no key required)

## Security Notes

- The `config.php` file contains your API key and is excluded from Git
- Never commit API keys to version control
- The `.gitignore` file ensures sensitive files are not tracked

## Features in Detail

### AI-Powered Analysis
When enabled, the system uses OpenAI's GPT-3.5 to provide intelligent recommendations for each energy site based on:
- Current weather conditions
- Energy production data
- Site-specific characteristics
- Environmental factors

### Real-time Updates
- Click "Refresh Metrics" to get fresh data for all sites
- Individual site updates when viewing site details
- Automatic data caching to reduce API calls

### Energy Site Types
The dashboard monitors various energy types:
- Solar + Grid
- Wind + Grid
- Natural Gas
- Flared Gas
- Hydroelectric
- Grid + Heat Recycle
- Grid + Clean Energy Certs

## File Structure

```
mara/
├── index.php              # Main dashboard interface
├── api.php               # Backend API with AI integration
├── script.js             # Frontend JavaScript
├── style.css             # Dashboard styling
├── config.php            # API keys (ignored by Git)
├── config.template.php   # Configuration template
├── .gitignore           # Git ignore rules
├── saved_data.json      # Cached data
└── README.md            # This file
```

## Troubleshooting

### API Key Issues
- Ensure your OpenAI API key is valid and has sufficient credits
- Check that `config.php` exists and contains the correct API key
- Verify the API key format starts with `sk-`

### Data Loading Issues
- Check your internet connection
- Verify that the NASA POWER API and Open-Meteo are accessible
- Check browser console for JavaScript errors

### Server Issues
- Ensure PHP has cURL extension enabled
- Check file permissions on the project directory
- Verify that `saved_data.json` is writable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. 
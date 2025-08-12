import { NextRequest, NextResponse } from 'next/server';

// Using your n8n configuration for WeatherAPI forecast
const WEATHER_API_KEY = '9b9f2a541a83438898d03333250707';
const WEATHER_FORECAST_URL = 'http://api.weatherapi.com/v1/forecast.json';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('q') || 'muscat';
    const days = searchParams.get('days') || '3'; // Default to 3 days forecast

    console.log('Fetching weather forecast for location:', location);

    // Build the API URL with parameters (matching your n8n config)
    const forecastUrl = new URL(WEATHER_FORECAST_URL);
    forecastUrl.searchParams.append('key', WEATHER_API_KEY);
    forecastUrl.searchParams.append('q', location);
    forecastUrl.searchParams.append('days', days);
    forecastUrl.searchParams.append('aqi', 'no');
    forecastUrl.searchParams.append('alerts', 'no');

    console.log('Forecast API URL:', forecastUrl.toString());

    const forecastResponse = await fetch(forecastUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error('Weather API error response:', errorText);
      throw new Error(`Weather Forecast API failed with status: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    console.log('Weather Forecast API response structure:', Object.keys(forecastData));

    // Format the response for easier consumption
    const formattedForecast = {
      location: {
        name: forecastData.location.name,
        region: forecastData.location.region,
        country: forecastData.location.country,
        localtime: forecastData.location.localtime
      },
      current: {
        temperature_c: forecastData.current.temp_c,
        temperature_f: forecastData.current.temp_f,
        condition: forecastData.current.condition.text,
        icon: forecastData.current.condition.icon,
        humidity: forecastData.current.humidity,
        wind_kph: forecastData.current.wind_kph,
        wind_dir: forecastData.current.wind_dir,
        pressure_mb: forecastData.current.pressure_mb,
        feelslike_c: forecastData.current.feelslike_c,
        feelslike_f: forecastData.current.feelslike_f,
        uv: forecastData.current.uv
      },
      forecast: {
        forecastday: forecastData.forecast.forecastday.map((day: any) => ({
          date: day.date,
          date_epoch: day.date_epoch,
          day: {
            maxtemp_c: day.day.maxtemp_c,
            maxtemp_f: day.day.maxtemp_f,
            mintemp_c: day.day.mintemp_c,
            mintemp_f: day.day.mintemp_f,
            avgtemp_c: day.day.avgtemp_c,
            avgtemp_f: day.day.avgtemp_f,
            condition: day.day.condition.text,
            icon: day.day.condition.icon,
            maxwind_kph: day.day.maxwind_kph,
            totalprecip_mm: day.day.totalprecip_mm,
            avghumidity: day.day.avghumidity,
            daily_will_it_rain: day.day.daily_will_it_rain,
            daily_chance_of_rain: day.day.daily_chance_of_rain,
            daily_will_it_snow: day.day.daily_will_it_snow,
            daily_chance_of_snow: day.day.daily_chance_of_snow,
            uv: day.day.uv
          },
          astro: {
            sunrise: day.astro.sunrise,
            sunset: day.astro.sunset,
            moonrise: day.astro.moonrise,
            moonset: day.astro.moonset,
            moon_phase: day.astro.moon_phase,
            moon_illumination: day.astro.moon_illumination
          }
        }))
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedForecast,
      message: `${days}-day weather forecast retrieved successfully for ${location}`,
      source: 'WeatherAPI via n8n configuration'
    });

  } catch (error: any) {
    console.error('Weather Forecast API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch weather forecast data',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
/**
 * WeatherService.ts
 * Fetches real-time weather using device GPS + OpenWeatherMap API.
 * Falls back to a deterministic default if permissions are denied or the
 * network request fails.
 */

import * as Location from 'expo-location';

// ─── FREE TIER key — replace with your own from openweathermap.org ───────────
// The free tier supports 1,000 calls/day, which is plenty for a farming app.
const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY as string;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// ─── Types ────────────────────────────────────────────────────────────────────
export type WeatherCondition = 'Sunny' | 'Rainy' | 'Cloudy' | 'Stormy' | 'Partly Cloudy';

export interface WeatherData {
  condition: WeatherCondition;
  temp: string;          // e.g. "31°C"
  tempC: number;          // raw number for calculations
  humidity: number;          // 0-100 %
  emoji: string;          // weather emoji
  description: string;          // e.g. "Light rain"
  city: string;          // e.g. "Pune"
  /** HSL gradient tuples for the hero card */
  gradient: [string, string, string];
  /** Farmer hint string */
  hint: string;
  /** Crop compatibility map: cropId → 'perfect' | 'good' | 'poor' */
  cropCompatibility: Record<string, 'perfect' | 'good' | 'poor'>;
  isLive: boolean;         // false = fallback
  fetchedAt: number;          // Date.now()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function owmCodeToCondition(code: number): WeatherCondition {
  if (code >= 200 && code < 300) return 'Stormy';
  if (code >= 300 && code < 600) return 'Rainy';
  if (code >= 600 && code < 700) return 'Cloudy';   // snow → treat as cloudy
  if (code >= 700 && code < 800) return 'Cloudy';   // atmosphere
  if (code === 800) return 'Sunny';
  if (code === 801 || code === 802) return 'Partly Cloudy';
  return 'Cloudy';
}

function buildWeatherData(
  condition: WeatherCondition,
  tempC: number,
  humidity: number,
  description: string,
  city: string,
  isLive: boolean,
): WeatherData {
  const temp = `${Math.round(tempC)}°C`;

  const GRADIENT: Record<WeatherCondition, [string, string, string]> = {
    'Sunny': ['#F57C00', '#FFA726', '#FFCC80'],
    'Partly Cloudy': ['#1565C0', '#42A5F5', '#90CAF9'],
    'Cloudy': ['#455A64', '#78909C', '#B0BEC5'],
    'Rainy': ['#1A237E', '#283593', '#5C6BC0'],
    'Stormy': ['#212121', '#424242', '#757575'],
  };

  const EMOJI: Record<WeatherCondition, string> = {
    'Sunny': '☀️', 'Partly Cloudy': '⛅', 'Cloudy': '☁️', 'Rainy': '🌧️', 'Stormy': '⛈️',
  };

  const HINT: Record<WeatherCondition, string> = {
    'Sunny': `🌡️ Hot ${temp} — crops need extra irrigation!`,
    'Partly Cloudy': '🌤️ Mild conditions — ideal for most crops.',
    'Cloudy': '☁️ Overcast sky — good for consistent growth.',
    'Rainy': '🌧️ Rain incoming — water-heavy crops will thrive!',
    'Stormy': '⛈️ Storms ahead — protect your harvest!',
  };

  // Crop-weather compatibility
  const compat: Record<WeatherCondition, Record<string, 'perfect' | 'good' | 'poor'>> = {
    'Sunny': { Rice: 'poor', Wheat: 'perfect', Cotton: 'perfect', Sugarcane: 'good' },
    'Partly Cloudy': { Rice: 'good', Wheat: 'perfect', Cotton: 'good', Sugarcane: 'good' },
    'Cloudy': { Rice: 'good', Wheat: 'good', Cotton: 'good', Sugarcane: 'perfect' },
    'Rainy': { Rice: 'perfect', Wheat: 'poor', Cotton: 'poor', Sugarcane: 'perfect' },
    'Stormy': { Rice: 'good', Wheat: 'poor', Cotton: 'poor', Sugarcane: 'poor' },
  };

  return {
    condition,
    temp,
    tempC,
    humidity,
    emoji: EMOJI[condition],
    description,
    city,
    gradient: GRADIENT[condition],
    hint: HINT[condition],
    cropCompatibility: compat[condition],
    isLive,
    fetchedAt: Date.now(),
  };
}

/** Fallback data when GPS / network is unavailable */
export function getFallbackWeather(): WeatherData {
  // Deterministic "typical Indian farm weather" fallback
  return buildWeatherData('Partly Cloudy', 30, 65, 'Mild conditions', 'Your Farm', false);
}

// ─── Main fetch function ──────────────────────────────────────────────────────
export async function fetchLiveWeather(): Promise<WeatherData> {
  try {
    // 1. Ask for location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[WeatherService] Location permission denied, using fallback.');
      return getFallbackWeather();
    }

    // 2. Get GPS position (low accuracy is fine — we just need lat/lon)
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });
    const { latitude, longitude } = location.coords;

    // 3. Fetch OWM
    const url = `${OWM_BASE}?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}&appid=${OWM_API_KEY}&units=metric`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      console.warn('[WeatherService] OWM request failed:', res.status);
      return getFallbackWeather();
    }

    const data = await res.json();
    const code = data.weather?.[0]?.id ?? 800;
    const desc = data.weather?.[0]?.description ?? '';
    const tempC = data.main?.temp ?? 30;
    const hum = data.main?.humidity ?? 60;
    const city = data.name ?? '';

    return buildWeatherData(owmCodeToCondition(code), tempC, hum, desc, city, true);

  } catch (err) {
    console.warn('[WeatherService] Error fetching weather:', err);
    return getFallbackWeather();
  }
}

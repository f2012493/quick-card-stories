
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface LocationData {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const fetchLocationFromCoords = async (lat: number, lon: number): Promise<LocationData> => {
  // Using ipapi.co for reverse geocoding - it's free and doesn't require API key
  const response = await fetch(`https://ipapi.co/json/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }
  
  const data = await response.json();
  
  return {
    city: data.city || 'Unknown',
    region: data.region || 'Unknown', 
    country: data.country_name || 'Unknown',
    countryCode: data.country_code || 'US',
    lat: data.latitude || lat,
    lon: data.longitude || lon
  };
};

const fetchLocationFromIP = async (): Promise<LocationData> => {
  const response = await fetch('https://ipapi.co/json/');
  
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }
  
  const data = await response.json();
  
  return {
    city: data.city || 'Unknown',
    region: data.region || 'Unknown',
    country: data.country_name || 'Unknown', 
    countryCode: data.country_code || 'US',
    lat: data.latitude || 0,
    lon: data.longitude || 0
  };
};

export const useLocation = () => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setLocationPermission('denied');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    }
  }, []);

  const { data: locationData, isLoading, error } = useQuery({
    queryKey: ['location', coordinates],
    queryFn: async () => {
      if (coordinates) {
        return fetchLocationFromCoords(coordinates.lat, coordinates.lon);
      } else {
        return fetchLocationFromIP();
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2
  });

  return {
    locationData,
    isLoading,
    error,
    locationPermission,
    hasCoordinates: !!coordinates
  };
};

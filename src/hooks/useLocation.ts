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
  try {
    // First try with coordinates-based API
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.city || data.locality || 'Unknown',
        region: data.principalSubdivision || data.region || 'Unknown',
        country: data.countryName || 'Unknown',
        countryCode: data.countryCode || 'US',
        lat: lat,
        lon: lon
      };
    }
  } catch (error) {
    console.log('Coordinate-based location failed, trying IP-based');
  }

  // Fallback to IP-based location
  return fetchLocationFromIP();
};

const fetchLocationFromIP = async (): Promise<LocationData> => {
  try {
    // Try multiple IP geolocation services for better accuracy
    const services = [
      'https://ipapi.co/json/',
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle different response formats
          if (data.city && data.country_name) {
            return {
              city: data.city || 'Unknown',
              region: data.region || data.region_code || 'Unknown',
              country: data.country_name || 'Unknown',
              countryCode: data.country_code || data.country || 'US',
              lat: data.latitude || 0,
              lon: data.longitude || 0
            };
          }
        }
      } catch (error) {
        console.log(`Service ${service} failed, trying next...`);
        continue;
      }
    }
  } catch (error) {
    console.log('All location services failed');
  }

  // Ultimate fallback for Indian users
  return {
    city: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    lat: 19.0760,
    lon: 72.8777
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

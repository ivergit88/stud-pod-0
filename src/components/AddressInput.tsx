import React, { useEffect, useRef } from 'react';
import { useYMaps } from '@pbe/react-yandex-maps';

interface AddressInputProps {
  value: string;
  onChange: (value: string, coordinates?: [number, number]) => void;
  className?: string;
  placeholder?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  className,
  placeholder,
}) => {
  const ymaps = useYMaps(['SuggestView', 'geocode']);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestViewRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ymaps || !inputRef.current || suggestViewRef.current) {
      return;
    }

    suggestViewRef.current = new (ymaps as any).SuggestView(inputRef.current, {
      results: 5,
    });

    suggestViewRef.current.events.add('select', async (e: any) => {
      const selectedItem = e.get('item');
      const selectedAddress = selectedItem?.value;

      if (!selectedAddress) {
        return;
      }

      try {
        const geocodeResult = await (ymaps as any).geocode(selectedAddress, {
          results: 1,
        });
        const firstGeoObject = geocodeResult?.geoObjects?.get(0);
        const rawCoordinates = firstGeoObject?.geometry?.getCoordinates?.();

        if (
          Array.isArray(rawCoordinates) &&
          rawCoordinates.length === 2 &&
          rawCoordinates.every((item) => typeof item === 'number')
        ) {
          onChangeRef.current(selectedAddress, [rawCoordinates[0], rawCoordinates[1]]);
          return;
        }
      } catch (error) {
        console.error('Yandex geocode error:', error);
      }

      onChangeRef.current(selectedAddress);
    });

    return () => {
      if (suggestViewRef.current) {
        suggestViewRef.current.destroy();
        suggestViewRef.current = null;
      }
    };
  }, [ymaps]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChangeRef.current(e.target.value)}
      className={className}
      placeholder={placeholder}
      name="location"
    />
  );
};

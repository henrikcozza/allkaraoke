import { useEffect, useState } from 'react';
import { ValuesType } from 'utility-types';

class Setting<T> {
    private value: T;

    private listeners: Array<(newValue: T) => void> = [];
    public constructor(private name: string, defaultValue: T) {
        this.value = JSON.parse(window.localStorage.getItem(`settings-${name}`)!) ?? defaultValue;
    }

    public get = () => this.value;

    public set = (newValue: T) => {
        this.value = newValue;

        window.localStorage.setItem(`settings-${this.name}`, JSON.stringify(newValue));
        this.listeners.forEach((listener) => listener(newValue));
    };

    public addListener = (newListener: (newValue: T) => void) => {
        this.listeners.push(newListener);

        return () => {
            this.listeners = this.listeners.filter((listener) => listener !== newListener);
        };
    };
}

export const GraphicsLevel = ['high', 'low'] as const;
const GRAPHICS_LEVEL_KEY = 'graphics-level';

export const FpsCount = [60, 30] as const;
const FPS_COUNT_KEY = 'fps-count';

export const GraphicSetting = new Setting<ValuesType<typeof GraphicsLevel>>(GRAPHICS_LEVEL_KEY, GraphicsLevel[0]);
export const FPSCountSetting = new Setting<ValuesType<typeof FpsCount>>(FPS_COUNT_KEY, FpsCount[0]);

export function useSettingValue<T>(value: Setting<T>) {
    const [currentValue, setCurrentValue] = useState(value.get());

    useEffect(() => {
        return value.addListener(setCurrentValue);
    }, [value]);

    return [currentValue, value.set] as const;
}
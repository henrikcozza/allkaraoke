import { throttle } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';

export default function useViewportSize() {
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState<{
        width: number | undefined;
        height: number | undefined;
    }>({
        width: undefined,
        height: undefined,
    });

    const handleResize = useCallback(
        throttle(() => {
            setWindowSize({
                width: window.document.body.clientWidth,
                height: window.visualViewport!.height,
            });
        }, 1000),
        [],
    );

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { ...windowSize, handleResize };
}

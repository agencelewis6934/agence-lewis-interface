import React, { useEffect } from 'react';

export function useClickOutside<T extends HTMLElement>(
    ref: React.RefObject<T | null>,
    handler: (event: MouseEvent | TouchEvent) => void,
    ignoreRef?: React.RefObject<HTMLElement | null>
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (!target || !target.isConnected) {
                return;
            }

            const el = ref.current;
            const ignoreEl = ignoreRef?.current;

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(target)) {
                return;
            }

            // Do nothing if clicking ignoreRef's element (e.g. trigger button)
            if (ignoreEl && ignoreEl.contains(target)) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, ignoreRef]);
}

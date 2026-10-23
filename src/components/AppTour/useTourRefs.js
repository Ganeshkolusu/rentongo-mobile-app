// src/components/AppTour/useTourRefs.js
// Reusable hook for managing tour target refs across components
import { useRef, useCallback, useMemo } from 'react';

/**
 * Hook for creating and managing tour target refs
 *
 * Usage:
 * ```js
 * const { refs, getRef, registerRef, getAllRefs } = useTourRefs([
 *   'locationSelector',
 *   'notificationButton',
 *   'searchBar',
 * ]);
 *
 * // In JSX:
 * <TouchableOpacity ref={refs.locationSelector}>...</TouchableOpacity>
 *
 * // Or dynamically:
 * <TouchableOpacity ref={getRef('locationSelector')}>...</TouchableOpacity>
 * ```
 *
 * @param {string[]} targetIds - Array of target IDs to create refs for
 * @returns {object} Object containing refs map and helper functions
 */
export const useTourRefs = (targetIds = []) => {
    // Create a stable refs object that won't change between renders
    const refsMap = useRef({});

    // Initialize refs for each target ID
    targetIds.forEach((id) => {
        if (!refsMap.current[id]) {
            refsMap.current[id] = { current: null };
        }
    });

    // Get a specific ref by ID
    const getRef = useCallback((targetId) => {
        if (!refsMap.current[targetId]) {
            refsMap.current[targetId] = { current: null };
        }
        return refsMap.current[targetId];
    }, []);

    // Register a ref dynamically (for components that use callback refs)
    const registerRef = useCallback((targetId, element) => {
        if (!refsMap.current[targetId]) {
            refsMap.current[targetId] = { current: null };
        }
        refsMap.current[targetId].current = element;
    }, []);

    // Get all refs as an object (for passing to AppTour)
    const getAllRefs = useCallback(() => {
        return refsMap.current;
    }, []);

    // Memoized refs object for direct access
    const refs = useMemo(() => refsMap.current, []);

    return {
        refs,
        getRef,
        registerRef,
        getAllRefs,
    };
};

/**
 * Hook for combining refs from multiple components
 * Used in parent components that need to collect refs from children
 *
 * Usage:
 * ```js
 * const { addRefs, getTargetRefs, clearRefs } = useTourRefCollector();
 *
 * // After child components mount:
 * useEffect(() => {
 *   if (topNavbarRef.current) {
 *     addRefs(topNavbarRef.current);
 *   }
 *   if (navBarRef.current) {
 *     addRefs(navBarRef.current);
 *   }
 * }, [topNavbarRef.current, navBarRef.current]);
 *
 * // Pass to AppTour:
 * <AppTour targetRefs={getTargetRefs()} ... />
 * ```
 */
export const useTourRefCollector = () => {
    const collectedRefs = useRef({});

    // Add refs from a child component
    const addRefs = useCallback((childRefs) => {
        if (childRefs && typeof childRefs === 'object') {
            Object.entries(childRefs).forEach(([key, ref]) => {
                if (ref && ref.current !== undefined) {
                    collectedRefs.current[key] = ref;
                }
            });
        }
    }, []);

    // Remove refs (useful when component unmounts)
    const removeRefs = useCallback((keys) => {
        keys.forEach((key) => {
            delete collectedRefs.current[key];
        });
    }, []);

    // Clear all collected refs
    const clearRefs = useCallback(() => {
        collectedRefs.current = {};
    }, []);

    // Get all collected refs
    const getTargetRefs = useCallback(() => {
        return collectedRefs.current;
    }, []);

    return {
        addRefs,
        removeRefs,
        clearRefs,
        getTargetRefs,
    };
};

/**
 * Helper function to create a ref callback that registers with the tour
 * Useful for components that need both local ref access and tour registration
 *
 * Usage:
 * ```js
 * const buttonRef = useRef(null);
 *
 * <TouchableOpacity
 *   ref={createTourRefCallback(buttonRef, registerRef, 'myButton')}
 * >
 * ```
 */
export const createTourRefCallback = (localRef, registerFn, targetId) => {
    return (element) => {
        // Update local ref
        if (localRef) {
            localRef.current = element;
        }
        // Register with tour system
        if (registerFn) {
            registerFn(targetId, element);
        }
    };
};

export default useTourRefs;

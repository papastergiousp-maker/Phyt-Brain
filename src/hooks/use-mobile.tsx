import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false); // Default to false (desktop)
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    
    // Set initial value
    setIsMobile(mql.matches);
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return the default value (false) until the component has mounted on the client,
  // then return the actual determined value.
  // This ensures server-render and initial client-render are consistent for isMobile.
  return hasMounted ? isMobile : false;
}

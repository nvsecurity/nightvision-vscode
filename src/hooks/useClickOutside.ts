import { useEffect, useRef, useState } from 'react';

export default function useClickOutside(showInit?: boolean) {
  const [showComponent, setShowComponent] = useState(showInit || false);
  const componentRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLInputElement>(null);
  const clickStartedInside = useRef(false);

  const handleMouseDown = (event: MouseEvent) => {
    if (
      (componentRef.current &&
        componentRef.current.contains(event.target as Node)) ||
      (buttonRef.current && buttonRef.current.contains(event.target as Node))
    ) {
      clickStartedInside.current = true;
    } else {
      clickStartedInside.current = false;
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (
      !(
        componentRef.current &&
        componentRef.current.contains(event.target as Node)
      ) &&
      !(
        buttonRef.current && buttonRef.current.contains(event.target as Node)
      ) &&
      !clickStartedInside.current
    ) {
      setShowComponent(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, []);

  return { componentRef, buttonRef, showComponent, setShowComponent };
}

import { ScanContext, ScanContextType } from '@contexts/ScanContext';
import { useContext, useEffect } from 'react';

export const useScans = () => {
  const { scans, setScans, addScan, setIsScanning, setIsError, addIssues } =
    useContext<ScanContextType>(ScanContext);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setScans((prevScans) => {
        const updatedScans = Object.fromEntries(
          Object.entries(prevScans).map(([scanId, scan]) => {
            if (scan.isScanning) {
              return [
                scanId,
                { ...scan, duration: (Date.now() - scan.timestamp) / 1000 },
              ];
            }

            return [scanId, scan];
          })
        );
        return updatedScans;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { scans, setScans, addScan, setIsScanning, setIsError, addIssues };
};

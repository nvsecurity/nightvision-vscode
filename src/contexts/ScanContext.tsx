import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from 'react';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Scan {
  requestId: string;
  applicationName: string;
  targetName: string;
  timestamp: number;
  duration: number;
  isScanning: boolean;
  isError: boolean;
  issues: { name: string; severity: Severity }[];
}

export interface ScanContextType {
  scans: { [scanId: string]: Scan };
  setScans: Dispatch<
    SetStateAction<{
      [scanId: string]: Scan;
    }>
  >;
  addScan: (
    scanId: string,
    requestId: string,
    applicationName: string,
    targetName: string,
    timestamp: number
  ) => void;
  setIsScanning: (scanId: string, isScanning: boolean) => void;
  setIsError: (scanId: string, isError: boolean) => void;
  addIssues: (
    scanId: string,
    newIssues: { name: string; severity: Severity }[]
  ) => void;
}

export const ScanContext = createContext<ScanContextType>({
  scans: {},
  setScans: () => {},
  addScan: () => {},
  setIsScanning: () => {},
  setIsError: () => {},
  addIssues: () => {},
});

export const ScanContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [scans, setScans] = useState<{ [scanId: string]: Scan }>({
    'scan-id-1': {
      applicationName: 'vuln_node_express',
      duration: 565,
      issues: [
        { name: 'issue-1', severity: 'critical' },
        { name: 'issue-1', severity: 'medium' },
        { name: 'issue-1', severity: 'medium' },
      ],
      requestId: 'req-id',
      targetName: 'vuln_node_express',
      timestamp: Date.now(),
      isScanning: true,
      isError: false,
    },
    'scan-id-2': {
      applicationName: 'vuln_node_express',
      duration: 422,
      issues: [{ name: 'issue-1', severity: 'high' }],
      requestId: 'req-id',
      targetName: 'vuln_node_express',
      timestamp: 0,
      isScanning: false,
      isError: false,
    },
    'scan-id-3': {
      applicationName: 'vuln_node_express',
      duration: 378,
      issues: [{ name: 'issue-1', severity: 'low' }],
      requestId: 'req-id',
      targetName: 'vuln_node_express',
      timestamp: 0,
      isScanning: false,
      isError: false,
    },
  });

  const addScan = (
    scanId: string,
    requestId: string,
    applicationName: string,
    targetName: string,
    timestamp: number
  ) => {
    console.log('adding new scan');
    console.log(scans);
    setScans((prevScans) => {
      const updatedScans = {
        [scanId]: {
          requestId,
          applicationName,
          targetName,
          timestamp,
          duration: 0,
          isScanning: false,
          isError: false,
          issues: [],
        },
        ...prevScans,
      };
      console.log('addScan - updatedScans:', updatedScans); // Logging here
      return updatedScans;
    });
  };

  const setIsScanning = (scanId: string, isScanning: boolean) => {
    setScans((prevScans) => {
      const updatedScans = {
        ...prevScans,
        [scanId]: {
          ...prevScans[scanId],
          isScanning,
        },
      };
      console.log('setIsScanning - updatedScans:', updatedScans); // Logging here
      return updatedScans;
    });
  };

  const setIsError = (scanId: string, isError: boolean) => {
    setScans((prevScans) => ({
      ...prevScans,
      [scanId]: {
        ...prevScans[scanId],
        isError,
      },
    }));
  };

  const addIssues = (
    scanId: string,
    newIssues: { name: string; severity: Severity }[]
  ) => {
    console.log(scans);
    console.log(scans[scanId]);
    console.log(newIssues);

    // setScans((prevScans) => ({
    //   ...prevScans,
    //   [scanId]: {
    //     ...prevScans[scanId],
    //     issues: [...prevScans[scanId].issues, ...newIssues],
    //   },
    // }));

    setScans((prevScans) => {
      if (!prevScans[scanId]) {
        console.error(`Scan with id ${scanId} does not exist.`);
        return prevScans;
      }
      const updatedScans = {
        ...prevScans,
        [scanId]: {
          ...prevScans[scanId],
          issues: [...prevScans[scanId].issues, ...newIssues],
        },
      };
      console.log('addIssues - updatedScans:', updatedScans); // Logging here
      return updatedScans;
    });
  };

  useEffect(() => {
    console.log('scans updated:', scans); // Logging every time scans change
  }, [scans]);

  return (
    <ScanContext.Provider
      value={{ scans, setScans, addScan, setIsScanning, setIsError, addIssues }}
    >
      {children}
    </ScanContext.Provider>
  );
};

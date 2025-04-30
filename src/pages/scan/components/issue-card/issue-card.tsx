import React from 'react';
import { Severity } from '@types_/scan';

const severityColor: { [key in Severity]: string } = {
  Critical: 'after:bg-red-600',
  High: 'after:bg-orange-600',
  Medium: 'after:bg-yellow-600',
  Low: 'after:bg-green-600',
  Informational: 'after:bg-blue-600',
  Unspecified: '',
  Unknown: '',
};

interface IssueCardProps {
  severity: Severity;
  amount: number;
  toggled: Severity | null;
  setToggled: React.Dispatch<React.SetStateAction<Severity | null>>;
}

export const IssueCard = ({
  severity,
  amount,
  toggled,
  setToggled,
}: IssueCardProps) => {
  const isToggled = severity === toggled;
  return (
    <div
      className={`relative flex h-24 flex-col items-center justify-center bg-transparent px-4 py-2 before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] after:absolute after:inset-y-0 after:left-0 after:w-1.5 after:rounded-bl after:rounded-tl after:bg-opacity-0 hover:cursor-pointer hover:bg-transparent before:hover:brightness-75 ${isToggled ? 'before:brightness-75 after:bg-opacity-100' : ''} ${severityColor[severity]}`}
      onClick={() => {
        if (isToggled) {
          setToggled(null);
          return;
        }
        setToggled(severity);
      }}
    >
      <span className='text-3xl font-bold'>{amount}</span>
      <span className='text-center font-medium capitalize brightness-50'>
        {severity} Severity
      </span>
    </div>
  );
};
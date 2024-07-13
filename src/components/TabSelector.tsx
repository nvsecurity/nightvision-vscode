import React from 'react';

export const TabSelector = ({
  values,
  selected,
  setSelected,
  className,
}: {
  values: { type: any; name: string }[];
  selected: { type: any; name: string };
  setSelected: React.Dispatch<
    React.SetStateAction<{ type: any; name: string }>
  >;
  className?: string;
}) => {
  return (
    <div>
      <div className={`flex w-full flex-nowrap justify-around ${className}`}>
        {values.map((value, index) => (
          <Tab
            key={value.type}
            value={value}
            selected={selected}
            setSelected={setSelected}
            first={index === 0}
            last={index === values.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const Tab = ({
  value,
  selected,
  setSelected,
  first = false,
  last = false,
}: {
  value: { type: any; name: string };
  selected: { type: any; name: string };
  setSelected: React.Dispatch<
    React.SetStateAction<{ type: any; name: string }>
  >;
  first?: boolean;
  last?: boolean;
}) => {
  return (
    <button
      type='button'
      onClick={() => setSelected(value)}
      className={`relative truncate !bg-transparent text-[--vscode-foreground] before:absolute before:inset-0 before:-z-50 before:bg-[--vscode-input-background] before:hover:bg-[--vscode-input-background] before:hover:opacity-100 before:hover:brightness-100 ${first && 'rounded-l'} ${last && 'rounded-r'} ${selected !== value && 'before:opacity-20'}`}
    >
      {value.name}
    </button>
  );
};

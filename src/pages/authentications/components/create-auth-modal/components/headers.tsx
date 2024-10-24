import { TextInput } from '@components/TextInput';
import { AuthHeader, AuthType } from '@types_/auth';
import React from 'react';

interface HeadersProps {
  name: string;
  value: string;
  setHeaders: React.Dispatch<React.SetStateAction<AuthHeader[]>>;
  index: number;
  selectedType: {
    type: AuthType;
    name: string;
  };
}

export const Headers: React.FC<HeadersProps> = ({
  name,
  value,
  setHeaders,
  index,
  selectedType,
}) => {
  return (
    <div className='mb-1 flex flex-nowrap' key={index}>
      <div className='grid w-full grid-cols-2 gap-2'>
        <TextInput
          value={name}
          handleOnChange={(value) =>
            setHeaders((prevState) =>
              prevState.map((header, i) =>
                index === i ? { ...header, name: value } : header
              )
            )
          }
          label={`${selectedType.name} Name`}
          id={`header-name-${index}`}
        />
        <TextInput
          value={value}
          handleOnChange={(value) =>
            setHeaders((prevState) =>
              prevState.map((header, i) =>
                index === i ? { ...header, value: value } : header
              )
            )
          }
          label={`${selectedType.name} Value`}
          id={`header-value-${index}`}
        />
      </div>
      <button
        className='unstyled h-min w-min hover:brightness-75'
        onClick={() =>
          setHeaders((prevState) =>
            prevState.length > 1
              ? prevState.filter((_, i) => i !== index)
              : prevState
          )
        }
      >
        <svg
          viewBox='0 0 16 16'
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6 fill-[--vscode-foreground]'
        >
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z'
          />
        </svg>
      </button>
    </div>
  );
};
import React from 'react';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { Chip } from '@components/chip';

interface ExclusionProps {
  label: string;
  onAddClick: (value: string) => void;
  exclusions: string[];
  onDeleteExclusion: (index: number) => void;
}

// TODO : remove from @components after create/update target modal will be in one place
export const Exclusion: React.FC<ExclusionProps> = ({
  label,
  onAddClick,
  exclusions,
  onDeleteExclusion,
}) => {
  const [value, setValue] = React.useState<string>('');

  const onAddExclusion = () => {
    onAddClick(value);
    setValue('');
  };

  const onKeyUp = (e: any) => {
    if (e.key === 'Enter') {
      onAddExclusion();
    }
  };

  return (
    <>
      <div className='flex flex-row items-end gap-3 max-[320px]:flex-wrap'>
        <TextInput
          value={value}
          handleOnChange={setValue}
          label={label}
          onKeyUp={onKeyUp}
          id={`exclusion-${label}`}
          style={{width: '100%'}}
        />
        <SecondaryButton
          onClick={onAddExclusion}
          style={{width: 'unset', flexShrink: 0, marginRight: '0.25rem'}}
          disabled={!value}
        >
          Add
        </SecondaryButton>
      </div>
      {!!exclusions.length && (
        <div className='flex flex-row flex-wrap gap-2'>
          {exclusions.map((el, index) => (
            <Chip text={el} key={`url-pattern-${index}`} onDelete={() => onDeleteExclusion(index)}/>
          ))}
        </div>
      )}
    </>
  );
};

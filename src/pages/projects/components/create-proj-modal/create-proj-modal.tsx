import useClickOutside from '@hooks/useClickOutside';
import React from 'react';
import { Modal } from '@components/Modal';
import { TextInput } from '@components/TextInput';
import { useDebounce } from 'use-debounce';
import { messageHandler } from '@utils/MessageHandler';
import { CLI_MISSING, CREATE_PROJECT, DUPLICATE_NAME, INVALID_NAME, UNAUTHORIZED_ACCESS } from '@commands/CommandConstants';
import { v4 } from 'uuid';
import { useUser } from '@hooks/useUser';
import { SecondaryButton } from '@components/SecondaryButton';
import { CreateProjectParams } from '@commands/CreateProject';
import { ProjectInfo } from '@types_/project';

interface CreateProjModalProps {
  onAfterCreate?: () => void;
  onClose: () => void;
  projects: ProjectInfo[];
}

export const CreateProjModal: React.FC<CreateProjModalProps> = ({
  onAfterCreate,
  onClose,
  projects,
}) => {
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const {
    componentRef: createRef,
    showComponent: showModal,
    setShowComponent: setShowModal,
  } = useClickOutside(true);

  React.useEffect(() => {
    if (!showModal) {
      onClose();
    }
  }, [showModal]);

  const [_projectName, setProjectName] = React.useState('');
  const [projectName] = useDebounce(_projectName, 500);

  const [projectNameErrors, setProjectNameErrors] = React.useState<string[]>([]);

  const [isValidatingInput, setIsValidatingInput] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const hasEmptyRequiredInputs = !projectName;
  const hasErrors = projectNameErrors.length > 0;

  React.useEffect(() => {
    setIsValidatingInput(true);
  }, [_projectName]);

  React.useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!projectName) {
      errors.push('Name is required');
    }

    if (projectName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(projectName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    // O_o
    // TODO: use API request to check this info
    if (projects?.some((project) => project.name === projectName)) {
      errors.push('Project name already exists');
    }

    setProjectNameErrors(errors);
    setIsValidatingInput(false);
  }, [projectName]);

  const handleCreateProject = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    const requestGenerator =
      messageHandler.requestGenerator<CreateProjectParams>(
        CREATE_PROJECT,
        v4(),
        { projectName: projectName }
      );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_PROJECT: {
            onAfterCreate?.();
            break;
          }
          case DUPLICATE_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              'Project name already exists',
            ]);
            break;
          }
          case INVALID_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case UNAUTHORIZED_ACCESS: {
            setIsLoggedIn(false);
            break;
          }
          case CLI_MISSING: {
            setIsCliInstalled(false);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  return (
    <Modal componentRef={createRef}>
      <div className='flex flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='truncate font-bold uppercase'>
            Create Project
          </span>
          <button
            className='unstyled'
            onClick={() => setShowModal(false)}
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
        <TextInput
          value={_projectName}
          handleOnChange={setProjectName}
          label='Project Name'
          id='project-name'
          errors={projectNameErrors}
        />
        <div className='!mt-6 flex space-x-2'>
          <SecondaryButton
            onClick={() => setShowModal(false)}
            disabled={isLoading}
          >
            Cancel
          </SecondaryButton>
          <button
            onClick={handleCreateProject}
            className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
            disabled={
              isLoading ||
              isValidatingInput ||
              hasEmptyRequiredInputs ||
              hasErrors
            }
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

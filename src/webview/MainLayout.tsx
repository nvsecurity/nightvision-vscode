import React from "react";
import { useUser } from "@hooks/useUser";
import { Outlet } from "react-router-dom";
import { messageHandler } from "@utils/MessageHandler";
import { LOGOUT } from "@commands/CommandConstants";

export const MainLayout: React.FC = () => {
  const { currentUser } = useUser();

    const { setIsLoggedIn } = useUser();
    const [isLoggingOut, setIsLogginOut] = React.useState(false);

    const handleLogOut = async () => {
      setIsLogginOut(true);

      const requestGenerator = messageHandler.requestGenerator(LOGOUT);

      try {
        for await (const response of requestGenerator) {
          switch (response.command) {
            case LOGOUT: {
              setIsLoggedIn(false);
              break;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      setIsLogginOut(false);
    };

  return (
    <div className='h-full'>
      <div className='flex items-center gap-1 justify-between pb-[0.75rem]'>
        <h1 className='truncate text-[0.85rem] font-medium'>USERNAME: {currentUser?.name}</h1>
        <button className="unstyled !outline-offset-0" onClick={handleLogOut} disabled={isLoggingOut}>
          {SignOutIcon}
        </button>
      </div>
      <Outlet />
    </div>
  );
};

const SignOutIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="#ffffff"
    viewBox="0 0 256 256"
  >
    <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"></path>
  </svg>
);
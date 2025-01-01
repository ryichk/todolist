import { useAuth } from "react-oidc-context";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";
import { COGNITO_CLIENT_ID, COGNITO_DOMAIN, COGNITO_REDIRECT_URI } from "~/constants";

export default function Header() {
  const auth = useAuth();

  const logout = () => {
    auth.removeUser()
    window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(COGNITO_REDIRECT_URI)}`;
  };

  return (
    <header className="grid grid-cols-2 border-b border-gray-300 p-3">
      <span className="justify-self-start text-2xl font-bold text-gray-800 dark:text-gray-100">
        Todo List
      </span>
      <div className="justify-self-end">
        <Toaster />
        {auth?.isAuthenticated ? (
          <Button onClick={logout}>ログアウト</Button>
        ) : (
          <Button type="button" className="mx-2" onClick={() => auth.signinRedirect()}>ログイン</Button>
        )}
      </div>
    </header>
  )
}

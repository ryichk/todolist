import { useAuth } from "react-oidc-context";
import { Button } from "./ui/button";
import { Toaster } from "./ui/toaster";

export default function Header() {
  const auth = useAuth();

  return (
    <header className="grid grid-cols-2 border-b border-gray-300 p-3">
      <span className="justify-self-start text-2xl font-bold text-gray-800 dark:text-gray-100">
        Todo List
      </span>
      <div className="justify-self-end">
        <Toaster />
        {auth?.isAuthenticated ? (
          <Button onClick={() => auth.removeUser()}>ログアウト</Button>
        ) : (
          <Button type="button" className="mx-2" onClick={() => auth.signinRedirect()}>ログイン</Button>
        )}
      </div>
    </header>
  )
}

import type { MetaFunction } from "@remix-run/node";
import { useAuth } from "react-oidc-context";

export const meta: MetaFunction = () => {
  return [
    { title: "Todo List App" },
    { name: "description", content: "Todo List Application." },
  ];
};

export default function Index() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <>Now Loading...</>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  const token = auth.user?.access_token ?? '';

  return (
    <div>
      {auth?.isAuthenticated ? (
        <div>
          <p className="max-w-screen-md">Access Token: {token}</p>
        </div>
      ) : (
        <p>ログインしてください</p>
      )}
    </div>
  );
}

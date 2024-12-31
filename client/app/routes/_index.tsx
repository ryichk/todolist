import type { MetaFunction } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import TodoForm from "~/components/todo-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useToast } from "~/hooks/use-toast";
import { Todo } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Todo List App" },
    { name: "description", content: "Todo List Application." },
  ];
};

export default function Index() {
  const auth = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const { toast } = useToast();

  const token = auth.user?.access_token ?? '';
  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/todos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const todos = await res.json()
      setTodos(todos);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'TODO一覧の取得に失敗しました',
      });
    }
  }, [token, toast])

  useEffect(() => {
    if (!auth?.isAuthenticated) return;

    fetchTodos();
  }, [auth, fetchTodos]);

  if (auth.isLoading) {
    return <p>ローディング中...</p>;
  }

  if (auth.error) {
    console.error(auth.error.message);
    return <p>エラーが発生しました。</p>;
  }

  return (
    <div className="container mx-auto">
      {auth?.isAuthenticated ? (
        <>
          <TodoForm accessToken={token} setTodos={setTodos} />
          <div className="mt-8">
            {todos.length === 0 && (<p>TODOはまだありません。</p>)}
            {todos.map((todo) => (
              <Card key={todo.id} className="m-3">
                <CardHeader>
                  <CardTitle>{todo.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{todo.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <p>ログインしてください。</p>
      )}
    </div>
  );
}

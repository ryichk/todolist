import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "~/hooks/use-toast";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dispatch, SetStateAction } from "react";
import { Todo } from "~/types";
import { API_DOMAIN } from "~/constants";

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'タイトルは2文字以上にしてください'
  }).max(140, {
    message: 'タイトルは140文字以内にしてください'
  }),
  note: z.string().max(800, {
    message: '詳細は800文字以内にしてください'
  }),
})

type Props = {
  accessToken: string;
  setTodos: Dispatch<SetStateAction<Todo[]>>;
}

export default function TodoForm({ accessToken, setTodos }: Props) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const createTodo = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch(`${API_DOMAIN}/todos`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: values.title, note: values.note }),
      });
      const todo = await res.json();
      setTodos((prevTodos) => [todo, ...prevTodos])
      form.reset({ title: '', note: '' });
      toast({
        variant: 'default',
        title: 'TODOを作成しました',
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'TODOの作成に失敗しました',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createTodo)} className="grid">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input placeholder="タイトルを入力してください" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormLabel>詳細</FormLabel>
              <FormControl>
                <Textarea placeholder="詳細を入力してください" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-3 justify-self-end">作成</Button>
      </form>
    </Form>
  )
}

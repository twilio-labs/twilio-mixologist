"use client";

import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LineChartIcon,
  ListTodoIcon,
  MenuIcon,
  Trash2Icon,
} from "lucide-react";
import ConfirmDialog from "./config-dialog";
import { useToast } from "./ui/use-toast";

interface EventCardProps {
  title: string;
  slug: string;
  isAdmin: boolean;
}

export default function EventCard({ title, slug, isAdmin }: EventCardProps) {
  const { toast } = useToast();

  return (
    <Card className="w-full hover:bg-slate-200">
      {isAdmin ? (
        <Link className="hover:underline" href={`/event/${slug}`}>
          <CardHeader>
            <CardTitle className="block h-12 break-words">{title}</CardTitle>
            <CardDescription>Event ID: {slug}</CardDescription>
          </CardHeader>
        </Link>
      ) : (
        <CardHeader>
          <CardTitle className="block h-12 break-words">{title}</CardTitle>
          <CardDescription>Event ID: {slug}</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col space-y-2 ">
          <Link href={`/event/${slug}/orders`}>
            <Button
              className="justify-start hover:underline uppercase"
              variant="ghost"
            >
              <ListTodoIcon className="mr-2" /> orders
            </Button>
          </Link>
          <Link href={`/event/${slug}/menu`}>
            <Button
              className="justify-start hover:underline uppercase"
              variant="ghost"
            >
              <MenuIcon className="mr-2" /> menu
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/event/${slug}/stats`}>
              <Button
                className="justify-start hover:underline uppercase"
                variant="ghost"
              >
                <LineChartIcon className="mr-2" /> stats
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isAdmin && (
          <div className="ml-auto ">
            <ConfirmDialog
              title="Are you sure?"
              description="This action cannot be undone."
              action={async () => {
                fetch(`/api/event/${slug}`, {
                  method: "DELETE",
                })
                  .catch((err: any) => {
                    toast({
                      title: "Count not connect to Sync",
                      description: err.message,
                    });
                    console.error(err);
                  })
                  .then((res: any) => {
                    if (res.ok) {
                      toast({
                        title: "Event Deleted",
                        description: `The event ${title} has been deleted.`,
                      });
                      return window.location.reload();
                    }
                    toast({
                      title: "Deletion Failed",
                      description: res.statusText,
                    });
                  });
              }}
            >
              <Trash2Icon />
            </ConfirmDialog>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

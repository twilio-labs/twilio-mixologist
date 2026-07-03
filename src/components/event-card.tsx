"use client";

import Link from "next/link";
import { LineChartIcon, ListTodoIcon, MenuIcon, Trash2Icon } from "lucide-react";
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
    <div className="bg-white rounded-xl border border-warm shadow-xs hover:shadow-sm transition-shadow flex flex-col">
      <div className="p-5 flex-1">
        {isAdmin ? (
          <Link className="group block" href={`/event/${slug}`}>
            <h2 className="font-semibold text-twilio-ink text-lg leading-snug group-hover:text-twilio-red transition-colors line-clamp-2 min-h-[3rem]">
              {title}
            </h2>
          </Link>
        ) : (
          <h2 className="font-semibold text-twilio-ink text-lg leading-snug line-clamp-2 min-h-[3rem]">
            {title}
          </h2>
        )}
        <p className="text-xs text-gray-400 mt-1 font-mono">{slug}</p>
      </div>

      <div className="px-5 pb-4 border-t border-warm pt-3 flex items-center gap-1">
        <Link
          href={`/event/${slug}/orders`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-warm hover:text-twilio-ink transition-colors font-medium"
        >
          <ListTodoIcon aria-hidden="true" className="h-3.5 w-3.5" />
          Orders
        </Link>
        <Link
          href={`/event/${slug}/menu`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-warm hover:text-twilio-ink transition-colors font-medium"
        >
          <MenuIcon aria-hidden="true" className="h-3.5 w-3.5" />
          Menu
        </Link>
        {isAdmin && (
          <Link
            href={`/event/${slug}/stats`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-warm hover:text-twilio-ink transition-colors font-medium"
          >
            <LineChartIcon aria-hidden="true" className="h-3.5 w-3.5" />
            Stats
          </Link>
        )}
        {isAdmin && (
          <div className="ml-auto">
            <ConfirmDialog
              title="Are you sure?"
              description="This action cannot be undone."
              action={async () => {
                fetch(`/api/event/${slug}`, { method: "DELETE" })
                  .catch((err: any) => {
                    toast({ title: "Could not connect to Sync", description: err.message });
                    console.error(err);
                  })
                  .then((res: any) => {
                    if (res.ok) {
                      toast({ title: "Event Deleted", description: `${title} has been deleted.` });
                      return window.location.reload();
                    }
                    toast({ title: "Deletion Failed", description: res.statusText });
                  });
              }}
            >
              <Trash2Icon aria-label={`Delete ${title}`} className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
            </ConfirmDialog>
          </div>
        )}
      </div>
    </div>
  );
}

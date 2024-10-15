import { PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { useFormStatus } from "react-dom";

export default function BroadcastPopoverContent({
  eventSlug,
  closePopover,
}: {
  eventSlug: string;
  closePopover: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <PopoverContent className="flex flex-col items-center space-y-4 w-full">
      <h2 className="text-xl mx-auto mb-2">Send a message</h2>
      <p>Use the field below to send a message to all open orders.</p>
      <Textarea
        className="min-h-[150px]"
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        name="message"
        placeholder="Type your message here..."
      />
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-slate-200 hover:bg-slate-400 "
        onClick={async (e: any) => {
          e.preventDefault();
          setPending(true);

          fetch(`/api/${eventSlug}/broadcast`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event: eventSlug,
              message,
            }),
          }).then((res) => {
            setPending(false);
            if (res.ok) {
              closePopover();
              setMessage("");
            }
          });
        }}
      >
        {pending ? "Sending..." : "Send Message"}
      </Button>
    </PopoverContent>
  );
}

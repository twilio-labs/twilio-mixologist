import { PopoverContent } from "@/components/ui/popover";
import { Selection } from "../../../../../components/menu-select";
import OrderForm from "../kiosk/order-form";

export default function CustomOrderPopoverContent({
  selection,
  eventSlug,
  closePopover,
}: {
  selection: Selection;
  eventSlug: string;
  closePopover: () => void;
}) {
  return (
    <PopoverContent className="flex flex-col items-center space-y-4 w-full">
      <h2 className="text-xl mx-auto mb-2">Create a custom order</h2>
      <p>Only use this feature if a attendee faces issues with their phone</p>

      <OrderForm
        selection={selection}
        eventSlug={eventSlug}
        showToast={false}
        orderCreated={closePopover}
        askForSender={false}
      />
    </PopoverContent>
  );
}

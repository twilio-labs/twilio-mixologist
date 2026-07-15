import { Check } from "lucide-react";
import MenuItem from "./menu-item";
import type { MenuItem as MenuItemInterface, Menus, modes, Selection } from "@/types";
import { useToast } from "./ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export type { Selection } from "@/types";

const MAX_SELECTABLE_ITEMS = 10;

// Purely decorative checked-state indicator — the surrounding <button> already
// carries the interactive/checkbox semantics, so this must never render a real
// <button> (Radix's Checkbox does) or the browser flags a <button> nested in a <button>.
function CheckboxIndicator({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-primary",
        checked ? "bg-primary text-primary-foreground" : "bg-background",
        className,
      )}
    >
      {checked && <Check className="h-4 w-4" />}
    </div>
  );
}

function menuItemIncluded(menuItem: MenuItemInterface, selection: Selection) {
  return selection.items.some(
    (item) => (item.originalTitle ?? item.shortTitle) === menuItem.shortTitle,
  );
}

export function MenuSelect({
  menus,
  selection,
  onSelectionChange,
}: {
  menus: Menus;
  selection: Selection;
  onSelectionChange: (newSelection: Selection) => void;
}) {
  const { toast } = useToast();
  const allModes = Object.keys(menus) as modes[];
  if (allModes.length === 0) return <div>No menus found</div>;

  const activeMode = selection.mode ?? allModes[0];
  const selectedMenu = menus[activeMode];

  return (
    <Tabs
      value={activeMode}
      onValueChange={(mode) => {
        onSelectionChange({ items: [], modifiers: [], mode: mode as modes });
      }}
    >
      <TabsList className="mb-4 h-auto flex-wrap gap-1">
        {allModes.sort().map((mode) => {
          const selectedCount = selection.mode === mode ? selection.items.length : 0;
          return (
            <TabsTrigger key={mode} value={mode} className="capitalize gap-2 text-sm py-2 px-4">
              {mode}
              {selectedCount > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 font-medium">
                  {selectedCount}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {allModes.map((mode) => {
        const menu = menus[mode];
        return (
          <TabsContent key={mode} value={mode} className="space-y-4">
            {/* Items grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {menu.items.map((menuItem) => {
                const checked = menuItemIncluded(menuItem, selection);
                return (
                  <button
                    key={`${mode}-${menuItem.shortTitle}`}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => {
                      if (!checked && selection.items.length >= MAX_SELECTABLE_ITEMS) {
                        toast({
                          title: "Cannot select more items",
                          description: `Maximum of ${MAX_SELECTABLE_ITEMS} items reached.`,
                        });
                        return;
                      }
                      onSelectionChange(
                        checked
                          ? {
                              ...selection,
                              items: selection.items.filter(
                                (item) =>
                                  (item.originalTitle ?? item.shortTitle) !== menuItem.shortTitle,
                              ),
                            }
                          : { ...selection, items: [...selection.items, menuItem] },
                      );
                    }}
                    className={`relative w-full text-left rounded-lg border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilio-red focus-visible:ring-offset-2 ${
                      checked
                        ? "border-twilio-red bg-red-50"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="absolute top-2.5 right-2.5">
                      <CheckboxIndicator checked={checked} />
                    </div>
                    <MenuItem
                      title={menuItem.title}
                      shortTitle={menuItem.shortTitle}
                      description={menuItem.description}
                    />
                  </button>
                );
              })}
            </div>

            {/* Modifiers */}
            {menu.modifiers && menu.modifiers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Modifiers
                </p>
                <div className="flex flex-wrap gap-2">
                  {menu.modifiers.map((modifier) => {
                    const originals = selection.originalModifiers ?? selection.modifiers;
                    const checked = originals.includes(modifier);
                    return (
                      <button
                        key={`${mode}-${modifier}`}
                        type="button"
                        onClick={() => {
                          const idx = originals.indexOf(modifier);
                          if (checked) {
                            onSelectionChange({
                              ...selection,
                              modifiers: selection.modifiers.filter((_, i) => i !== idx),
                              originalModifiers: originals.filter((_, i) => i !== idx),
                            });
                          } else {
                            onSelectionChange({
                              ...selection,
                              modifiers: [...selection.modifiers, modifier],
                              originalModifiers: [...originals, modifier],
                            });
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilio-red focus-visible:ring-offset-2 ${
                          checked
                            ? "border-twilio-red bg-red-50 text-twilio-red font-medium"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <CheckboxIndicator checked={checked} className="h-3 w-3" />
                        {modifier}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selection.mode === mode && (
              <p className="text-xs text-gray-400">
                {selection.items.length} of {MAX_SELECTABLE_ITEMS} items selected
              </p>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

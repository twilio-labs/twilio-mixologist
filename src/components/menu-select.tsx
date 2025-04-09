import { Checkbox } from "@/components/ui/checkbox";
import MenuItem from "./menu-item";
import { MenuItem as MenuItemInterface, Menus, modes } from "@/config/menus";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";

const MAX_SELECTABLE_ITEMS = 10;

export interface Selection {
  items: MenuItemInterface[];
  modifiers: string[];
  mode: modes;
}

function menuItemIncluded(menuItem: MenuItemInterface, selection: Selection) {
  return selection.items.some((item) => item.title === menuItem.title);
}

function sortAlphabetically(a: string, b: string) {
  return a.localeCompare(b);
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
  const modes = Object.keys(menus) as modes[];
  if (modes.length === 0) {
    return <div>No menus found</div>;
  }

  let selectedMenu = menus[selection.mode];
  if (!selection.mode) {
    // delay my a microtick to avoid "cannot update a component while rendering a different component" error
    setTimeout(() => {
      onSelectionChange({
        ...selection,
        mode: modes[0],
      });
    }, 0);
    selectedMenu = menus[modes[0]];
  }

  return (
    <>
      <ul className="flex mb-2 flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200  dark:text-gray-400">
        {modes.sort(sortAlphabetically).map(function (mode, idx) {
          return (
            <li
              key={mode}
              onClick={() => {
                onSelectionChange({
                  items: [],
                  modifiers: [],
                  mode,
                });
              }}
              className={`${
                (!selection.mode && idx === 0) || // noSelectionAndFirstItem
                (selection.mode && mode === selection.mode) // selectionAndSelectedItem
                  ? "active text-slate-800 bg-slate-200"
                  : ""
              } me-2 inline-block p-4 rounded-t-lg cursor-pointer hover:bg-slate-300 hover:text-white-300`}
            >
              {mode.substring(0, 1).toUpperCase() + mode.substring(1)}
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 mb-2 border-b border-gray-200 ">
        {selectedMenu.items.map((menuItem) => (
          <div
            key={`${selection.mode}-${menuItem.shortTitle}`}
            onClick={() => {
              const isAlreadySelected = menuItemIncluded(menuItem, selection);
              if (!isAlreadySelected && selection.items.length === 9) {
                toast({
                  title: "Cannot select more items",
                  description: `Reached maximum of ${MAX_SELECTABLE_ITEMS} selected items.`,
                });
                return;
              }

              onSelectionChange(
                isAlreadySelected
                  ? {
                      ...selection,
                      items: selection.items.filter(
                        (item) => item.title !== menuItem.title,
                      ),
                    }
                  : {
                      ...selection,
                      items: [...selection.items, menuItem],
                    },
              );
            }}
            className={`${
              menuItemIncluded(menuItem, selection) ? "bg-slate-200" : ""
            } border rounded-lg px-4 flex items-start gap-4 cursor-pointer hover:bg-slate-300`}
          >
            <Checkbox
              className="mt-1 self-center"
              checked={menuItemIncluded(menuItem, selection)}
            />
            <MenuItem
              title={menuItem.title}
              shortTitle={menuItem.shortTitle}
              description={menuItem.description}
            />
          </div>
        ))}
      </div>
      {selectedMenu.modifiers && (
        <>
          <Label htmlFor="modifiers">Modifiers</Label>
          <div className="mt-2 space-y-2">
            {selectedMenu.modifiers.map((modifier) => (
              <div
                key={`${selection.mode}-${modifier}`}
                onClick={() => {
                  const isAlreadySelected =
                    selection.modifiers.includes(modifier);
                  onSelectionChange(
                    isAlreadySelected
                      ? {
                          ...selection,
                          modifiers: selection.modifiers.filter(
                            (item) => item !== modifier,
                          ),
                        }
                      : {
                          ...selection,
                          modifiers: [...selection.modifiers, modifier],
                        },
                  );
                }}
                className={`${
                  selection.modifiers.includes(modifier) ? "bg-slate-200" : ""
                } border rounded-lg p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-300`}
              >
                <Checkbox
                  className="mt-1 self-center"
                  checked={selection.modifiers.includes(modifier)}
                />
                <span>{modifier}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

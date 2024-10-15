import iconMap from "@/components/icon-map";
import { XIcon } from "lucide-react";

export default function MenuItem({
  title,
  shortTitle,
  description,
}: {
  title: string;
  shortTitle: string;
  description: string;
}) {
  const IconComponent = iconMap[shortTitle];
  return (
    <div className="flex flex-col">
      {IconComponent ? (
        <IconComponent
          width="6rem"
          height="6rem"
          fill="text-black"
          className="m-2 mx-auto"
        />
      ) : (
        <XIcon
          width="3rem"
          height="3rem"
          fill="text-black"
          className="m-2 mx-auto"
        />
      )}
      <div className="text-center">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

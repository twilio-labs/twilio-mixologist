import { XIcon } from "lucide-react";
import iconMap from "./icon-map";

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
    <div className="flex items-start py-4">
      {IconComponent ? (
        <IconComponent
          width="3rem"
          height="3rem"
          style={{ fill: "black" }}
          className="m-2 mr-6"
        />
      ) : (
        <XIcon
          width="3rem"
          height="3rem"
          style={{ fill: "black" }}
          className="m-2 mr-6"
        />
      )}
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

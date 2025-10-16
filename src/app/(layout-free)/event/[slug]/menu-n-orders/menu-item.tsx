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
    <div className="flex flex-col cursor-pointer">
      {IconComponent ? (
        <IconComponent
          width="8rem"
          height="8rem"
          style={{ fill: "white" }}
          className="m-2 mx-auto"
        />
      ) : (
        <XIcon
          width="3rem"
          height="3rem"
          fill="text-black"
          style={{ fill: "white" }}
          className="m-2 mx-auto"
        />
      )}
      <div className="text-center">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm mt-2 max-w-xs">{description}</p>
      </div>
    </div>
  );
}

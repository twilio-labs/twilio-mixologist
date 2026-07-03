import { CupSodaIcon } from "lucide-react";
import iconMap from "./icon-map";

export default function MenuItem({
  title,
  shortTitle,
  description,
  originalTitle,
}: {
  title: string;
  shortTitle: string;
  description: string;
  originalTitle?: string;
}) {
  const IconComponent = iconMap[originalTitle ?? shortTitle];

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-twilio-paper mt-0.5">
        {IconComponent ? (
          <IconComponent
            width="1rem"
            height="1rem"
            style={{ fill: "currentColor" }}
            className="text-twilio-ink"
          />
        ) : (
          <CupSodaIcon className="h-4 w-4 text-twilio-ink" />
        )}
      </div>
      <div>
        <p className="text-base font-medium text-gray-900 leading-snug">
          {title}
        </p>
        {description && (
          <p className="text-sm text-gray-400 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

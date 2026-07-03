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
    <div className="flex items-start gap-3 rounded-lg border border-warm bg-white px-3 py-2.5 hover:bg-warm transition-colors">
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
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-snug">
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

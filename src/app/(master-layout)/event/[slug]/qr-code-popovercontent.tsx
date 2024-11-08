import { Input } from "@/components/ui/input";
import { PopoverContent } from "@/components/ui/popover";
import { useRef, useState } from "react";

import QRCode from "react-qr-code";

function getActionableLink(sender: string, ctaMessage: string) {
  if (sender.startsWith("whatsapp:")) {
    return `https://wa.me/${sender.replace("whatsapp:", "")}?text=${encodeURIComponent(ctaMessage)}`;
  }
  return `smsto:${sender}:${ctaMessage}`;
}
export default function QrPopoverConent({ senders }: { senders: string[] }) {
  const [ctaMessage, setCtaMessage] = useState("");

  const qrContainerRef = useRef<HTMLDivElement>(null);
  const downloadQR = async () => {
    qrContainerRef.current?.childNodes.forEach((qr) => {
      if (!qr) {
        throw new Error("Something went wrong");
      }

      const svgData = new XMLSerializer().serializeToString(qr);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = function () {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
        }
        const pngFile = canvas.toDataURL("image/png", 1.0);

        const downloadLink = document.createElement("a");
        downloadLink.download = "qrcode";
        downloadLink.href = `${pngFile}`;
        downloadLink.target = "_blank";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        downloadLink.remove();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    });
  };

  return (
    <PopoverContent className="max-[400px] w-[600px] overflow-auto">
      <h2 className="text-xl mb-2 text-center">QR Codes</h2>
      <Input
        placeholder="Your CTA message"
        value={ctaMessage}
        onChange={(event) => setCtaMessage(event.target.value)}
      />
      <div className="grid grid-cols-2" ref={qrContainerRef}>
        {senders.map((sender) => (
          <QRCode
            key={sender}
            className="p-6 w-[200px] h-[200px] mx-auto"
            value={getActionableLink(sender, ctaMessage)}
          />
        ))}
      </div>
      <div className="flex justify-center bg-slate-100 hover:bg-slate-200 rounded-sm py-2">
        <button onClick={downloadQR}>Download QR Codes</button>
      </div>
    </PopoverContent>
  );
}

import { CoffeeShopIcon } from "@/components/icons";
import QRCode from "react-qr-code";

export default function Header({ number }: { number: string }) {
  return (
    <header className="bg-red-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <CoffeeShopIcon
          width="10rem"
          height="10rem"
          style={{ fill: "white" }}
        />
        <div className="flex items-center ">
          <object
            data="/twilio.svg"
            type="image/svg+xml"
            width="153"
            height="45"
            className="mr-2"
          />
          <h1 className="text-[2.5rem] ">cafe</h1>
        </div>
        {/* <p className="text-sm">SEND YOUR ORDER TO {number}</p> */}
        <QRCode
          value={`https://qr.link/AnTVsw`}
          // @ts-expect-error - `size` prop is missing in the type definition
          size={"10rem"}
          renderAs="svg"
        />
        {/* only temporary test with the QR code */}
        {/* <CoffeeShopIcon
          width="10rem"
          height="10rem"
          style={{ fill: "white" }}
        /> */}
      </div>
    </header>
  );
}

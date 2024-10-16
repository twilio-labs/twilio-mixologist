import { CoffeeShopIcon } from "@/components/icons";

export default function Header({ number }: { number: string }) {
  return (
    <header className="bg-red-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <CoffeeShopIcon
          width="10rem"
          height="10rem"
          fill="text-white svg-hack fill-white"
        />
        <div className="flex items-center ">
          <object
            data="/twilio.svg"
            type="image/svg+xml"
            width="153"
            height="45"
            className="mr-2"
          />
          <h1 className="text-[2.5rem] font-bold">Mixologist</h1>
        </div>
        {/* <p className="text-sm">SEND YOUR ORDER TO {number}</p> */}
        <CoffeeShopIcon
          width="10rem"
          height="10rem"
          fill="text-white fill-green"
        />
      </div>
    </header>
  );
}

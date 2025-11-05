import { CoffeeShopIcon } from "@/components/icons";

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
          <h1 className="text-[2.5rem] ">Barista Menu</h1>
        </div>
        {/* <p className="text-sm">SEND YOUR ORDER TO {number}</p> */}
        <CoffeeShopIcon
          width="10rem"
          height="10rem"
          style={{ fill: "white" }}
        />
      </div>
    </header>
  );
}

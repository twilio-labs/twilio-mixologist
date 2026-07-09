import { ShopSignIcon } from "@/components/icons";

export default function Header({ mode }: { number: string; mode: string }) {
  return (
    <header className="bg-red-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <ShopSignIcon
          mode={mode}
          width="10rem"
          height="10rem"
          style={{ fill: "white" }}
        />
        <div className="flex items-center gap-6">
          <object
            data="/twilio.svg"
            type="image/svg+xml"
            width="306"
            height="90"
          />
          <h1 className="text-[5rem] font-bold leading-none">Bar</h1>
        </div>
        {/* <p className="text-sm">SEND YOUR ORDER TO {number}</p> */}
        <ShopSignIcon
          mode={mode}
          width="10rem"
          height="10rem"
          style={{ fill: "white" }}
        />
      </div>
    </header>
  );
}

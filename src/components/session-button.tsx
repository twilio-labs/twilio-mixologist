import Link from "next/link";
import { cookies } from "next/headers";
import { Privilege } from "@/middleware";
import { redirect } from "next/navigation";

import { LogOutIcon, UserIcon } from "lucide-react";

export default async function SessionButton(
  props: React.HTMLAttributes<HTMLDivElement>,
) {
  const cookiesStore = await cookies();
  const loggedIn = [Privilege.ADMIN, Privilege.MIXOLOGIST].includes(
    cookiesStore.get("privilege")?.value as Privilege,
  );

  return (
    <div {...props}>
      <li className={`mx-2 ${loggedIn ? "hidden" : ""}`}>
        <Link className="text-white text-lg flex" href="/login">
          <UserIcon className="mr-2 text-white text-lg " />
          <span className="hidden md:block">Login</span>
        </Link>
      </li>
      <li className={`mx-2 ${!loggedIn ? "hidden" : ""}`}>
        <form
          action={async function clearPrivilegeCookies() {
            "use server";

            const cs = await cookies();
            cs.delete("privilege");
            redirect("/");
          }}
        >
          <button
            className="text-white text-lg flex items-center"
            type="submit"
          >
            <LogOutIcon className="mr-2 text-white text-lg " />
            <span className="hidden md:block">Log out</span>
          </button>
        </form>
      </li>
    </div>
  );
}

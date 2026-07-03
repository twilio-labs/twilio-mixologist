import Link from "next/link";
import { cookies } from "next/headers";
import { Privilege } from "@/proxy";
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
      <li className={`${loggedIn ? "hidden" : ""}`}>
        <Link
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[#9cafc8] hover:text-white hover:bg-[#1e2d42] transition-colors text-sm"
          href="/login"
        >
          <UserIcon className="h-4 w-4" />
          <span className="hidden md:block">Login</span>
        </Link>
      </li>
      <li className={`${!loggedIn ? "hidden" : ""}`}>
        <form
          action={async function clearPrivilegeCookies() {
            "use server";
            const cs = await cookies();
            cs.delete("privilege");
            redirect("/");
          }}
        >
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[#9cafc8] hover:text-white hover:bg-[#1e2d42] transition-colors text-sm"
            type="submit"
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden md:block">Log out</span>
          </button>
        </form>
      </li>
    </div>
  );
}

"use client";

import { getCookie } from "cookies-next";
import { useState, useEffect } from "react";
import { Privilege } from "@/middleware";
import { redirect } from "next/navigation";

export function isClientAuth(privileges: Privilege[], Component: any) {
  return clientOnlyRender(function IsAuth(props: any) {
    const privilege = getCookie("privilege") as Privilege;
    const authenticated = privileges.includes(privilege);

    useEffect(() => {
      if (!authenticated) {
        return redirect("/login");
      }
    }, []);

    if (!authenticated) {
      return null;
    }

    return <Component {...props} />;
  });
}

export function clientOnlyRender(Component: any) {
  return function (props: any) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return null;
    }

    return <Component {...props} />;
  };
}

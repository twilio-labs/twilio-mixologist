"use client";
import { useState, useEffect } from "react";

const getOrientation = () => {
  if (typeof screen !== "undefined") {
    return screen?.orientation?.type;
  }
  return "landscape";
};

export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());

    screen.orientation.addEventListener("change", handleOrientationChange);

    return () =>
      screen.orientation.removeEventListener("change", handleOrientationChange);
  }, []);

  return orientation;
};
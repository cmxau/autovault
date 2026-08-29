import { useEffect, useState } from "react";

const KEY = "autovault-profile-name";

export function getProfileName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) ?? "";
}

export function setProfileName(name: string) {
  window.localStorage.setItem(KEY, name);
}

export function useProfileName() {
  const [name, setName] = useState("");

  useEffect(() => setName(getProfileName()), []);

  return name;
}

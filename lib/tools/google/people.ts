import { google } from "googleapis";

export function getPeopleClient() {
  return google.people({ version: "v1" });
}

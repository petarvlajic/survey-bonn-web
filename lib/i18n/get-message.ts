import type { Messages } from "./messages/de"

export function getMessage(messages: Messages, path: string): string {
  const parts = path.split(".")
  let cur: unknown = messages
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return path
    }
  }
  return typeof cur === "string" ? cur : path
}

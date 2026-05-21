import type { ThemeName } from "@/app/themes/error"
export type ErrorObjectType = {
  theme: ThemeName
  name: string
  desc: string
  stateChangeFunc?: (state: boolean)=> void
  state?: boolean
  interactiveFunc?: ()=> void
  interactiveName?: string
}
'use client'
import themes from "../themes/error"
import type { ThemeName } from "../themes/error"
import { createPortal } from "react-dom"
type PageErrorProps = {
  theme: ThemeName
  name: string
  desc: string
  stateChangeFunc: (state: boolean)=> void
  state: boolean
  interactiveFunc: ()=> void
  interactiveName: string
}

const Error = ({ name, desc, theme, stateChangeFunc, state, interactiveFunc, interactiveName }: PageErrorProps) => {
  const actualTheme = themes[theme ?? 'main']
  if(!state) return null;
  
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[1000001] animate-fade-in-up">
      <div
        style={{
          '--error-bg': actualTheme.background,
          '--error-text': actualTheme.text,
          '--error-border': actualTheme.border,
          '--error-icon': actualTheme.iconColor,
          '--error-gradient-from': actualTheme.gradient.from,
          '--error-gradient-to': actualTheme.gradient.to,
          '--error-point': actualTheme.pointColor,
        } as React.CSSProperties}
        className="w-80 overflow-hidden rounded-lg border border-[rgb(var(--error-border)/0.5)] bg-[rgb(var(--error-bg)/0.95)] text-[rgb(var(--error-text)/1)] backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[rgb(var(--error-gradient-from)/0.5)] to-[rgb(var(--error-gradient-to)/0.5)]">
          <div className="flex items-center">
            <div className="mr-3 h-2 w-2 animate-pulse rounded-full bg-[rgb(var(--error-point)/1)]" />
            <h3 className="text-sm font-medium">{name}</h3>
          </div>
          <button
            onClick={() => stateChangeFunc(false)}
            className="rounded-full p-1 transition-colors duration-200 hover:bg-[rgb(var(--error-border)/0.3)]"
          >
            <svg className="h-4 w-4 text-[rgb(var(--error-icon)/1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className=" px-4 py-3 flex gap-5">
          <div className="max-width-80% flex items-center">
            <p className="text-sm text-[rgb(var(--error-text)/0.85)]">{desc}</p>
          </div>

          {interactiveName && (
            <div className="flex justify-end items-center margin-0px">
              <button
                onClick={interactiveFunc}
                className="rounded-md border border-[rgb(var(--error-border)/0.6)] bg-gradient-to-r from-[rgb(var(--error-gradient-from)/0.7)] to-[rgb(var(--error-gradient-to)/0.7)] px-3 py-1.5 text-sm font-medium text-[rgb(var(--error-text)/1)] transition-all duration-200 hover:from-[rgb(var(--error-gradient-from)/0.9)] hover:to-[rgb(var(--error-gradient-to)/0.9)] hover:shadow-md active:scale-[0.97]"
              >
                {interactiveName}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Error

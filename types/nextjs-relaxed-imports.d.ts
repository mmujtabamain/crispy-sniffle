// Stricter declarations so Next-generated type imports resolve.
// These mirror the shapes expected by Next's `types/validator.ts`.

declare module "../../src/app/page.js" {
  import type React from "react"

  export type PageProps = { params: Promise<Record<string, unknown>> } & Record<string, unknown>

  export type PageDefault =
    | React.ComponentType<PageProps>
    | ((props: PageProps) => React.ReactNode | Promise<React.ReactNode> | void)

  const _default: PageDefault
  export default _default

  export function generateStaticParams(props: { params: Record<string, unknown> }): Promise<any[]> | any[]
  export function generateMetadata(props: PageProps, parent: unknown): Promise<any> | any
  export function generateViewport(props: PageProps, parent: unknown): Promise<any> | any
  export const metadata: unknown
  export const viewport: unknown
}

declare module "../../src/app/layout.js" {
  import type React from "react"

  export type LayoutProps = { params: Record<string, unknown> } & Record<string, unknown>

  export type LayoutDefault =
    | React.ComponentType<LayoutProps>
    | ((props: LayoutProps) => React.ReactNode | Promise<React.ReactNode> | void)

  const _default: LayoutDefault
  export default _default

  export function generateStaticParams(props: { params: Record<string, unknown> }): Promise<any[]> | any[]
  export function generateMetadata(props: { params: Promise<Record<string, unknown>> } & Record<string, unknown>, parent: unknown): Promise<any> | any
  export function generateViewport(props: { params: Promise<Record<string, unknown>> } & Record<string, unknown>, parent: unknown): Promise<any> | any
  export const metadata: unknown
  export const viewport: unknown
}

// Wildcard variants to match different resolver patterns
declare module "*src/app/page.js" {
  export * from "../../src/app/page.js"
  import defaultExport from "../../src/app/page.js"
  export { defaultExport as default }
}

declare module "*src/app/layout.js" {
  export * from "../../src/app/layout.js"
  import defaultExport from "../../src/app/layout.js"
  export { defaultExport as default }
}

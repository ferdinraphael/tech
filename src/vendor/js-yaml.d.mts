export function load(source: string): unknown

declare const yaml: {
  load: typeof load
}

export default yaml

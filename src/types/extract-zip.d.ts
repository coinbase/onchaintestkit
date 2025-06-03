declare module "extract-zip" {
  export default function extract(
    source: string,
    options: {
      dir: string
      onEntry?: (entry: any) => void
    },
  ): Promise<void>
}

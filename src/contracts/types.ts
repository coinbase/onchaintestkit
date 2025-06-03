export type DeployConfig = {
  name: string
  address: string
  args: string
  value?: bigint
}

export type InitCall = {
  sender: string
  target: string
  selector: string
  args: string
  value: bigint
}

export type SetupConfig = {
  deployments: DeployConfig[]
  initCalls: InitCall[]
}

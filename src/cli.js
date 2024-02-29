import { install_raw } from "./install"

// TODO: implement

const main = async () => {
  let sourcePath = scriptArgs[1]
  let name = scriptArgs[2] ?? "default"
  let nuxId = scriptArgs[3] ?? null

  install_raw(sourcePath, name, nuxId)
}


main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  std.exit(1)
})

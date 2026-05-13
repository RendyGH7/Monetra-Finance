export function requiredEnv(name: keyof ImportMetaEnv) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}


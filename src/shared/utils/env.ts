export function getEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

export function isDevEnvironment(): boolean {
  return getEnvironment() === 'development';
}

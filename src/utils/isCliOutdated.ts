export const isCliOutdated = (cliVersion: string) => {
  const userCliVersion = cliVersion.split('.').map(Number);
  const pluginCliVersion = (process.env.CLI_VERSION ?? '0.0.0')
    .split('.')
    .map(Number);

  for (
    let i = 0;
    i < Math.max(userCliVersion.length, pluginCliVersion.length);
    i++
  ) {
    const v1 = userCliVersion[i] || 0;
    const v2 = pluginCliVersion[i] || 0;

    if (v1 < v2) {
      return true;
    }
  }

  return false;
};

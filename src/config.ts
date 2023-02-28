const parsePrefix = (envPrefix: string | undefined): string => {
  let prefix = envPrefix || '/update-webhooks';

  if (prefix.endsWith('/')) {
    prefix = prefix.replace(/\/$/, '')
  }

  if (!prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }

  return prefix;
};

const config = {
  host: process.env.HOST || '0.0.0.0',
  port: isNaN(parseInt(process.env.PORT || '', 10))
    ? 9999
    : parseInt(process.env.PORT || '', 10),
  webhookUrlPrefix: parsePrefix(process.env.URL_PREFIX),
  webhookScriptsDir: process.env.SCRIPTS_DIR || `${process.cwd()}/webhooks`
};

export default config;

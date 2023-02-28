import express from 'express';
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import config from './config';
import spawnAndPipe from './spawn-and-pipe';
import { PassThrough } from 'stream';

const app = express();
const webhookScripts = glob.sync(`${config.webhookScriptsDir}/*`)
  .filter((file) => !file.endsWith('.secret'))
  .map((scriptPath) => {
    const scriptName = path.basename(
      scriptPath,
      scriptPath.match(/(?:.(?!\.))+$/)?.[0]
    );

    return {
      scriptName,
      scriptPath,
      scriptSecret: fs.readFileSync(
        `${config.webhookScriptsDir}/${scriptName}.secret`,
        'utf8'
      ).replace(/(\r|\n)/g, '')
    };
  })
  .filter(({ scriptPath, scriptName, scriptSecret }) => {
    if (!scriptSecret) {
      console.error(`ERROR: Script "${path.basename(scriptPath)}" has no secret (file "${scriptName}.secret" missing).`)
    }

    return !!scriptSecret;
  });

if (!webhookScripts.length) {
  throw new Error(`No webhook scripts found in "${config.webhookScriptsDir}". Exitting...`);
}

for (const { scriptName, scriptSecret, scriptPath } of webhookScripts) {
  const webhookUrl = `${config.webhookUrlPrefix}/${scriptName}/${scriptSecret}`;
  console.info(`Creating webhook "${webhookUrl}"...`);

  app.get(webhookUrl, async (req, res) => {
    const logEvent = (msg: string | Error) => {
      console.info(msg);
      res.write(typeof msg === 'string'
        ? `${msg}\n`
        : `${msg?.stack || msg?.message || 'UNKNOWN ERROR OCCURED'}\n`
      );
    };

    const stream = new PassThrough({
      transform(chunk, encoding, callback) {
        process.stdout.write(`${chunk || ''}`);
        res.write(`${chunk || ''}`);
        this.push(chunk, encoding);
        callback();
      }
    });

    logEvent(`[START] Executing webhook: "${webhookUrl}"...`);
    try {
      await spawnAndPipe([scriptPath], stream);
      logEvent(`[END] SUCCESS: Webhook: "${webhookUrl}" finished successfully.`);
    } catch (err) {
      logEvent(err as Error);
      logEvent(`[END] ERROR: Webhook "${webhookUrl}" finished with an error.`);
    } finally {
      stream.end();
      res.end();
    }
  })
}

app.listen(config.port, config.host, () => {
  console.info(`Listening on http://${config.host}:${config.port}`);
});

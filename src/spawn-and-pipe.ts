import childProcess from 'child_process';
import { PassThrough } from 'stream';
import pump from 'pump';

class SpawnAndPipeError extends Error {
  code: number;
  command: string;

  constructor({ code, command }: { code: number, command: string }) {
    super();
    this.code = code;
    this.command = command;
    this.message = `Command "${command}" exitted with code: ${code}`
  }
}

const spawnAndPipe = (
  cmdWithArgs: string[],
  stdout: PassThrough
) => new Promise<void>((resolve, reject) => {
  const [cmd, ...args] = cmdWithArgs;
  const spawned = childProcess.spawn(cmd, args, {
    stdio: [
      'ignore', // stdin
      'pipe',   // stdout
      'pipe'    // stderr
    ]
  });

  pump(spawned.stdout, stdout);
  pump(spawned.stderr, stdout);

  spawned.on('close', (code) => {
    if (code) {
      return reject(new SpawnAndPipeError({
        code,
        command: `${cmd} ${args.join(' ')}`
      }));
    }

    resolve();
  });
});

export default spawnAndPipe;

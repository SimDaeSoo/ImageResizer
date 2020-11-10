import fs from 'fs';
import sharp from 'sharp';

interface ImageProcessTask {
  src: string;
  dst: string;
  resolution: Resolution;
}

interface Resolution {
  width: number;
  height: number;
}

async function main(): Promise<void> {
  while (true) {
    try {
      await execute();
    } catch (e) {
      console.log(e);
    }
  }
}

async function execute(): Promise<void> {
  const INPUT_DIRECTORY: string = '/Volumes/ConvertVideos/Masters/Resizer';
  const OUTPUT_DIRECTORY: string = '/Volumes/ConvertVideos/Services/Resizer';
  const imageProcessTasks: Array<ImageProcessTask> = getImageProcessTasks(INPUT_DIRECTORY, OUTPUT_DIRECTORY);

  for (const imageProcessTask of imageProcessTasks) {
    if (!validateTask(imageProcessTask)) continue;
    await processing(imageProcessTask);
  }

  return new Promise(resolve => setTimeout(resolve, 5000));
}

function validateTask(task: ImageProcessTask): boolean {
  try {
    const srcStat: fs.Stats = fs.statSync(task.src);
    const dstStat: fs.Stats = fs.statSync(task.dst);
    return srcStat.atimeMs > dstStat.atimeMs;
  } catch {
    return true;
  }
}

async function processing(task: ImageProcessTask): Promise<void> {
  return new Promise((resolve) => {
    const paths: Array<string> = task.dst.split('/');
    fs.mkdirSync(paths.splice(0, paths.length - 1).join('/'), { recursive: true });

    sharp(task.src)
      .resize({ width: task.resolution.width, height: task.resolution.height })
      .toBuffer()
      .then((data: Buffer): void => {
        fs.writeFileSync(task.dst, data);
        resolve();
      });
  });
}

function isImageFile(path: string): boolean {
  const matched: Array<string> | null = path.match(/.png|.jpg|.jpeg/g);
  return matched !== null && matched.length > 0;
}

function getImageProcessTasks(input: string, output: string): Array<ImageProcessTask> {
  const imageProcessTasks: Array<ImageProcessTask> = [];
  const files: Array<string> = getFiles(input);

  for (const file of files) {
    if (isImageFile(file)) {
      const resolution: Resolution = getTargetResolution(file);
      const task: ImageProcessTask = { resolution, src: file, dst: file.replace(input, output) };
      imageProcessTasks.push(task);
    }
  }

  return imageProcessTasks;
}

function getTargetResolution(path: string): Resolution {
  const paths: Array<string> = path.split('/');
  const parent: Array<string> = paths.slice(-2, -1);
  const [width, height]: Array<string> = parent[0].split('x');

  return { width: Number(width), height: Number(height) };
}

function getFiles(path: string): Array<string> {
  const files: Array<string> = [];

  for (const file of fs.readdirSync(path)) {
    const filepath: string = `${path}/${file}`;
    const filestat: fs.Stats = fs.statSync(filepath);

    if (filestat.isDirectory()) {
      files.push(...getFiles(filepath));
    } else {
      files.push(filepath);
    }
  }

  return files;
}

main();
import fs from 'fs';
import sharp from 'sharp';

interface ImageProcessTask {
  src: string;
  dst: string;
  resolution: {
    width: number;
    height: number;
  }
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

function getImageProcessTasks(input: string, output: string): Array<ImageProcessTask> {
  const imageProcessTasks: Array<ImageProcessTask> = [];

  const dirs: Array<string> = getDirs(input);
  for (const dir of dirs) {
    const [width, height]: Array<string> = dir.split('x');
    const images: Array<string> = getImages(`${input}/${dir}`);
    const tasks: Array<ImageProcessTask> = images.map((image: string): ImageProcessTask => {
      return {
        src: `${input}/${dir}/${image}`,
        dst: `${output}/${dir}/${image}`,
        resolution: {
          width: Number(width),
          height: Number(height)
        }
      }
    });

    imageProcessTasks.push(...tasks)
  }

  return imageProcessTasks;
}

function getDirs(path: string): Array<string> {
  const dirs: Array<string> = fs.readdirSync(path);
  return dirs.reduce((acc: Array<string>, val: string): Array<string> => {
    if (val.indexOf('.') < 0) {
      acc.push(val);
    }
    return acc;
  }, []);
}

function getImages(path: string): Array<string> {
  const dirs: Array<string> = fs.readdirSync(path);
  return dirs.reduce((acc: Array<string>, val: string): Array<string> => {
    if (val.match(/png|jpg|jpeg/g)) {
      acc.push(val);
    }
    return acc;
  }, []);
}

main();
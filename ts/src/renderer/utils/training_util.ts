import fs from 'fs'
import child_process from 'child_process'
import { OUTPUT_DIR_BASE } from '../../main'

export function performTrainingIfNeeded(outputDir: string, modelName: string): void {
  // Checking if outputs directory already exists
  try {
    fs.statSync(`${OUTPUT_DIR_BASE}\\${outputDir}`)
    console.log('INFO: Output directory already exists! Skipping training.')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        const args: string[] = ['--model-name', modelName, '--output-dir', outputDir]
        const command = `cd ${OUTPUT_DIR_BASE} && py run_training.py ${args.join(' ')}`
        const stdout = child_process.execSync(command, {
          encoding: 'utf8',
          env: { ...process.env, PYTHONIOENCODING: 'utf8' }
        })
        // optional, stdout from child process (emojis are bugged for example)
        console.log(stdout)
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : String(error)
        console.error(`INFO: Error occurred! ${errMessage}`)
      }
    } else {
      console.log(`INFO: Unknown error: ${err}`)
    }
  }
}

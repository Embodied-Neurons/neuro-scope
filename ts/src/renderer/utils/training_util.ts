import { exec } from 'child_process'
import fs from 'fs'
import { OUTPUT_DIR_BASE } from '../../main'

export function performTrainingIfNeeded(outputDir: string, modelName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Checking if outputs directory already exists
    try {
      fs.statSync(`${OUTPUT_DIR_BASE}\\${outputDir}`)
      console.log('Output directory exists. Skipping training.')
      resolve()
      return
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        reject(err)
        return
      }
    }

    const args = ['--model-name', modelName, '--output-dir', outputDir]
    const command = `cd ${OUTPUT_DIR_BASE} && py run_training.py ${args.join(' ')}`

    const child = exec(command, { env: { ...process.env } })

    child.stdout?.on('data', (d) => console.log(d))
    child.stderr?.on('data', (d) => console.error(d))

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Training failed with exit code ${code}`))
    })
  })
}

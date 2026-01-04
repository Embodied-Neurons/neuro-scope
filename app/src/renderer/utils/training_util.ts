import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { OUTPUT_DIR_BASE, PY_DIR_BASE } from '../../main'

export function performTrainingIfNeeded(
  outputDir: string,
  modelName: string,
  epochs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullOutputPath = path.join(OUTPUT_DIR_BASE, outputDir)
    if (fs.existsSync(fullOutputPath)) {
      console.log('Output folder exists, checking its contents...')

      const files = fs.readdirSync(fullOutputPath)

      // Names of the required files
      const required = new Set<string>([
        'graph_structure.json',
        ...Array.from({ length: epochs }, (_, i) => `epoch_${i}_activations.json`),
        ...Array.from({ length: epochs }, (_, i) => `epoch_${i}_gradients.json`)
      ])

      // Names of the allowed files
      const allowed = new Set<string>(['test_activations.json', ...required])

      let valid = true

      // Check if there is a not allowed file
      for (const file of files) {
        if (!allowed.has(file)) {
          valid = false
          console.log(`Unexpected file detected: ${file}`)
          break
        }
      }

      // Check for required files - gradients, activations and structure
      for (const file of required) {
        if (!files.includes(file)) {
          valid = false
          console.log(`Missing expected file: ${file}`)
          break
        }
      }

      if (valid) {
        console.log(
          'All expected files are present and there are no unexpected files. Skipping training.'
        )
        resolve()
        return
      }

      // Folder is 'invalid' in some way, so clean it
      try {
        fs.rmSync(fullOutputPath, { recursive: true, force: true })
      } catch (err) {
        reject(err)
        return
      }
    }

    const args = [
      '--model-name',
      String(modelName),
      '--output-dir',
      String(outputDir),
      '--epochs',
      String(epochs)
    ]
    const command = `cd ${PY_DIR_BASE} && py run_training.py ${args.join(' ')}`
    const child = exec(command, { env: { ...process.env } })

    child.stdout?.on('data', (d) => console.log(d))
    child.stderr?.on('data', (d) => console.error(d))

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Training failed with exit code ${code}`))
    })
  })
}

export function checkDir(dir: string): string[] {
  try {
    const files = fs.readdirSync(path.join(OUTPUT_DIR_BASE, dir))
    return files
  } catch {
    return []
  }
}

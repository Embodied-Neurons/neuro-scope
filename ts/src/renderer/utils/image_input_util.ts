import child_process from 'child_process'
import { OUTPUT_DIR_BASE } from '../../main'

export function runImageInput(outputDir: string, modelName: string, imagePath: string): void {
  try {
    const args: string[] = [
      '--model-name',
      String(modelName),
      '--output-dir',
      String(outputDir),
      '--image-path',
      String(imagePath)
    ]

    const command = `cd ${OUTPUT_DIR_BASE} && py run_image_input.py ${args.join(' ')}`
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
}

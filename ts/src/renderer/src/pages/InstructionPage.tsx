import { useNavigate } from 'react-router-dom'
import { JSX } from 'react'

export default function InstructionsPage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl space-y-8">
        <h2 className="text-3xl font-bold text-center">User Manual</h2>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">1. Registering the Tracker</h3>
          <p>
            Before visualizing a neural network, you must register an activation tracker on your
            model. To do this, apply the <strong>@register_trainer</strong> decorator to your
            training class, and add the <strong>@staticmethod</strong> decorator to the method that
            runs the training loop.
          </p>

          <p>
            Afterward, create an instance of <code>ActivationTracker</code> and extract the network
            structure using <code>extract_graph_structure</code>.
          </p>

          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400 ">Example decorators usage:</p>
            <pre className="bg-gray-900 px-4 rounded-lg overflow-auto text-sm">
              <code>
                {`
@register_trainer
class Trainer(TrainerInterface):
    @staticmethod
    def train(
        model: NeuralNetInterface,
        tracker: ActivationTracker,
        num_batches: int,
        output_dir: str,
        epochs: int = 5
    ):
    ....
`}
              </code>
            </pre>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">2. Modifying the Training Loop</h3>
          <p>
            At the start of each training iteration, call <code>tracker.clear()</code> to remove old
            data. At the end of the inner training loop call{' '}
            <code>tracker.reset_after_batch()</code> Once the forward and backward passes finish,
            call <code>tracker.save_to_json()</code> to store activations and gradients for the
            current epoch.
          </p>

          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Example training loop modification:</p>
            <pre className="bg-gray-900 px-4 rounded-lg overflow-auto text-sm">
              <code>
                {`
for epoch in range(num_epochs):
  tracker.clear()

  for _, (images, labels) in enumerate(train_loader):
      optimizer.zero_grad()

      outputs = model(images)
      loss = criterion(outputs, labels)

      loss.backward()
      optimizer.step()

      tracker.reset_after_batch()

  tracker.save_to_json(epoch, save_dir=output_dir)
tracker.remove_hooks()`}
              </code>
            </pre>
          </div>

          <p>
            When training is finished, run <code>tracker.remove_hooks()</code> to detach all hooks.
            This step prevents performance issues during future use of the model.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">3. Starting the Application</h3>
          <p>Once the tracking setup is complete, launch the visualizer using:</p>

          <div className="bg-gray-900 p-4 rounded-lg">
            <pre className="text-sm">
              <code>npm start</code>
            </pre>
          </div>

          <p>
            You will see three options: <strong>Start</strong>, <strong>Demo</strong>, and
            <strong> Instructions</strong>. Select <strong>Start</strong> to choose your model file.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">4. Loading a Model</h3>
          <p>
            If tracking data does not exist for the selected model, the application will
            automatically run the training process. Otherwise, existing tracking data will load
            automatically.
          </p>
          <p>
            Wait for the <strong>Training complete</strong> message before proceeding.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">5. Exploring the Visualization</h3>
          <p>The main view displays your neural network’s structure. Use the mouse to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Drag to pan the network</li>
            <li>Scroll to zoom in/out</li>
            <li>
              Click on a neuron to see:
              <ul className="list-disc pl-10">
                <li>Activation values</li>
                <li>Gradient information</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">6. Loading example data</h3>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">7. Training animation</h3>
        </section>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white text-black px-5 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

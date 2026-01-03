import { useNavigate } from 'react-router-dom'
import { JSX } from 'react'

export default function InstructionsPage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-black px-6 py-12 text-white">
      <button
        onClick={() => navigate('/')}
        className="text-primary fixed top-4 right-4 z-50 rounded-lg bg-white px-4 py-2 font-medium transition hover:bg-gray-200"
      >
        Back to home
      </button>
      <div className="mx-auto max-w-3xl space-y-14">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">User Manual</h1>
          <p className="text-sm text-gray-400">
            Guide for preparing, training, and visualizing your neural network
          </p>
        </div>

        <section className="space-y-10">
          <h2 className="border-b border-gray-800 pb-3 text-2xl font-semibold">
            Preparing Your Own Model
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">1. Registering the Tracker</h3>
            <p className="leading-relaxed text-gray-300">
              Before visualizing a neural network, you must register an activation tracker on your
              model. Apply the <strong>@register_trainer</strong> decorator to your training class
              and add <strong>@staticmethod</strong> to the training method.
            </p>

            <p className="text-gray-300">
              Then create an <code>ActivationTracker</code> instance and extract the network
              structure using <code>extract_graph_structure</code>.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
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
        ...
`}
              </code>
            </pre>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">2. Modifying the Training Loop</h3>
            <p className="leading-relaxed text-gray-300">
              Clear previous data with <code>tracker.clear()</code> at the start of each epoch.
              After each batch, call <code>tracker.reset_after_batch()</code>. Once an epoch
              completes, store activations using <code>tracker.save_to_json()</code>.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
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

tracker.remove_hooks()
`}
              </code>
            </pre>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-medium">3. Starting the Application</h3>
            <p className="text-gray-300">Launch the visualizer once tracking is complete:</p>

            <pre className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
              <code>npm start</code>
            </pre>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-medium">4. Loading a Model</h3>
            <p className="text-gray-300">
              In main menu press start and select your own model and number of training epochs. If
              no tracking data exists, training will run automatically. Otherwise, stored data loads
              instantly. Either way wait for the <strong>Training complete</strong> message before
              proceeding.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-gray-800 pb-3 text-2xl font-semibold">
            Available Functions
          </h2>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Network Visualization</h3>
            <p className="text-sm text-gray-400">{/* Description goes here */}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Image Input</h3>
            <p className="text-sm text-gray-400">{/* Description goes here */}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Training Animation</h3>
            <p className="text-sm text-gray-400">{/* Description goes here */}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

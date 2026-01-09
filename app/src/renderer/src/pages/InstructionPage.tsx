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
            Guide for preparing, training, and visualizing your neural network or demo model.
          </p>
        </div>

        <section className="space-y-10">
          <h2 className="border-b border-gray-800 pb-3 text-2xl font-semibold">
            Preparing Your Own Model
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">0. Required Imports</h3>
            <p className="leading-relaxed text-gray-300">
              We prepared Python scripts containing all necessary functionalities. In order to be
              able to utilize them, there are three imports you need to add at the beginning of your
              model file:
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
              <code>
                {`from model_interface import NeuralNetInterface, TrainerInterface
from extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer, register_runner
`}
              </code>
            </pre>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">1. Registering the Model</h3>
            <p className="leading-relaxed text-gray-300">
              The first real step is to prepare your model accordingly. Apply the&nbsp;
              <strong>@register_model</strong> decorator to your model class. Make sure your model
              class inherits from <code>NeuralNetInterface</code>.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
              <code>
                {`@register_model
class YourModel(NeuralNetInterface):
    def __init__(self):
        super(YourModel, self).__init__()
        ...
`}
              </code>
            </pre>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">2. Registering the Training Tracker</h3>
            <p className="leading-relaxed text-gray-300">
              The next step is to register the training tracker on your model. Apply the&nbsp;
              <strong>@register_trainer</strong> decorator to your training class and add&nbsp;
              <strong>@staticmethod</strong> decorator to the training method. Make sure your
              training class inherits from <code>TrainerInterface</code>.
            </p>

            <p className="text-gray-300">
              The training method should take the following parameters: <code>model</code>,&nbsp;
              <code>tracker</code>,&nbsp;number of epochs and output directory. Before the training
              loop, extract the network structure using <code>extract_graph_structure</code>&nbsp;
              function. You also include your normal training code here, like data transformation,
              loss function and optimizer definitions etc.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
              <code>
                {`@register_trainer
class Trainer(TrainerInterface):
    @staticmethod
    def train(
      model: NeuralNetInterface,
      tracker: ActivationTracker,
      num_epochs: int,
      output_dir: str
    ):
        ...
        extract_graph_structure(model, save_path=f"./{output_dir}/graph_structure.json")
        ...
`}
              </code>
            </pre>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">3. Modifying the Training Loop</h3>
            <p className="leading-relaxed text-gray-300">
              Clear data with <code>tracker.clear()</code> call at the start of each epoch. After
              each batch, call <code>tracker.reset_after_batch()</code>. Once an epoch completes,
              store activations and gradients calling <code>tracker.save_to_json()</code>.
            </p>

            <p className="text-gray-300">
              Remember to add <code>tracker.remove_hooks()</code> at the end of the training method
              to detach all the hooks. It is required to eliminate performance issues during future
              operations on the model.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
              <code>
                {`model.train()

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

          <div className="space-y-4">
            <h3 className="text-xl font-medium">4. Registering the Running Tracker</h3>
            <p className="leading-relaxed text-gray-300">
              Another functionality supported by the application requires registering the running
              tracker on your model. Apply the <strong>@register_runner</strong> decorator to the
              function responsible for running trained model on a selected image.
            </p>

            <p className="text-gray-300">
              Below you can find an example of such function. It should take the following
              parameters: <code>model</code>, <code>tracker</code>, input tensor, path to the saved
              model and output directory. The most important elements are loading the model
              state,&nbsp;<code>tracker.save_test_to_json()</code> call and&nbsp;
              <code>tracker.remove_hooks()</code> call.
            </p>

            <pre className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm">
              <code>
                {`@register_runner
def run(
  model: NeuralNetInterface,
  tracker: ActivationTracker,
  input_tensor: torch.Tensor,
  saved_model_path: str,
  output_dir: str
):
    model.load_state_dict(torch.load(saved_model_path))
    model.eval()

    with torch.no_grad():
        tracker.clear()
        model(input_tensor)
        tracker.save_test_to_json(save_dir=output_dir)

    tracker.remove_hooks()
`}
              </code>
            </pre>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-gray-800 pb-3 text-2xl font-semibold">
            Starting Application and Selecting a Model
          </h2>

          <div className="space-y-3">
            <h3 className="text-xl font-medium">1. Starting the Application</h3>
            <p className="leading-relaxed text-gray-300">
              Ensure you are in the application directory (<code>app</code> catalog in the project
              directory). Then you can launch the application in a terminal using the following:
            </p>

            <pre className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
              <code>npm start</code>
            </pre>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-medium">2. Loading Your Own Model</h3>
            <p className="leading-relaxed text-gray-300">
              In the main menu, select &quot;Start application&quot; button (1) and choose your
              model file, using &quot;Select model&quot; button. Then choose &quot;Continue&quot;
              and enter the number of training epochs. Finally click &quot;Start Training&quot;
              button.
            </p>

            <img className="w-180" src="../../resources/manual_images/main_window.png" />

            <div className="flex justify-around">
              <div>
                <img
                  className="h-60 w-85"
                  src="../../resources/manual_images/model_selection.png"
                />
              </div>
              <div>
                <img
                  className="h-60 w-85"
                  src="../../resources/manual_images/epoch_selection.png"
                />
              </div>
            </div>

            <p className="text-gray-300">
              If no tracking data exists or number of saved epochs data does not correspond to
              selected number, model training will run automatically. You can see the progress bar
              of the training procedure. Otherwise, stored data is detected and loaded instantly.
              Either way, wait for the <strong>Training complete</strong> message before proceeding
              further and then select &quot;Continue to Visualization&quot;.
            </p>

            <img className="w-150" src="../../resources/manual_images/training_progress.png" />
            <img className="w-150" src="../../resources/manual_images/training_complete.png" />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-medium">3. Selecting a Demo Model</h3>
            <p className="leading-relaxed text-gray-300">
              If you do not have your own model or just want to test provided models, select
              &quot;Demo&quot; button (2) in the main menu. Currently there are three pretrained
              (for 10 epochs) models of varying complexity for you to choose:
              <pre>
                <ul>
                  <li>
                    • <strong>Simple MNIST Model</strong>
                  </li>
                  <li>
                    • <strong>Iris Model</strong>
                  </li>
                  <li>
                    • <strong>Fashion-MNIST Model</strong>
                  </li>
                </ul>
              </pre>
              You can select the desired model by clicking the respective &quot;Load Demo&quot;
              button.
            </p>

            <img className="w-180" src="../../resources/manual_images/demo_page.png" />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-gray-800 pb-3 text-2xl font-semibold">
            Available Visualization Functions
          </h2>

          <div className="space-y-3">
            <p className="leading-relaxed text-gray-300">
              There are three main features of the application: <strong>Visualization</strong>,
              &nbsp;<strong>Image input</strong> and <strong>Animation</strong>. We describe them in
              detail below.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Network Visualization</h3>
            <p className="text-sm text-gray-400">
              Image below presents the visualization view. All examples, including this one are
              presented on the <strong>Simple MNIST model</strong>.
            </p>

            <img className="w-180" src="../../resources/manual_images/visualization_page.png" />

            <p className="text-sm text-gray-400">
              The main panel displays the structure of neural network. Node colors correspond to
              their activation values - from red (lower value) to yellow (higher value). The
              interactive panel on the right contains three components: epoch controls, activation
              highlights and node statistics.
            </p>

            <p className="text-sm text-gray-400">
              You can choose a specific epoch using the panel shown below. After selecting an epoch,
              use &quot;Load Epoch&quot; button to load the corresponding activation and gradient
              data.
            </p>

            <img className="w-150" src="../../resources/manual_images/choose_epoch.png" />

            <p className="text-sm text-gray-400">
              Using the activation highlights panel, you can analyze extreme activation values and
              detect possible anomalies. You can adjust selecting top activations (yellow) and
              bottom activations (red), as well as the fraction of activations to display by using
              the provided slider.
            </p>

            <img className="w-180" src="../../resources/manual_images/activation_highlights.png" />

            <p className="text-sm text-gray-400">
              Finally, node statistics panel allows you to inspect detailed node information upon
              clicking on the node. These include the numerical activation value (averaged within an
              epoch), placed on a range between minimum and maximum value (within the layer of the
              selected node). All edges that represent neuron&#8217;s connections are displayed.
              Their brightness depends on a respective gradient value. You can also highlight
              extreme gradient values.
            </p>

            <img className="w-180" src="../../resources/manual_images/neuron_stats.png" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Image Input</h3>
            <p className="text-sm text-gray-400">
              In the Image input tab you can pass an image to the loaded model. Use &quot;Select
              image to feed to the model&quot; button in the right panel to choose an image from
              your filesystem. Then you need to wait for a while as inferred activations are
              calculated.
            </p>

            <p className="text-sm text-gray-400">
              The main panel displays the neural network graph, but the first layer is square-shaped
              to resemble the input image. Panels on the right side include selecting image controls
              (mentioned above), as well as activation highlights and node statistics panels which
              function similarly as in the Visualization tab.
            </p>

            <p className="text-sm text-gray-400">
              An example of graph view after passing an image to the model is presented below. Note
              that in case of running model on a test data there are no gradients - gradients are
              calculated during optimization phase when a model is being <strong>trained</strong>.
            </p>

            <img className="w-180" src="../../resources/manual_images/image_input.png" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Epoch Animation</h3>
            <p className="text-sm text-gray-400">
              Animation tab provides animation controls and node statistics panels. The animation
              controls panel allows you to start/pause animation, rewind animation one epoch back or
              forward using fast-backward and fast-forward buttons and adjust the speed of the
              animation with a slider.
            </p>

            <p className="text-sm text-gray-400">
              Animation relies on coloring the graph nodes depending on their activation values for
              respective epochs. When animation is not running, you can select a neuron. Then,
              displayed neuron data dynamically changes as epochs animate.
            </p>

            <img className="w-180" src="../../resources/manual_images/animation.png" />
          </div>
        </section>
      </div>
    </div>
  )
}

import dash
from dash import html
import dash_cytoscape as cyto
import numpy as np
from scripts.neuron_compresser import compress_neurons
from dash.dependencies import Input, Output

from dash import dcc
import json
import os


current_no_neuron_layer = None

def set_neuron_layers(layers, compress=False):
    global current_no_neuron_layer
    if compress:
        new_layers = []
        for layer in layers:
            compressed = compress_neurons(layer[0])
            if isinstance(compressed, tuple):
                compressed = compressed[0]
            new_layers.append((compressed, layer[1], layer[2]))
        current_no_neuron_layer = new_layers
    else:
        current_no_neuron_layer = layers


def create_network_elements(neuron_layers):
    elements = []
    x_shift = 150
    y_spacing = 20
    x_start = 100
    center_y = 400

    # Create input node
    elements.append({
        'data': {'id': 'input', 'label': 'Input'},
        'position': {'x': x_start - x_shift, 'y': center_y},
        'classes': 'special'
    })

    output_pos = {'x': x_start + len(neuron_layers) * x_shift, 'y': center_y}
    elements.append({
        'data': {'id': 'output', 'label': 'Output'},
        'position': output_pos,
        'classes': 'special'
    })

    layer_positions = []
    for layer_idx, layer in enumerate(neuron_layers):
        num_neurons = layer[0]
        total_height = (num_neurons - 1) * y_spacing if num_neurons > 0 else 0
        y_start = center_y - total_height / 2
        x_pos = x_start + layer_idx * x_shift
        layer_pos = []
        for i in range(num_neurons):
            node_id = f"n_{layer_idx}_{i}"
            y_pos = y_start + i * y_spacing
            node = {
                'data': {'id': node_id, 'label': ''},
                'position': {'x': x_pos, 'y': y_pos}
            }
            elements.append(node)
            layer_pos.append((node_id, x_pos, y_pos))
        layer_positions.append(layer_pos)

    for target_id, _, _ in layer_positions[0]:
        elements.append({'data': {'source': 'input', 'target': target_id}})

    for i in range(len(layer_positions) - 1):
        for src_id, _, _ in layer_positions[i]:
            for tgt_id, _, _ in layer_positions[i + 1]:
                elements.append({'data': {'source': src_id, 'target': tgt_id}})

    for source_id, _, _ in layer_positions[-1]:
        elements.append({'data': {'source': source_id, 'target': 'output'}})

    return elements


app = dash.Dash(__name__)

app.layout = html.Div([
    html.H1("Neuron Layers Interactive (Dash Cytoscape)"),

    html.Label("Select Training Batch:"),
    dcc.Dropdown(
        id='batch-selector',
        options=[
            {'label': f'Batch {i}', 'value': i}
            for i in range(50)
        ],
        value=0,
        style={'width': '300px'}
    ),

    cyto.Cytoscape(
        id='cytoscape-graph',
        layout={'name': 'preset'},
        style={'width': '100%', 'height': '600px'},
        elements=[],
        stylesheet=[
            {
                'selector': 'node',
                'style': {
                    'label': 'data(label)',
                    'width': '12px',
                    'height': '12px',
                    'background-color': '#0074D9',
                    'text-valign': 'center',
                    'color': 'white',
                    'font-size': '8px'
                }
            },
            {
                'selector': '.special',
                'style': {
                    'width': '25px',
                    'height': '25px',
                    'background-color': '#FF4136',
                    'font-size': '12px',
                    'font-weight': 'bold'
                }
            },
            {
                'selector': 'edge',
                'style': {
                    'line-color': '#B3B3B3',
                    'width': 0.7
                }
            }
        ]
    )
])



@app.callback(
    Output('cytoscape-graph', 'elements'),
    Input('batch-selector', 'value')
)
def update_elements(batch_index):
    global current_no_neuron_layer
    if current_no_neuron_layer is None:
        default_layers = [(5, 1, 0), (7, 1, 0), (3, 1, 0)]
        layers = [(compress_neurons(l[0]) if isinstance(compress_neurons(l[0]), int)
                   else compress_neurons(l[0])[0], l[1], l[2])
                  for l in default_layers]
    else:
        layers = current_no_neuron_layer

    act_path = f"outputs/batch_{batch_index}_activations.json"
    if os.path.exists(act_path):
        with open(act_path, "r") as f:
            activation_data = json.load(f)

    return create_network_elements(layers)


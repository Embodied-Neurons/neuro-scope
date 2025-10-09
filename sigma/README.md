### In order to run the program:
- you have _Node.js_ and _npm_ installed and working
- **in this directory** (_important!_), run
```bash
    npm install sigma
    npm install graphology
    npm install electron --save-dev
```
all that is needed will be in _node_modules_ subdirectory.

- in _package.json_ file, change **scripts** section so it looks as follows:
```
"scripts": {
    "train": "py ../neuroscope_app.py --train",
    "serve": "py ../neuroscope_app.py --serve",
    "start": "electron index.js"
},
```
- in the **main** project directory (you can use `cd ..` in the terminal) run:
```bash
    python menu.py
```
a window with quite intuitive interface should appear. Follow the instructions (i.e. provide model file) and if your model is compliant with our interface, start the application using the corresponding button. Et voila.

---

### Known issues:
- app is still using _localhost_, but not in a browser (per se), but in electron app window - should be convenient
- sometimes scroll event is not detected properly and because of it no proper graph interaction happens
- optimization is welcome, as the way gradients and activations are calculated and prepared right now is quite computationally demanding - it is hard to find simple solution for that case
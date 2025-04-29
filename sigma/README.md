### In order to run the program:
- you have _Node.js_ and _npm_ installed and working
- in this directory, run
```bash
    npm install sigma
    npm install graphology
    npm install electron --save-dev
```
all that is needed will be in _node_modules_ subdirectory.

- in _package.json_ file, change **scripts** section so it looks as follows:
```
"scripts": {
    "prep_data": "py ../neuroscope_app.py",
    "start": "electron index.js"
},
```
- for now: run `npm run prep_data` and wait for logs to appear (server providing endpoint to data is now running). Then in **separate** terminal run `npm start`. Electron app window should appear. Et voila.

---

### Known issues:
- currently program has to be run on two terminals via two npm commands - I tried to connect and synchronize them (server has to be running before electron app starts), but haven't succeded yet. Fix welcome.
- app is still using _localhost_, but now in a browser (per se), but in electron app window - should be convenient
- limiting moving sigma container outside of the graph (so it is visible at all times) may seem aggressive and coefficients used to calculate bounds were selected experimentally - likely to fail for neural net of different structure
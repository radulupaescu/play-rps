const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

const labels = { rock: 0, paper: 1, scissors: 2 };
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'keypoints.json'), 'utf8'));

const allKeypoints = data.map(item => item.keypoints);
const allLabels = data.map(item => item.label);

const xs = tf.tensor2d(allKeypoints);
const ys = tf.oneHot(allLabels, 3);

const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [42], units: 64, activation: 'relu' }));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
});

(async () => {
    console.log('Starting training...');
    await model.fit(xs, ys, {
        epochs: 20,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: [
            tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),
        ],
    });

    await model.save('file://./src/game/model/rps-classifier');
    console.log('Model training and saving completed.');
})();

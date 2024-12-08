// JavaScript version using TensorFlow.js
import * as tf from "@tensorflow/tfjs";

const findSignificantDropoffs = (dropoffs, zScoreThreshold = 2) => {
  const dropoffValues = dropoffs.map((d) => d.dropoff);
  const dropoffTensor = tf.tensor1d(dropoffValues);

  const mean = tf.mean(dropoffTensor);
  const stdDev = tf.sqrt(tf.mean(tf.square(tf.sub(dropoffTensor, mean))));

  const zScores = tf.div(tf.sub(dropoffTensor, mean), stdDev);
  const significantMask = tf.greater(zScores, zScoreThreshold);

  const significantIndices = tf.whereAsync(significantMask);

  return significantIndices
    .then((indicies) => indicies.array())
    .then((indices) =>
      indices.map(([index]) => dropoffs[index].index).sort((a, b) => a - b)
    );
};

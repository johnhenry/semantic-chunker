import dotProduct from "./dot-product.mjs";
import norm from "./norm.mjs";

/**
 * @param {number[]} vectorA
 * @param {number[]} vectorB
 * @returns {number}
 */
const cosineSimilarity = (vectorA, vectorB) =>
  dotProduct(vectorA, vectorB) / (norm(vectorA) * norm(vectorB));

// import * as tf from "@tensorflow/tfjs";

// const cosineSimilarity = (a, b) => {
//   const aTensor = tf.tensor(a);
//   const bTensor = tf.tensor(b);
//   const dotProduct = tf.sum(tf.mul(aTensor, bTensor));
//   const magnitudeA = tf.sqrt(tf.sum(tf.square(aTensor)));
//   const magnitudeB = tf.sqrt(tf.sum(tf.square(bTensor)));
//   return dotProduct.div(magnitudeA.mul(magnitudeB)).dataSync()[0];
// };

export default cosineSimilarity;

/**
 * Deterministic embedder for tests: maps each text to an orthogonal basis
 * vector by topic keyword, so similarity is 1 within a topic and 0 across
 * topics. This makes chunk boundaries fully predictable.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const mockEmbed = async (text) => {
  const t = text.toLowerCase();
  const pig = t.includes("pig") ? 1 : 0;
  const rocket = t.includes("rocket") ? 1 : 0;
  const other = pig === 0 && rocket === 0 ? 1 : 0;
  return [pig, rocket, other];
};

export const PIG_ROCKET_DOC =
  "Pigs like mud. Pigs eat corn. Pigs sleep at noon. " +
  "Rockets fly to space. Rockets burn fuel. Rockets land on ships.";

export default mockEmbed;

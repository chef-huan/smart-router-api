// Creates an array of elements split into groups the length of size.
// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_chunk
const chunk = <T>(input: T[], size: number): T[][] => {
  return input.reduce((arr, item, idx) => {
    return idx % size === 0
      ? [...arr, [item]]
      : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
  }, []);
};

export default chunk;

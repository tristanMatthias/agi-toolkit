export function parseJSON(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    // Slice the string from the first { and the last }
    const start = json.indexOf("{");
    const end = json.lastIndexOf("}");
    const sliced = json.slice(start, end + 1);
    try {
      return JSON.parse(sliced);
    } catch (e) {
      throw new Error("Could not parse JSON");
    }
  }
}

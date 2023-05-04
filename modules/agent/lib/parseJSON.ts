export function parseJSON(json: string) {
  const fixed = fixMalformedJSON(json);
  try {
    return JSON.parse(fixed);
  } catch (e) {
    // Slice the string from the first { and the last }
    const start = fixed.indexOf("{");
    const end = fixed.lastIndexOf("}");
    const sliced = fixed.slice(start, end + 1);
    try {
      return JSON.parse(sliced);
    } catch (e) {
      throw new Error("Could not parse JSON");
    }
  }
}

export function fixMalformedJSON(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    // If the JSON is not well-formed, attempt to fix it
    let fixedJSON = jsonString;

    // Add missing closing brackets and braces
    const openBrackets = (fixedJSON.match(/{/g) || []).length;
    const closeBrackets = (fixedJSON.match(/}/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJSON += '}';
    }

    const openSquareBrackets = (fixedJSON.match(/\[/g) || []).length;
    const closeSquareBrackets = (fixedJSON.match(/]/g) || []).length;
    for (let i = 0; i < openSquareBrackets - closeSquareBrackets; i++) {
      fixedJSON += ']';
    }

    // Add missing double quotes
    const openQuotes = (fixedJSON.match(/":\s*"/g) || []).length;
    const closeQuotes = (fixedJSON.match(/"[^"]*"/g) || []).length;
    for (let i = 0; i < openQuotes - closeQuotes; i++) {
      fixedJSON = fixedJSON.replace(/"[^"]*$/g, (match) => `${match}"`);
    }

    try {
      JSON.parse(fixedJSON);
      return fixedJSON;
    } catch (e) {
      throw new Error('Unable to fix the malformed JSON string.');
    }
  }
}

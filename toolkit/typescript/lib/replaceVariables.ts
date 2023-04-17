/**
 * Take a string, and replace all the {{variables}} with the dictionary values
 * Return a new string
 */
export function replaceVariables(str: string, variables: any) {
  return str.replace(/{{(.*?)}}/g, (match, variable) => {
    return variables[variable] || "";
  });
}

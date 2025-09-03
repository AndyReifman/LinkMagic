/**
 * Finds all RegExp groups in the innerWord and uses them to replace matching group in the target string with their replacement from the inner word.
 * The group name {pattern} is kept for backwards compatibility. This group gets replaced with the full innerWord.
 * @param target The target string to do all replacements in
 * @param pattern
 * @param innerWord The keyword from the source text that triggered this replacement
 * @returns a string based on the target string, in which all occurences of group names or numbers are replaced with their matching group in the innerWord
 */
export function replacePattern(target: string, pattern: RegExp, innerWord: string) {
  const groups = findGroups(innerWord, pattern);

  const replacements = [["pattern", innerWord], ...groups];

  return replacements.reduce((acc, [groupName, replacement]) => {
    return replaceGroup(acc, groupName, replacement);
  }, target);
}

/**
 * Lists matching RegExp groups in the input string. This includes numbered and named groups.
 * @param input 
 * @param pattern 
 * @returns An array of [groupName, replacement] tuples
 */
function findGroups(input: string, pattern: RegExp): string[][] {
  const matches = pattern.exec(input);
  if (!matches) {
    return [];
  }
  const numberedGroups = Object.entries(matches)
    .filter(([key]) => !isNaN(Number(key)));
  
  const groups = matches.groups || {};
  const namedGroups = Object.entries(groups);

  return [...numberedGroups, ...namedGroups];
}

/**
 * Replaces all substrings {groupName} in the input string with the replacement
 * @param input
 * @param groupName 
 * @param replacement 
 * @returns The string with the replaced values
 */
function replaceGroup(input: string, groupName: string, replacement: string): string {
  return input.replace(new RegExp(`\\{${groupName}\\}`, 'g'), replacement);
}

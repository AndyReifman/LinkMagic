export function replacePattern(link: string, pattern: string, innerWord: string) {
  const groups = findGroups(innerWord, pattern);

  const replacements = [["pattern", innerWord], ...groups];

  return replacements.reduce((acc, [groupName, replacement]) => {
    return replaceGroup(acc, groupName, replacement);
  }, link);
}

function findGroups(innerWord: string, pattern: string): string[][] {
  const matches = new RegExp(pattern, "g").exec(innerWord);
  if (!matches) {
    return [];
  }
  const numberedGroups = Object.entries(matches)
    .filter(([key]) => !isNaN(Number(key)));
  
  const groups = matches.groups || {};
  const namedGroups = Object.entries(groups);

  return [...numberedGroups, ...namedGroups];
}

function replaceGroup(input: string, groupName: string, replacement: string): string {
  return input.replace(`{${groupName}}`, replacement);
}

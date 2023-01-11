// find last occurance of comma in an array and replace it with "and"
// Usage exmple: a,b,c will become a,b and c.

export const replaceLastCommaWithAnd = (arr) => {
  const fieldToString = arr.join(", ");
  //! Explanation: /,(?=[^,]*$)/  I.E find the last comma in a string.
  //! this regex matches any comma at the end of a string, which is followed by zero or more characters which are not a comma.
  const replaceLastComma = fieldToString.replace(/,(?=[^,]*$)/, " and");

  console.log(replaceLastComma);
  return replaceLastComma;
};

export const checkIfArrayHasMoreThanOne = (arr) => {
  const isPlural = arr.length > 1 ? true : false;
  return isPlural;
};

export const checkIfWordStartWithVowel = (word) => {
  const vowel = "aeiou";
  if (Array.isArray(word)) {
    const firstCharOfFirstWord = word[0].charAt(0);
    return vowel.indexOf(firstCharOfFirstWord) !== -1 ? true : false;
  } else {
    return vowel.indexOf(word.charAt(0)) !== -1 ? true : false;
  }
};

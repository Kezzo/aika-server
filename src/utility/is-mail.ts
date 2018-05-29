import _ = require('underscore');

export default function isMail(stringToCheck: string) {
  if (!stringToCheck) {
    return false;
  }

  const stringSplitByAt: string[] = stringToCheck.split('@');

  // @ is missing.
  if (stringSplitByAt.length < 2) {
    return false;
  }

  return stringSplitByAt[1].includes('.');
}

import _ = require('underscore');

export default function isMail(stringToCheck: string) {
  if (!stringToCheck) {
    return false;
  }

  if (stringToCheck.length > 320) {
    return false;
  }

  const stringSplitByAt: string[] = stringToCheck.split('@');

  // @ is missing.
  if (stringSplitByAt.length < 2) {
    return false;
  }

  if (!stringSplitByAt[0] || !stringSplitByAt[1]) {
    return false;
  }

  if (stringSplitByAt[0].length > 64 || stringSplitByAt[1].length > 255) {
    return false;
  }

  return stringSplitByAt[1].includes('.');
}

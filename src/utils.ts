function parse (path) {
  if (typeof path !== 'string') {
    path = '';
  }
  const tokens = path.split('.');
  for (let i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i] === '') {
      return [ ];
    }
  }
  return tokens;
}

export function deepSet(obj, path, value) {
  const tokens = parse(path);
  for (let i = 0, len = tokens.length; i < len; i++) {
    if (! obj || ! obj.hasOwnProperty(tokens[i])) {
      obj[tokens[i]] = { };
    }
    if (i === (len - 1)) {
      obj[tokens[i]] = value;
    } else {
      obj = obj[tokens[i]];
    }
  }
};

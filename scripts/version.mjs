export function metadata(source) {
  const block = source.match(/^\/\/ ==UserScript==\r?\n[\s\S]*?^\/\/ ==\/UserScript==/m)?.[0];
  if (!block) {
    throw new Error('Missing userscript metadata');
  }
  const versions = [...block.matchAll(/^\/\/\s+@version\s+(\S+)\s*$/gm)];
  if (versions.length !== 1) {
    throw new Error('Expected one @version');
  }
  const version = versions[0][1];
  parseVersion(version);
  return { block, version };
}

function parseVersion(version) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Expected a stable major.minor.patch version: ${version}`);
  }
  return version.split('.').map(BigInt);
}

export function isNewer(current, previous) {
  const currentParts = parseVersion(current);
  const previousParts = parseVersion(previous.replace(/^v/, ''));
  for (let index = 0; index < currentParts.length; index++) {
    if (currentParts[index] !== previousParts[index]) {
      return currentParts[index] > previousParts[index];
    }
  }
  return false;
}

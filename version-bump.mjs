import { readFile, writeFile } from 'node:fs/promises';

export function nextPatchVersion(version) {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Invalid plugin version: ${String(version)}`);
  }
  const [major, minor, patch] = version.split('.');
  return `${major}.${minor}.${BigInt(patch) + 1n}`;
}

/** Called only after a successful production build. Never included in the plugin. */
export async function bumpVersion() {
  const names = ['manifest.json', 'package.json', 'package-lock.json', 'versions.json'];
  const files = await Promise.all(names.map(async name => {
    const url = new URL(name, import.meta.url);
    return { url, data: JSON.parse(await readFile(url, 'utf8')) };
  }));
  const [manifest, packageJson, lock, versions] = files.map(file => file.data);
  if (packageJson.version !== manifest.version || lock.version !== manifest.version ||
    lock.packages?.['']?.version !== manifest.version) {
    throw new Error('Version mismatch between manifest, package and lockfile. No versions changed.');
  }
  const next = nextPatchVersion(manifest.version);
  versions[manifest.version] ??= manifest.minAppVersion;
  versions[next] = manifest.minAppVersion;
  manifest.version = next;
  packageJson.version = next;
  lock.version = next;
  lock.packages[''].version = next;
  await Promise.all(files.map(file => writeFile(file.url, `${JSON.stringify(file.data, null, 2)}\n`)));
  console.log(`Plugin version: ${next}`);
  return next;
}

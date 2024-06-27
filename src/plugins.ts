import path from 'path';
import shell from 'shelljs';
import semver from 'semver';
import { globby } from 'globby';

export async function registerPlugins(enablePlugins: string, version: string) {
  if (enablePlugins === '' || enablePlugins === 'false') {
    return;
  }
  const LEGACY_VERSION = '0.92.3';
  const nuBin = shell.which('nu');
  console.log('Nu binary path:', nuBin?.toString());
  const nuDir = nuBin ? path.dirname(nuBin.toString()) : '';
  const plugins = await globby(`${nuDir}/nu_plugin_*`, { absolute: true, unique: true });
  console.log('All available Nu plugins:', plugins);
  const filteredPlugins =
    enablePlugins === 'true' ? plugins : plugins.filter((it) => enablePlugins.includes(path.basename(it)));
  filteredPlugins.forEach((it) => {
    console.log(`Register plugin: ${it}`);
    if (!version.includes('nightly') && semver.lte(version, LEGACY_VERSION)) {
      shell.exec(`nu -c "'register ${it}'"`);
    } else {
      shell.exec(`nu -c "'plugin add ${it}'"`);
    }
  });
}

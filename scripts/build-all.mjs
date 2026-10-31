import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function run() {
  console.log('🚀 Step 1: Building standard production web bundle (base: "./")...');
  await build({
    configFile: path.resolve(rootDir, 'vite.config.ts'),
    build: {
      outDir: path.resolve(rootDir, 'dist'),
      emptyOutDir: true,
    },
  });

  console.log('🚀 Step 2: Building 100% standalone single-file offline HTML...');
  const tempDir = path.resolve(rootDir, 'dist_single_temp');
  await build({
    configFile: false,
    base: './',
    plugins: [react(), tailwindcss(), viteSingleFile()],
    build: {
      outDir: tempDir,
      emptyOutDir: true,
    },
  });

  const singleHtmlSource = path.join(tempDir, 'index.html');
  const targetDexonDist = path.join(rootDir, 'dist', 'Dexon_Business_Pro_Offline.html');
  const targetDexonPublic = path.join(rootDir, 'public', 'Dexon_Business_Pro_Offline.html');
  const targetOfflineDist = path.join(rootDir, 'dist', 'Nexbill_Solar_Pro_Offline.html');
  const targetOfflinePublic = path.join(rootDir, 'public', 'Nexbill_Solar_Pro_Offline.html');
  const targetPortablePublic = path.join(rootDir, 'public', 'Nexbill_Solar_Pro_Portable.html');

  if (fs.existsSync(singleHtmlSource)) {
    fs.copyFileSync(singleHtmlSource, targetDexonDist);
    fs.copyFileSync(singleHtmlSource, targetDexonPublic);
    fs.copyFileSync(singleHtmlSource, targetOfflineDist);
    fs.copyFileSync(singleHtmlSource, targetOfflinePublic);
    fs.copyFileSync(singleHtmlSource, targetPortablePublic);
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ Standalone single-file HTML generated successfully (zero external dependencies).');
  }

  // Ensure .htaccess in dist
  const htaccessPublic = path.join(rootDir, 'public', '.htaccess');
  const htaccessDist = path.join(rootDir, 'dist', '.htaccess');
  if (fs.existsSync(htaccessPublic)) {
    fs.copyFileSync(htaccessPublic, htaccessDist);
  }

  // Step 3: Create clean deployment ZIP via python
  console.log('📦 Step 3: Creating nexbill-website-deploy.zip package...');
  execSync(`python3 -c "
import zipfile, os

dist_dir = 'dist'
zip_filename = 'public/nexbill-website-deploy.zip'

if os.path.exists(zip_filename):
    os.remove(zip_filename)

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            # Skip zip files inside dist if any
            if file.endswith('.zip') or file.endswith('.tar.gz'):
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, dist_dir)
            zipf.write(file_path, arcname)

print('Zip created successfully. Size:', os.path.getsize(zip_filename), 'bytes')
"`, { cwd: rootDir, stdio: 'inherit' });

  // Step 4: Create clean unminified SOURCE CODE ZIP (NexBill-Fixed-Source-v1.zip)
  console.log('📦 Step 4: Creating clean unminified NexBill-Fixed-Source-v1.zip for audit and deployment...');
  execSync(`python3 -c "
import zipfile, os

targets = [
    'public/NexBill-Fixed-Source-v1.zip',
    'dist/NexBill-Fixed-Source-v1.zip',
    'NexBill-Fixed-Source-v1.zip',
    'public/nexbill-source-code.zip',
    'dist/nexbill-source-code.zip'
]

included_files = [
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'server.ts',
    'README.md',
    'CHANGELOG.md',
    'BUG-AUDIT-REPORT.md',
    '.env.example',
    'start.bat'
]

included_dirs = ['src', 'scripts', 'supabase']

for target_zip in targets:
    os.makedirs(os.path.dirname(target_zip) if os.path.dirname(target_zip) else '.', exist_ok=True)
    if os.path.exists(target_zip):
        os.remove(target_zip)
    with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for d in included_dirs:
            if os.path.exists(d):
                for root, dirs, files in os.walk(d):
                    for file in files:
                        full_path = os.path.join(root, file)
                        zipf.write(full_path, full_path)
        for f in included_files:
            if os.path.exists(f):
                zipf.write(f, f)
    print('Artifact created:', target_zip, 'Size:', round(os.path.getsize(target_zip) / 1024, 2), 'KB')
"`, { cwd: rootDir, stdio: 'inherit' });

  console.log('🎉 All build artifacts created and packaged successfully!');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

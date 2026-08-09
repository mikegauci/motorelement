#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BACKUPS = join(ROOT, 'backups')
const ARTWORK_TABLE = 'artwork'
const ARTWORK_BUCKET = 'artwork'
const LIST_PAGE = 1000
const REMOVE_BATCH = 100
const DOWNLOAD_CONCURRENCY = 8

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function parseArgs(argv) {
  const flags = new Set(argv)
  return {
    executeDelete: flags.has('--execute-delete'),
    skipBackup: flags.has('--skip-backup'),
    refreshPlan: flags.has('--refresh-plan'),
    help: flags.has('--help') || flags.has('-h'),
  }
}

function usage() {
  console.log(`Usage: node scripts/supabase-storage-cleanup.mjs [options]

Options:
  --execute-delete   Delete objects in delete-plan.json and matching artwork rows
  --skip-backup      Reuse existing staging/manifest/zip (still verifies zip)
  --refresh-plan     Re-list remote objects and write a delete-all plan (use with --skip-backup)
  --help             Show this help
`)
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n
  let i = -1
  do {
    v /= 1024
    i += 1
  } while (v >= 1024 && i < units.length - 1)
  return `${v.toFixed(2)} ${units[i]}`
}

function walkFiles(dir, base = dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(abs, base))
    else if (entry.isFile()) out.push(relative(base, abs).split('\\').join('/'))
  }
  return out
}

async function listAllObjects(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error
  const objects = []
  for (const bucket of buckets) {
    const queue = ['']
    while (queue.length) {
      const prefix = queue.shift()
      let offset = 0
      for (;;) {
        const { data, error: listError } = await supabase.storage
          .from(bucket.name)
          .list(prefix, {
            limit: LIST_PAGE,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          })
        if (listError) throw listError
        if (!data?.length) break
        for (const item of data) {
          const path = prefix ? `${prefix}/${item.name}` : item.name
          const isFolder = !item.id || item.metadata === null
          if (isFolder && item.name && !item.metadata) {
            queue.push(path)
            continue
          }
          if (item.id) {
            objects.push({
              bucket: bucket.name,
              storage_path: path,
              bytes: Number(item.metadata?.size ?? 0),
              content_type: item.metadata?.mimetype ?? null,
              created_at: item.created_at ?? null,
              updated_at: item.updated_at ?? null,
              id: item.id,
            })
          }
        }
        if (data.length < LIST_PAGE) break
        offset += LIST_PAGE
      }
    }
  }
  return { buckets: buckets.map((b) => b.name), objects }
}

async function downloadObject(supabase, bucket, storagePath, destPath, expectedBytes = 0) {
  if (existsSync(destPath)) {
    const existing = statSync(destPath).size
    if (!expectedBytes || existing === expectedBytes) return existing
  }
  const { data, error } = await supabase.storage.from(bucket).download(storagePath)
  if (error) throw new Error(`${bucket}/${storagePath}: ${error.message}`)
  ensureDir(dirname(destPath))
  const body = data.stream()
  await pipeline(Readable.fromWeb(body), createWriteStream(destPath))
  return statSync(destPath).size
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
  return results
}

function buildDeletePlan(objects) {
  const sorted = [...objects].sort((a, b) => {
    const ta = a.created_at || ''
    const tb = b.created_at || ''
    if (ta !== tb) return ta < tb ? -1 : 1
    if (a.bucket !== b.bucket) return a.bucket < b.bucket ? -1 : 1
    return a.storage_path < b.storage_path ? -1 : 1
  })
  const totalBytes = sorted.reduce((sum, o) => sum + o.bytes, 0)
  return {
    strategy: 'delete-all',
    total_objects: objects.length,
    total_bytes: totalBytes,
    target_bytes: totalBytes,
    delete_objects: sorted.length,
    delete_bytes: totalBytes,
    keep_objects: 0,
    keep_bytes: 0,
    objects: sorted,
  }
}

function createZip(stagingDir, zipPath) {
  if (existsSync(zipPath)) rmSync(zipPath)
  const result = spawnSync(
    'zip',
    ['-r', '-q', zipPath, '.'],
    { cwd: stagingDir, stdio: 'inherit' },
  )
  if (result.status !== 0) {
    throw new Error(`zip failed with status ${result.status}`)
  }
}

function verifyZip(zipPath, objects, stagingDir = null) {
  const test = spawnSync('unzip', ['-t', zipPath], { encoding: 'utf8' })
  if (test.status !== 0) {
    throw new Error(`unzip -t failed:\n${test.stdout}\n${test.stderr}`)
  }
  const listed = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
  if (listed.status !== 0) {
    throw new Error(`unzip -Z1 failed:\n${listed.stderr}`)
  }
  const zipEntries = listed.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !p.endsWith('/'))
    .map((p) => p.replace(/^\.\//, ''))
  const expected = new Set(objects.map((o) => `${o.bucket}/${o.storage_path}`))
  const zipSet = new Set(zipEntries)
  const missing = [...expected].filter((p) => !zipSet.has(p))
  const extra = [...zipSet].filter((p) => !expected.has(p))
  if (missing.length || extra.length) {
    throw new Error(
      `zip path mismatch: missing=${missing.length} extra=${extra.length}` +
        (missing[0] ? ` firstMissing=${missing[0]}` : '') +
        (extra[0] ? ` firstExtra=${extra[0]}` : ''),
    )
  }
  if (stagingDir) {
    const stagingFiles = walkFiles(stagingDir)
    if (stagingFiles.length !== objects.length) {
      throw new Error(
        `staging file count ${stagingFiles.length} != object count ${objects.length}`,
      )
    }
  }
  const zipStat = statSync(zipPath)
  return {
    ok: true,
    zip_bytes: zipStat.size,
    entry_count: zipEntries.length,
    unzip_t: 'passed',
  }
}

async function executeDelete(supabase, deletePlan) {
  const byBucket = new Map()
  for (const obj of deletePlan.objects) {
    if (!byBucket.has(obj.bucket)) byBucket.set(obj.bucket, [])
    byBucket.get(obj.bucket).push(obj.storage_path)
  }

  const removed = []
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const batch = paths.slice(i, i + REMOVE_BATCH)
      const { error } = await supabase.storage.from(bucket).remove(batch)
      if (error) throw new Error(`remove ${bucket}: ${error.message}`)
      for (const storage_path of batch) removed.push({ bucket, storage_path })
      console.log(`Removed ${Math.min(i + REMOVE_BATCH, paths.length)}/${paths.length} from ${bucket}`)
    }
  }

  const artworkPaths = removed
    .filter((o) => o.bucket === ARTWORK_BUCKET)
    .map((o) => o.storage_path)

  let artworkDeleted = 0
  if (artworkPaths.length) {
    for (let i = 0; i < artworkPaths.length; i += REMOVE_BATCH) {
      const batch = artworkPaths.slice(i, i + REMOVE_BATCH)
      const { data, error } = await supabase
        .from(ARTWORK_TABLE)
        .delete()
        .in('storage_path', batch)
        .select('id')
      if (error) throw new Error(`artwork delete: ${error.message}`)
      artworkDeleted += data?.length ?? 0
    }
  }

  return { removed_objects: removed.length, artwork_rows_deleted: artworkDeleted }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  loadEnvFile(join(ROOT, '.env'))
  loadEnvFile(join(ROOT, '.env.local'))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  ensureDir(BACKUPS)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const runDir = join(BACKUPS, `run_${stamp}`)
  const stagingDir = join(runDir, 'staging')
  const manifestPath = join(runDir, 'manifest.json')
  const deletePlanPath = join(runDir, 'delete-plan.json')
  const zipPath = join(runDir, `supabase-storage-${stamp}.zip`)
  const latestManifest = join(BACKUPS, 'manifest.json')
  const latestDeletePlan = join(BACKUPS, 'delete-plan.json')
  const latestZip = join(BACKUPS, 'supabase-storage-latest.zip')
  const latestVerify = join(BACKUPS, 'verify.json')

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let buckets
  let objects
  let deletePlan

  if (args.skipBackup && existsSync(latestZip) && (args.refreshPlan || existsSync(latestDeletePlan))) {
    console.log(`Reusing zip from ${latestZip}`)
    if (args.refreshPlan) {
      console.log('Listing remote objects for delete-all plan…')
      ;({ buckets, objects } = await listAllObjects(supabase))
      deletePlan = buildDeletePlan(objects)
      writeFileSync(latestDeletePlan, JSON.stringify(deletePlan, null, 2))
      writeFileSync(join(BACKUPS, `delete-plan-all_${stamp}.json`), JSON.stringify(deletePlan, null, 2))
      console.log(
        `Delete plan: ${deletePlan.delete_objects} objects / ${formatBytes(deletePlan.delete_bytes)}`,
      )
      const backupManifest = existsSync(latestManifest)
        ? JSON.parse(readFileSync(latestManifest, 'utf8'))
        : null
      const backupPaths = new Set(
        (backupManifest?.objects || []).map((o) => `${o.bucket}/${o.storage_path}`),
      )
      const missingFromBackup = objects
        .map((o) => `${o.bucket}/${o.storage_path}`)
        .filter((p) => !backupPaths.has(p))
      if (missingFromBackup.length) {
        throw new Error(
          `Refuse to delete: ${missingFromBackup.length} remote objects missing from backup zip ` +
            `(e.g. ${missingFromBackup[0]})`,
        )
      }
      const verify = verifyZip(latestZip, backupManifest?.objects || objects)
      writeFileSync(latestVerify, JSON.stringify(verify, null, 2))
    } else {
      const manifest = JSON.parse(readFileSync(latestManifest, 'utf8'))
      deletePlan = JSON.parse(readFileSync(latestDeletePlan, 'utf8'))
      buckets = manifest.buckets
      objects = manifest.objects
      const verify = verifyZip(latestZip, objects)
      writeFileSync(latestVerify, JSON.stringify(verify, null, 2))
    }
  } else {
    console.log('Listing storage objects…')
    ;({ buckets, objects } = await listAllObjects(supabase))
    const totalBytes = objects.reduce((s, o) => s + o.bytes, 0)
    console.log(`Buckets: ${buckets.join(', ') || '(none)'}`)
    console.log(`Objects: ${objects.length} (${formatBytes(totalBytes)})`)

    ensureDir(stagingDir)
    let downloadedCount = 0
    let downloadedBytes = 0
    await mapPool(objects, DOWNLOAD_CONCURRENCY, async (obj) => {
      const dest = join(stagingDir, obj.bucket, obj.storage_path)
      const size = await downloadObject(
        supabase,
        obj.bucket,
        obj.storage_path,
        dest,
        obj.bytes,
      )
      downloadedCount += 1
      downloadedBytes += size
      if (downloadedCount % 25 === 0 || downloadedCount === objects.length) {
        console.log(
          `Downloaded ${downloadedCount}/${objects.length} (${formatBytes(downloadedBytes)})`,
        )
      }
    })

    const sha = createHash('sha256')
    for (const rel of walkFiles(stagingDir).sort()) {
      const st = statSync(join(stagingDir, rel))
      sha.update(`${rel}\0${st.size}\n`)
    }

    const manifest = {
      created_at: new Date().toISOString(),
      supabase_url: url,
      buckets,
      object_count: objects.length,
      total_bytes: totalBytes,
      staging_path_size_sha256: sha.digest('hex'),
      objects,
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    writeFileSync(latestManifest, JSON.stringify(manifest, null, 2))

    deletePlan = buildDeletePlan(objects)
    writeFileSync(deletePlanPath, JSON.stringify(deletePlan, null, 2))
    writeFileSync(latestDeletePlan, JSON.stringify(deletePlan, null, 2))

    console.log('Creating zip…')
    createZip(stagingDir, zipPath)
    copyFileSync(zipPath, latestZip)

    console.log('Verifying zip…')
    const verify = verifyZip(zipPath, objects, stagingDir)
    writeFileSync(join(runDir, 'verify.json'), JSON.stringify(verify, null, 2))
    writeFileSync(latestVerify, JSON.stringify(verify, null, 2))
    console.log(
      `Zip OK: ${verify.entry_count} entries, ${formatBytes(verify.zip_bytes)}`,
    )
    console.log(
      `Delete plan: ${deletePlan.delete_objects} objects / ${formatBytes(deletePlan.delete_bytes)} (delete-all)`,
    )
    console.log(`Artifacts: ${runDir}`)
  }

  if (!args.executeDelete) {
    console.log('Dry run complete. Re-run with --execute-delete after reviewing delete-plan.json')
    return
  }

  if (!existsSync(latestVerify)) {
    throw new Error('Missing verify.json — refuse to delete without a verified zip')
  }
  const verify = JSON.parse(readFileSync(latestVerify, 'utf8'))
  if (!verify.ok) throw new Error('verify.json reports not ok')

  if (!deletePlan) {
    deletePlan = JSON.parse(readFileSync(latestDeletePlan, 'utf8'))
  }

  console.log(
    `Executing delete of ${deletePlan.delete_objects} objects (${formatBytes(deletePlan.delete_bytes)})…`,
  )
  const result = await executeDelete(supabase, deletePlan)
  const report = {
    executed_at: new Date().toISOString(),
    ...result,
    delete_plan_summary: {
      delete_objects: deletePlan.delete_objects,
      delete_bytes: deletePlan.delete_bytes,
    },
  }
  writeFileSync(join(BACKUPS, 'execute-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

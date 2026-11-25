import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const directory = join(root, '.local', 'postgres')
const data = join(directory, 'data')
const config = join(root, 'backend', 'config')
const binaries = process.env.POSTGRES_BIN ?? '/opt/homebrew/opt/postgresql@18/bin'
const action = process.argv[2]
const secretFile = join(directory, 'credentials.json')
const passwordFile = join(directory, 'pgpass')
const databases = [
  { name: 'duelens', app: 'duelens_app', migration: 'duelens_migrator', file: 'local.properties' },
  { name: 'duelens_test', app: 'duelens_test_app', migration: 'duelens_test_migrator', file: 'test.properties' },
]

function run(binary, args, { input, sensitive = false, allowFailure = false, env = {} } = {}) {
  const result = spawnSync(join(binaries, binary), args, {
    encoding: 'utf8', timeout: 30_000, input,
    env: { ...process.env, ...env },
  })
  if (result.error || result.status !== 0) {
    if (allowFailure) return null
    throw new Error(sensitive ? 'DB 계정·권한 구성을 완료하지 못했습니다. 접속 설정과 DB 상태를 확인해 주세요.'
      : `${binary} 실행 실패: ${result.error?.message ?? result.stderr.trim()}`)
  }
  return result.stdout.trim()
}

function sql(database, statement) {
  return run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', '5432', '-U', 'duelens_admin', '-d', database], {
    input: statement, sensitive: true, env: { PGPASSFILE: passwordFile },
  })
}

function writePrivate(path, contents) {
  writeFileSync(path, contents, { mode: 0o600, flag: 'wx' })
}

function initialize() {
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
  if (!existsSync(secretFile)) {
    if (existsSync(join(data, 'PG_VERSION'))) throw new Error('기존 DB의 접속 정보가 없습니다. 새 비밀번호로 덮어쓰지 않습니다.')
    const passwords = Object.fromEntries(['duelens_admin', ...databases.flatMap(db => [db.app, db.migration])]
      .map(role => [role, randomBytes(32).toString('hex')]))
    writePrivate(secretFile, JSON.stringify(passwords, null, 2) + '\n')
  }
  const passwords = JSON.parse(readFileSync(secretFile, 'utf8'))
  for (const role of ['duelens_admin', ...databases.flatMap(db => [db.app, db.migration])]) {
    if (typeof passwords[role] !== 'string' || !/^[a-f0-9]{64}$/.test(passwords[role])) {
      throw new Error('로컬 DB 접속 정보의 형식을 확인해 주세요. 기존 DB나 비밀번호를 덮어쓰지 않습니다.')
    }
  }
  if (!existsSync(passwordFile)) writePrivate(passwordFile, `127.0.0.1:5432:*:duelens_admin:${passwords.duelens_admin}\n`)
  if (!existsSync(join(data, 'PG_VERSION'))) {
    const initPassword = join(directory, 'init-password')
    writePrivate(initPassword, passwords.duelens_admin + '\n')
    try {
      run('initdb', ['-D', data, '--username=duelens_admin', `--pwfile=${initPassword}`, '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--encoding=UTF8', '--locale=C'])
    } finally { unlinkSync(initPassword) }
    writeFileSync(join(data, 'postgresql.conf'), [
      "listen_addresses = '127.0.0.1'", 'port = 5432',
      `unix_socket_directories = '${directory.replaceAll("'", "''")}'`,
      "password_encryption = 'scram-sha-256'", "timezone = 'Asia/Seoul'",
      "log_statement = 'none'", "log_min_error_statement = 'panic'", '',
    ].join('\n'), { flag: 'a' })
  }
  return passwords
}

function provision(passwords) {
  if (sql('postgres', "SELECT 1 FROM pg_roles WHERE rolname = 'duelens_runtime'") !== '1') {
    sql('postgres', 'CREATE ROLE duelens_runtime NOLOGIN;')
  }
  mkdirSync(config, { recursive: true, mode: 0o700 })
  for (const db of databases) {
    for (const role of [db.app, db.migration]) {
      if (sql('postgres', `SELECT 1 FROM pg_roles WHERE rolname = '${role}'`) !== '1') {
        sql('postgres', `CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${passwords[role]}';`)
      }
    }
    sql('postgres', `GRANT duelens_runtime TO ${db.app};`)
    if (sql('postgres', `SELECT 1 FROM pg_database WHERE datname = '${db.name}'`) !== '1') {
      sql('postgres', `CREATE DATABASE ${db.name} OWNER ${db.migration} ENCODING 'UTF8' TEMPLATE template0;`)
    }
    sql('postgres', `REVOKE ALL ON DATABASE ${db.name} FROM PUBLIC; GRANT CONNECT ON DATABASE ${db.name} TO ${db.app};`)
    sql(db.name, 'REVOKE ALL ON SCHEMA public FROM PUBLIC;')
    const path = join(config, db.file)
    const prefix = db.name === 'duelens_test' ? 'DUELENS_TEST' : 'DUELENS'
    if (!existsSync(path)) writePrivate(path, [
      '# npm run db:start가 생성한 로컬 전용 접속 정보입니다. Git에 올리지 않습니다.',
      `${prefix}_DB_URL=jdbc:postgresql://127.0.0.1:5432/${db.name}?sslmode=disable&requireAuth=scram-sha-256`,
      `${prefix}_DB_USERNAME=${db.app}`, `${prefix}_DB_PASSWORD=${passwords[db.app]}`,
      `${prefix}_MIGRATION_USERNAME=${db.migration}`, `${prefix}_MIGRATION_PASSWORD=${passwords[db.migration]}`, '',
      ...(db.name === 'duelens' ? ['DUELENS_COOKIE_SECURE=false', 'DUELENS_WRITE_ORIGINS=http://127.0.0.1:5173,http://localhost:5173', ''] : []),
    ].join('\n'))
    if (db.name === 'duelens') {
      const current = readFileSync(path, 'utf8')
      const defaults = [
        ['DUELENS_COOKIE_SECURE', 'false'],
        ['DUELENS_WRITE_ORIGINS', 'http://127.0.0.1:5173,http://localhost:5173'],
      ].filter(([key]) => !new RegExp(`^${key}\\s*=`, 'm').test(current))
      if (defaults.length) writeFileSync(path, current.trimEnd() + '\n' + defaults.map(([key, value]) => `${key}=${value}`).join('\n') + '\n')
    }
  }
}

try {
  if (!['start', 'stop', 'status'].includes(action)) throw new Error('사용법: npm run db:start | db:stop | db:status')
  if (!existsSync(join(binaries, 'pg_ctl'))) throw new Error('PostgreSQL 18을 먼저 설치해 주세요: brew install postgresql@18 (다른 경로는 POSTGRES_BIN으로 지정)')
  const running = existsSync(join(data, 'PG_VERSION')) && run('pg_ctl', ['-D', data, 'status'], { allowFailure: true }) !== null
  if (action === 'stop') {
    if (running) run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop'])
    console.log('DueLens 로컬 DB를 중지했습니다. 데이터는 유지합니다.')
  } else if (action === 'status') {
    console.log(running ? `DueLens PostgreSQL 실행 중 · 127.0.0.1:5432\n${run('postgres', ['--version'])}` : 'DueLens 로컬 DB가 중지되어 있습니다.')
  } else {
    const passwords = initialize()
    if (!running) run('pg_ctl', ['-D', data, '-l', join(directory, 'server.log'), '-w', 'start'])
    provision(passwords)
    console.log(`DueLens 로컬 DB 준비 완료 · 127.0.0.1:5432\n개발: duelens / 테스트: duelens_test\n접속 설정: backend/config/local.properties · test.properties (Git 제외)`)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}

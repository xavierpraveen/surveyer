'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import type { EmployeeImportRow, ImportResult } from '@/lib/types/phase4'
import { importEmployees } from '@/lib/actions/settings'

type ImportState = 'idle' | 'preview' | 'done'

function caseInsensitiveGet(
  row: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key]
    const lower = key.toLowerCase()
    const upper = key.charAt(0).toUpperCase() + key.slice(1)
    if (row[lower] !== undefined) return row[lower]
    if (row[upper] !== undefined) return row[upper]
  }
  return ''
}

function parseRowsFromCsv(
  rawRows: Record<string, string>[]
): EmployeeImportRow[] {
  return rawRows.map((row) => {
    const name = caseInsensitiveGet(row, 'name', 'Name')
    const email = caseInsensitiveGet(row, 'email', 'Email')
    const department = caseInsensitiveGet(row, 'department', 'Department')
    const role = caseInsensitiveGet(row, 'role', 'Role') || 'employee'
    const tenureBand =
      caseInsensitiveGet(row, 'tenure_band', 'tenureBand', 'Tenure_Band')

    const errors: string[] = []
    if (!name || name.trim().length === 0) errors.push('Missing name')
    if (!email || !email.includes('@')) errors.push('Invalid email')

    return {
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      role: role.trim(),
      tenureBand: tenureBand.trim(),
      isValid: errors.length === 0,
      errors,
    }
  })
}

export default function EmployeeImportTab() {
  const [importState, setImportState] = useState<ImportState>('idle')
  const [parsedRows, setParsedRows] = useState<EmployeeImportRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        if (result.errors.length > 0 && result.data.length === 0) {
          setParseError(`CSV parse error: ${result.errors[0].message}`)
          return
        }
        const rows = parseRowsFromCsv(result.data)
        setParsedRows(rows)
        setImportState('preview')
      },
      error(err) {
        setParseError(`Failed to read file: ${err.message}`)
      },
    })
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.isValid)
    if (validRows.length === 0) return

    setIsImporting(true)
    const result = await importEmployees(validRows)
    setIsImporting(false)

    if (result.success) {
      setImportResult(result.data)
    } else {
      setImportResult({ imported: 0, skipped: 0, errors: [result.error] })
    }
    setImportState('done')
  }

  function handleReset() {
    setParsedRows([])
    setImportResult(null)
    setParseError(null)
    setImportState('idle')
  }

  const validCount = parsedRows.filter((r) => r.isValid).length
  const errorCount = parsedRows.filter((r) => !r.isValid).length

  // ─── State 3: Import complete ──────────────────────────────────────────────
  if (importState === 'done' && importResult) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-base font-bold tracking-tight text-fg mb-4">Import Complete</h2>
        <div className="rounded-md bg-success-muted border border-success px-5 py-4 mb-4">
          <p className="text-sm text-success-text font-semibold">
            Imported: {importResult.imported} &nbsp;|&nbsp; Skipped (duplicates):{' '}
            {importResult.skipped}
          </p>
        </div>

        {importResult.errors.length > 0 && (
          <div className="rounded-md bg-error-muted border border-error px-5 py-4 mb-4" role="alert">
            <p className="text-sm font-semibold text-error-text mb-2">Errors:</p>
            <ul className="list-disc pl-5 space-y-1">
              {importResult.errors.map((err, i) => (
                <li key={i} className="text-sm text-error-text">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleReset}
          className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          Import another file
        </button>
      </div>
    )
  }

  // ─── State 2: File parsed, showing preview ──────────────────────────────────
  if (importState === 'preview') {
    return (
      <div className="max-w-4xl">
        <h2 className="text-base font-bold tracking-tight text-fg mb-2">Preview</h2>
        <p className="text-sm text-fg-muted mb-4">
          {validCount} valid row{validCount !== 1 ? 's' : ''},{' '}
          {errorCount} row{errorCount !== 1 ? 's' : ''} with errors
        </p>

        <div className="overflow-x-auto rounded-lg border border-border mb-4">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                {['Name', 'Email', 'Department', 'Role', 'Tenure Band', 'Status'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left text-xs font-semibold text-fg uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parsedRows.map((row, i) => (
                <tr key={i} className={row.isValid ? '' : 'bg-error-muted'}>
                  <td className="px-4 py-2 text-fg">{row.name || <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2 text-fg">{row.email || <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2 text-fg">{row.department || <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2 text-fg">{row.role}</td>
                  <td className="px-4 py-2 text-fg">{row.tenureBand || <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2">
                    {row.isValid ? (
                      <span className="text-success-text text-xs font-semibold">Valid</span>
                    ) : (
                      <span className="text-error-text text-xs font-semibold">
                        ⚠ {row.errors.join(', ')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            Clear
          </button>
          <button
            onClick={handleImport}
            disabled={validCount === 0 || isImporting}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            {isImporting ? 'Importing...' : `Import ${validCount} employee${validCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    )
  }

  // ─── State 1: No file selected ──────────────────────────────────────────────
  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold tracking-tight text-fg mb-2">Employee Roster Import</h2>
      <p className="text-sm text-fg-muted mb-4">
        Expected columns: <span className="font-mono text-xs bg-surface-2 px-1 rounded">name</span>,{' '}
        <span className="font-mono text-xs bg-surface-2 px-1 rounded">email</span>,{' '}
        <span className="font-mono text-xs bg-surface-2 px-1 rounded">department</span>,{' '}
        <span className="font-mono text-xs bg-surface-2 px-1 rounded">role</span>,{' '}
        <span className="font-mono text-xs bg-surface-2 px-1 rounded">tenure_band</span>
      </p>

      {parseError && (
        <div className="mb-4 rounded-md bg-error-muted border border-error px-4 py-3 text-sm text-error-text" role="alert">
          {parseError}
        </div>
      )}

      <label
        htmlFor="csv-upload"
        className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-brand hover:bg-brand-muted transition-colors"
      >
        <span className="text-sm text-fg-muted mb-1">Click to upload employee roster CSV</span>
        <span className="text-xs text-fg-subtle">.csv files only</span>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
    </div>
  )
}

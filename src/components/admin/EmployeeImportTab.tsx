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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h2>
        <div className="rounded-md bg-green-50 border border-green-200 px-5 py-4 mb-4">
          <p className="text-sm text-green-800 font-medium">
            Imported: {importResult.imported} &nbsp;|&nbsp; Skipped (duplicates):{' '}
            {importResult.skipped}
          </p>
        </div>

        {importResult.errors.length > 0 && (
          <div className="rounded-md bg-red-50 border border-red-200 px-5 py-4 mb-4">
            <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
            <ul className="list-disc pl-5 space-y-1">
              {importResult.errors.map((err, i) => (
                <li key={i} className="text-sm text-red-600">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleReset}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
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
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Preview</h2>
        <p className="text-sm text-gray-500 mb-4">
          {validCount} valid row{validCount !== 1 ? 's' : ''},{' '}
          {errorCount} row{errorCount !== 1 ? 's' : ''} with errors
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Department', 'Role', 'Tenure Band', 'Status'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parsedRows.map((row, i) => (
                <tr key={i} className={row.isValid ? '' : 'bg-red-50'}>
                  <td className="px-4 py-2">{row.name || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">{row.email || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">{row.department || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">{row.role}</td>
                  <td className="px-4 py-2">{row.tenureBand || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">
                    {row.isValid ? (
                      <span className="text-green-600 text-xs">Valid</span>
                    ) : (
                      <span className="text-red-600 text-xs">
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
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Clear
          </button>
          <button
            onClick={handleImport}
            disabled={validCount === 0 || isImporting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Employee Roster Import</h2>
      <p className="text-sm text-gray-500 mb-4">
        Expected columns: <span className="font-mono text-xs bg-gray-100 px-1 rounded">name</span>,{' '}
        <span className="font-mono text-xs bg-gray-100 px-1 rounded">email</span>,{' '}
        <span className="font-mono text-xs bg-gray-100 px-1 rounded">department</span>,{' '}
        <span className="font-mono text-xs bg-gray-100 px-1 rounded">role</span>,{' '}
        <span className="font-mono text-xs bg-gray-100 px-1 rounded">tenure_band</span>
      </p>

      {parseError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {parseError}
        </div>
      )}

      <label
        htmlFor="csv-upload"
        className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <span className="text-sm text-gray-500 mb-1">Click to upload employee roster CSV</span>
        <span className="text-xs text-gray-400">.csv files only</span>
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

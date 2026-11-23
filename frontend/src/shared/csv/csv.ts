type RecordRow = { line: number; fields: string[] };

export function readCsvRecords(input: string): RecordRow[] {
  const text = input.replace(/^\uFEFF/, '');
  const records: RecordRow[] = [];
  let fields: string[] = [],
    field = '',
    line = 1,
    startLine = 1;
  let state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';
  function endField() {
    fields.push(field);
    field = '';
    state = 'start';
  }
  function endRecord() {
    endField();
    records.push({ line: startLine, fields });
    fields = [];
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (state === 'quoted') {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else state = 'closed';
      } else {
        field += char;
        if (char === '\r') {
          if (text[index + 1] === '\n') {
            field += '\n';
            index++;
          }
          line++;
        } else if (char === '\n') line++;
      }
      continue;
    }
    if (char === ',') {
      endField();
      continue;
    }
    if (char === '\r' || char === '\n') {
      endRecord();
      if (char === '\r' && text[index + 1] === '\n') index++;
      line++;
      startLine = line;
      continue;
    }
    if (state === 'closed')
      throw new Error(`CSV line ${line}: only a comma or line break may follow a closing quote.`);
    if (char === '"') {
      if (state !== 'start')
        throw new Error(`CSV line ${line}: quotes must enclose the whole field.`);
      state = 'quoted';
    } else {
      field += char;
      state = 'plain';
    }
  }
  if (state === 'quoted') throw new Error(`CSV line ${startLine}: quoted field is not closed.`);
  if (fields.length || field || state !== 'start') endRecord();
  while (
    records.length &&
    records.at(-1)!.fields.length === 1 &&
    !records.at(-1)!.fields[0]!.trim()
  )
    records.pop();
  return records;
}

function csvCell(value: string): string {
  let first = 0;
  while (first < value.length && (/\s/u.test(value[first]!) || value.charCodeAt(first) <= 31))
    first++;
  const safe = /^[\t\r\n]/.test(value) || /^[=+\-@]/.test(value.slice(first)) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function writeCsv(rows: readonly (readonly string[])[]): string {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

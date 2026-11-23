import type { DocumentFile } from './types';
/** Only called after the authenticated transport returns a document; no public or credential URLs. */
export function saveDocument(file: DocumentFile) {
  const url = URL.createObjectURL(
    new Blob([file.content], { type: file.mimeType + ';charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

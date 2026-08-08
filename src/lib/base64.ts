/**
 * Base64 <-> UTF-8.
 *
 * `btoa()` seul ne gère que le Latin-1 : il lève une exception dès qu'une
 * plateforme s'appelle « Coinbase — compte perso ». L'API GitHub Contents attend
 * du base64, donc tout passe par ici.
 */

export function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  const chunk = 0x8000 // découpage pour ne pas exploser la pile sur un gros fichier
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToUtf8(input: string): string {
  // L'API GitHub renvoie du base64 découpé en lignes de 60 caractères.
  const binary = atob(input.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

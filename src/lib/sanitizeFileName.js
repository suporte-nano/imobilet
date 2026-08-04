/**
 * Utility to sanitize filenames for Supabase Storage.
 * Removes accents, replaces spaces with underscores, and strips invalid characters
 * to prevent InvalidKey errors during upload.
 * 
 * Example: "Estratégias de Comunicação.pdf" -> "Estrategias_de_Comunicacao.pdf"
 * 
 * Migration Note: 
 * If you have existing files in storage with accented characters, 
 * accessing them via URL usually still works if the URL is URL-encoded.
 * However, deleting or moving them via the Supabase SDK might require using 
 * the exact string that was originally used to save them. 
 * For all new files, this utility ensures safe ASCII-only paths.
 */
export const sanitizeFileName = (name) => {
  if (!name) return 'arquivo_desconhecido';
  
  return name
    .normalize('NFD') // Decompose accented characters into base char + accent
    .replace(/[\u0300-\u036f]/g, '') // Remove the accent marks
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[<>:"/\\|?*]/g, '') // Remove strictly forbidden filesystem chars
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Ensure only safe ASCII characters remain
};
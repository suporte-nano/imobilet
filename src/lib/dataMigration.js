/**
 * Utility function to normalize legacy text[] arrays or raw strings into standard jsonb arrays of file objects.
 */
export const normalizeFileArray = (val) => {
  if (!val) return [];
  
  // Attempt to parse stringified JSON arrays if present
  let parsedVal = val;
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      parsedVal = JSON.parse(val);
    } catch (e) {
      // Ignore parse error, treat as simple string
    }
  }

  const arr = Array.isArray(parsedVal) ? parsedVal : [parsedVal];
  
  return arr.map(item => {
    // If it's already an object with a url, return it (it's new jsonb format)
    if (item && typeof item === 'object' && item.url) {
      return item;
    }
    
    // If it's a legacy string URL, convert it to the object format
    if (typeof item === 'string') {
      let extractedName = item.split('/').pop() || 'Arquivo';
      if (extractedName.includes('-')) {
        extractedName = decodeURIComponent(extractedName.substring(extractedName.indexOf('-') + 1));
      }
      return {
        url: item,
        original_name: extractedName,
        file_type: 'unknown',
        size: 0,
        uploaded_at: new Date().toISOString()
      };
    }
    
    return null;
  }).filter(Boolean); // Remove any nulls/undefined
};
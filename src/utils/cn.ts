type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[] | bigint;

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = clsx(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}

// Simple merge for Tailwind classes (handles conflicts by keeping last occurrence)
function twMerge(classNames: string): string {
  const classes = classNames.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  
  // Process in reverse to keep last occurrence
  for (let i = classes.length - 1; i >= 0; i--) {
    const className = classes[i];
    // Extract base class (before any variant like hover:, focus:, etc.)
    const baseMatch = className.match(/^(?:[a-z]+:)*([a-z-]+)/);
    const base = baseMatch ? baseMatch[1] : className;
    
    if (!seen.has(base)) {
      seen.add(base);
      result.unshift(className);
    }
  }
  
  return result.join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

